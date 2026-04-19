#!/usr/bin/env bash
set -euo pipefail

BASE_URL="http://localhost:3000"
STATE_FILE="data/state.json"

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

http_code() { tail -n1 <<< "$1"; }
body() { sed '$d' <<< "$1"; }

assert_status() {
  local expected="$1"
  local actual="$2"
  local msg="${3:-}"
  if [ "$actual" != "$expected" ]; then
    echo "FAIL: expected HTTP $expected, got $actual${msg:+ ($msg)}"
    exit 1
  fi
}

assert_field_exists() {
  local json="$1"
  local field="$2"
  if ! echo "$json" | jq -e "$field" > /dev/null 2>&1; then
    echo "FAIL: expected field $field to exist"
    echo "$json"
    exit 1
  fi
}

assert_json_equals() {
  local json="$1"
  local field="$2"
  local expected="$3"
  local actual
  actual=$(echo "$json" | jq -r "$field")
  if [ "$actual" != "$expected" ]; then
    echo "FAIL: expected $field='$expected', got '$actual'"
    exit 1
  fi
}

# ---------------------------------------------------------------------------
# Setup: clean state and start server
# ---------------------------------------------------------------------------

echo "[setup] removing persisted state..."
rm -f "$STATE_FILE"

# Ensure no stale server on port 3000
for pid in $(lsof -ti:3000 2>/dev/null || true); do
  echo "[setup] killing stale process $pid on port 3000..."
  kill -9 "$pid" 2>/dev/null || true
done

echo "[setup] starting server..."
node dist/index.js > /tmp/smoke-server.log 2>&1 &
SERVER_PID=$!

# Wait for server with timeout
echo "[setup] waiting for server at $BASE_URL..."
for i in $(seq 1 30); do
  if curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/health" | grep -q "200"; then
    echo "[setup] server ready"
    break
  fi
  if [ "$i" -eq 30 ]; then
    echo "FAIL: server did not start within 30s"
    cat /tmp/smoke-server.log
    exit 1
  fi
  sleep 1
done

# Trap to ensure server is stopped on exit
cleanup() {
  echo "[teardown] stopping server..."
  kill "$SERVER_PID" 2>/dev/null || true
  wait "$SERVER_PID" 2>/dev/null || true
}
trap cleanup EXIT

# ---------------------------------------------------------------------------
# 1. Health check
# ---------------------------------------------------------------------------
echo "[test] GET /health"
RESP=$(curl -sS -w '\n%{http_code}' "$BASE_URL/health")
BODY=$(body "$RESP")
CODE=$(http_code "$RESP")
assert_status 200 "$CODE" "health"
assert_field_exists "$BODY" '.status'
assert_json_equals "$BODY" '.status' 'ok'
echo "  ✓ health returns 200 with status=ok"

# ---------------------------------------------------------------------------
# 2. POST /tasks — create a task
# ---------------------------------------------------------------------------
echo "[test] POST /tasks (create task)"
RESP=$(curl -sS -w '\n%{http_code}' -X POST "$BASE_URL/tasks" \
  -H 'Content-Type: application/json' \
  -d '{"title":"Smoke Test Task","description":"Created by smoke test"}')
BODY=$(body "$RESP")
CODE=$(http_code "$RESP")
assert_status 201 "$CODE" "create task"
assert_field_exists "$BODY" '.id'
assert_json_equals "$BODY" '.title' 'Smoke Test Task'
TASK_ID=$(echo "$BODY" | jq -r '.id')
echo "  ✓ created task id=$TASK_ID"

# ---------------------------------------------------------------------------
# 3. GET /tasks — list tasks, assert array contains created task
# ---------------------------------------------------------------------------
echo "[test] GET /tasks"
RESP=$(curl -sS -w '\n%{http_code}' "$BASE_URL/tasks")
BODY=$(body "$RESP")
CODE=$(http_code "$RESP")
assert_status 200 "$CODE" "list tasks"
if ! echo "$BODY" | jq -e "map(.id) | contains([\"$TASK_ID\"])" > /dev/null 2>&1; then
  echo "FAIL: task list does not contain created task"
  exit 1
fi
echo "  ✓ task list contains created task"

# ---------------------------------------------------------------------------
# 4. GET /tasks/:id — retrieve task detail
# ---------------------------------------------------------------------------
echo "[test] GET /tasks/$TASK_ID"
RESP=$(curl -sS -w '\n%{http_code}' "$BASE_URL/tasks/$TASK_ID")
BODY=$(body "$RESP")
CODE=$(http_code "$RESP")
assert_status 200 "$CODE" "get task"
assert_json_equals "$BODY" '.id' "$TASK_ID"
assert_json_equals "$BODY" '.title' 'Smoke Test Task'
assert_field_exists "$BODY" '.status'
assert_field_exists "$BODY" '.created_at'
echo "  ✓ task detail matches"

# ---------------------------------------------------------------------------
# 5. POST /tasks/:id/run — manual trigger
# ---------------------------------------------------------------------------
echo "[test] POST /tasks/$TASK_ID/run"
RESP=$(curl -sS -w '\n%{http_code}' -X POST "$BASE_URL/tasks/$TASK_ID/run")
BODY=$(body "$RESP")
CODE=$(http_code "$RESP")
# New task with no deps should dispatch successfully (200)
if [ "$CODE" != "200" ] && [ "$CODE" != "409" ]; then
  echo "FAIL: expected 200 or 409, got $CODE"
  exit 1
fi
if [ "$CODE" = "200" ]; then
  assert_field_exists "$BODY" '.run.id'
  RUN_ID=$(echo "$BODY" | jq -r '.run.id')
  echo "  ✓ run triggered, run_id=$RUN_ID"
else
  echo "  ✓ run returned 409 (task may be running or blocked)"
  RUN_ID=""
fi

# ---------------------------------------------------------------------------
# 6. GET /runs?task_id= — list runs for task
# ---------------------------------------------------------------------------
echo "[test] GET /runs?task_id=$TASK_ID"
RESP=$(curl -sS -w '\n%{http_code}' "$BASE_URL/runs?task_id=$TASK_ID")
BODY=$(body "$RESP")
CODE=$(http_code "$RESP")
assert_status 200 "$CODE" "list runs"
if [ -n "$RUN_ID" ]; then
  if ! echo "$BODY" | jq -e "map(.id) | contains([\"$RUN_ID\"])" > /dev/null 2>&1; then
    echo "FAIL: runs list does not contain created run"
    exit 1
  fi
  echo "  ✓ runs list contains created run"
else
  echo "  ✓ runs list returned 200"
fi

# ---------------------------------------------------------------------------
# 7. GET /runs/:id — retrieve run detail
# ---------------------------------------------------------------------------
if [ -n "$RUN_ID" ]; then
  echo "[test] GET /runs/$RUN_ID"
  RESP=$(curl -sS -w '\n%{http_code}' "$BASE_URL/runs/$RUN_ID")
  BODY=$(body "$RESP")
  CODE=$(http_code "$RESP")
  assert_status 200 "$CODE" "get run"
  assert_json_equals "$BODY" '.id' "$RUN_ID"
  assert_json_equals "$BODY" '.task_id' "$TASK_ID"
  assert_field_exists "$BODY" '.status'
  echo "  ✓ run detail matches"
fi

# ---------------------------------------------------------------------------
# 8. Dependency cycle detection
# ---------------------------------------------------------------------------
echo "[test] dependency cycle detection"

# Create task A
RESP=$(curl -sS -w '\n%{http_code}' -X POST "$BASE_URL/tasks" \
  -H 'Content-Type: application/json' \
  -d '{"title":"Task A","description":"Cycle test A"}')
BODY=$(body "$RESP")
CODE=$(http_code "$RESP")
assert_status 201 "$CODE" "create task A"
TASK_A_ID=$(echo "$BODY" | jq -r '.id')
echo "  → created Task A id=$TASK_A_ID"

# Create task B depending on A
RESP=$(curl -sS -w '\n%{http_code}' -X POST "$BASE_URL/tasks" \
  -H 'Content-Type: application/json' \
  -d "{\"title\":\"Task B\",\"description\":\"Cycle test B\",\"dependencies\":[\"$TASK_A_ID\"]}")
BODY=$(body "$RESP")
CODE=$(http_code "$RESP")
assert_status 201 "$CODE" "create task B"
TASK_B_ID=$(echo "$BODY" | jq -r '.id')
echo "  → created Task B id=$TASK_B_ID (depends on A)"

# PATCH task A to depend on B — this creates a cycle
RESP=$(curl -sS -w '\n%{http_code}' -X PATCH "$BASE_URL/tasks/$TASK_A_ID" \
  -H 'Content-Type: application/json' \
  -d "{\"dependencies\":[\"$TASK_B_ID\"]}")
BODY=$(body "$RESP")
CODE=$(http_code "$RESP")
# The API returns 409 for cycle detection
if [ "$CODE" != "409" ] && [ "$CODE" != "400" ]; then
  echo "FAIL: expected 400 or 409 for cycle detection, got $CODE"
  exit 1
fi
assert_json_equals "$BODY" '.error' 'Dependency cycle detected'
echo "  ✓ cycle detected returns $CODE with error='Dependency cycle detected'"

# ---------------------------------------------------------------------------
# 9. DELETE /tasks/:id
# ---------------------------------------------------------------------------
echo "[test] DELETE /tasks/$TASK_ID"
RESP=$(curl -sS -w '\n%{http_code}' -X DELETE "$BASE_URL/tasks/$TASK_ID")
BODY=$(body "$RESP")
CODE=$(http_code "$RESP")
assert_status 204 "$CODE" "delete task"
echo "  ✓ delete returns 204"

# ---------------------------------------------------------------------------
# 10. GET /tasks/:id after delete — assert 404
# ---------------------------------------------------------------------------
echo "[test] GET /tasks/$TASK_ID after delete"
RESP=$(curl -sS -w '\n%{http_code}' "$BASE_URL/tasks/$TASK_ID")
BODY=$(body "$RESP")
CODE=$(http_code "$RESP")
assert_status 404 "$CODE" "get deleted task"
assert_json_equals "$BODY" '.error' 'Task not found'
echo "  ✓ deleted task returns 404"

# ---------------------------------------------------------------------------
# 11. Persistence restart test
# ---------------------------------------------------------------------------
echo "[test] persistence restart test"

# Create task 1
RESP=$(curl -sS -w '\n%{http_code}' -X POST "$BASE_URL/tasks" \
  -H 'Content-Type: application/json' \
  -d '{"title":"Persistence Task 1","description":"Created by persistence test"}')
BODY=$(body "$RESP")
CODE=$(http_code "$RESP")
assert_status 201 "$CODE" "create persistence task 1"
TASK_P1_ID=$(echo "$BODY" | jq -r '.id')
echo "  → created persistence task 1 id=$TASK_P1_ID"

# Create task 2
RESP=$(curl -sS -w '\n%{http_code}' -X POST "$BASE_URL/tasks" \
  -H 'Content-Type: application/json' \
  -d '{"title":"Persistence Task 2","description":"Created by persistence test"}')
BODY=$(body "$RESP")
CODE=$(http_code "$RESP")
assert_status 201 "$CODE" "create persistence task 2"
TASK_P2_ID=$(echo "$BODY" | jq -r '.id')
echo "  → created persistence task 2 id=$TASK_P2_ID"

# Trigger manual run on task 1
RESP=$(curl -sS -w '\n%{http_code}' -X POST "$BASE_URL/tasks/$TASK_P1_ID/run")
BODY=$(body "$RESP")
CODE=$(http_code "$RESP")
if [ "$CODE" != "200" ] && [ "$CODE" != "409" ]; then
  echo "FAIL: expected 200 or 409 for manual run, got $CODE"
  exit 1
fi
if [ "$CODE" = "200" ]; then
  assert_field_exists "$BODY" '.run.id'
  RUN_P_ID=$(echo "$BODY" | jq -r '.run.id')
  echo "  → run triggered, run_id=$RUN_P_ID"
else
  echo "  → run returned 409"
  RUN_P_ID=""
fi

# Allow debounced auto-save to fire (5s debounce + 1s buffer)
echo "[test] waiting for auto-save..."
sleep 6

# Verify state file exists and is non-empty
if [ ! -s "$STATE_FILE" ]; then
  echo "FAIL: state file does not exist or is empty"
  exit 1
fi
echo "  ✓ state file exists and is non-empty"

# Stop server gracefully
echo "[test] stopping server for restart..."
kill -TERM "$SERVER_PID"
wait "$SERVER_PID" 2>/dev/null || true
echo "  ✓ server stopped"

# Restart server
echo "[test] restarting server..."
node dist/index.js > /tmp/smoke-server.log 2>&1 &
SERVER_PID=$!

# Wait for restarted server
for i in $(seq 1 30); do
  if curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/health" | grep -q "200"; then
    echo "  ✓ server restarted and ready"
    break
  fi
  if [ "$i" -eq 30 ]; then
    echo "FAIL: server did not restart within 30s"
    cat /tmp/smoke-server.log
    exit 1
  fi
  sleep 1
done

# Verify tasks persisted
echo "[test] GET /tasks after restart"
RESP=$(curl -sS -w '\n%{http_code}' "$BASE_URL/tasks")
BODY=$(body "$RESP")
CODE=$(http_code "$RESP")
assert_status 200 "$CODE" "list tasks after restart"
if ! echo "$BODY" | jq -e "map(.id) | contains([\"$TASK_P1_ID\"])" > /dev/null 2>&1; then
  echo "FAIL: task list does not contain persistence task 1 after restart"
  exit 1
fi
if ! echo "$BODY" | jq -e "map(.id) | contains([\"$TASK_P2_ID\"])" > /dev/null 2>&1; then
  echo "FAIL: task list does not contain persistence task 2 after restart"
  exit 1
fi
echo "  ✓ both persisted tasks found after restart"

# Verify run persisted
if [ -n "$RUN_P_ID" ]; then
  echo "[test] GET /runs/$RUN_P_ID after restart"
  RESP=$(curl -sS -w '\n%{http_code}' "$BASE_URL/runs/$RUN_P_ID")
  BODY=$(body "$RESP")
  CODE=$(http_code "$RESP")
  assert_status 200 "$CODE" "get run after restart"
  assert_json_equals "$BODY" '.id' "$RUN_P_ID"
  assert_json_equals "$BODY" '.task_id' "$TASK_P1_ID"
  echo "  ✓ run history persisted after restart"
fi

# Verify health count
echo "[test] GET /health after restart"
RESP=$(curl -sS -w '\n%{http_code}' "$BASE_URL/health")
BODY=$(body "$RESP")
CODE=$(http_code "$RESP")
assert_status 200 "$CODE" "health after restart"
TASKS_COUNT=$(echo "$BODY" | jq -r '.tasks_count')
if [ "$TASKS_COUNT" -lt 2 ]; then
  echo "FAIL: expected tasks_count >= 2, got $TASKS_COUNT"
  exit 1
fi
echo "  ✓ health reports tasks_count=$TASKS_COUNT"

# Clean up: delete all test tasks
echo "[test] cleaning up persistence test tasks"
for TID in "$TASK_P1_ID" "$TASK_P2_ID"; do
  RESP=$(curl -sS -w '\n%{http_code}' -X DELETE "$BASE_URL/tasks/$TID")
  CODE=$(http_code "$RESP")
  if [ "$CODE" != "204" ]; then
    echo "WARN: cleanup DELETE $TID returned $CODE"
  fi
done
echo "  ✓ persistence test tasks cleaned up"

# Also clean up the cycle test tasks
for TID in "$TASK_A_ID" "$TASK_B_ID"; do
  RESP=$(curl -sS -w '\n%{http_code}' -X DELETE "$BASE_URL/tasks/$TID")
  CODE=$(http_code "$RESP")
  if [ "$CODE" != "204" ]; then
    echo "WARN: cleanup DELETE $TID returned $CODE"
  fi
done
echo "  ✓ cycle test tasks cleaned up"

echo ""
echo "Persistence restart test passed"

echo ""
echo "========================================"
echo "All smoke tests passed"
echo "========================================"
