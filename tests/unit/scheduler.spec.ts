import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

// ---------------------------------------------------------------------------
// Module mocks (hoisted)
// ---------------------------------------------------------------------------

vi.mock('../../src/domain/handlers.js', () => ({
  executeHandler: vi.fn(),
}));

vi.mock('cron-parser', () => ({
  default: {
    parseExpression: vi.fn(() => ({
      next: vi.fn(() => ({
        toDate: vi.fn(() => new Date('2026-01-01T00:00:05Z')),
      })),
    })),
  },
}));

// ---------------------------------------------------------------------------
// Imports
// ---------------------------------------------------------------------------

import cronParser from 'cron-parser';
import { executeHandler } from '../../src/domain/handlers.js';
import {
  parseNextRun,
  checkOverlap,
  shouldDispatch,
  dispatchTask,
  executeRun,
  tick,
} from '../../src/services/scheduler.js';
import {
  getTasks,
  getRuns,
  addTask,
  addRun,
} from '../../src/services/persistence.js';
import { validateGraph, detectCycle } from '../../src/services/deps.js';
import { TaskStatus, RunStatus } from '../../src/domain/types.js';
import type { Task, Run } from '../../src/domain/types.js';
import { MAX_CONCURRENT_RUNS } from '../../src/services/concurrency.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: 'task-1',
    name: 'Test Task',
    description: '',
    cron: '*/5 * * * * *',
    payload: {},
    max_attempts: 3,
    base_delay_ms: 1000,
    max_delay_ms: 30000,
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

async function drainAsyncQueue(iterations = 10): Promise<void> {
  for (let i = 0; i < iterations; i++) {
    await new Promise<void>((resolve) => setImmediate(resolve));
  }
}

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

describe('scheduler service', () => {
  beforeEach(() => {
    getTasks().clear();
    getRuns().clear();
    vi.restoreAllMocks();
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.useFakeTimers({
      toFake: ['Date', 'setTimeout', 'setInterval', 'clearTimeout', 'clearInterval'],
    });
    vi.setSystemTime(new Date('2026-01-01T00:00:10Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // -------------------------------------------------------------------------
  // Rule 1: Cron scheduling
  // -------------------------------------------------------------------------

  describe('cron scheduling', () => {
    it('parseNextRun returns next occurrence for valid cron', () => {
      const result = parseNextRun('*/5 * * * * *');
      expect(result).toEqual(new Date('2026-01-01T00:00:05Z'));
    });

    it('parseNextRun returns null for invalid cron', () => {
      vi.mocked(cronParser.parseExpression).mockImplementation(() => {
        throw new Error('Invalid cron');
      });
      expect(parseNextRun('not-a-cron')).toBeNull();
    });

    it('shouldDispatch returns true when active task cron time has arrived', () => {
      const task = makeTask({ id: 't1', cron: '*/5 * * * * *' });
      addTask(task);
      expect(shouldDispatch(task, new Date('2026-01-01T00:00:10Z'))).toBe(true);
    });

    it('shouldDispatch returns false when task is paused', () => {
      const task = makeTask({ id: 't1', status: TaskStatus.Paused });
      addTask(task);
      expect(shouldDispatch(task, new Date('2026-01-01T00:00:10Z'))).toBe(false);
    });

    it('shouldDispatch returns false when cron next occurrence is in the future', () => {
      vi.mocked(cronParser.parseExpression).mockReturnValue({
        next: vi.fn(() => ({
          toDate: vi.fn(() => new Date('2026-01-01T00:00:15Z')),
        })),
      } as any);
      const task = makeTask({ id: 't1' });
      addTask(task);
      expect(shouldDispatch(task, new Date('2026-01-01T00:00:10Z'))).toBe(false);
    });

    it('tick creates a run for active task whose cron time has arrived', () => {
      addTask(makeTask({ id: 't1' }));
      tick();
      const runs = Array.from(getRuns().values());
      expect(runs).toHaveLength(1);
      expect(runs[0].task_id).toBe('t1');
    });
  });

  // -------------------------------------------------------------------------
  // Rule 2: No self-overlap
  // -------------------------------------------------------------------------

  describe('no self-overlap', () => {
    it('checkOverlap returns true when a running run exists for the task', () => {
      const runs = new Map<string, Run>([
        ['r1', makeRun({ id: 'r1', task_id: 't1', status: RunStatus.Running })],
        ['r2', makeRun({ id: 'r2', task_id: 't1', status: RunStatus.Queued })],
      ]);
      expect(checkOverlap('t1', runs)).toBe(true);
    });

    it('checkOverlap returns false when no running run exists for the task', () => {
      const runs = new Map<string, Run>([
        ['r1', makeRun({ id: 'r1', task_id: 't1', status: RunStatus.Queued })],
        ['r2', makeRun({ id: 'r2', task_id: 't1', status: RunStatus.Completed })],
      ]);
      expect(checkOverlap('t1', runs)).toBe(false);
    });

    it('shouldDispatch returns false when overlap exists', () => {
      const task = makeTask({ id: 't1' });
      addTask(task);
      addRun(makeRun({ id: 'r1', task_id: 't1', status: RunStatus.Running }));
      expect(shouldDispatch(task, new Date('2026-01-01T00:00:10Z'))).toBe(false);
    });

    it('tick logs overlap skip and does not create a new run when task is already running', () => {
      const logSpy = vi.spyOn(console, 'log');
      addTask(makeTask({ id: 't1', name: 'OverlapTask' }));
      addRun(makeRun({ id: 'r1', task_id: 't1', status: RunStatus.Running }));

      tick();

      const overlapLog = logSpy.mock.calls.find((call) =>
        String(call[0]).includes('overlap')
      );
      expect(overlapLog).toBeDefined();
      expect(Array.from(getRuns().values())).toHaveLength(1);
    });
  });

  // -------------------------------------------------------------------------
  // Rule 3: Retry policy
  // -------------------------------------------------------------------------

  describe('retry policy', () => {
    it('executeRun marks run Completed and stores output on handler success', async () => {
      vi.mocked(executeHandler).mockResolvedValue({
        success: true,
        output: { result: 'ok' },
      });

      addTask(makeTask({ id: 't1', payload: { handler_name: 'echo' } }));
      addRun(
        makeRun({
          id: 'r1',
          task_id: 't1',
          status: RunStatus.Running,
          started_at: new Date(),
        })
      );

      await executeRun('r1');

      const run = getRuns().get('r1')!;
      expect(run.status).toBe(RunStatus.Completed);
      expect(run.output).toEqual({ result: 'ok' });
      expect(run.error).toBeNull();
      expect(run.finished_at).not.toBeNull();
    });

    it('executeRun retries failed run, incrementing attempt and setting next_retry_at', async () => {
      vi.mocked(executeHandler).mockRejectedValue(new Error('handler failure'));

      addTask(makeTask({ id: 't1', payload: { handler_name: 'flaky' } }));
      addRun(
        makeRun({
          id: 'r1',
          task_id: 't1',
          status: RunStatus.Running,
          started_at: new Date(),
        })
      );

      await executeRun('r1');
      await drainAsyncQueue();

      const run = getRuns().get('r1')!;
      // Should have retried until max_attempts (3)
      expect(run.attempt).toBe(3);
      expect(run.status).toBe(RunStatus.Failed);
      expect(run.error).toBe('handler failure');
      expect(vi.mocked(executeHandler).mock.calls.length).toBe(3);
    });

    it('executeRun respects max_attempts cap and leaves run Failed after exhaustion', async () => {
      vi.mocked(executeHandler).mockRejectedValue(new Error('boom'));

      addTask(
        makeTask({
          id: 't1',
          payload: { handler_name: 'flaky' },
          max_attempts: 2,
        })
      );
      addRun(
        makeRun({
          id: 'r1',
          task_id: 't1',
          status: RunStatus.Running,
          started_at: new Date(),
        })
      );

      await executeRun('r1');
      await drainAsyncQueue();

      const run = getRuns().get('r1')!;
      expect(run.attempt).toBe(2);
      expect(run.status).toBe(RunStatus.Failed);
      expect(vi.mocked(executeHandler).mock.calls.length).toBe(2);
    });

    it('executeRun propagates handler error string to run.error', async () => {
      vi.mocked(executeHandler).mockResolvedValue({
        success: false,
        error: 'custom handler error',
      });

      addTask(makeTask({ id: 't1', payload: { handler_name: 'echo' } }));
      addRun(
        makeRun({
          id: 'r1',
          task_id: 't1',
          status: RunStatus.Running,
          started_at: new Date(),
        })
      );

      await executeRun('r1');
      await drainAsyncQueue();

      const run = getRuns().get('r1')!;
      expect(run.status).toBe(RunStatus.Failed);
      expect(run.error).toBe('custom handler error');
    });

    it('executeRun sets next_retry_at on retry scheduling', async () => {
      vi.mocked(executeHandler).mockRejectedValue(new Error('fail'));

      addTask(makeTask({ id: 't1', payload: { handler_name: 'flaky' } }));
      addRun(
        makeRun({
          id: 'r1',
          task_id: 't1',
          status: RunStatus.Running,
          started_at: new Date(),
        })
      );

      await executeRun('r1');
      // Only drain a little to capture the first retry state
      await new Promise<void>((r) => setImmediate(r));
      await new Promise<void>((r) => setImmediate(r));

      const run = getRuns().get('r1')!;
      // After first failure and first retry scheduling, attempt becomes 2
      expect(run.attempt).toBeGreaterThanOrEqual(2);
      if (run.status === RunStatus.Queued) {
        expect(run.next_retry_at).not.toBeNull();
        expect(run.next_retry_at!.getTime()).toBeGreaterThan(Date.now());
      }
    });
  });

  // -------------------------------------------------------------------------
  // Rule 4: Dependency DAG
  // -------------------------------------------------------------------------

  describe('dependency DAG', () => {
    it('shouldDispatch returns false when dependencies are not satisfied', () => {
      const taskA = makeTask({ id: 'tA' });
      const taskB = makeTask({ id: 'tB', depends_on: ['tA'] });
      addTask(taskA);
      addTask(taskB);
      expect(shouldDispatch(taskB, new Date('2026-01-01T00:00:10Z'))).toBe(false);
    });

    it('tick logs blocked skip and does not dispatch task with unsatisfied dependencies', () => {
      const logSpy = vi.spyOn(console, 'log');
      const taskA = makeTask({ id: 'tA' });
      const taskB = makeTask({ id: 'tB', name: 'BlockedTask', depends_on: ['tA'] });
      addTask(taskA);
      addTask(taskB);

      tick();

      const blockedLog = logSpy.mock.calls.find((call) =>
        String(call[0]).includes('blocked')
      );
      expect(blockedLog).toBeDefined();
      const runs = Array.from(getRuns().values());
      expect(runs.filter((r) => r.task_id === 'tB')).toHaveLength(0);
    });

    it('shouldDispatch returns true when all dependencies have fresh completed runs', () => {
      const taskA = makeTask({ id: 'tA' });
      const taskB = makeTask({ id: 'tB', depends_on: ['tA'] });
      addTask(taskA);
      addTask(taskB);
      addRun(
        makeRun({
          id: 'rA',
          task_id: 'tA',
          status: RunStatus.Completed,
          finished_at: new Date(Date.now() - 60_000),
        })
      );
      expect(shouldDispatch(taskB, new Date('2026-01-01T00:00:10Z'))).toBe(true);
    });

    it('tick dispatches dependent task after dependency run completes successfully', () => {
      const taskA = makeTask({ id: 'tA', status: TaskStatus.Paused });
      const taskB = makeTask({ id: 'tB', depends_on: ['tA'] });
      addTask(taskA);
      addTask(taskB);
      addRun(
        makeRun({
          id: 'rA',
          task_id: 'tA',
          status: RunStatus.Completed,
          finished_at: new Date(Date.now() - 60_000),
        })
      );

      tick();

      const runs = Array.from(getRuns().values());
      expect(runs.some((r) => r.task_id === 'tB')).toBe(true);
    });
  });

  // -------------------------------------------------------------------------
  // Rule 5: Concurrency limit
  // -------------------------------------------------------------------------

  describe('concurrency limit', () => {
    it('dispatchTask queues a run when all concurrency slots are occupied', () => {
      // Fill all slots
      for (let i = 0; i < MAX_CONCURRENT_RUNS; i++) {
        const tid = `slot-${i}`;
        addTask(makeTask({ id: tid }));
        addRun(
          makeRun({
            id: `r-${i}`,
            task_id: tid,
            status: RunStatus.Running,
            started_at: new Date(),
          })
        );
      }

      addTask(makeTask({ id: 'overflow' }));
      dispatchTask(getTasks().get('overflow')!);

      const overflowRuns = Array.from(getRuns().values()).filter(
        (r) => r.task_id === 'overflow'
      );
      expect(overflowRuns).toHaveLength(1);
      expect(overflowRuns[0].status).toBe(RunStatus.Queued);
    });

    it('tick dispatches up to MAX_CONCURRENT_RUNS and queues the rest', () => {
      for (let i = 0; i < MAX_CONCURRENT_RUNS + 1; i++) {
        addTask(makeTask({ id: `t${i}` }));
      }

      tick();

      const runs = Array.from(getRuns().values());
      const runningCount = runs.filter((r) => r.status === RunStatus.Running).length;
      const queuedCount = runs.filter((r) => r.status === RunStatus.Queued).length;
      expect(runningCount).toBe(MAX_CONCURRENT_RUNS);
      expect(queuedCount).toBe(1);
    });

    it('executeRun promotes a queued run to running when it completes and frees a slot', async () => {
      vi.mocked(executeHandler).mockResolvedValue({ success: true, output: {} });

      // Fill slots
      for (let i = 0; i < MAX_CONCURRENT_RUNS; i++) {
        const tid = `slot-${i}`;
        addTask(makeTask({ id: tid }));
        addRun(
          makeRun({
            id: `r-${i}`,
            task_id: tid,
            status: RunStatus.Running,
            started_at: new Date(),
          })
        );
      }

      // Add a queued run
      addTask(makeTask({ id: 'queued-task' }));
      addRun(
        makeRun({
          id: 'r-queued',
          task_id: 'queued-task',
          status: RunStatus.Queued,
        })
      );

      // Complete one running run
      await executeRun('r-0');

      const queuedRun = getRuns().get('r-queued')!;
      expect(queuedRun.status).toBe(RunStatus.Running);
      expect(queuedRun.started_at).not.toBeNull();
    });
  });

  // -------------------------------------------------------------------------
  // Rule 6: Cycle detection
  // -------------------------------------------------------------------------

  describe('cycle detection', () => {
    it('detectCycle detects A→B→C→A and returns the cycle path', () => {
      const tasks = new Map<string, Task>([
        ['A', makeTask({ id: 'A', depends_on: ['B'] })],
        ['B', makeTask({ id: 'B', depends_on: ['C'] })],
        ['C', makeTask({ id: 'C', depends_on: ['A'] })],
      ]);
      const result = detectCycle('A', ['B'], tasks);
      expect(result.hasCycle).toBe(true);
      expect(result.path).toBeDefined();
      expect(result.path!.length).toBeGreaterThanOrEqual(2);
    });

    it('validateGraph reports invalid for a task graph containing a cycle', () => {
      const tasks = new Map<string, Task>([
        ['A', makeTask({ id: 'A', depends_on: ['B'] })],
        ['B', makeTask({ id: 'B', depends_on: ['C'] })],
        ['C', makeTask({ id: 'C', depends_on: ['A'] })],
      ]);
      const result = validateGraph(tasks);
      expect(result.valid).toBe(false);
      expect(result.cycle).toBeDefined();
      expect(result.cycle!.length).toBeGreaterThanOrEqual(2);
    });

    it('tick never dispatches tasks that are part of a dependency cycle', () => {
      addTask(makeTask({ id: 'A', depends_on: ['B'] }));
      addTask(makeTask({ id: 'B', depends_on: ['C'] }));
      addTask(makeTask({ id: 'C', depends_on: ['A'] }));

      tick();

      const runs = Array.from(getRuns().values());
      expect(runs).toHaveLength(0);
    });
  });

  // -------------------------------------------------------------------------
  // Edge cases & extras
  // -------------------------------------------------------------------------

  describe('edge cases', () => {
    it('tick skips inactive (paused) tasks', () => {
      addTask(makeTask({ id: 't1', status: TaskStatus.Paused }));
      tick();
      expect(Array.from(getRuns().values())).toHaveLength(0);
    });

    it('tick skips orphaned tasks', () => {
      addTask(makeTask({ id: 't1', status: TaskStatus.Orphaned }));
      tick();
      expect(Array.from(getRuns().values())).toHaveLength(0);
    });

    it('dispatchTask triggers async execution for promoted runs', async () => {
      vi.mocked(executeHandler).mockResolvedValue({
        success: true,
        output: { dispatched: true },
      });

      addTask(makeTask({ id: 't1', payload: { handler_name: 'echo' } }));
      dispatchTask(getTasks().get('t1')!);

      // Run should be created and promoted immediately (slot available)
      const runs = Array.from(getRuns().values());
      expect(runs).toHaveLength(1);
      expect(runs[0].status).toBe(RunStatus.Running);

      // Let async execution complete
      await drainAsyncQueue();

      const run = getRuns().get(runs[0].id)!;
      expect(run.status).toBe(RunStatus.Completed);
      expect(run.output).toEqual({ dispatched: true });
    });

    it('does not dispatch a task that already has a queued run', () => {
      addTask(makeTask({ id: 't1' }));
      addRun(makeRun({ id: 'r1', task_id: 't1', status: RunStatus.Queued }));

      tick();

      const runs = Array.from(getRuns().values());
      expect(runs).toHaveLength(1);
      expect(runs[0].id).toBe('r1');
    });
  });
});
