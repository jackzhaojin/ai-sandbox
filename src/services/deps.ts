import { TaskStatus, RunStatus } from '../domain/types.js';
import type { Task, Run } from '../domain/types.js';

// ---------------------------------------------------------------------------
// Cycle detection
// ---------------------------------------------------------------------------

export interface CycleResult {
  hasCycle: boolean;
  path?: string[];
}

/**
 * Detect whether adding `depends_on` to `task_id` would create a cycle.
 *
 * Uses DFS starting from each new dependency and following existing
 * `depends_on` edges. If the traversal ever reaches `task_id`, a cycle
 * would be formed.
 */
export function detectCycle(
  task_id: string,
  depends_on: string[],
  existing_tasks: Map<string, Task> | Iterable<[string, Task]>
): CycleResult {
  // Self-loop
  if (depends_on.includes(task_id)) {
    return { hasCycle: true, path: [task_id, task_id] };
  }

  const tasks = existing_tasks instanceof Map
    ? existing_tasks
    : new Map(existing_tasks);

  const visited = new Set<string>();
  const recStack = new Set<string>();

  function dfs(node: string, path: string[]): CycleResult {
    visited.add(node);
    recStack.add(node);

    const task = tasks.get(node);
    const deps = task?.depends_on ?? [];

    for (const dep of deps) {
      if (dep === task_id) {
        return { hasCycle: true, path: [...path, dep] };
      }

      if (!visited.has(dep)) {
        const result = dfs(dep, [...path, dep]);
        if (result.hasCycle) {
          return result;
        }
      } else if (recStack.has(dep)) {
        // Cycle among existing tasks (not involving task_id)
        return { hasCycle: true, path: [...path, dep] };
      }
    }

    recStack.delete(node);
    return { hasCycle: false };
  }

  for (const dep of depends_on) {
    if (!visited.has(dep)) {
      const result = dfs(dep, [dep]);
      if (result.hasCycle) {
        return result;
      }
    }
  }

  return { hasCycle: false };
}

// ---------------------------------------------------------------------------
// Dependency satisfaction
// ---------------------------------------------------------------------------

const DEFAULT_FRESHNESS_SECONDS = 3600;

function getCompletedRunsForTask(taskId: string, runs: Map<string, Run>): Run[] {
  const result: Run[] = [];
  for (const run of runs.values()) {
    if (run.task_id === taskId && run.status === RunStatus.Completed && run.finished_at !== null) {
      result.push(run);
    }
  }
  return result;
}

function isFresh(run: Run, now: number, freshnessSeconds: number): boolean {
  if (!run.finished_at) return false;
  const elapsedSeconds = (now - run.finished_at.getTime()) / 1000;
  return elapsedSeconds <= freshnessSeconds;
}

/**
 * Check whether all tasks in `task.depends_on` have at least one
 * completed run within `dep_freshness_seconds` (default 3600).
 */
export function isDependencySatisfied(
  task: Task,
  tasks: Map<string, Task>,
  runs: Map<string, Run>,
  dep_freshness_seconds: number = DEFAULT_FRESHNESS_SECONDS
): boolean {
  const now = Date.now();

  for (const depId of task.depends_on) {
    const depRuns = getCompletedRunsForTask(depId, runs);
    const hasFresh = depRuns.some((run) => isFresh(run, now, dep_freshness_seconds));
    if (!hasFresh) {
      return false;
    }
  }

  return true;
}

/**
 * Return the dependency task IDs that are blocking execution:
 * - never ran (no completed run exists)
 * - failed (most recent run is not completed)
 * - stale (most recent completed run is outside freshness window)
 */
export function getBlockingDeps(
  task: Task,
  tasks: Map<string, Task>,
  runs: Map<string, Run>,
  dep_freshness_seconds: number = DEFAULT_FRESHNESS_SECONDS
): string[] {
  const now = Date.now();
  const blocking: string[] = [];

  for (const depId of task.depends_on) {
    const depRuns: Run[] = [];
    for (const run of runs.values()) {
      if (run.task_id === depId) {
        depRuns.push(run);
      }
    }

    if (depRuns.length === 0) {
      blocking.push(depId);
      continue;
    }

    // Sort by finished_at descending (nulls last)
    depRuns.sort((a, b) => {
      const at = a.finished_at?.getTime() ?? 0;
      const bt = b.finished_at?.getTime() ?? 0;
      return bt - at;
    });

    const mostRecent = depRuns[0];

    if (mostRecent.status !== RunStatus.Completed) {
      blocking.push(depId);
      continue;
    }

    if (!mostRecent.finished_at || !isFresh(mostRecent, now, dep_freshness_seconds)) {
      blocking.push(depId);
      continue;
    }
  }

  return blocking;
}

/**
 * Returns true only if `isDependencySatisfied` returns true.
 */
export function canDispatch(
  task: Task,
  tasks: Map<string, Task>,
  runs: Map<string, Run>
): boolean {
  return isDependencySatisfied(task, tasks, runs);
}

// ---------------------------------------------------------------------------
// Orphan handling
// ---------------------------------------------------------------------------

/**
 * When a dependency (task_id) is deleted, mark all tasks that depend on it
 * as 'orphaned' by mutating their status in the provided tasks Map.
 */
export function markOrphaned(
  task_id: string,
  tasks: Map<string, Task>
): string[] {
  const orphaned: string[] = [];

  for (const [id, task] of tasks) {
    if (task.depends_on.includes(task_id) && task.status !== TaskStatus.Orphaned) {
      task.status = TaskStatus.Orphaned;
      task.updated_at = new Date();
      orphaned.push(id);
    }
  }

  return orphaned;
}
