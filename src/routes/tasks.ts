import type { FastifyInstance } from 'fastify';
import { randomUUID } from 'crypto';
import {
  getTasks,
  getRuns,
  getTask,
  addTask,
  updateTask,
  deleteTask,
  addRun,
  updateRun,
} from '../services/persistence.js';
import { detectCycle, canDispatch, getBlockingDeps, markOrphaned, validateGraph } from '../services/deps.js';
import { scheduleRetry } from '../services/retry.js';
import { TaskStatus, RunStatus } from '../domain/types.js';
import { TaskCreateSchema, TaskUpdateSchema } from '../domain/types.js';
import type { Task, Run } from '../domain/types.js';

function getSnapshotHistory(taskId: string) {
  const runs = Array.from(getRuns().values()).filter((r) => r.task_id === taskId);
  runs.sort((a, b) => {
    const at = a.started_at?.getTime() ?? 0;
    const bt = b.started_at?.getTime() ?? 0;
    return bt - at;
  });
  return runs;
}

function taskToJson(task: Task) {
  return {
    id: task.id,
    title: task.name,
    description: task.description,
    dependencies: task.depends_on,
    cron: task.cron,
    payload: task.payload,
    max_attempts: task.max_attempts,
    base_delay_ms: task.base_delay_ms,
    max_delay_ms: task.max_delay_ms,
    depends_on: task.depends_on,
    status: task.status,
    created_at: task.created_at.toISOString(),
    updated_at: task.updated_at.toISOString(),
  };
}

function runToJson(run: Run) {
  return {
    id: run.id,
    task_id: run.task_id,
    status: run.status,
    attempt: run.attempt,
    started_at: run.started_at?.toISOString() ?? null,
    finished_at: run.finished_at?.toISOString() ?? null,
    error: run.error,
    output: run.output,
    next_retry_at: run.next_retry_at?.toISOString() ?? null,
  };
}

export default async function taskRoutes(app: FastifyInstance) {
  // GET /api/tasks — list all tasks
  app.get('/', async (_req, reply) => {
    const tasks = Array.from(getTasks().values()).map(taskToJson);
    return reply.send(tasks);
  });

  // POST /api/tasks — create a task
  app.post('/', async (req, reply) => {
    const parsed = TaskCreateSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Invalid request body', details: parsed.error.format() });
    }

    const data = parsed.data;

    // Cycle detection
    const cycle = detectCycle('new-task', data.dependencies, getTasks());
    if (cycle.hasCycle) {
      return reply.status(400).send({ error: 'Dependency cycle detected', path: cycle.path });
    }

    const retryPolicy = data.retryPolicy;
    const task: Task = {
      id: randomUUID(),
      name: data.title,
      description: data.description,
      cron: '0 0 * * *',
      payload: {},
      max_attempts: retryPolicy?.maxAttempts ?? 3,
      base_delay_ms: retryPolicy?.baseDelayMs ?? 1000,
      max_delay_ms: retryPolicy?.maxDelayMs ?? 30000,
      depends_on: data.dependencies,
      status: TaskStatus.Active,
      created_at: new Date(),
      updated_at: new Date(),
    };

    addTask(task);
    return reply.status(201).send(taskToJson(task));
  });

  // GET /api/tasks/:id — retrieve a task and its current snapshot
  app.get('/:id', async (req, reply) => {
    const { id } = req.params as { id: string };
    const task = getTask(id);
    if (!task) {
      return reply.status(404).send({ error: 'Task not found' });
    }
    const snapshots = getSnapshotHistory(id);
    return reply.send({
      ...taskToJson(task),
      snapshot_history: snapshots.map(runToJson),
    });
  });

  // PUT /api/tasks/:id — update a task
  app.put('/:id', async (req, reply) => {
    const { id } = req.params as { id: string };
    const existing = getTask(id);
    if (!existing) {
      return reply.status(404).send({ error: 'Task not found' });
    }

    const parsed = TaskUpdateSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Invalid request body', details: parsed.error.format() });
    }

    const data = parsed.data;
    const newDeps = data.dependencies ?? data.depends_on;

    // If dependencies are changing, check for cycles
    if (newDeps !== undefined) {
      const cycle = detectCycle(id, newDeps, getTasks());
      if (cycle.hasCycle) {
        return reply.status(400).send({ error: 'Dependency cycle detected', path: cycle.path });
      }
    }

    updateTask(id, {
      name: data.title ?? data.name,
      description: data.description,
      cron: data.cron,
      payload: data.payload,
      max_attempts: data.max_attempts,
      base_delay_ms: data.base_delay_ms,
      max_delay_ms: data.max_delay_ms,
      depends_on: newDeps,
      status: data.status,
    });

    const updated = getTask(id)!;
    return reply.send(taskToJson(updated));
  });

  // DELETE /api/tasks/:id — delete a task
  app.delete('/:id', async (req, reply) => {
    const { id } = req.params as { id: string };
    const existing = getTask(id);
    if (!existing) {
      return reply.status(404).send({ error: 'Task not found' });
    }

    // Mark dependent tasks as orphaned before deleting
    markOrphaned(id, getTasks());
    deleteTask(id);
    return reply.status(204).send();
  });

  // POST /api/tasks/:id/execute — trigger execution
  app.post('/:id/execute', async (req, reply) => {
    const { id } = req.params as { id: string };
    const task = getTask(id);
    if (!task) {
      return reply.status(404).send({ error: 'Task not found' });
    }

    // Check if task is active
    if (task.status !== TaskStatus.Active) {
      return reply.status(409).send({ error: `Task status is ${task.status}, cannot execute` });
    }

    // Check dependencies
    const tasks = getTasks();
    const runs = getRuns();
    if (!canDispatch(task, tasks, runs)) {
      const blocking = getBlockingDeps(task, tasks, runs);
      return reply.status(409).send({ error: 'Dependencies not satisfied', blocking_deps: blocking });
    }

    // Create a run
    const run: Run = {
      id: randomUUID(),
      task_id: id,
      status: RunStatus.Running,
      attempt: 1,
      started_at: new Date(),
      finished_at: null,
      error: null,
      output: null,
      next_retry_at: null,
    };
    addRun(run);

    // Simulate execution
    const body = (req.body ?? {}) as Record<string, unknown>;
    const simulateFailure = body.simulate_failure === true;

    if (simulateFailure) {
      run.status = RunStatus.Failed;
      run.error = 'Simulated failure';
      run.finished_at = new Date();

      // Attempt retry scheduling
      const retried = scheduleRetry(run, task);
      updateRun(run.id, {
        status: run.status,
        error: run.error,
        finished_at: run.finished_at,
        attempt: run.attempt,
        next_retry_at: run.next_retry_at,
      });

      return reply.status(200).send({
        run: runToJson(run),
        retried,
        message: 'Execution failed (simulated)',
      });
    }

    // Success path
    run.status = RunStatus.Completed;
    run.output = { message: 'Execution completed successfully' };
    run.finished_at = new Date();
    updateRun(run.id, {
      status: run.status,
      output: run.output,
      finished_at: run.finished_at,
    });

    return reply.status(200).send({
      run: runToJson(run),
      message: 'Execution completed successfully',
    });
  });

  // GET /api/tasks/dependencies — validate dependency graph
  app.get('/dependencies', async (_req, reply) => {
    const result = validateGraph(getTasks());
    return reply.send(result);
  });

  // GET /api/tasks/:id/runs — list runs for a task
  app.get('/:id/runs', async (req, reply) => {
    const { id } = req.params as { id: string };
    const task = getTask(id);
    if (!task) {
      return reply.status(404).send({ error: 'Task not found' });
    }

    const taskRuns = Array.from(getRuns().values())
      .filter((r) => r.task_id === id)
      .map(runToJson);

    return reply.send(taskRuns);
  });
}
