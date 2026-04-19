import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { rm } from 'fs/promises';
import {
  init,
  loadState,
  getTasks,
  getRuns,
  getTask,
  getRun,
  addTask,
  addRun,
  updateRun,
} from '../../src/services/persistence.js';
import {
  calculateNextRetry,
  shouldRetry,
  scheduleRetry,
} from '../../src/services/retry.js';
import {
  detectCycle,
  isDependencySatisfied,
  getBlockingDeps,
  canDispatch,
  markOrphaned,
} from '../../src/services/deps.js';
import { TaskStatus, RunStatus } from '../../src/domain/types.js';
import type { Task, Run } from '../../src/domain/types.js';

const STATE_FILE = 'data/state.json';

async function clearStateFile() {
  try {
    await rm(STATE_FILE);
  } catch {
    // ignore
  }
}

function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: `task-${Math.random().toString(36).slice(2, 8)}`,
    name: 'Journey Task',
    cron: '*/5 * * * *',
    payload: {},
    max_attempts: 3,
    base_delay_ms: 1000,
    max_delay_ms: 30000,
    depends_on: [],
    status: TaskStatus.Active,
    created_at: new Date(),
    updated_at: new Date(),
    ...overrides,
  };
}

function makeRun(overrides: Partial<Run> = {}): Run {
  return {
    id: `run-${Math.random().toString(36).slice(2, 8)}`,
    task_id: 'task-placeholder',
    status: RunStatus.Queued,
    attempt: 1,
    started_at: null,
    finished_at: null,
    error: null,
    output: null,
    next_retry_at: null,
    ...overrides,
  };
}

/**
 * Helper that completes all prior steps' work to set up a consistent
 * base state for journey blocks.
 */
async function completePriorSteps(): Promise<{
  taskA: Task;
  taskB: Task;
  taskC: Task;
}> {
  await clearStateFile();
  await loadState();

  const taskA = makeTask({ id: 'journey-task-a', name: 'Task A', depends_on: [] });
  const taskB = makeTask({ id: 'journey-task-b', name: 'Task B', depends_on: ['journey-task-a'] });
  const taskC = makeTask({ id: 'journey-task-c', name: 'Task C', depends_on: ['journey-task-b'] });

  addTask(taskA);
  addTask(taskB);
  addTask(taskC);

  return { taskA, taskB, taskC };
}

describe('end-to-end journey', () => {
  beforeEach(async () => {
    await clearStateFile();
    await loadState();
  });

  afterEach(async () => {
    await clearStateFile();
  });

  describe('checkpoint 1 — domain, persistence, retry, and dependency DAG', () => {
    it('creates tasks, detects cycles, checks deps, and retries failed runs', async () => {
      // ---- Step 1: complete all prior steps (domain + persistence setup) ----
      const { taskA, taskB, taskC } = await completePriorSteps();

      // Verify persistence wrote the tasks
      expect(getTasks().size).toBe(3);
      expect(getTask('journey-task-a')!.name).toBe('Task A');
      expect(getTask('journey-task-b')!.depends_on).toEqual(['journey-task-a']);
      expect(getTask('journey-task-c')!.depends_on).toEqual(['journey-task-b']);

      // ---- Step 2: cycle detection (dependency DAG service) ----
      // Trying to make A depend on C would create A -> B -> C -> A cycle
      const cycleResult = detectCycle('journey-task-a', ['journey-task-c'], getTasks());
      expect(cycleResult.hasCycle).toBe(true);

      // Self-loop is also caught
      const selfLoop = detectCycle('journey-task-a', ['journey-task-a'], getTasks());
      expect(selfLoop.hasCycle).toBe(true);

      // Valid DAG has no cycle
      const validTask = makeTask({ id: 'journey-task-d', name: 'Task D', depends_on: [] });
      addTask(validTask);
      const noCycle = detectCycle('journey-task-d', ['journey-task-a'], getTasks());
      expect(noCycle.hasCycle).toBe(false);

      // ---- Step 3: dependency satisfaction ----
      // Task C depends on B; B has no completed run, so C is blocked
      expect(isDependencySatisfied(taskC, getTasks(), getRuns())).toBe(false);
      expect(getBlockingDeps(taskC, getTasks(), getRuns())).toContain('journey-task-b');
      expect(canDispatch(taskC, getTasks(), getRuns())).toBe(false);

      // Create a completed run for B within freshness window
      const runB = makeRun({
        id: 'run-b-1',
        task_id: 'journey-task-b',
        status: RunStatus.Completed,
        finished_at: new Date(Date.now() - 5 * 60 * 1000), // 5 min ago
      });
      addRun(runB);

      // Now B is satisfied, so C's dependency on B is satisfied
      expect(isDependencySatisfied(taskC, getTasks(), getRuns())).toBe(true);
      expect(getBlockingDeps(taskC, getTasks(), getRuns())).toEqual([]);
      expect(canDispatch(taskC, getTasks(), getRuns())).toBe(true);

      // ---- Step 4: retry service — schedule retry on failed run ----
      const runA = makeRun({
        id: 'run-a-1',
        task_id: 'journey-task-a',
        status: RunStatus.Failed,
        attempt: 1,
      });
      addRun(runA);

      // Should retry because attempt (1) < max_attempts (3)
      expect(shouldRetry(runA, taskA)).toBe(true);

      const now = Date.now();
      const scheduled = scheduleRetry(runA, taskA);
      expect(scheduled).toBe(true);
      expect(runA.attempt).toBe(2);
      expect(runA.status).toBe(RunStatus.Queued);
      expect(runA.next_retry_at).not.toBeNull();
      // Backoff: base_delay_ms * 2^attempt = 1000 * 2^2 = 4000ms
      expect(runA.next_retry_at!.getTime() - now).toBeGreaterThanOrEqual(4000);
      expect(runA.next_retry_at!.getTime() - now).toBeLessThan(4500);

      // ---- Step 5: orphan marking when dependency is deleted ----
      // Simulating deletion of task A should orphan task B (which depends on A)
      const orphaned = markOrphaned('journey-task-a', getTasks());
      expect(orphaned).toContain('journey-task-b');
      expect(getTask('journey-task-b')!.status).toBe(TaskStatus.Orphaned);

      // Task C should remain Active (it depends on B, not directly on A)
      // BUT wait - in our model, C depends_on B, not A. However if B is orphaned,
      // C is still Active because its direct dependency B still exists.
      expect(getTask('journey-task-c')!.status).toBe(TaskStatus.Active);
    });

    it('round-trips state through save and load preserving all service mutations', async () => {
      const { taskA, taskB } = await completePriorSteps();

      // Add a run and mutate it via retry service
      const runA = makeRun({
        id: 'run-a-2',
        task_id: taskA.id,
        status: RunStatus.Failed,
        attempt: 1,
      });
      addRun(runA);
      scheduleRetry(runA, taskA);

      // Mark a task orphaned
      markOrphaned(taskA.id, getTasks());

      // Save state to disk
      const { saveState } = await import('../../src/services/persistence.js');
      await saveState();

      // Reload from disk
      await loadState();

      // Verify persistence round-tripped everything
      const loadedTaskB = getTask(taskB.id)!;
      expect(loadedTaskB.status).toBe(TaskStatus.Orphaned);
      expect(loadedTaskB.updated_at instanceof Date).toBe(true);

      const loadedRunA = getRun('run-a-2')!;
      expect(loadedRunA.status).toBe(RunStatus.Queued);
      expect(loadedRunA.attempt).toBe(2);
      expect(loadedRunA.next_retry_at instanceof Date).toBe(true);
      expect(loadedRunA.next_retry_at!.getTime()).toBeGreaterThan(Date.now());
    });
  });
});
