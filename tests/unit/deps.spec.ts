import { describe, it, expect } from 'vitest';
import {
  detectCycle,
  isDependencySatisfied,
  getBlockingDeps,
  canDispatch,
  markOrphaned,
} from '../../src/services/deps.js';
import { TaskStatus, RunStatus } from '../../src/domain/types.js';
import type { Task, Run } from '../../src/domain/types.js';

function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: 'task-a',
    name: 'Test Task',
    cron: '*/5 * * * *',
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
    task_id: 'task-a',
    status: RunStatus.Completed,
    attempt: 1,
    started_at: null,
    finished_at: new Date('2026-01-01T00:00:00Z'),
    error: null,
    output: null,
    next_retry_at: null,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// detectCycle
// ---------------------------------------------------------------------------

describe('detectCycle', () => {
  it('detects cycle A → B → C → A', () => {
    const tasks = new Map<string, Task>([
      ['A', makeTask({ id: 'A', depends_on: ['B'] })],
      ['B', makeTask({ id: 'B', depends_on: ['C'] })],
      ['C', makeTask({ id: 'C', depends_on: ['A'] })],
    ]);

    const result = detectCycle('A', ['B'], tasks);
    expect(result.hasCycle).toBe(true);
    expect(result.path).toContain('A');
  });

  it('detects self-loop A → A', () => {
    const tasks = new Map<string, Task>();
    const result = detectCycle('A', ['A'], tasks);
    expect(result.hasCycle).toBe(true);
    expect(result.path).toEqual(['A', 'A']);
  });

  it('passes for valid DAG A → B, B → C', () => {
    const tasks = new Map<string, Task>([
      ['A', makeTask({ id: 'A', depends_on: ['B'] })],
      ['B', makeTask({ id: 'B', depends_on: ['C'] })],
      ['C', makeTask({ id: 'C', depends_on: [] })],
    ]);

    const result = detectCycle('A', ['B'], tasks);
    expect(result.hasCycle).toBe(false);
  });

  it('detects cycle when adding new dependency creates closed loop', () => {
    const tasks = new Map<string, Task>([
      ['A', makeTask({ id: 'A', depends_on: [] })],
      ['B', makeTask({ id: 'B', depends_on: ['A'] })],
    ]);

    // Adding A depends_on B would create A → B → A
    const result = detectCycle('A', ['B'], tasks);
    expect(result.hasCycle).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// isDependencySatisfied
// ---------------------------------------------------------------------------

describe('isDependencySatisfied', () => {
  it('returns true when parent completed within freshness window', () => {
    const task = makeTask({ id: 'task-x', depends_on: ['task-y'] });
    const tasks = new Map<string, Task>([
      ['task-x', task],
      ['task-y', makeTask({ id: 'task-y' })],
    ]);
    const runs = new Map<string, Run>([
      [
        'run-y-1',
        makeRun({
          id: 'run-y-1',
          task_id: 'task-y',
          status: RunStatus.Completed,
          finished_at: new Date(Date.now() - 30 * 60 * 1000), // 30 min ago
        }),
      ],
    ]);

    expect(isDependencySatisfied(task, tasks, runs, 3600)).toBe(true);
  });

  it('returns false when parent failed (no completed run)', () => {
    const task = makeTask({ id: 'task-x', depends_on: ['task-y'] });
    const tasks = new Map<string, Task>([
      ['task-x', task],
      ['task-y', makeTask({ id: 'task-y' })],
    ]);
    const runs = new Map<string, Run>([
      [
        'run-y-1',
        makeRun({
          id: 'run-y-1',
          task_id: 'task-y',
          status: RunStatus.Failed,
          finished_at: new Date(Date.now() - 30 * 60 * 1000),
        }),
      ],
    ]);

    expect(isDependencySatisfied(task, tasks, runs, 3600)).toBe(false);
  });

  it('returns false when parent completed but outside freshness window', () => {
    const task = makeTask({ id: 'task-x', depends_on: ['task-y'] });
    const tasks = new Map<string, Task>([
      ['task-x', task],
      ['task-y', makeTask({ id: 'task-y' })],
    ]);
    const runs = new Map<string, Run>([
      [
        'run-y-1',
        makeRun({
          id: 'run-y-1',
          task_id: 'task-y',
          status: RunStatus.Completed,
          finished_at: new Date(Date.now() - 2 * 3600 * 1000), // 2 hours ago
        }),
      ],
    ]);

    expect(isDependencySatisfied(task, tasks, runs, 3600)).toBe(false);
  });

  it('returns true when all multiple deps are satisfied', () => {
    const task = makeTask({ id: 'task-x', depends_on: ['task-y', 'task-z'] });
    const tasks = new Map<string, Task>([
      ['task-x', task],
      ['task-y', makeTask({ id: 'task-y' })],
      ['task-z', makeTask({ id: 'task-z' })],
    ]);
    const runs = new Map<string, Run>([
      [
        'run-y-1',
        makeRun({
          id: 'run-y-1',
          task_id: 'task-y',
          status: RunStatus.Completed,
          finished_at: new Date(Date.now() - 10 * 60 * 1000),
        }),
      ],
      [
        'run-z-1',
        makeRun({
          id: 'run-z-1',
          task_id: 'task-z',
          status: RunStatus.Completed,
          finished_at: new Date(Date.now() - 20 * 60 * 1000),
        }),
      ],
    ]);

    expect(isDependencySatisfied(task, tasks, runs, 3600)).toBe(true);
  });

  it('returns false when one of multiple deps is missing a run', () => {
    const task = makeTask({ id: 'task-x', depends_on: ['task-y', 'task-z'] });
    const tasks = new Map<string, Task>([
      ['task-x', task],
      ['task-y', makeTask({ id: 'task-y' })],
      ['task-z', makeTask({ id: 'task-z' })],
    ]);
    const runs = new Map<string, Run>([
      [
        'run-y-1',
        makeRun({
          id: 'run-y-1',
          task_id: 'task-y',
          status: RunStatus.Completed,
          finished_at: new Date(Date.now() - 10 * 60 * 1000),
        }),
      ],
    ]);

    expect(isDependencySatisfied(task, tasks, runs, 3600)).toBe(false);
  });

  it('returns true when no dependencies exist', () => {
    const task = makeTask({ id: 'task-x', depends_on: [] });
    const tasks = new Map<string, Task>([['task-x', task]]);
    const runs = new Map<string, Run>();

    expect(isDependencySatisfied(task, tasks, runs)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// getBlockingDeps
// ---------------------------------------------------------------------------

describe('getBlockingDeps', () => {
  it('returns empty array when all deps are satisfied', () => {
    const task = makeTask({ id: 'task-x', depends_on: ['task-y'] });
    const tasks = new Map<string, Task>([
      ['task-x', task],
      ['task-y', makeTask({ id: 'task-y' })],
    ]);
    const runs = new Map<string, Run>([
      [
        'run-y-1',
        makeRun({
          id: 'run-y-1',
          task_id: 'task-y',
          status: RunStatus.Completed,
          finished_at: new Date(Date.now() - 15 * 60 * 1000),
        }),
      ],
    ]);

    expect(getBlockingDeps(task, tasks, runs, 3600)).toEqual([]);
  });

  it('returns dep id when parent never ran', () => {
    const task = makeTask({ id: 'task-x', depends_on: ['task-y'] });
    const tasks = new Map<string, Task>([
      ['task-x', task],
      ['task-y', makeTask({ id: 'task-y' })],
    ]);
    const runs = new Map<string, Run>();

    expect(getBlockingDeps(task, tasks, runs, 3600)).toEqual(['task-y']);
  });

  it('returns dep id when most recent run failed', () => {
    const task = makeTask({ id: 'task-x', depends_on: ['task-y'] });
    const tasks = new Map<string, Task>([
      ['task-x', task],
      ['task-y', makeTask({ id: 'task-y' })],
    ]);
    const runs = new Map<string, Run>([
      [
        'run-y-1',
        makeRun({
          id: 'run-y-1',
          task_id: 'task-y',
          status: RunStatus.Failed,
          finished_at: new Date(Date.now() - 5 * 60 * 1000),
        }),
      ],
    ]);

    expect(getBlockingDeps(task, tasks, runs, 3600)).toEqual(['task-y']);
  });

  it('returns dep id when completed run is stale', () => {
    const task = makeTask({ id: 'task-x', depends_on: ['task-y'] });
    const tasks = new Map<string, Task>([
      ['task-x', task],
      ['task-y', makeTask({ id: 'task-y' })],
    ]);
    const runs = new Map<string, Run>([
      [
        'run-y-1',
        makeRun({
          id: 'run-y-1',
          task_id: 'task-y',
          status: RunStatus.Completed,
          finished_at: new Date(Date.now() - 2 * 3600 * 1000),
        }),
      ],
    ]);

    expect(getBlockingDeps(task, tasks, runs, 3600)).toEqual(['task-y']);
  });

  it('returns multiple blocking deps when several are unsatisfied', () => {
    const task = makeTask({ id: 'task-x', depends_on: ['task-y', 'task-z'] });
    const tasks = new Map<string, Task>([
      ['task-x', task],
      ['task-y', makeTask({ id: 'task-y' })],
      ['task-z', makeTask({ id: 'task-z' })],
    ]);
    const runs = new Map<string, Run>();

    const blocking = getBlockingDeps(task, tasks, runs, 3600);
    expect(blocking).toHaveLength(2);
    expect(blocking).toContain('task-y');
    expect(blocking).toContain('task-z');
  });
});

// ---------------------------------------------------------------------------
// canDispatch
// ---------------------------------------------------------------------------

describe('canDispatch', () => {
  it('returns true when dependencies are satisfied', () => {
    const task = makeTask({ id: 'task-x', depends_on: ['task-y'] });
    const tasks = new Map<string, Task>([
      ['task-x', task],
      ['task-y', makeTask({ id: 'task-y' })],
    ]);
    const runs = new Map<string, Run>([
      [
        'run-y-1',
        makeRun({
          id: 'run-y-1',
          task_id: 'task-y',
          status: RunStatus.Completed,
          finished_at: new Date(Date.now() - 10 * 60 * 1000),
        }),
      ],
    ]);

    expect(canDispatch(task, tasks, runs)).toBe(true);
  });

  it('returns false when dependencies are blocked', () => {
    const task = makeTask({ id: 'task-x', depends_on: ['task-y'] });
    const tasks = new Map<string, Task>([
      ['task-x', task],
      ['task-y', makeTask({ id: 'task-y' })],
    ]);
    const runs = new Map<string, Run>();

    expect(canDispatch(task, tasks, runs)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// markOrphaned
// ---------------------------------------------------------------------------

describe('markOrphaned', () => {
  it('marks dependent tasks as orphaned when dependency is deleted', () => {
    const tasks = new Map<string, Task>([
      ['A', makeTask({ id: 'A', depends_on: [] })],
      ['B', makeTask({ id: 'B', depends_on: ['A'] })],
      ['C', makeTask({ id: 'C', depends_on: ['A'] })],
      ['D', makeTask({ id: 'D', depends_on: ['B'] })],
    ]);

    const orphaned = markOrphaned('A', tasks);

    expect(orphaned.sort()).toEqual(['B', 'C']);
    expect(tasks.get('B')!.status).toBe(TaskStatus.Orphaned);
    expect(tasks.get('C')!.status).toBe(TaskStatus.Orphaned);
    expect(tasks.get('A')!.status).toBe(TaskStatus.Active);
    expect(tasks.get('D')!.status).toBe(TaskStatus.Active);
  });

  it('does not mark already-orphaned tasks again', () => {
    const tasks = new Map<string, Task>([
      ['A', makeTask({ id: 'A', depends_on: [] })],
      ['B', makeTask({ id: 'B', depends_on: ['A'], status: TaskStatus.Orphaned })],
    ]);

    const orphaned = markOrphaned('A', tasks);
    expect(orphaned).toEqual([]);
  });

  it('updates updated_at when marking orphaned', () => {
    const before = new Date('2026-01-01T00:00:00Z');
    const tasks = new Map<string, Task>([
      ['A', makeTask({ id: 'A', depends_on: [] })],
      ['B', makeTask({ id: 'B', depends_on: ['A'], updated_at: before })],
    ]);

    markOrphaned('A', tasks);
    expect(tasks.get('B')!.updated_at.getTime()).toBeGreaterThanOrEqual(before.getTime());
  });
});
