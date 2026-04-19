import { start, stop } from '../src/server.js';
import { unlink } from 'fs/promises';

const BASE_URL = 'http://localhost:3000';

interface ApiResponse {
  status: number;
  data: unknown;
}

interface TaskJson {
  id: string;
  title: string;
  description: string;
  dependencies: string[];
  cron: string;
  payload: Record<string, unknown>;
  max_attempts: number;
  base_delay_ms: number;
  max_delay_ms: number;
  depends_on: string[];
  status: string;
  created_at: string;
  updated_at: string;
}

interface RunJson {
  id: string;
  task_id: string;
  status: string;
  attempt: number;
  started_at: string | null;
  finished_at: string | null;
  error: string | null;
  output: Record<string, unknown> | null;
  next_retry_at: string | null;
}

async function post(path: string, body: unknown): Promise<ApiResponse> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return { status: res.status, data };
}

async function patch(path: string, body: unknown): Promise<ApiResponse> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return { status: res.status, data };
}

async function get(path: string): Promise<ApiResponse> {
  const res = await fetch(`${BASE_URL}${path}`);
  const data = await res.json();
  return { status: res.status, data };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main(): Promise<void> {
  console.log('=== Task Scheduler API Demo ===\n');

  // Remove any persisted state so the demo starts fresh
  try {
    await unlink('data/state.json');
  } catch {
    // ignore if file does not exist
  }

  // Start the Fastify server and scheduler
  await start();
  await sleep(1500); // allow scheduler tick interval to initialise

  // ── Task A: flaky handler, cron every 3 seconds, max_attempts = 3 ──
  console.log('Creating Task A (flaky handler, cron */3 * * * * *, max_attempts=3)...');
  const createA = await post('/tasks', {
    title: 'Task A',
    description: 'Flaky handler demo — randomly fails 50% of the time',
    retryPolicy: { maxAttempts: 3, baseDelayMs: 1000, maxDelayMs: 30000 },
  });
  const taskA = createA.data as TaskJson;
  await patch(`/tasks/${taskA.id}`, {
    cron: '*/3 * * * * *',
    payload: { handler_name: 'flaky' },
  });
  console.log(`  → id: ${taskA.id}\n`);

  // ── Task B: slow handler, cron every 5 seconds ──
  console.log('Creating Task B (slow handler, cron */5 * * * * * — sleeps 5 s)...');
  const createB = await post('/tasks', {
    title: 'Task B',
    description: 'Slow handler demo — sleeps for 5 seconds',
  });
  const taskB = createB.data as TaskJson;
  await patch(`/tasks/${taskB.id}`, {
    cron: '*/5 * * * * *',
    payload: { handler_name: 'slow' },
  });
  console.log(`  → id: ${taskB.id}\n`);

  // ── Task C: echo handler, cron every 10 seconds, depends on A + B ──
  console.log('Creating Task C (echo handler, cron */10 * * * * *, depends_on=[A, B])...');
  const createC = await post('/tasks', {
    title: 'Task C',
    description: 'Echo handler with dependencies',
    dependencies: [taskA.id, taskB.id],
  });
  const taskC = createC.data as TaskJson;
  await patch(`/tasks/${taskC.id}`, {
    cron: '*/10 * * * * *',
    payload: { handler_name: 'echo' },
  });
  console.log(`  → id: ${taskC.id}\n`);

  // ── Wait 30 seconds while the scheduler ticks ──
  console.log('Scheduler running for 30 seconds...');
  for (let i = 0; i < 30; i++) {
    await sleep(1000);
    if ((i + 1) % 5 === 0) {
      console.log(`  ${i + 1}s elapsed...`);
    }
  }
  console.log('');

  // ── Gather stats ──
  console.log('Gathering stats...\n');
  const runsRes = await get('/runs');
  const tasksRes = await get('/tasks');

  const allRuns = (runsRes.data ?? []) as RunJson[];
  const allTasks = (tasksRes.data ?? []) as TaskJson[];

  const aRuns = allRuns.filter((r) => r.task_id === taskA.id);
  const bRuns = allRuns.filter((r) => r.task_id === taskB.id);
  const cRuns = allRuns.filter((r) => r.task_id === taskC.id);

  const aCompleted = aRuns.filter((r) => r.status === 'completed').length;
  const aFailed = aRuns.filter((r) => r.status === 'failed').length;
  const aRetries = aRuns.reduce((sum, r) => sum + Math.max(0, r.attempt - 1), 0);

  const bCompleted = bRuns.filter((r) => r.status === 'completed').length;
  const bFailed = bRuns.filter((r) => r.status === 'failed').length;
  const bQueued = bRuns.filter((r) => r.status === 'queued').length;

  const cCompleted = cRuns.filter((r) => r.status === 'completed').length;
  const cFailed = cRuns.filter((r) => r.status === 'failed').length;
  const cQueued = cRuns.filter((r) => r.status === 'queued').length;

  // Infer overlap / blocked counts from expected vs actual dispatches
  const expectedB = 6; // 30 s / 5 s
  const expectedC = 3; // 30 s / 10 s
  const bOverlap = Math.max(0, expectedB - bRuns.length);
  const cBlocked = Math.max(0, expectedC - cRuns.length);

  const totalQueued = allRuns.filter((r) => r.status === 'queued').length;
  const totalRunning = allRuns.filter((r) => r.status === 'running').length;

  // ── Summary table ──
  console.log('╔══════════════════════════════════════════════════════════════════════╗');
  console.log('║           TASK SCHEDULER DEMO — 30 SECOND SUMMARY                    ║');
  console.log('╠══════════════════════════════════════════════════════════════════════╣');
  console.log('║  Total scheduler ticks elapsed: ~30                                  ║');
  console.log(`║  Total runs recorded:          ${String(allRuns.length).padEnd(46)} ║`);
  console.log(`║  Runs currently queued:        ${String(totalQueued).padEnd(46)} ║`);
  console.log(`║  Runs currently running:       ${String(totalRunning).padEnd(46)} ║`);
  console.log('╠══════════════════════════════════════════════════════════════════════╣');
  console.log('║  Task A — flaky handler, cron */3 * * * * *, max_attempts=3          ║');
  console.log(`║    Dispatches:                 ${String(aRuns.length).padEnd(46)} ║`);
  console.log(`║    Completed:                  ${String(aCompleted).padEnd(46)} ║`);
  console.log(`║    Failed:                     ${String(aFailed).padEnd(46)} ║`);
  console.log(`║    Retry attempts observed:    ${String(aRetries).padEnd(46)} ║`);
  console.log('╠══════════════════════════════════════════════════════════════════════╣');
  console.log('║  Task B — slow handler, cron */5 * * * * * (sleeps 5 s)              ║');
  console.log(`║    Dispatches:                 ${String(bRuns.length).padEnd(46)} ║`);
  console.log(`║    Completed:                  ${String(bCompleted).padEnd(46)} ║`);
  console.log(`║    Queued:                     ${String(bQueued).padEnd(46)} ║`);
  console.log(`║    Inferred skipped_overlap:   ${String(bOverlap).padEnd(46)} ║`);
  console.log('╠══════════════════════════════════════════════════════════════════════╣');
  console.log('║  Task C — echo handler, cron */10 * * * * *, depends_on=[A, B]       ║');
  console.log(`║    Dispatches:                 ${String(cRuns.length).padEnd(46)} ║`);
  console.log(`║    Completed:                  ${String(cCompleted).padEnd(46)} ║`);
  console.log(`║    Queued:                     ${String(cQueued).padEnd(46)} ║`);
  console.log(`║    Inferred blocked_on_dep:    ${String(cBlocked).padEnd(46)} ║`);
  console.log('╚══════════════════════════════════════════════════════════════════════╝');

  // ── Stop server ──
  console.log('\nStopping server...');
  await stop();
  console.log('Demo complete.');
}

main().catch(async (err) => {
  console.error('Demo failed:', err);
  try {
    await stop();
  } catch {
    // ignore
  }
  process.exit(1);
});
