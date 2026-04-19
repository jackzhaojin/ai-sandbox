import Fastify from 'fastify';
import healthRoutes from './routes/health.js';
import taskRoutes from './routes/tasks.js';
import runsRoutes from './routes/runs.js';
import * as scheduler from './services/scheduler.js';

const app = Fastify({
  logger: true,
  routerOptions: {
    ignoreTrailingSlash: true,
  },
});

// Register routes
app.register(healthRoutes, { prefix: '/health' });
app.register(taskRoutes, { prefix: '/tasks' });
app.register(runsRoutes, { prefix: '/runs' });

// Custom error shape used by the global error handler
interface FastifyErrorLike {
  code?: string;
  message: string;
  statusCode?: number;
  validation?: unknown;
}

// Global error handler
app.setErrorHandler((error: unknown, _request, reply) => {
  const err = error as FastifyErrorLike;
  app.log.error(err);

  if (err.code === 'FST_ERR_VALIDATION') {
    return reply.status(400).send({
      error: 'Validation error',
      message: err.message,
      details: err.validation ?? null,
    });
  }

  const statusCode = err.statusCode ?? 500;
  return reply.status(statusCode).send({
    error: err.code || 'Internal server error',
    message: err.message,
    details: null,
  });
});

async function start(): Promise<void> {
  scheduler.start();

  const port = parseInt(process.env.PORT || '3000', 10);
  try {
    await app.listen({ port, host: '0.0.0.0' });
    app.log.info(`Server listening on port ${port}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

async function stop(): Promise<void> {
  await scheduler.stop();
  await app.close();
}

// Process signal handlers
process.on('SIGINT', async () => {
  app.log.info('SIGINT received, shutting down gracefully...');
  await stop();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  app.log.info('SIGTERM received, shutting down gracefully...');
  await stop();
  process.exit(0);
});

export { app, start, stop };
