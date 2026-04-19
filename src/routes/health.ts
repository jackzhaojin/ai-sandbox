import type { FastifyInstance } from 'fastify';
import { getTasks, getRuns } from '../services/persistence.js';

export default async function healthRoutes(app: FastifyInstance) {
  app.get('/', async (_req, reply) => {
    const tasks = getTasks();
    const runs = getRuns();

    const tasks_count = tasks.size;
    const running_count = Array.from(runs.values()).filter(
      (r) => r.status === 'running'
    ).length;
    const queued_count = Array.from(runs.values()).filter(
      (r) => r.status === 'queued'
    ).length;

    return reply.send({
      status: 'ok',
      uptime_s: process.uptime(),
      tasks_count,
      running_count,
      queued_count,
    });
  });
}
