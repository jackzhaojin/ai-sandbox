import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { rm } from 'fs/promises';
import {
  init,
  loadState,
  saveState,
  getTasks,
  getRuns,
  getTask,
  getRun,
  addTask,
  updateTask,
  deleteTask,
  addRun,
  updateRun,
} from '../../src/services/persistence.js';
import { TaskStatus, RunStatus } from '../../src/domain/types.js';

const STATE_FILE = 'data/state.json';

async function clearStateFile() {
  try {
    await rm(STATE_FILE);
  } catch {
    // ignore
  }
}

function createSampleTask(id: string): import('../../src/domain/types.js').Task {
  return {
    id,
    name: `Task ${id}`,
    description: '',
    cron: '*/5 * * * *',
    payload: { foo: 'bar' },
    max_attempts: 3,
    base_delay_ms: 1000,
    max_delay_ms: 30000,
    depends_on: [],
    status: TaskStatus.Active,
    created_at: new Date('2026-01-01T00:00:00Z'),
    updated_at: new Date('2026-01-01T00:00:00Z'),
  };
}

function createSampleRun(id: string, taskId: string): import('../../src/domain/types.js').Run {
  return {
    id,
    task_id: taskId,
    status: RunStatus.Queued,
    attempt: 1,
    started_at: null,
    finished_at: null,
    error: null,
    output: null,
    next_retry_at: null,
  };
}

describe('persistence service', () => {
  beforeEach(async () => {
    await clearStateFile();
    // Reset in-memory state by loading empty file
    await loadState();
  });

  afterEach(async () => {
    await clearStateFile();
  });

  it('loads gracefully when state file is missing', async () => {
    await clearStateFile();
    await expect(loadState()).resolves.toBeUndefined();
    expect(getTasks().size).toBe(0);
    expect(getRuns().size).toBe(0);
  });

  it('adds and retrieves tasks', () => {
    const task = createSampleTask('t1');
    addTask(task);
    expect(getTask('t1')).toEqual(task);
    expect(getTasks().size).toBe(1);
  });

  it('updates a task and refreshes updated_at', () => {
    const task = createSampleTask('t2');
    addTask(task);
    updateTask('t2', { name: 'Updated' });
    const updated = getTask('t2')!;
    expect(updated.name).toBe('Updated');
    expect(updated.updated_at.getTime()).toBeGreaterThanOrEqual(task.updated_at.getTime());
  });

  it('throws on update for missing task', () => {
    expect(() => updateTask('missing', { name: 'X' })).toThrow('Task not found: missing');
  });

  it('deletes a task', () => {
    addTask(createSampleTask('t3'));
    deleteTask('t3');
    expect(getTask('t3')).toBeUndefined();
    expect(getTasks().size).toBe(0);
  });

  it('adds and retrieves runs', () => {
    const run = createSampleRun('r1', 't1');
    addRun(run);
    expect(getRun('r1')).toEqual(run);
    expect(getRuns().size).toBe(1);
  });

  it('updates a run', () => {
    const run = createSampleRun('r2', 't1');
    addRun(run);
    updateRun('r2', { status: RunStatus.Running });
    expect(getRun('r2')!.status).toBe(RunStatus.Running);
  });

  it('throws on update for missing run', () => {
    expect(() => updateRun('missing', { status: RunStatus.Failed })).toThrow('Run not found: missing');
  });

  it('round-trips state through save and load preserving Dates', async () => {
    const task = createSampleTask('t4');
    const run = createSampleRun('r4', 't4');
    run.started_at = new Date('2026-02-01T12:00:00Z');

    addTask(task);
    addRun(run);
    await saveState();

    // Reload from disk to verify round-trip
    await loadState();

    const loadedTask = getTask('t4')!;
    expect(loadedTask.created_at instanceof Date).toBe(true);
    expect(loadedTask.created_at.toISOString()).toBe('2026-01-01T00:00:00.000Z');

    const loadedRun = getRun('r4')!;
    expect(loadedRun.started_at instanceof Date).toBe(true);
    expect(loadedRun.started_at!.toISOString()).toBe('2026-02-01T12:00:00.000Z');
  });
});
