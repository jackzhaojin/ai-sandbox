import type { FastifyInstance } from 'fastify';
import { getRuns, getRun } from '../services/persistence.js';
import type { Run } from '../domain/types.js';

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

export default async function runsRoutes(app: FastifyInstance) {
  // GET /api/runs — list runs with optional filters
  app.get('/', async (req, reply) => {
    const { task_id, status, since } = req.query as {
      task_id?: string;
      status?: string;
      since?: string;
    };

    let runs = Array.from(getRuns().values());

    if (task_id) {
      runs = runs.filter((r) => r.task_id === task_id);
    }

    if (status) {
      runs = runs.filter((r) => r.status === status);
    }

    if (since) {
      const sinceDate = new Date(since);
      if (isNaN(sinceDate.getTime())) {
        return reply.status(400).send({ error: 'Invalid since timestamp' });
      }
      runs = runs.filter((r) => {
        const started = r.started_at?.getTime() ?? 0;
        return started >= sinceDate.getTime();
      });
    }

    // Sort by started_at descending (nulls last)
    runs.sort((a, b) => {
      const at = a.started_at?.getTime() ?? 0;
      const bt = b.started_at?.getTime() ?? 0;
      return bt - at;
    });

    return reply.send(runs.map(runToJson));
  });

  // GET /api/runs/:id — get single run
  app.get('/:id', async (req, reply) => {
    const { id } = req.params as { id: string };
    const run = getRun(id);
    if (!run) {
      return reply.status(404).send({ error: 'Run not found' });
    }
    return reply.send(runToJson(run));
  });
}
