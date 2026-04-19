import type { Run } from '../domain/types.js';
import { RunStatus } from '../domain/types.js';
import { getRuns } from './persistence.js';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const MAX_CONCURRENT_RUNS = 5;

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

/**
 * Count how many runs are currently in the 'running' state.
 */
export function getCurrentRunningCount(runs: Map<string, Run>): number {
  let count = 0;
  for (const run of runs.values()) {
    if (run.status === RunStatus.Running) {
      count++;
    }
  }
  return count;
}

/**
 * Check whether there is a free slot under the global concurrency limit.
 */
export function hasAvailableSlot(runs: Map<string, Run>): boolean {
  return getCurrentRunningCount(runs) < MAX_CONCURRENT_RUNS;
}

/**
 * Return all queued runs sorted by creation order (oldest first).
 * Relies on Map insertion order as a proxy for creation time.
 */
export function getQueuedRuns(runs: Map<string, Run>): Run[] {
  const queued: Run[] = [];
  for (const run of runs.values()) {
    if (run.status === RunStatus.Queued) {
      queued.push(run);
    }
  }
  return queued;
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

/**
 * If a concurrency slot is available, promote the oldest queued run to
 * 'running' and set its started_at timestamp.
 *
 * Mutates the run in-place. Returns the promoted run, or null if no
 * promotion happened.
 */
export function tryPromoteQueued(runs: Map<string, Run>): Run | null {
  if (!hasAvailableSlot(runs)) {
    return null;
  }

  const queued = getQueuedRuns(runs);
  if (queued.length === 0) {
    return null;
  }

  const oldest = queued[0];
  oldest.status = RunStatus.Running;
  oldest.started_at = new Date();
  return oldest;
}

/**
 * Helper to call after every run completion. Automatically attempts to
 * promote queued runs into running slots.
 */
export function onRunCompleted(): Run | null {
  return tryPromoteQueued(getRuns());
}
