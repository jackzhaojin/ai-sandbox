# Task Scheduler API

A backend-only task scheduler with complex service logic built on Fastify and TypeScript.

## Overview

This API manages tasks, schedules them via cron expressions, and tracks execution runs. It enforces six core service rules:

1. **Cron scheduling** — automatically dispatches tasks based on cron expressions
2. **No self-overlap** — prevents a task from running twice simultaneously
3. **Retry policy with exponential backoff** — retries failed runs up to `max_attempts`
4. **Dependency DAG with freshness** — blocks tasks until dependencies have completed successfully
5. **Concurrency limit** — caps global running runs to `MAX_CONCURRENT_RUNS` (5)
6. **Cycle detection** — rejects dependency updates that would create a cycle

State is persisted to `data/state.json` with debounced auto-save.

## Setup

```bash
npm install
npm run build
```

## NPM Scripts

| Script | Description |
|--------|-------------|
| `npm run build` | Compile TypeScript to `dist/` |
| `npm run dev` | Start development server with hot reload (`tsx watch`) |
| `npm run typecheck` | Run TypeScript type checking without emitting files |
| `npm test` | Run all unit and E2E tests with Vitest |
| `npm run demo` | Run a 30-second live demo showing scheduler behavior |

## Running the Server

```bash
# Development (with watch)
npm run dev

# Production (requires build first)
npm run build
node dist/index.js
```

The server listens on `http://localhost:3000` by default (configurable via `PORT` env var).

## API Endpoints

### Health

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check with `tasks_count`, `running_count`, `queued_count` |

### Tasks

| Method | Path | Description |
|--------|------|-------------|
| GET | `/tasks` | List all tasks (optional `?status=` filter) |
| POST | `/tasks` | Create a task |
| GET | `/tasks/:id` | Get task detail with last 20 run snapshots |
| PUT | `/tasks/:id` | Update a task |
| PATCH | `/tasks/:id` | Update a task (partial) |
| DELETE | `/tasks/:id` | Delete a task (marks dependents as orphaned) |
| POST | `/tasks/:id/run` | Manual trigger via scheduler dispatch |
| POST | `/tasks/:id/execute` | Direct execution trigger |
| GET | `/tasks/:id/runs` | List runs for a specific task |
| GET | `/tasks/dependencies` | Validate full dependency graph |

### Runs

| Method | Path | Description |
|--------|------|-------------|
| GET | `/runs` | List all runs (optional `?task_id=`, `?status=`, `?since=` filters) |
| GET | `/runs/:id` | Get a single run record |

## Demo

Run the built-in demo to see all six service rules in action:

```bash
npm run demo
```

The demo creates three tasks, lets the scheduler tick for 30 seconds, and prints a summary table showing:
- Task dispatches, completions, failures, and retries
- Overlap skipping and dependency blocking
- Live run counts

## Project Structure

```
src/
├── domain/
│   ├── types.ts          # Task, Run, and status enums
│   └── handlers.ts       # Registered task handlers (echo, flaky, slow)
├── routes/
│   ├── health.ts         # Health metrics endpoint
│   ├── tasks.ts          # Task CRUD, execution, dependencies
│   └── runs.ts           # Run listing and retrieval
├── services/
│   ├── scheduler.ts      # Cron tick loop, dispatch, execute
│   ├── deps.ts           # Cycle detection, dependency satisfaction
│   ├── retry.ts          # Exponential backoff retry scheduling
│   ├── concurrency.ts    # Slot-based run promotion
│   └── persistence.ts    # In-memory state with JSON file backing
├── server.ts             # Fastify app setup and lifecycle
└── index.ts              # Entry point

tests/
├── unit/
│   ├── scheduler.spec.ts # Tests for all 6 service rules
│   ├── deps.spec.ts      # DAG, cycle detection, freshness
│   ├── retry.spec.ts     # Backoff math and retry decisions
│   ├── concurrency.spec.ts # Slot promotion and limits
│   └── persistence.test.ts # Save/load round-trips
├── e2e/
│   └── journey.spec.ts   # 6 E2E tests covering the full user journey
└── smoke/
    └── api.sh            # Curl-based smoke tests + persistence restart test
```

## Tech Stack

- **Runtime:** Node.js 20+
- **Framework:** Fastify 5
- **Language:** TypeScript 5
- **Testing:** Vitest
- **Validation:** Zod
- **Cron:** cron-parser
