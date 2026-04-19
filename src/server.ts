import Fastify from 'fastify';
import { init } from './services/persistence.js';
import healthRoutes from './routes/health.js';
import taskRoutes from './routes/tasks.js';
import runsRoutes from './routes/runs.js';

const app = Fastify({
  logger: true,
});

// Register routes
app.register(healthRoutes, { prefix: '/api/health' });
app.register(taskRoutes, { prefix: '/api/tasks' });
app.register(runsRoutes, { prefix: '/api/runs' });

async function start() {
  // Load persisted state before accepting requests
  init();

  try {
    await app.listen({ port: 3000 });
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

start();
