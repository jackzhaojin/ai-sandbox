import { describe, it, expect } from 'vitest';
import {
  calculateNextRetry,
  shouldRetry,
  canRetry,
  scheduleRetry,
} from '../../src/services/retry.js';
import { TaskStatus, RunStatus } from '../../src/domain/types.js';
import type { Task, Run } from '../../src/domain/types.js';

function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: 'task-1',
    name: 'Test Task',
    description: '',
    cron: '*/5 * * * *',
    payload: {},
    max_attempts: 3,
    base_delay_ms: 1000,
    max_delay_ms: 10000,
    depends_on: [],
    status: TaskStatus.Active,
    created_at: new Date('2026-01-01T00:00:00Z'),
    updated_at: new Date('2026-01-01T00:00:00Z'),
    ...overrides,
  };
}

function makeRun(overrides: Partial<Run> = {}): Run {
  return {
    id: 'run-1',
    task_id: 'task-1',
    status: RunStatus.Failed,
    attempt: 1,
    started_at: null,
    finished_at: null,
    error: null,
    output: null,
    next_retry_at: null,
    ...overrides,
  };
}

describe('retry service', () => {
  describe('calculateNextRetry', () => {
    it('calculates correct backoff for attempts 0, 1, 2, 3 with base=1000, max=10000', () => {
      const base = 1000;
      const max = 10000;
      const now = Date.now();

      const result0 = calculateNextRetry(0, base, max);
      const result1 = calculateNextRetry(1, base, max);
      const result2 = calculateNextRetry(2, base, max);
      const result3 = calculateNextRetry(3, base, max);

      // Allow a small margin for execution time
      expect(result0.getTime() - now).toBeGreaterThanOrEqual(1000);
      expect(result0.getTime() - now).toBeLessThan(1500);

      expect(result1.getTime() - now).toBeGreaterThanOrEqual(2000);
      expect(result1.getTime() - now).toBeLessThan(2500);

      expect(result2.getTime() - now).toBeGreaterThanOrEqual(4000);
      expect(result2.getTime() - now).toBeLessThan(4500);

      expect(result3.getTime() - now).toBeGreaterThanOrEqual(8000);
      expect(result3.getTime() - now).toBeLessThan(8500);
    });

    it('caps delay at max_delay_ms when calculated backoff exceeds it', () => {
      const base = 1000;
      const max = 5000;
      const now = Date.now();

      // attempt=3 would be 8000, capped to 5000
      const result = calculateNextRetry(3, base, max);
      expect(result.getTime() - now).toBeGreaterThanOrEqual(5000);
      expect(result.getTime() - now).toBeLessThan(5500);

      // attempt=4 would be 16000, capped to 5000
      const result4 = calculateNextRetry(4, base, max);
      expect(result4.getTime() - now).toBeGreaterThanOrEqual(5000);
      expect(result4.getTime() - now).toBeLessThan(5500);
    });
  });

  describe('shouldRetry', () => {
    it('returns true when run.attempt < task.max_attempts', () => {
      const task = makeTask({ max_attempts: 3 });
      const run = makeRun({ attempt: 1 });
      expect(shouldRetry(run, task)).toBe(true);
    });

    it('returns false when run.attempt >= task.max_attempts', () => {
      const task = makeTask({ max_attempts: 3 });
      const run = makeRun({ attempt: 3 });
      expect(shouldRetry(run, task)).toBe(false);
    });

    it('returns false when run.attempt > task.max_attempts', () => {
      const task = makeTask({ max_attempts: 2 });
      const run = makeRun({ attempt: 3 });
      expect(shouldRetry(run, task)).toBe(false);
    });
  });

  describe('canRetry', () => {
    it('returns true when max_attempts > 1', () => {
      expect(canRetry(makeTask({ max_attempts: 3 }))).toBe(true);
      expect(canRetry(makeTask({ max_attempts: 2 }))).toBe(true);
    });

    it('returns false when max_attempts <= 1', () => {
      expect(canRetry(makeTask({ max_attempts: 1 }))).toBe(false);
    });
  });

  describe('scheduleRetry', () => {
    it('increments attempt, sets status to queued, and sets next_retry_at', () => {
      const task = makeTask({ max_attempts: 3, base_delay_ms: 1000, max_delay_ms: 10000 });
      const run = makeRun({ attempt: 1, status: RunStatus.Failed });
      const now = Date.now();

      const scheduled = scheduleRetry(run, task);

      expect(scheduled).toBe(true);
      expect(run.attempt).toBe(2);
      expect(run.status).toBe(RunStatus.Queued);
      expect(run.next_retry_at).not.toBeNull();
      expect(run.next_retry_at!.getTime() - now).toBeGreaterThanOrEqual(4000);
      expect(run.next_retry_at!.getTime() - now).toBeLessThan(4500);
    });

    it('returns false and does not mutate run when shouldRetry is false', () => {
      const task = makeTask({ max_attempts: 2 });
      const run = makeRun({ attempt: 2, status: RunStatus.Failed });

      const scheduled = scheduleRetry(run, task);

      expect(scheduled).toBe(false);
      expect(run.attempt).toBe(2);
      expect(run.status).toBe(RunStatus.Failed);
      expect(run.next_retry_at).toBeNull();
    });

    it('calculates next_retry_at using the incremented attempt value', () => {
      const task = makeTask({ max_attempts: 5, base_delay_ms: 1000, max_delay_ms: 10000 });
      const run = makeRun({ attempt: 2, status: RunStatus.Failed });
      const now = Date.now();

      scheduleRetry(run, task);

      // Incremented attempt is 3, so delay = 1000 * 2^3 = 8000
      expect(run.attempt).toBe(3);
      expect(run.next_retry_at!.getTime() - now).toBeGreaterThanOrEqual(8000);
      expect(run.next_retry_at!.getTime() - now).toBeLessThan(8500);
    });
  });
});
