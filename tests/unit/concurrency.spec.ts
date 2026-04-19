import { describe, it, expect } from 'vitest';
import {
  MAX_CONCURRENT_RUNS,
  getCurrentRunningCount,
  hasAvailableSlot,
  getQueuedRuns,
  tryPromoteQueued,
} from '../../src/services/concurrency.js';
import { RunStatus } from '../../src/domain/types.js';
import type { Run } from '../../src/domain/types.js';

function makeRun(overrides: Partial<Run> = {}): Run {
  return {
    id: 'run-1',
    task_id: 'task-1',
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

describe('concurrency service', () => {
  describe('getCurrentRunningCount', () => {
    it('counts only runs with status running', () => {
      const runs = new Map<string, Run>([
        ['r1', makeRun({ id: 'r1', status: RunStatus.Running })],
        ['r2', makeRun({ id: 'r2', status: RunStatus.Queued })],
        ['r3', makeRun({ id: 'r3', status: RunStatus.Running })],
        ['r4', makeRun({ id: 'r4', status: RunStatus.Completed })],
      ]);
      expect(getCurrentRunningCount(runs)).toBe(2);
    });

    it('returns 0 when no runs are running', () => {
      const runs = new Map<string, Run>([
        ['r1', makeRun({ id: 'r1', status: RunStatus.Queued })],
        ['r2', makeRun({ id: 'r2', status: RunStatus.Failed })],
      ]);
      expect(getCurrentRunningCount(runs)).toBe(0);
    });
  });

  describe('hasAvailableSlot', () => {
    it('returns false when running count >= limit', () => {
      const runs = new Map<string, Run>();
      for (let i = 0; i < MAX_CONCURRENT_RUNS; i++) {
        runs.set(`r${i}`, makeRun({ id: `r${i}`, status: RunStatus.Running }));
      }
      expect(hasAvailableSlot(runs)).toBe(false);

      // One more over the limit
      runs.set(
        `r${MAX_CONCURRENT_RUNS}`,
        makeRun({ id: `r${MAX_CONCURRENT_RUNS}`, status: RunStatus.Running })
      );
      expect(hasAvailableSlot(runs)).toBe(false);
    });

    it('returns true when running count < limit', () => {
      const runs = new Map<string, Run>();
      for (let i = 0; i < MAX_CONCURRENT_RUNS - 1; i++) {
        runs.set(`r${i}`, makeRun({ id: `r${i}`, status: RunStatus.Running }));
      }
      expect(hasAvailableSlot(runs)).toBe(true);
    });
  });

  describe('getQueuedRuns', () => {
    it('returns only queued runs in insertion order', () => {
      const runs = new Map<string, Run>();
      const r1 = makeRun({ id: 'r1', status: RunStatus.Queued });
      const r2 = makeRun({ id: 'r2', status: RunStatus.Running });
      const r3 = makeRun({ id: 'r3', status: RunStatus.Queued });
      const r4 = makeRun({ id: 'r4', status: RunStatus.Failed });

      runs.set('r1', r1);
      runs.set('r2', r2);
      runs.set('r3', r3);
      runs.set('r4', r4);

      const queued = getQueuedRuns(runs);
      expect(queued).toHaveLength(2);
      expect(queued[0].id).toBe('r1');
      expect(queued[1].id).toBe('r3');
    });
  });

  describe('tryPromoteQueued', () => {
    it('promotes oldest queued run when slot available', () => {
      const runs = new Map<string, Run>();
      const r1 = makeRun({ id: 'r1', status: RunStatus.Queued });
      const r2 = makeRun({ id: 'r2', status: RunStatus.Queued });

      runs.set('r1', r1);
      runs.set('r2', r2);

      const promoted = tryPromoteQueued(runs);
      expect(promoted).not.toBeNull();
      expect(promoted!.id).toBe('r1');
      expect(promoted!.status).toBe(RunStatus.Running);
      expect(promoted!.started_at).not.toBeNull();
    });

    it('does nothing when no slots available', () => {
      const runs = new Map<string, Run>();
      for (let i = 0; i < MAX_CONCURRENT_RUNS; i++) {
        runs.set(`r${i}`, makeRun({ id: `r${i}`, status: RunStatus.Running }));
      }
      const queued = makeRun({ id: 'queued', status: RunStatus.Queued });
      runs.set('queued', queued);

      const promoted = tryPromoteQueued(runs);
      expect(promoted).toBeNull();
      expect(queued.status).toBe(RunStatus.Queued);
      expect(queued.started_at).toBeNull();
    });

    it('does nothing when no queued runs exist', () => {
      const runs = new Map<string, Run>();
      runs.set('r1', makeRun({ id: 'r1', status: RunStatus.Running }));

      const promoted = tryPromoteQueued(runs);
      expect(promoted).toBeNull();
    });

    it('promotes multiple runs when multiple slots are available', () => {
      const runs = new Map<string, Run>();
      runs.set('r1', makeRun({ id: 'r1', status: RunStatus.Running }));
      runs.set('q1', makeRun({ id: 'q1', status: RunStatus.Queued }));
      runs.set('q2', makeRun({ id: 'q2', status: RunStatus.Queued }));
      runs.set('q3', makeRun({ id: 'q3', status: RunStatus.Queued }));

      // MAX_CONCURRENT_RUNS = 5, 1 running => 4 slots available
      const promoted1 = tryPromoteQueued(runs);
      expect(promoted1!.id).toBe('q1');

      const promoted2 = tryPromoteQueued(runs);
      expect(promoted2!.id).toBe('q2');

      const promoted3 = tryPromoteQueued(runs);
      expect(promoted3!.id).toBe('q3');
    });
  });
});
