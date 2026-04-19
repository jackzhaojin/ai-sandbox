#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

# Clean any existing state
rm -f data/state.json

# Start the Fastify dev server in background
npx tsx src/server.ts > /tmp/task-scheduler-smoke.log 2>&1 &
SERVER_PID=$!

# Wait for server to be ready
for i in {1..30}; do
  if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/health 2>/dev/null | grep -q "200"; then
    break
  fi
  sleep 1
done

# Helper: extract JSON body from a file (all lines except those starting with HTTP)
json_body() {
  grep -v '^HTTP ' "$1" || true
}

# Helper: extract HTTP status from a file
http_status() {
  grep '^HTTP ' "$1" | awk '{print $2}' || true
}

echo "=== 1. POST /api/tasks (with retryPolicy) ==="
CREATE_FILE=$(mktemp)
curl -sS -w '\nHTTP %{http_code}\n' -X POST http://localhost:3000/api/tasks \
  -H 'Content-Type: application/json' \
  -d '{"title":"Smoke Task A","description":"First smoke task","retryPolicy":{"maxAttempts":5,"baseDelayMs":500,"maxDelayMs":10000}}' > "$CREATE_FILE"
cat "$CREATE_FILE"
TASK_A_ID=$(json_body "$CREATE_FILE" | jq -r '.id')

echo "=== 2. GET /api/tasks/:id (snapshot_history) ==="
GET_FILE=$(mktemp)
curl -sS -w '\nHTTP %{http_code}\n' "http://localhost:3000/api/tasks/$TASK_A_ID" > "$GET_FILE"
cat "$GET_FILE"

echo "=== 3. POST /api/tasks (with dependencies) ==="
CREATE_B_FILE=$(mktemp)
curl -sS -w '\nHTTP %{http_code}\n' -X POST http://localhost:3000/api/tasks \
  -H 'Content-Type: application/json' \
  -d "{\"title\":\"Smoke Task B\",\"dependencies\":[\"$TASK_A_ID\"]}" > "$CREATE_B_FILE"
cat "$CREATE_B_FILE"
TASK_B_ID=$(json_body "$CREATE_B_FILE" | jq -r '.id')

echo "=== 4. GET /api/tasks/dependencies (valid graph) ==="
DEPS_FILE=$(mktemp)
curl -sS -w '\nHTTP %{http_code}\n' "http://localhost:3000/api/tasks/dependencies" > "$DEPS_FILE"
cat "$DEPS_FILE"

echo "=== 5. POST /api/tasks/:id/execute (blocked) ==="
EXEC_BLOCKED_FILE=$(mktemp)
curl -sS -w '\nHTTP %{http_code}\n' -X POST "http://localhost:3000/api/tasks/$TASK_B_ID/execute" > "$EXEC_BLOCKED_FILE"
cat "$EXEC_BLOCKED_FILE"

echo "=== 6. POST /api/tasks/:id/execute (success) ==="
EXEC_A_FILE=$(mktemp)
curl -sS -w '\nHTTP %{http_code}\n' -X POST "http://localhost:3000/api/tasks/$TASK_A_ID/execute" > "$EXEC_A_FILE"
cat "$EXEC_A_FILE"

echo "=== 7. POST /api/tasks/:id/execute (retry via simulate_failure) ==="
EXEC_FAIL_FILE=$(mktemp)
curl -sS -w '\nHTTP %{http_code}\n' -X POST "http://localhost:3000/api/tasks/$TASK_A_ID/execute" \
  -H 'Content-Type: application/json' \
  -d '{"simulate_failure":true}' > "$EXEC_FAIL_FILE"
cat "$EXEC_FAIL_FILE"

echo "=== 8. GET /api/tasks/:id (status changed after execute) ==="
GET_AFTER_FILE=$(mktemp)
curl -sS -w '\nHTTP %{http_code}\n' "http://localhost:3000/api/tasks/$TASK_A_ID" > "$GET_AFTER_FILE"
cat "$GET_AFTER_FILE"
SNAPSHOT_COUNT=$(json_body "$GET_AFTER_FILE" | jq '.snapshot_history | length')
echo "Snapshot history count: $SNAPSHOT_COUNT"

echo "=== 9. POST /api/tasks (cycle detection) ==="
CREATE_C_FILE=$(mktemp)
curl -sS -w '\nHTTP %{http_code}\n' -X POST http://localhost:3000/api/tasks \
  -H 'Content-Type: application/json' \
  -d "{\"title\":\"Smoke Task C\",\"dependencies\":[\"$TASK_B_ID\"]}" > "$CREATE_C_FILE"
cat "$CREATE_C_FILE"
TASK_C_ID=$(json_body "$CREATE_C_FILE" | jq -r '.id')

# Try to create cycle by updating A to depend on C
CYCLE_FILE=$(mktemp)
curl -sS -w '\nHTTP %{http_code}\n' -X PUT "http://localhost:3000/api/tasks/$TASK_A_ID" \
  -H 'Content-Type: application/json' \
  -d "{\"dependencies\":[\"$TASK_C_ID\"]}" > "$CYCLE_FILE"
cat "$CYCLE_FILE"

echo "=== 10. GET /api/tasks/dependencies (graph still valid after rejected cycle) ==="
DEPS_AFTER_FILE=$(mktemp)
curl -sS -w '\nHTTP %{http_code}\n' "http://localhost:3000/api/tasks/dependencies" > "$DEPS_AFTER_FILE"
cat "$DEPS_AFTER_FILE"

# Cleanup temp files
rm -f "$CREATE_FILE" "$GET_FILE" "$CREATE_B_FILE" "$DEPS_FILE" "$EXEC_BLOCKED_FILE" "$EXEC_A_FILE" "$EXEC_FAIL_FILE" "$GET_AFTER_FILE" "$CREATE_C_FILE" "$CYCLE_FILE" "$DEPS_AFTER_FILE"

# Cleanup server
kill $SERVER_PID 2>/dev/null || true
wait $SERVER_PID 2>/dev/null || true

echo "=== Smoke tests complete ==="
