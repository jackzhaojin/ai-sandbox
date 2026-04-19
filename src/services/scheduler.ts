import { randomUUID } from 'crypto';
import cronParser from 'cron-parser';
import {
  getTasks,
  getRuns,
  getTask,
  getRun,
  addRun,
  updateRun,
  init as persistenceInit,
  saveState,
} from './persistence.js';
import { canDispatch } from './deps.js';
import { tryPromoteQueued, onRunCompleted } from './concurrency.js';
import { scheduleRetry } from './retry.js';
import { executeHandler } from '../domain/handlers.js';
import { TaskStatus, RunStatus } from '../domain/types.js';
import type { Task, Run } from '../domain/types.js';

// ---------------------------------------------------------------------------
// Interval handle
// ---------------------------------------------------------------------------

let tickInterval: ReturnType<typeof setInterval> | null = null;

// ---------------------------------------------------------------------------
// Cron parsing
// ---------------------------------------------------------------------------

/**
 * Parse a cron expression and return the next execution timestamp.
 * Returns `null` if the expression is invalid.
 */
export function parseNextRun(cron: string): Date | null {
  try {
    const interval = cronParser.parseExpression(cron);
    return interval.next().toDate();
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Overlap check
// ---------------------------------------------------------------------------

/**
 * Returns `true` if any run for the given task is still in the
 * {@link RunStatus.Running} state.
 */
export function checkOverlap(taskId: string, runs: Map<string, Run>): boolean {
  for (const run of runs.values()) {
    if (run.task_id === taskId && run.status === RunStatus.Running) {
      return true;
    }
  }
  return false;
}

// ---------------------------------------------------------------------------
// Queued-run check
// ---------------------------------------------------------------------------

function hasQueuedRun(taskId: string, runs: Map<string, Run>): boolean {
  for (const run of runs.values()) {
    if (run.task_id === taskId && run.status === RunStatus.Queued) {
      return true;
    }
  }
  return false;
}

// ---------------------------------------------------------------------------
// Dispatch decision
// ---------------------------------------------------------------------------

/**
 * Determine whether a task should be dispatched right now.
 *
 * Checks:
 * 1. The task is active.
 * 2. The next cron occurrence is at or before `now`.
 * 3. No overlapping run is currently executing.
 * 4. All dependencies are satisfied.
 */
export function shouldDispatch(task: Task, now: Date): boolean {
  if (task.status !== TaskStatus.Active) {
    return false;
  }

  const nextRun = parseNextRun(task.cron);
  if (!nextRun || nextRun > now) {
    return false;
  }

  const runs = getRuns();
  if (checkOverlap(task.id, runs)) {
    return false;
  }

  if (!canDispatch(task, getTasks(), runs)) {
    return false;
  }

  return true;
}

// ---------------------------------------------------------------------------
// Dispatch task
// ---------------------------------------------------------------------------

/**
 * Create a new {@link Run} record for the given task, store it as
 * {@link RunStatus.Queued}, then attempt to promote the oldest queued run
 * into a running slot.
 *
 * If promotion succeeds, the promoted run is executed asynchronously.
 */
export function dispatchTask(task: Task): Run {
  const run: Run = {
    id: randomUUID(),
    task_id: task.id,
    status: RunStatus.Queued,
    attempt: 1,
    started_at: null,
    finished_at: null,
    error: null,
    output: null,
    next_retry_at: null,
  };

  addRun(run);

  const promoted = tryPromoteQueued(getRuns());
  if (promoted) {
    executeRun(promoted.id).catch((err) => {
      console.error(`[scheduler] executeRun failed for ${promoted.id}:`, err);
    });
  }

  return run;
}

// ---------------------------------------------------------------------------
// Execute run
// ---------------------------------------------------------------------------

/**
 * Execute the handler associated with a run's task.
 *
 * 1. Resolves the handler via `task.payload.handler_name` (defaults to `'echo'`).
 * 2. Calls the handler and awaits its result.
 * 3. Updates the run with the outcome.
 * 4. On failure, attempts retry scheduling via the retry service.
 * 5. On final completion (success or exhausted retries), promotes queued runs.
 */
export async function executeRun(runId: string): Promise<void> {
  const run = getRun(runId);
  if (!run) {
    throw new Error(`Run not found: ${runId}`);
  }

  const task = getTask(run.task_id);
  if (!task) {
    throw new Error(`Task not found for run ${runId}`);
  }

  // Ensure started_at is set (defensive: may already be set by tryPromoteQueued)
  if (!run.started_at) {
    run.started_at = new Date();
  }

  const handlerName = (task.payload.handler_name as string) ?? 'echo';

  try {
    const result = await executeHandler(handlerName, task.payload);

    if (result.success) {
      run.status = RunStatus.Completed;
      run.output = (result.output as Record<string, unknown> | null) ?? null;
      run.error = null;
    } else {
      run.status = RunStatus.Failed;
      run.error = result.error ?? 'Handler reported failure';
      run.output = null;
    }
  } catch (err) {
    run.status = RunStatus.Failed;
    run.error = err instanceof Error ? err.message : String(err);
    run.output = null;
  }

  run.finished_at = new Date();

  // Retry handling
  if (run.status === RunStatus.Failed) {
    const retried = scheduleRetry(run, task);
    if (retried) {
      updateRun(run.id, {
        status: run.status,
        error: run.error,
        finished_at: run.finished_at,
        attempt: run.attempt,
        next_retry_at: run.next_retry_at,
      });

      const promoted = tryPromoteQueued(getRuns());
      if (promoted) {
        executeRun(promoted.id).catch((e) => {
          console.error(`[scheduler] retry executeRun failed for ${promoted.id}:`, e);
        });
      }
      return;
    }
  }

  // Final state update
  updateRun(run.id, {
    status: run.status,
    output: run.output,
    error: run.error,
    finished_at: run.finished_at,
  });

  // Attempt to promote any queued runs now that a slot is free
  onRunCompleted();
}

// ---------------------------------------------------------------------------
// Tick loop
// ---------------------------------------------------------------------------

/**
 * Single scheduler tick.
 *
 * Iterates all active tasks and dispatches those whose next cron occurrence
 * has arrived and that are not blocked by overlap, unsatisfied dependencies,
 * or an existing queued run.
 */
export function tick(): void {
  const now = new Date();
  const tasks = getTasks();
  const runs = getRuns();

  for (const task of tasks.values()) {
    if (task.status !== TaskStatus.Active) {
      continue;
    }

    if (hasQueuedRun(task.id, runs)) {
      console.log(`[scheduler] skip "${task.name}" (${task.id}): queued`);
      continue;
    }

    if (!shouldDispatch(task, now)) {
      // Determine the specific skip reason for logging
      const nextRun = parseNextRun(task.cron);
      if (!nextRun || nextRun > now) {
        continue;
      }
      if (checkOverlap(task.id, runs)) {
        console.log(`[scheduler] skip "${task.name}" (${task.id}): overlap`);
        continue;
      }
      if (!canDispatch(task, tasks, runs)) {
        console.log(`[scheduler] skip "${task.name}" (${task.id}): blocked`);
        continue;
      }
      continue;
    }

    dispatchTask(task);
  }
}

// ---------------------------------------------------------------------------
// Lifecycle
// ---------------------------------------------------------------------------

/**
 * Start the scheduler engine.
 *
 * Loads persisted state and begins ticking every second.
 */
export function start(): void {
  persistenceInit();
  tickInterval = setInterval(tick, 1000);
}

/**
 * Stop the scheduler engine.
 *
 * Clears the tick interval and immediately persists the current state.
 */
export async function stop(): Promise<void> {
  if (tickInterval) {
    clearInterval(tickInterval);
    tickInterval = null;
  }
  await saveState();
}
