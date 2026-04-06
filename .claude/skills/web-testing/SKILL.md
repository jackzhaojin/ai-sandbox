---
name: web-testing
category: skill
version: 1.0.0
description: >
  Mandatory visual testing protocol for all web projects using playwright-cli.
  Enforces pre-flight site health check and post-build visual verification.
  Use when: building any web UI (Next.js, React, Vue, Angular, HTML/CSS).
use_cases:
  - Web application development
  - UI component building
  - Frontend projects
tools_required: [playwright-cli]
setup: []
tags: [web, testing, playwright, visual-verification, ui]
track_record:
  total_executions: 0
  successes: 0
  failures: 0
  last_executed: null
  confidence: 80
  maturity: Declared
---

# Visual Testing Protocol for Web Projects

## PRE-FLIGHT CHECK: Verify the website loads BEFORE you start coding

Before writing ANY new code, verify the existing site works:

```bash
cd {{PROJECT_PATH}} && npm run dev &
sleep 3
playwright-cli open http://localhost:3000
playwright-cli snapshot
playwright-cli close
kill %1 2>/dev/null || true
```

If the page does NOT load or shows errors, FIX THAT FIRST before doing your task. Do not build on a broken foundation.

## MANDATORY: You MUST Use playwright-cli To Verify Your Work AFTER Building

**THIS IS A HARD REQUIREMENT, NOT A SUGGESTION.** Your task is NOT complete until you have run `playwright-cli` to visually verify your UI renders correctly. Do NOT skip this. Do NOT substitute with curl or npm run build alone.

**You MUST execute these exact shell commands after you finish building:**

```bash
# Start dev server
cd {{PROJECT_PATH}} && npm run dev &
sleep 3

# Open browser with playwright-cli (this is a real CLI tool installed on this machine)
playwright-cli open http://localhost:3000

# Take a snapshot to see what rendered
playwright-cli snapshot

# Take a screenshot for the record
playwright-cli screenshot

# Click on interactive elements to verify they work
playwright-cli click <ref-from-snapshot>

# Close browser and kill dev server
playwright-cli close
kill %1 2>/dev/null || true
```

`playwright-cli` is installed at `/Users/jackjin/.nvm/versions/node/v20.19.5/bin/playwright-cli`. It is a real tool. Run it via your Shell tool. If you do not run playwright-cli, your work will be rejected by the verifier.

## What to Verify

- Page renders without blank screens or errors
- Components are visible and properly styled
- Forms accept input and show validation errors
- Navigation between pages/steps works
- No console errors (check browser dev tools)

## Fallback (if playwright-cli is unavailable)

If `playwright-cli` is not available, fall back to:
1. `npm run build` — verifies compilation
2. `curl http://localhost:3000` — verifies server responds
3. Check for runtime errors in server output

**Do NOT skip visual testing.** A component that compiles but renders a blank page is a failure.
