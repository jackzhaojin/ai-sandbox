---
name: backend-testing
description: >
  Curl-based API smoke testing for backend work. No browser required. Use when
  building or editing API routes, serverless functions, express endpoints,
  database layer, or any work where the deliverable is a callable endpoint
  rather than a UI. Complements web-testing — do not replace it for UI work.
user-invocable: false
metadata:
  category: skill
---

# Backend Testing Protocol — API Smoke Checks

This skill exists because the v2.1.6 run shipped 83 UI components against
hardcoded mock data. Every `GET /api/health` returned 500 in production and
nobody noticed because nothing tested the endpoint. Workers in backend steps
MUST exercise each endpoint they create before calling the step complete.

## PRE-FLIGHT CHECK: health of the existing API

Before writing any new endpoint, probe the current state:

```bash
cd {{PROJECT_PATH}}
# Start the dev server in the background
npm run dev > /tmp/backend-dev.log 2>&1 &
DEV_PID=$!

# Wait for it to be ready (max 30s)
for i in {1..30}; do
  if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/ >/dev/null 2>&1; then
    break
  fi
  sleep 1
done

# Hit the health endpoint. If it doesn't exist yet, that's fine — the
# absence tells you what to build next.
curl -sS -w '\nHTTP %{http_code}\n' http://localhost:3000/api/health || echo 'no /api/health'
```

If `/api/health` already returns non-200, FIX THAT before adding new endpoints.
Building on a failing foundation is the #1 reason v2.1.6 shipped unusable.

## MANDATORY: curl-verify every new endpoint BEFORE you mark the step done

For each endpoint you created or modified, record three things in your
structured handoff:

1. Method + path (e.g. `POST /api/shipments`)
2. Exact request body you sent
3. Exact response body you got back, including HTTP status

Example — creating `POST /api/shipments`:

```bash
curl -sS -w '\nHTTP %{http_code}\n' -X POST http://localhost:3000/api/shipments \
  -H 'Content-Type: application/json' \
  -d '{"origin":{"line1":"1 test st"},"destination":{"line1":"2 test st"}}'
```

Expected shape:

```json
{"id":"ship_…","origin":{"line1":"1 test st"},"destination":{"line1":"2 test st"}}
HTTP 201
```

If the response is 500 or HTML, STOP — do not paper over with a catch that
returns mock data. Debug the handler, fix the underlying cause, repeat the
curl. You are not done until the endpoint returns the shape you documented.

## Request-shape discipline

The v2.1.6 failure had `/api/quote` expecting `{ origin: { line1 } }` but
the form posted `{ originLine1 }`. Both sides shipped, neither talked to
the other, and the system appeared to work because the UI fell through to
mock data. Avoid this:

- Before building a new endpoint, declare its request and response TypeScript
  types (or JSON Schema) in the code.
- Before the form/caller is built, the endpoint exists AND passes its curl
  smoke with the exact shape the caller will send.
- `[PREREQUISITE-1]` breakdown step exists specifically to enforce this —
  don't skip it when you are inside a prerequisite step.

## Persistence round-trip

If the endpoint writes to a database, curl-verify the round-trip. Create
→ read back → confirm what you created is what you read.

```bash
# Create
RESP=$(curl -sS -X POST http://localhost:3000/api/shipments \
  -H 'Content-Type: application/json' \
  -d '{"origin":{"line1":"A"},"destination":{"line1":"B"}}')
ID=$(echo "$RESP" | jq -r .id)

# Read back
curl -sS -w '\nHTTP %{http_code}\n' "http://localhost:3000/api/shipments/$ID"
```

If the GET returns 404 or different data, the write did not persist. Do not
declare the endpoint working.

## Handoff must include API surface

Your structured handoff YAML block must include, verbatim, the endpoints you
exercised. Keep it tight — list method + path + one-line notes:

```yaml
what_i_built: "POST /api/shipments persists to Supabase; returns shipment.id"
what_connects: "reads {origin,destination}; writes shipments table"
what_i_verified: "curl -X POST returned 201 with id; GET /api/shipments/:id returned the same record"
known_gaps: "no rate-limiting; no auth check on GET"
```

## Cleanup

Always kill the dev server you started:

```bash
kill $DEV_PID 2>/dev/null || true
```

## When to use this skill vs. web-testing

| Step intent | Skill |
|---|---|
| New or modified API route, serverless function, DB access | `backend-testing` |
| New or modified UI surface, journey gate, visual verification | `web-testing` (playwright-cli) |
| Full-stack step that does both | Run `backend-testing` first, then `web-testing` |

The executive's Phase 5 integration validator will fail a fullstack gate
that claims "UI works" without the backend round-trip being documented in
the handoff.
