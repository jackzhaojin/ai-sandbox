---
name: web-testing
description: >
  Mandatory visual testing protocol for all web projects using playwright-cli.
  Enforces pre-flight site health check and post-build visual verification.
  Use when building any web UI (Next.js, React, Vue, Angular, HTML/CSS).
user-invocable: false
metadata:
  category: skill
---

# Visual Testing Protocol for Web Projects

## PRE-FLIGHT CHECK: Verify the website loads BEFORE you start coding

Before writing ANY new code, verify the existing site works:

```bash
cd {{PROJECT_PATH}} && npm run dev &
sleep 3
PORT=$(lsof -nP -iTCP -sTCP:LISTEN | awk '/node/ && /127.0.0.1|localhost/ {print $9}' | sed -E 's/.*:([0-9]+)->?/\1/' | head -1)
[ -z "$PORT" ] && PORT=$(grep -oE 'localhost:[0-9]+' .next/dev/logs/* 2>/dev/null | head -1 | cut -d: -f2)
[ -z "$PORT" ] && PORT=3000
playwright-cli open "http://localhost:$PORT"
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
PORT=$(lsof -nP -iTCP -sTCP:LISTEN | awk '/node/ && /127.0.0.1|localhost/ {print $9}' | sed -E 's/.*:([0-9]+)->?/\1/' | head -1)
[ -z "$PORT" ] && PORT=$(grep -oE 'localhost:[0-9]+' .next/dev/logs/* 2>/dev/null | head -1 | cut -d: -f2)
[ -z "$PORT" ] && PORT=3000

# Open browser with playwright-cli (this is a real CLI tool installed on this machine)
playwright-cli open "http://localhost:$PORT"

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

## JOURNEY VERIFICATION (the part the postal-checkout run skipped)

**After your component renders correctly, walk the user journey from its natural start all the way to your component's output.** Not just "my page loads" — "I got here from Step 1 and I can get to Step N."

Snapshots of individual pages are not enough. A flow is only real when a user can traverse it.

### Extend `tests/e2e/journey.spec.ts` every step

This is an **append-only** spec that grows as the app grows. Each step adds a block for its segment. If the file doesn't exist, create it. Never rewrite prior blocks — extend.

```ts
// tests/e2e/journey.spec.ts
import { test, expect, Page } from '@playwright/test'

export async function completePriorSteps(page: Page, opts: { through: number }) {
  // Each step that adds a gate extends this helper with its own segment.
  // Start at the flow's natural entry and walk through `opts.through`.
  if (opts.through >= 1) {
    await page.goto('/')
    await page.getByRole('button', { name: /start/i }).click()
    await page.fill('[name="email"]', 'journey@test.local')
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL(/\/step-2/)
  }
  if (opts.through >= 2) {
    // step 2 segment...
  }
  // ...etc
}

test('step 14: pickup slot selection persists to confirmation', async ({ page }) => {
  await completePriorSteps(page, { through: 13 })
  await page.click('[data-slot="tuesday-10am"]')
  await page.click('button:has-text("Continue")')
  await expect(page).toHaveURL(/\/review/)
  await expect(page.getByText(/tuesday.*10:00/i)).toBeVisible()
})
```

### Run the WHOLE journey.spec.ts before declaring your step done

Not just your new block:

```bash
cd {{PROJECT_PATH}} && npm run dev &
sleep 3
npx playwright test tests/e2e/journey.spec.ts
kill %1 2>/dev/null || true
```

**If an earlier block now fails, you broke it.** Fix it before moving on. Do not open a new step until `journey.spec.ts` is green.

### What counts as a journey-verifying step

Extend `journey.spec.ts` whenever your step:
- Adds a new page/route a user can reach
- Adds a form submission that should persist
- Adds navigation between steps of a flow
- Adds a data-dependent render (showing persisted state from a prior step)

You can skip extending it for: pure refactors, style-only changes, non-user-facing config.

### Data dependency — do not hardcode your way out of integration

If the journey requires data that should come from an API/DB and the API/DB isn't ready, **do not mock it with hardcoded component defaults and call the step done.** Either:
1. Seed the DB (preferred — this is the real fix), or
2. Use `page.route()` to intercept the API call in the test and honestly label it as a mock in `known_gaps` in your handoff

Silently hardcoding data into components is the failure mode that shipped the undemoable postal-checkout app.

## Fallback (if playwright-cli is unavailable)

If `playwright-cli` is not available, fall back to:
1. `npm run build` — verifies compilation
2. `curl "http://localhost:${PORT:-3000}"` — verifies server responds
3. Check for runtime errors in server output

**Do NOT skip visual testing.** A component that compiles but renders a blank page is a failure.
