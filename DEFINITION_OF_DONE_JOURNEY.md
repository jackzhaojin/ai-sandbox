# Task Scheduler API — Definition of Done Journey

## Concrete User Journey

1. **POST /api/tasks** → Creates a task with `active` status; persists to in-memory state (backed by `data/state.json`); returns task object with `id`.
2. **GET /api/tasks/:id** → Retrieves the task and its last 20 run snapshots (execution history).
3. **POST /api/tasks/:id/execute** → Manually triggers task execution; checks dependencies, overlap, and task status; creates a `Run` record.
   - If dependencies are not satisfied → returns `409` with `blocking_deps` list.
   - If task is already running → returns `409` with overlap error.
4. **Dependency DAG enforcement** → `POST /api/tasks` and `PUT /api/tasks/:id` reject cycles with `409` and return the cycle path.
5. **Retry scheduling** → `POST /api/tasks/:id/execute` with `{ simulate_failure: true }` creates a failed run, then automatically schedules a retry run with incremented `attempt` and `next_retry_at` computed via exponential backoff.
6. **Orphan marking** → `DELETE /api/tasks/:id` marks dependent tasks as `orphaned`.
7. **GET /api/runs** → Lists all runs with optional filters (`task_id`, `status`, `since`).
8. **GET /api/runs/:id** → Retrieves a single run record.
9. **GET /api/health** → Returns `status: ok` plus live counts of `tasks_count`, `running_count`, and `queued_count`.
10. **Scheduler tick loop** → Background `setInterval` tick every 1s evaluates active tasks against cron expressions and dispatches due tasks automatically.

## Domain Coverage

This journey covers the core Task Scheduler domain concepts:
- **Tasks** — creation, retrieval, update, deletion
- **Runs** — execution records with status tracking (`queued`, `running`, `completed`, `failed`, `blocked_on_dep`, `skipped_overlap`)
- **Retries** — exponential backoff with `max_attempts` limit
- **Dependencies** — DAG validation, cycle detection, blocking/unblocking
- **Concurrency** — slot-based promotion in `concurrency.ts`
- **Health** — live metrics endpoint reflecting task and run state

## Evidence References

- `src/routes/tasks.ts` — task CRUD, execution, dependency validation
- `src/routes/runs.ts` — run listing and retrieval
- `src/routes/health.ts` — health metrics
- `src/services/scheduler.ts` — cron tick loop, dispatch, execute
- `src/services/deps.ts` — cycle detection, dependency satisfaction
- `src/services/retry.ts` — retry scheduling with backoff
- `src/services/concurrency.ts` — slot-based run promotion
- `src/services/persistence.ts` — in-memory state with JSON file backing
- `tests/e2e/journey.spec.ts` — 6 E2E tests covering the full journey
