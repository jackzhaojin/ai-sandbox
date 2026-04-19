# Task Scheduler API — Architecture Plan

**Step**: 3/21 — Research and plan architecture  
**Date**: 2026-04-18  
**Status**: Draft  

---

## 1. Overview

### Purpose
Design the complex service-logic layer for the Task Scheduler API. The existing Express + Supabase backend (steps 1–2) provides CRUD endpoints for tasks, schedules, dependencies, categories, and users. This plan defines the scheduler engine that sits on top of those endpoints and enforces six service rules: cron scheduling, no self-overlap, retry policy, dependency DAG, concurrency limits, and cycle detection.

### Goals
- Define core types for Task, Run, and Status enums.
- Establish module boundaries between `scheduler.js`, `deps.js`, `retry.js`, `concurrency.js`, and `persistence.js`.
- Design a handler-registration mechanism so arbitrary task logic can be plugged in.
- Specify a persistence snapshot strategy that minimizes database round-trips during scheduling decisions.
- Document a test strategy that gives each of the six service rules its own verifiable harness.

### Scope
- **In scope**: Service layer architecture, new `ts_task_runs` table, module interfaces, data flow, testing plan.
- **Out of scope**: Actual implementation of services (steps 5–6+), UI, auth/rate-limiting.

---

## 2. Technology Choices

- **Language**: Plain JavaScript (Node.js) with JSDoc type annotations. The existing codebase is pure JS; staying consistent avoids a TypeScript build step.
- **Runtime**: Node.js 20+ (LTS).
- **Framework**: Express 4 (already in use).
- **Database**: PostgreSQL via Supabase JS client (already in use).
- **Cron / recurrence**: `rrule` (npm) for parsing iCalendar RRULE strings already stored in `ts_task_schedules.recurrence_rule`. `node-cron` is **not** needed because we will poll on an interval and compute next occurrences with `rrule`.
- **Testing**: `node:test` + `node:assert` (built-in, zero dependency) for unit tests; `curl` / `node --test` integration for service-level smoke tests.

---

## 3. Core Types & Interfaces (JSDoc)

### Task
Represents the existing `ts_tasks` row.

```javascript
/**
 * @typedef {Object} Task
 * @property {string} id - UUID
 * @property {string} user_id - UUID
 * @property {string} title
 * @property {string} [description]
 * @property {'pending'|'in_progress'|'completed'|'cancelled'|'blocked'} status
 * @property {'low'|'medium'|'high'|'urgent'} priority
 * @property {Date} [due_date]
 * @property {Date} [started_at]
 * @property {Date} [completed_at]
 * @property {number} [estimated_minutes]
 * @property {number} [actual_minutes]
 * @property {Date} created_at
 * @property {Date} updated_at
 */
```

### Run (new entity)
Tracks a single execution attempt of a scheduled or manually-triggered task.

**New table: `ts_task_runs`**
```sql
CREATE TABLE IF NOT EXISTS ts_task_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES ts_tasks(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'running', 'success', 'failed', 'cancelled', 'retrying')),
    started_at TIMESTAMPTZ,
    ended_at TIMESTAMPTZ,
    attempt_number INTEGER NOT NULL DEFAULT 1,
    error_message TEXT,
    output JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ts_task_runs_task_id ON ts_task_runs(task_id);
CREATE INDEX IF NOT EXISTS idx_ts_task_runs_status ON ts_task_runs(status);
```

```javascript
/**
 * @typedef {Object} Run
 * @property {string} id - UUID
 * @property {string} task_id - UUID
 * @property {'pending'|'running'|'success'|'failed'|'cancelled'|'retrying'} status
 * @property {Date} [started_at]
 * @property {Date} [ended_at]
 * @property {number} attempt_number
 * @property {string} [error_message]
 * @property {Object} [output]
 * @property {Date} created_at
 */
```

### TaskSchedule
Existing `ts_task_schedules` row.

```javascript
/**
 * @typedef {Object} TaskSchedule
 * @property {string} id - UUID
 * @property {string} task_id - UUID
 * @property {string} recurrence_rule - iCalendar RRULE string
 * @property {Date} next_run_at
 * @property {Date} [end_date]
 * @property {boolean} is_active
 */
```

### TaskDependency
Existing `ts_task_dependencies` row.

```javascript
/**
 * @typedef {Object} TaskDependency
 * @property {string} id - UUID
 * @property {string} task_id - the dependent task
 * @property {string} depends_on_task_id - the prerequisite task
 * @property {'blocks'|'relates_to'|'duplicates'} dependency_type
 */
```

### Handler Function

```javascript
/**
 * @callback TaskHandler
 * @param {Task} task
 * @param {Run} run
 * @returns {Promise<Object>} output payload
 */
```

---

## 4. Data Model Additions

In addition to the existing schema (`ts_users`, `ts_tasks`, `ts_categories`, `ts_task_categories`, `ts_task_dependencies`, `ts_task_schedules`, `ts_task_logs`), we need:

1. **`ts_task_runs`** (defined above) — one row per execution attempt.
2. **Add `handler_name` to `ts_tasks`** so the scheduler knows which registered handler to invoke:
   ```sql
   ALTER TABLE ts_tasks ADD COLUMN handler_name TEXT;
   ```
3. **Add `max_attempts` and `retry_backoff` to `ts_tasks`** for retry policy configuration:
   ```sql
   ALTER TABLE ts_tasks ADD COLUMN max_attempts INTEGER NOT NULL DEFAULT 3;
   ALTER TABLE ts_tasks ADD COLUMN retry_backoff TEXT NOT NULL DEFAULT 'exponential'
       CHECK (retry_backoff IN ('fixed', 'linear', 'exponential'));
   ```
4. **Add `concurrency_limit` to `ts_users`** (or a global config table) for per-user concurrency caps:
   ```sql
   ALTER TABLE ts_users ADD COLUMN concurrency_limit INTEGER NOT NULL DEFAULT 5;
   ```

---

## 5. Module Boundaries & Responsibilities

All service modules live under `services/`.

### 5.1 `services/persistence.js`
**Responsibility**: Single source of truth for all database reads and writes. No other module imports `@supabase/supabase-js` directly.

**Exports**:
- `getSnapshot()` → returns `{ tasks, runs, schedules, dependencies, users }` loaded in one batched query.
- `getTaskById(taskId)`
- `getRunsForTask(taskId)`
- `getActiveRunsForTask(taskId)` — `status = 'running'`
- `getActiveRunsForUser(userId)` — for concurrency counting.
- `createRun(runData)`
- `updateRun(runId, patch)`
- `updateTask(taskId, patch)`
- `getScheduleDueBefore(date)`
- `updateScheduleNextRun(scheduleId, nextRunAt)`
- `getDependenciesForTask(taskId)`
- `getTasksBlockedBy(taskId)` — reverse dependency lookup.

**Snapshot strategy**:
- On scheduler startup, `getSnapshot()` loads the full working set (all active schedules, all non-terminal runs, all `blocks` dependencies, all tasks with `handler_name`).
- The scheduler keeps this in memory and refreshes it on a 30-second timer or after any mutation it performs.
- This avoids N+1 queries when the scheduling loop evaluates hundreds of tasks per tick.

### 5.2 `services/scheduler.js`
**Responsibility**: The main scheduling loop. Polls for due work, checks business rules, and delegates execution.

**Exports**:
- `start(pollIntervalMs = 60000)` — begins the loop.
- `stop()` — graceful shutdown.
- `registerHandler(name, handlerFn)` — maps a handler name to a `TaskHandler`.
- `triggerTask(taskId, manual = false)` — forces immediate execution (API endpoint uses this).

**Internal flow per tick**:
1. Refresh snapshot from `persistence.js`.
2. Query `taskSchedules` where `next_run_at <= NOW()` and `is_active = true`.
3. For each due schedule:
   a. Call `concurrency.canStart(task)` — if false, skip.
   b. Call `deps.areSatisfied(task)` — if false, skip.
   c. Call `concurrency.canStart(task)` again (double-check after deps, in case another run started during the tick).
   d. Call `selfOverlap.canStart(task)` — if an active run exists for this task, skip or queue.
   e. Create a `Run` via `persistence.createRun({ task_id, status: 'pending', attempt_number: 1 })`.
   f. Transition run to `running`, transition task to `in_progress`.
   g. Look up handler by `task.handler_name`; if missing, fail the run.
   h. `await handler(task, run)` inside a `try/catch`.
   i. On success: mark run `success`, mark task `completed` (or keep `in_progress` if recurring), update schedule `next_run_at` using `rrule`.
   j. On failure: call `retry.shouldRetry(task, run)` — if yes, create a new `Run` with `status = 'pending'` and incremented `attempt_number`, scheduled for `retry.getNextRetryAt(task, run)`. If no, mark run `failed` and task `cancelled`.
   k. After run terminal state, call `concurrency.release(task)` and `deps.onTaskCompleted(task)`.

### 5.3 `services/deps.js`
**Responsibility**: Dependency graph analysis, cycle detection, and unblock logic.

**Exports**:
- `areSatisfied(task, snapshot)` → boolean. Returns `true` if all `blocks` dependencies of `task` have status `completed`.
- `onTaskCompleted(task, snapshot)` → `string[]`. Returns a list of task IDs that were `blocked` but are now unblocked because this task completed. The scheduler can then auto-trigger them.
- `detectCycle(taskId, dependsOnTaskId, snapshot)` → boolean. Returns `true` if adding this edge would create a cycle.
- `getExecutionOrder(taskIds, snapshot)` → `string[]`. Topological sort (Kahn’s algorithm) of the given task IDs based on `blocks` edges. Used for bulk-scheduling or validation.

**Data structures**:
- Build an adjacency list from `ts_task_dependencies` rows where `dependency_type = 'blocks'`.
- Keep the graph in memory as part of the snapshot for O(1) edge lookups.

### 5.4 `services/retry.js`
**Responsibility**: Retry policy math and decision-making.

**Exports**:
- `shouldRetry(task, run)` → boolean. `run.attempt_number < task.max_attempts`.
- `getNextRetryAt(task, run)` → `Date`. Based on `task.retry_backoff`:
  - `fixed`: `now + 5 minutes`
  - `linear`: `now + (attempt_number * 5 minutes)`
  - `exponential`: `now + (2^attempt_number * 5 minutes)` capped at 24 hours.

**Note**: Retry scheduling does **not** use `ts_task_schedules` (that table is for recurring cron rules). Instead, retried runs are kept in `ts_task_runs` with `status = 'pending'` and the scheduler loop checks `pending` runs in addition to cron schedules. Alternatively, a simpler approach: the scheduler loop also checks for `pending` runs whose `created_at` has passed a computed retry delay; but to keep it explicit, we can add a `scheduled_at` column to `ts_task_runs`:
```sql
ALTER TABLE ts_task_runs ADD COLUMN scheduled_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
```
Then the scheduler queries `ts_task_runs` where `status = 'pending' AND scheduled_at <= NOW()`.

### 5.5 `services/concurrency.js`
**Responsibility**: Enforce per-user max concurrent runs.

**Exports**:
- `canStart(task, snapshot)` → boolean. Count `running` runs for `task.user_id`; allow if `< user.concurrency_limit`.
- `release(task, snapshot)` — decrements the in-memory counter (or just lets the next tick re-count from snapshot).

**Design choice**: Because we refresh the snapshot every tick, `canStart` simply counts from the snapshot rather than maintaining a separate counter. This eliminates race conditions between the scheduler and external status updates.

### 5.6 `services/selfOverlap.js` (or inline in scheduler)
**Responsibility**: Prevent a task from running twice simultaneously.

**Exports**:
- `canStart(task, snapshot)` → boolean. Returns `true` if no `run` for `task.id` has `status = 'running'`.

This could be a standalone micro-module or inlined in `scheduler.js`. For testability, keep it as `services/selfOverlap.js`.

---

## 6. Handler Registration Mechanism

Task handlers are user-defined async functions registered at application startup.

**Example**:
```javascript
// server.js (or handlers/index.js)
const { registerHandler } = require('./services/scheduler');

registerHandler('send-email', async (task, run) => {
  const { to, subject, body } = JSON.parse(task.description);
  await emailService.send({ to, subject, body });
  return { sent_to: to };
});

registerHandler('generate-report', async (task, run) => {
  const report = await generateReport(task.title);
  return { report_url: report.url };
});
```

**API exposure**:
- `POST /api/tasks/:id/trigger` — manual trigger. Calls `scheduler.triggerTask(id, true)`.
- The scheduler loop itself is the automatic trigger.

---

## 7. Integration Points & Data Flow

### 7.1 Startup sequence
1. `server.js` loads Express, mounts routes, imports `services/scheduler`.
2. Handlers are registered (from `handlers/` directory or inline).
3. `scheduler.start()` loads initial snapshot via `persistence.getSnapshot()`.
4. Scheduler loop begins.

### 7.2 Tick data flow
```
Scheduler Loop
│
├─► persistence.getSnapshot()
│
├─► For each due schedule / pending retry run:
│   ├─► concurrency.canStart(task) ──► yes/no
│   ├─► deps.areSatisfied(task) ─────► yes/no
│   ├─► selfOverlap.canStart(task) ──► yes/no
│   ├─► persistence.createRun({ ... })
│   ├─► persistence.updateRun(id, { status: 'running' })
│   ├─► persistence.updateTask(task.id, { status: 'in_progress' })
│   ├─► handler = registry[task.handler_name]
│   ├─► await handler(task, run)
│   │   ├─► success:
│   │   │   ├─► persistence.updateRun(id, { status: 'success', ended_at: now, output })
│   │   │   ├─► persistence.updateTask(task.id, { status: 'completed', completed_at: now })
│   │   │   ├─► persistence.updateScheduleNextRun(schedule.id, rrule.next())
│   │   │   └─► deps.onTaskCompleted(task) → list of unblocked task IDs
│   │   └─► failure:
│   │       ├─► retry.shouldRetry(task, run) ──► yes/no
│   │       ├─► if yes: persistence.createRun({ task_id, attempt_number: run.attempt_number + 1, scheduled_at: retry.getNextRetryAt(task, run) })
│   │       └─► if no: persistence.updateRun(id, { status: 'failed', ended_at: now, error_message })
│   └─► concurrency.release(task) [implicit via next tick snapshot refresh]
```

### 7.3 API → Service integration
- Existing `POST /api/tasks/:id/dependencies` should call `deps.detectCycle()` before inserting a new row into `ts_task_dependencies`. If a cycle is detected, return `409 Conflict`.
- Existing `PUT /api/tasks/:id` should block a status change to `in_progress` if `deps.areSatisfied()` returns false (unless overridden by admin).

---

## 8. Persistence Snapshot Strategy

### Why snapshots?
The scheduling loop may evaluate dozens or hundreds of tasks per minute. Doing individual Supabase queries per task per rule (concurrency, deps, self-overlap) creates N+1 overhead and race conditions. A snapshot loads the full working set into memory once per tick.

### Snapshot contents
```javascript
{
  tasks: Map<taskId, Task>,
  runs: Map<runId, Run>,
  runsByTask: Map<taskId, Run[]>,
  runsByUser: Map<userId, Run[]>,
  schedules: Map<scheduleId, TaskSchedule>,
  deps: Map<taskId, TaskDependency[]>,         // outgoing edges
  reverseDeps: Map<taskId, TaskDependency[]>,  // incoming edges
  users: Map<userId, User>
}
```

### Refresh strategy
- **Automatic**: every tick before evaluating due work.
- **On mutation**: after `createRun`, `updateRun`, or `updateTask`, the scheduler patches the in-memory snapshot so the rest of the current tick sees consistent state.
- **Full refresh**: every 30 seconds (configurable) to catch changes made by API requests outside the scheduler loop.

### Trade-off
- **Pro**: O(1) in-memory lookups, no N+1, simple to test.
- **Con**: Stale data if the API modifies state between refreshes. Mitigated by the 30-second auto-refresh and by having the API use `persistence.js` which can broadcast a refresh signal (e.g., via `EventEmitter`) to the scheduler.

---

## 9. Testing Strategy

Use the built-in `node:test` runner. One test file per service rule.

### 9.1 Cron Scheduling — `tests/scheduler.cron.test.js`
- Mock `Date.now()` to simulate time passing.
- Create a task with `recurrence_rule = 'FREQ=MINUTELY;INTERVAL=1'`.
- Verify `scheduler.tick()` creates a Run at T+0, T+60s, T+120s.
- Verify `next_run_at` is updated correctly after each execution.
- Verify schedules past `end_date` are ignored.

### 9.2 No Self-Overlap — `tests/scheduler.overlap.test.js`
- Create a task with a slow handler (sleep 5s simulated).
- Start run #1.
- Trigger the same task again while run #1 is `running`.
- Assert run #2 is **not** created (or created with `status = 'pending'` and deferred).
- Assert after run #1 completes, the deferred run #2 starts.

### 9.3 Retry Policy — `tests/scheduler.retry.test.js`
- Create a task with `max_attempts = 3`, `retry_backoff = 'exponential'`.
- Register a handler that always throws.
- Trigger the task.
- Assert run #1 fails, run #2 is created with `attempt_number = 2` and `scheduled_at` ~10 min later.
- Assert run #2 fails, run #3 is created with `attempt_number = 3`.
- Assert run #3 fails, no run #4 is created, and task status becomes `cancelled`.

### 9.4 Dependency DAG — `tests/deps.dag.test.js`
- Create tasks A, B, C with B blocked by A, C blocked by B.
- Assert `deps.areSatisfied(B)` is `false` while A is not `completed`.
- Mark A as completed (update snapshot).
- Assert `deps.areSatisfied(B)` is `true`.
- Assert `deps.onTaskCompleted(A)` returns `[B]`.
- Mark B as completed.
- Assert `deps.onTaskCompleted(B)` returns `[C]`.

### 9.5 Concurrency Limit — `tests/concurrency.limit.test.js`
- Set `user.concurrency_limit = 2`.
- Create tasks T1, T2, T3 for the same user.
- Start T1 and T2 (both `running`).
- Attempt to start T3.
- Assert `concurrency.canStart(T3)` is `false`.
- Complete T1.
- Assert `concurrency.canStart(T3)` is `true`.
- Start T3.

### 9.6 Cycle Detection — `tests/deps.cycle.test.js`
- Create tasks A, B.
- Add dependency B → A (`blocks`).
- Attempt to add A → B.
- Assert `deps.detectCycle(A, B)` is `true`.
- Assert the API returns `409`.
- Test longer cycle: A→B, B→C, C→A.
- Test topological sort on a valid DAG: A→B→C returns `[A, B, C]`.

### Test helpers
- `tests/helpers.js`:
  - `buildSnapshot(overrides)` — returns a minimal snapshot object.
  - `mockPersistence()` — returns an in-memory persistence implementation so tests never hit Supabase.

---

## 10. Key Decisions & Trade-offs

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Language** | Plain JS + JSDoc | Existing codebase is JS; avoids TS build pipeline. |
| **Run table** | New `ts_task_runs` | Needed to track individual execution attempts for retries and audit. |
| **Snapshot vs. query-per-rule** | In-memory snapshot refreshed per tick | N+1 prevention, deterministic testability, simple concurrency counting. |
| **Retry scheduling** | `pending` runs with `scheduled_at` | Reuses the same scheduler loop; no separate cron job needed. |
| **Cycle detection** | DFS in `deps.js` | Simple, works on adjacency list built from snapshot. Kahn’s algorithm used for topo sort. |
| **Handler registry** | In-memory Map at runtime | Simplest for an API backend; handlers are code, not config. |
| **Self-overlap** | Standalone module | Makes the rule explicit and independently testable. |
| **Concurrency scope** | Per-user limit | Matches existing multi-tenant schema (`user_id` on tasks). |

---

## 11. File Layout (planned)

```
/Users/jackjin/dev/ai-sandbox-worktrees/proj/task-scheduler-api
├── server.js                     # existing — mounts routes, starts scheduler
├── routes/                       # existing
│   ├── health.js
│   ├── users.js
│   ├── categories.js
│   ├── tasks.js                  # add POST /:id/trigger
│   └── schedules.js
├── services/
│   ├── persistence.js            # all DB access + snapshot logic
│   ├── scheduler.js              # main loop + handler registry
│   ├── deps.js                   # DAG, cycle detection, unblock logic
│   ├── retry.js                  # backoff math + retry decisions
│   ├── concurrency.js            # per-user active-run counting
│   └── selfOverlap.js            # no-self-overlap rule
├── handlers/                     # user-defined task handlers (example)
│   └── index.js
├── tests/
│   ├── helpers.js
│   ├── scheduler.cron.test.js
│   ├── scheduler.overlap.test.js
│   ├── scheduler.retry.test.js
│   ├── deps.dag.test.js
│   ├── deps.cycle.test.js
│   └── concurrency.limit.test.js
├── schema.sql                    # existing + ALTER TABLE additions
├── package.json                  # add rrule, node:test script
└── PLAN.md                       # this document
```

---

## 12. Open Questions for Later Steps

1. Should the scheduler run in the same Node process as the Express server, or as a separate worker? **Decision for now**: same process, using `setInterval`, because the expected load is moderate.
2. Should failed runs emit webhooks or events? **Decision for now**: out of scope; log to `ts_task_logs` only.
3. Should the snapshot use Supabase Realtime for instant updates? **Decision for now**: polling-only to keep dependencies minimal.
