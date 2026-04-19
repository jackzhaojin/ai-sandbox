import type { Run, Task } from '../domain/types.js';
import { RunStatus } from '../domain/types.js';

/**
 * Calculate the next retry timestamp using exponential backoff.
 *
 * Formula: delay = base_delay_ms * 2^attempt, capped at max_delay_ms
 * The returned Date is `now + delay`.
 */
export function calculateNextRetry(
  attempt: number,
  base_delay_ms: number,
  max_delay_ms: number
): Date {
  const delay = Math.min(base_delay_ms * Math.pow(2, attempt), max_delay_ms);
  return new Date(Date.now() + delay);
}

/**
 * Determine whether a failed run should be retried.
 */
export function shouldRetry(run: Run, task: Task): boolean {
  return run.attempt < task.max_attempts;
}

/**
 * Check if a task has retry configuration enabled.
 */
export function canRetry(task: Task): boolean {
  return task.max_attempts > 1;
}

/**
 * Schedule a retry for a failed run.
 *
 * Mutates the run in-place: increments attempt, sets status to queued,
 * and computes next_retry_at. Returns true if a retry was scheduled.
 */
export function scheduleRetry(run: Run, task: Task): boolean {
  if (!shouldRetry(run, task)) {
    return false;
  }

  const nextAttempt = run.attempt + 1;
  const nextRetryAt = calculateNextRetry(nextAttempt, task.base_delay_ms, task.max_delay_ms);

  run.attempt = nextAttempt;
  run.status = RunStatus.Queued;
  run.next_retry_at = nextRetryAt;

  return true;
}
