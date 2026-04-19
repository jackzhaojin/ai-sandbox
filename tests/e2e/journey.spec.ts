import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { rm } from 'fs/promises';
import Fastify from 'fastify';
import type { FastifyInstance } from 'fastify';
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
  validateGraph,
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
    description: '',
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

    it('orchestrates retry exhaustion and cascading dependency unblocking end-to-end', async () => {
      const { taskA, taskB, taskC } = await completePriorSteps();

      // ---- Initial chain: A is dispatchable, B and C are blocked ----
      expect(canDispatch(taskA, getTasks(), getRuns())).toBe(true);
      expect(canDispatch(taskB, getTasks(), getRuns())).toBe(false);
      expect(canDispatch(taskC, getTasks(), getRuns())).toBe(false);
      expect(getBlockingDeps(taskB, getTasks(), getRuns())).toContain(taskA.id);
      expect(getBlockingDeps(taskC, getTasks(), getRuns())).toContain(taskB.id);

      // ---- Task A fails repeatedly; retries schedule until exhausted ----
      const runA1 = makeRun({ id: 'run-a-exhaust', task_id: taskA.id, status: RunStatus.Failed, attempt: 1 });
      addRun(runA1);

      // Retry 1: attempt 1 -> 2
      expect(scheduleRetry(runA1, taskA)).toBe(true);
      expect(runA1.attempt).toBe(2);
      expect(runA1.status).toBe(RunStatus.Queued);
      expect(runA1.next_retry_at).not.toBeNull();

      // Retry 2: attempt 2 -> 3
      runA1.status = RunStatus.Failed;
      expect(scheduleRetry(runA1, taskA)).toBe(true);
      expect(runA1.attempt).toBe(3);
      expect(runA1.status).toBe(RunStatus.Queued);

      // Exhausted: attempt 3 equals max_attempts 3, no further retries
      runA1.status = RunStatus.Failed;
      expect(scheduleRetry(runA1, taskA)).toBe(false);
      expect(runA1.attempt).toBe(3);
      expect(runA1.status).toBe(RunStatus.Failed);

      // B remains blocked because A has no completed run
      expect(canDispatch(taskB, getTasks(), getRuns())).toBe(false);
      expect(getBlockingDeps(taskB, getTasks(), getRuns())).toContain(taskA.id);

      // ---- Recover A with a successful run; chain unblocks ----
      const runA2 = makeRun({
        id: 'run-a-recover',
        task_id: taskA.id,
        status: RunStatus.Completed,
        finished_at: new Date(),
      });
      addRun(runA2);

      expect(canDispatch(taskB, getTasks(), getRuns())).toBe(true);
      expect(getBlockingDeps(taskB, getTasks(), getRuns())).toEqual([]);

      // Execute B successfully
      const runB = makeRun({
        id: 'run-b-success',
        task_id: taskB.id,
        status: RunStatus.Completed,
        finished_at: new Date(),
      });
      addRun(runB);

      // C can now dispatch
      expect(canDispatch(taskC, getTasks(), getRuns())).toBe(true);
      expect(getBlockingDeps(taskC, getTasks(), getRuns())).toEqual([]);

      // Execute C with a failure that gets retried once
      const runC1 = makeRun({
        id: 'run-c-fail',
        task_id: taskC.id,
        status: RunStatus.Failed,
        attempt: 1,
      });
      addRun(runC1);

      const now = Date.now();
      expect(scheduleRetry(runC1, taskC)).toBe(true);
      expect(runC1.attempt).toBe(2);
      expect(runC1.status).toBe(RunStatus.Queued);
      // Verify exponential backoff: base_delay_ms 1000 * 2^attempt(2) = 4000ms
      expect(runC1.next_retry_at!.getTime() - now).toBeGreaterThanOrEqual(4000);
      expect(runC1.next_retry_at!.getTime() - now).toBeLessThan(4500);
    });

    it('validates complex DAG topology (diamond pattern) via API end-to-end', async () => {
      let app: FastifyInstance | null = null;
      try {
        app = Fastify({ logger: false });
        const healthRoutes = (await import('../../src/routes/health.js')).default;
        const taskRoutes = (await import('../../src/routes/tasks.js')).default;
        await app.register(healthRoutes, { prefix: '/api/health' });
        await app.register(taskRoutes, { prefix: '/api/tasks' });

        // Health check
        const health = await app.inject({ method: 'GET', url: '/api/health' });
        expect(health.statusCode).toBe(200);

        // Create root task A
        const createA = await app.inject({
          method: 'POST',
          url: '/api/tasks',
          payload: { title: 'Task A', description: 'Root' },
        });
        expect(createA.statusCode).toBe(201);
        const taskA = JSON.parse(createA.payload);

        // Create B and C depending on A (diamond split)
        const createB = await app.inject({
          method: 'POST',
          url: '/api/tasks',
          payload: { title: 'Task B', description: 'Branch 1', dependencies: [taskA.id] },
        });
        expect(createB.statusCode).toBe(201);
        const taskB = JSON.parse(createB.payload);

        const createC = await app.inject({
          method: 'POST',
          url: '/api/tasks',
          payload: { title: 'Task C', description: 'Branch 2', dependencies: [taskA.id] },
        });
        expect(createC.statusCode).toBe(201);
        const taskC = JSON.parse(createC.payload);

        // Create D depending on B and C (diamond merge)
        const createD = await app.inject({
          method: 'POST',
          url: '/api/tasks',
          payload: { title: 'Task D', description: 'Merge', dependencies: [taskB.id, taskC.id] },
        });
        expect(createD.statusCode).toBe(201);
        const taskD = JSON.parse(createD.payload);

        // List all tasks — should include 4 tasks
        const listTasks = await app.inject({ method: 'GET', url: '/api/tasks' });
        expect(listTasks.statusCode).toBe(200);
        const allTasks = JSON.parse(listTasks.payload);
        expect(allTasks.length).toBe(4);
        expect(allTasks.some((t: { id: string }) => t.id === taskA.id)).toBe(true);
        expect(allTasks.some((t: { id: string }) => t.id === taskD.id)).toBe(true);

        // Validate graph — diamond should be valid
        const depsValid = await app.inject({
          method: 'GET',
          url: '/api/tasks/dependencies',
        });
        expect(depsValid.statusCode).toBe(200);
        const depsValidBody = JSON.parse(depsValid.payload);
        expect(depsValidBody.valid).toBe(true);

        // D cannot execute until B and C are done
        const execDBlocked = await app.inject({
          method: 'POST',
          url: `/api/tasks/${taskD.id}/execute`,
        });
        expect(execDBlocked.statusCode).toBe(409);
        const dBlockBody = JSON.parse(execDBlocked.payload);
        expect(dBlockBody.error).toBe('Dependencies not satisfied');
        expect(dBlockBody.blocking_deps).toContain(taskB.id);
        expect(dBlockBody.blocking_deps).toContain(taskC.id);

        // B is blocked until A completes
        const execBBlocked = await app.inject({
          method: 'POST',
          url: `/api/tasks/${taskB.id}/execute`,
        });
        expect(execBBlocked.statusCode).toBe(409);
        const bBlockBody = JSON.parse(execBBlocked.payload);
        expect(bBlockBody.blocking_deps).toContain(taskA.id);

        // Execute A successfully
        const execA = await app.inject({
          method: 'POST',
          url: `/api/tasks/${taskA.id}/execute`,
        });
        expect(execA.statusCode).toBe(200);

        // Now B and C can execute
        const execB = await app.inject({
          method: 'POST',
          url: `/api/tasks/${taskB.id}/execute`,
        });
        expect(execB.statusCode).toBe(200);
        const runB = JSON.parse(execB.payload).run;
        expect(runB.status).toBe('completed');

        const execC = await app.inject({
          method: 'POST',
          url: `/api/tasks/${taskC.id}/execute`,
        });
        expect(execC.statusCode).toBe(200);
        const runC = JSON.parse(execC.payload).run;
        expect(runC.status).toBe('completed');

        // D still cannot execute? Wait, B and C now have completed runs.
        // D should be able to execute now.
        const execD = await app.inject({
          method: 'POST',
          url: `/api/tasks/${taskD.id}/execute`,
        });
        expect(execD.statusCode).toBe(200);
        const runD = JSON.parse(execD.payload).run;
        expect(runD.status).toBe('completed');

        // Update D to depend on A directly — should fail because it creates A -> B -> D -> A cycle
        const updateCycle = await app.inject({
          method: 'PUT',
          url: `/api/tasks/${taskA.id}`,
          payload: { dependencies: [taskD.id] },
        });
        expect(updateCycle.statusCode).toBe(409);
        const cycleBody = JSON.parse(updateCycle.payload);
        expect(cycleBody.error).toBe('Dependency cycle detected');

        // Successfully update D's description (non-dependency change)
        const updateD = await app.inject({
          method: 'PUT',
          url: `/api/tasks/${taskD.id}`,
          payload: { description: 'Updated merge task' },
        });
        expect(updateD.statusCode).toBe(200);
        const updatedD = JSON.parse(updateD.payload);
        expect(updatedD.description).toBe('Updated merge task');

        // Delete B — should orphan D (which depends on B)
        const delB = await app.inject({
          method: 'DELETE',
          url: `/api/tasks/${taskB.id}`,
        });
        expect(delB.statusCode).toBe(204);

        const getD = await app.inject({
          method: 'GET',
          url: `/api/tasks/${taskD.id}`,
        });
        expect(getD.statusCode).toBe(200);
        const dBody = JSON.parse(getD.payload);
        expect(dBody.status).toBe('orphaned');

        // C should still be active
        const getC = await app.inject({
          method: 'GET',
          url: `/api/tasks/${taskC.id}`,
        });
        expect(getC.statusCode).toBe(200);
        expect(JSON.parse(getC.payload).status).toBe('active');
      } finally {
        if (app) {
          await app.close();
        }
      }
    });

    it('exercises the full API surface end-to-end', async () => {
      let app: FastifyInstance | null = null;
      try {
        app = Fastify({ logger: false });
        const healthRoutes = (await import('../../src/routes/health.js')).default;
        const taskRoutes = (await import('../../src/routes/tasks.js')).default;
        await app.register(healthRoutes, { prefix: '/api/health' });
        await app.register(taskRoutes, { prefix: '/api/tasks' });

        // Health check
        const health = await app.inject({ method: 'GET', url: '/api/health' });
        expect(health.statusCode).toBe(200);
        expect(JSON.parse(health.payload).status).toBe('ok');

        // Create task A with custom retryPolicy
        const createA = await app.inject({
          method: 'POST',
          url: '/api/tasks',
          payload: { title: 'Task A', description: 'First task', retryPolicy: { maxAttempts: 5, baseDelayMs: 500, maxDelayMs: 10000 } },
        });
        expect(createA.statusCode).toBe(201);
        const taskA = JSON.parse(createA.payload);
        expect(taskA.max_attempts).toBe(5);
        expect(taskA.base_delay_ms).toBe(500);
        expect(taskA.max_delay_ms).toBe(10000);

        // Create task B depending on A
        const createB = await app.inject({
          method: 'POST',
          url: '/api/tasks',
          payload: { title: 'Task B', description: 'Second task', dependencies: [taskA.id] },
        });
        expect(createB.statusCode).toBe(201);
        const taskB = JSON.parse(createB.payload);

        // Create task C depending on B
        const createC = await app.inject({
          method: 'POST',
          url: '/api/tasks',
          payload: { title: 'Task C', description: 'Third task', dependencies: [taskB.id] },
        });
        expect(createC.statusCode).toBe(201);
        const taskC = JSON.parse(createC.payload);

        // Validate dependency graph — should be valid
        const depsValid = await app.inject({
          method: 'GET',
          url: '/api/tasks/dependencies',
        });
        expect(depsValid.statusCode).toBe(200);
        const depsValidBody = JSON.parse(depsValid.payload);
        expect(depsValidBody.valid).toBe(true);

        // Attempt to create a cycle by updating A to depend on C
        const updateCycle = await app.inject({
          method: 'PUT',
          url: `/api/tasks/${taskA.id}`,
          payload: { dependencies: [taskC.id] },
        });
        expect(updateCycle.statusCode).toBe(409);
        const cycleBody = JSON.parse(updateCycle.payload);
        expect(cycleBody.error).toBe('Dependency cycle detected');

        // Try to execute B before A is completed — should block
        const execBBlocked = await app.inject({
          method: 'POST',
          url: `/api/tasks/${taskB.id}/execute`,
        });
        expect(execBBlocked.statusCode).toBe(409);
        const blockBody = JSON.parse(execBBlocked.payload);
        expect(blockBody.error).toBe('Dependencies not satisfied');
        expect(blockBody.blocking_deps).toContain(taskA.id);

        // Execute A successfully
        const execA = await app.inject({
          method: 'POST',
          url: `/api/tasks/${taskA.id}/execute`,
        });
        expect(execA.statusCode).toBe(200);
        const runA = JSON.parse(execA.payload).run;
        expect(runA.status).toBe('completed');

        // GET task A should show snapshot_history
        const getA = await app.inject({
          method: 'GET',
          url: `/api/tasks/${taskA.id}`,
        });
        expect(getA.statusCode).toBe(200);
        const getABody = JSON.parse(getA.payload);
        expect(Array.isArray(getABody.snapshot_history)).toBe(true);
        expect(getABody.snapshot_history.length).toBeGreaterThanOrEqual(1);
        expect(getABody.snapshot_history[0].status).toBe('completed');

        // Now execute B successfully
        const execB = await app.inject({
          method: 'POST',
          url: `/api/tasks/${taskB.id}/execute`,
        });
        expect(execB.statusCode).toBe(200);
        const runB = JSON.parse(execB.payload).run;
        expect(runB.status).toBe('completed');

        // Execute C with simulated failure to trigger retry scheduling
        const execCFail = await app.inject({
          method: 'POST',
          url: `/api/tasks/${taskC.id}/execute`,
          payload: { simulate_failure: true },
        });
        expect(execCFail.statusCode).toBe(200);
        const failBody = JSON.parse(execCFail.payload);
        expect(failBody.run.status).toBe('queued');
        expect(failBody.run.attempt).toBe(2);
        expect(failBody.retried).toBe(true);
        expect(failBody.run.next_retry_at).not.toBeNull();

        // List runs for C
        const listRuns = await app.inject({
          method: 'GET',
          url: `/api/tasks/${taskC.id}/runs`,
        });
        expect(listRuns.statusCode).toBe(200);
        const runs = JSON.parse(listRuns.payload);
        expect(runs.length).toBeGreaterThanOrEqual(1);
        expect(runs.some((r: { id: string }) => r.id === failBody.run.id)).toBe(true);

        // Delete A — should orphan B
        const delA = await app.inject({
          method: 'DELETE',
          url: `/api/tasks/${taskA.id}`,
        });
        expect(delA.statusCode).toBe(204);

        // Verify B is orphaned
        const getB = await app.inject({
          method: 'GET',
          url: `/api/tasks/${taskB.id}`,
        });
        expect(getB.statusCode).toBe(200);
        const bBody = JSON.parse(getB.payload);
        expect(bBody.status).toBe('orphaned');
      } finally {
        if (app) {
          await app.close();
        }
      }
    });
  });

  describe('checkpoint 2 — run routes and enhanced health metrics', () => {
    it('lists, filters, and retrieves runs; health reports live counts', async () => {
      let app: FastifyInstance | null = null;
      try {
        app = Fastify({ logger: false });
        const healthRoutes = (await import('../../src/routes/health.js')).default;
        const taskRoutes = (await import('../../src/routes/tasks.js')).default;
        const runsRoutes = (await import('../../src/routes/runs.js')).default;
        await app.register(healthRoutes, { prefix: '/api/health' });
        await app.register(taskRoutes, { prefix: '/api/tasks' });
        await app.register(runsRoutes, { prefix: '/api/runs' });

        // ---- Step 1: health metrics baseline (0 tasks, 0 runs) ----
        const health0 = await app.inject({ method: 'GET', url: '/api/health' });
        expect(health0.statusCode).toBe(200);
        const health0Body = JSON.parse(health0.payload);
        expect(health0Body.status).toBe('ok');
        expect(health0Body.tasks_count).toBe(0);
        expect(health0Body.running_count).toBe(0);
        expect(health0Body.queued_count).toBe(0);
        expect(typeof health0Body.uptime_s).toBe('number');

        // ---- Step 2: create two independent tasks ----
        const createX = await app.inject({
          method: 'POST',
          url: '/api/tasks',
          payload: { title: 'Task X', description: 'Run test X' },
        });
        expect(createX.statusCode).toBe(201);
        const taskX = JSON.parse(createX.payload);

        const createY = await app.inject({
          method: 'POST',
          url: '/api/tasks',
          payload: { title: 'Task Y', description: 'Run test Y' },
        });
        expect(createY.statusCode).toBe(201);
        const taskY = JSON.parse(createY.payload);

        // Health now shows 2 tasks
        const health2 = await app.inject({ method: 'GET', url: '/api/health' });
        expect(JSON.parse(health2.payload).tasks_count).toBe(2);

        // ---- Step 3: execute both tasks, creating completed runs ----
        const execX = await app.inject({ method: 'POST', url: `/api/tasks/${taskX.id}/execute` });
        expect(execX.statusCode).toBe(200);
        const runX = JSON.parse(execX.payload).run;
        expect(runX.status).toBe('completed');

        const execY = await app.inject({ method: 'POST', url: `/api/tasks/${taskY.id}/execute` });
        expect(execY.statusCode).toBe(200);
        const runY = JSON.parse(execY.payload).run;
        expect(runY.status).toBe('completed');

        // ---- Step 4: GET /api/runs lists all runs ----
        const listAll = await app.inject({ method: 'GET', url: '/api/runs' });
        expect(listAll.statusCode).toBe(200);
        const allRuns = JSON.parse(listAll.payload);
        expect(allRuns.length).toBe(2);
        expect(allRuns.some((r: { id: string }) => r.id === runX.id)).toBe(true);
        expect(allRuns.some((r: { id: string }) => r.id === runY.id)).toBe(true);

        // ---- Step 5: filter runs by task_id ----
        const filterX = await app.inject({ method: 'GET', url: `/api/runs?task_id=${taskX.id}` });
        expect(filterX.statusCode).toBe(200);
        const runsX = JSON.parse(filterX.payload);
        expect(runsX.length).toBe(1);
        expect(runsX[0].task_id).toBe(taskX.id);

        // ---- Step 6: filter runs by status ----
        const filterCompleted = await app.inject({ method: 'GET', url: '/api/runs?status=completed' });
        expect(filterCompleted.statusCode).toBe(200);
        const completedRuns = JSON.parse(filterCompleted.payload);
        expect(completedRuns.length).toBe(2);

        const filterQueued = await app.inject({ method: 'GET', url: '/api/runs?status=queued' });
        expect(filterQueued.statusCode).toBe(200);
        expect(JSON.parse(filterQueued.payload).length).toBe(0);

        // ---- Step 7: GET /api/runs/:id retrieves a single run ----
        const getRunX = await app.inject({ method: 'GET', url: `/api/runs/${runX.id}` });
        expect(getRunX.statusCode).toBe(200);
        const runXBody = JSON.parse(getRunX.payload);
        expect(runXBody.id).toBe(runX.id);
        expect(runXBody.task_id).toBe(taskX.id);
        expect(runXBody.status).toBe('completed');
        expect(runXBody.attempt).toBe(1);

        // Non-existent run returns 404
        const getMissing = await app.inject({ method: 'GET', url: '/api/runs/run-does-not-exist' });
        expect(getMissing.statusCode).toBe(404);
        expect(JSON.parse(getMissing.payload).error).toBe('Run not found');

        // ---- Step 8: simulate a failing run to create a queued retry ----
        const execYFail = await app.inject({
          method: 'POST',
          url: `/api/tasks/${taskY.id}/execute`,
          payload: { simulate_failure: true },
        });
        expect(execYFail.statusCode).toBe(200);
        const runYFail = JSON.parse(execYFail.payload).run;
        expect(runYFail.status).toBe('queued');
        expect(runYFail.attempt).toBe(2);

        // Health now shows 1 queued run
        const healthFinal = await app.inject({ method: 'GET', url: '/api/health' });
        const healthFinalBody = JSON.parse(healthFinal.payload);
        expect(healthFinalBody.tasks_count).toBe(2);
        expect(healthFinalBody.queued_count).toBe(1);
        expect(healthFinalBody.running_count).toBe(0);

        // Filter by queued status
        const filterQueuedNow = await app.inject({ method: 'GET', url: '/api/runs?status=queued' });
        expect(filterQueuedNow.statusCode).toBe(200);
        const queuedRuns = JSON.parse(filterQueuedNow.payload);
        expect(queuedRuns.length).toBe(1);
        expect(queuedRuns[0].id).toBe(runYFail.id);

        // ---- Step 9: since filter ----
        const since = new Date(Date.now() - 60 * 1000).toISOString();
        const filterSince = await app.inject({ method: 'GET', url: `/api/runs?since=${since}` });
        expect(filterSince.statusCode).toBe(200);
        const sinceRuns = JSON.parse(filterSince.payload);
        expect(sinceRuns.length).toBeGreaterThanOrEqual(2);

        // Invalid since returns 400
        const filterInvalidSince = await app.inject({ method: 'GET', url: '/api/runs?since=not-a-date' });
        expect(filterInvalidSince.statusCode).toBe(400);
        expect(JSON.parse(filterInvalidSince.payload).error).toBe('Invalid since timestamp');
      } finally {
        if (app) {
          await app.close();
        }
      }
    });
  });
});
