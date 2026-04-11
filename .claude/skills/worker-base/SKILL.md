---
name: worker-base
description: >
  Core worker instructions for all autonomous agent workers. Includes constitution limits,
  monorepo rules, navigation protocol, technology preferences, and execution guidelines.
  Loaded for EVERY worker task regardless of type or vendor.
user-invocable: false
metadata:
  category: skill
---

# Worker Base Instructions

## CONSTITUTION LIMITS (IMMUTABLE)

You are operating under the Continuous Executive Agent constitution. These limits are ABSOLUTE:

1. **No spending beyond cost cap** ($20/month per service)
2. **No permanent deletions** (archive/soft-delete only)
3. **No external publishing** without approval (npm publish, blog posts, etc.)
4. **No credential exposure** (never log, commit, or transmit credentials)
5. **No access control expansion** (no making private things public)
6. **No output in agent codebase** (all output goes to ai-sandbox)
7. **All activity must be logged** (no silent execution)
8. **No giving up early** (10 retries minimum before blocking)

If you hit a constitutional limit, document it and proceed with alternative work.

## Project Context (Monorepo)

You are working inside a **monorepo** at `ai-sandbox/`. Multiple projects coexist here, each in its own subdirectory. Your current working directory is the monorepo root.

**Your Project Directory:** `{{PROJECT_PATH}}`

### IMPORTANT — Navigate and Assess First

Before doing ANY work, navigate to your project directory and assess existing state:

```bash
cd {{PROJECT_PATH}}
git log --oneline -10 2>/dev/null  # See what's already been built
git diff --stat 2>/dev/null         # Check for uncommitted work
ls -la                              # Understand project structure
```

**A previous worker may have already made progress on this task** (e.g., due to a timeout or restart). Review what exists before writing any code. If the project already has files, commits, or partial implementations that align with your task, **continue from where it left off** — do not start over. Only redo work if what exists is broken beyond repair.

### Monorepo Rules

- **ALL files you create or modify MUST be inside `{{PROJECT_PATH}}`**
- Do NOT modify the root CLAUDE.md, .env (worker env), or .claude/ directory
- Do NOT modify any other project's directory
- **Do NOT create `.claude/` inside your project.** Skills and agents are shared at the root `.claude/` only — use via Skill/Task tools, do NOT copy them
- **Projects CAN have their own CLAUDE.md** — CLAUDE.md inherits hierarchically, so your project-level CLAUDE.md adds to (not replaces) the root one
- Do NOT run `git init` — you are inside a monorepo. Commit to the monorepo's git from your project directory

## Technology Preferences

**Language priority:** JavaScript > Python > Other
- Prefer JavaScript/Node.js for most tasks
- Use plain JavaScript over TypeScript when possible
- Only use Python if JavaScript SDK/library is unavailable
- Do NOT add "complementary" implementations in other languages - stick to ONE

**Scope discipline:**
- Complete the task as specified, no more
- Do not add extra features, languages, or implementations
- If the task is done, stop - don't "complement" with alternatives

## Execution Guidelines — Vertical Slice, Not Horizontal Layer

**You are not done when the file compiles. You are not done when the page renders. You are done when the thing you built works inside the user journey it belongs to.**

Workers who build in isolation produce beautiful parts that don't connect. This has happened before (see `ai-docs/v2/2026-04-01-v2.1/retro-b2b-postal-checkout.md` — 32 steps, 52 commits, 0 working user flows). Do not repeat it.

### Protocol for every task

1. **Navigate to your project directory first** — `cd {{PROJECT_PATH}}`
2. **Read the prior step's handoff first.** Look for `{{PROJECT_PATH}}/../step-*-handoff.md` or the handoff appended to this prompt. Specifically note: `what_connects`, `known_gaps`, `next_step_should_know`. If you can't find it, assume you are Step 1.
3. **Make the smallest change that advances the user journey.** Not "build all of Step 4's UI" — "wire the one interaction that gets a user from where they were to one step further."
4. **Run the journey, not just your component.** If this is a web project, see the web-testing skill's Journey Verification section. Walk from the natural start of the flow all the way through your change. Assert data you wrote is readable by the next screen.
5. **Commit frequently** — small, logical commits with clear messages (see `jack-git-commit` skill).
6. **Fill out the structured handoff honestly.** At the end, produce the fields listed under "Structured Handoff" below. If you cannot truthfully write `what_connects` and `what_i_verified`, your task is NOT done — go back to step 3.

### Anti-patterns (from the postal-checkout retro — do NOT do these)

- **Building components against hardcoded mock data when the DB is available.** If a schema and credentials exist, write real data and read it back. Mock data hides integration bugs that ship to the user.
- **Writing E2E test specs that depend on APIs you haven't smoke-tested first.** If you can't `curl` the endpoint and get a plausible response, don't write 40 test cases asserting its shape.
- **Marking a wizard step complete when its submit button doesn't persist or navigate.** A button that looks right but does nothing is not "done."
- **Writing test cases for pages that don't exist yet.** Tests that live in files but can never run are documentation, not testing.
- **Treating your step as isolated.** Your task exists in a flow. If the flow doesn't work end-to-end after your change, your change is incomplete, regardless of how pretty the component is.

### Structured Handoff (MANDATORY — your task is REJECTED without it)

**Your FINAL assistant message before stopping MUST contain a fenced ```yaml block in the exact format below.** Not a summary sentence. Not "here's what I did." An actual fenced YAML block with every field filled in. The integration validator parses this with a regex — no block, no pass, defect subtask filed, your work gets redone.

This is not optional and it is not the same as your progress report. The validator has already filed defects on prior runs that omitted this block. Do not be the next one.

**⚠️ CRITICAL: replace every placeholder with your REAL answer. Do NOT copy the placeholder text literally. Do NOT write `>` as a value. Each field is a single-line plain string (wrap in double quotes if it contains a colon).**

**Concrete example — this is the real shape of a good handoff. Use this as your template:**

```yaml
step: "step-2"
what_i_built: "Next.js 15 scaffold at projects/nextjs/2026-04-11/.../ with package.json, app/layout.tsx, app/page.tsx, and src/lib/supabase/{client,server}.ts pinned to the postal_v2 schema."
what_connects: "Reads SUPABASE_URL/SUPABASE_ANON_KEY from .env.local (sourced from /Users/jackjin/dev/ai-sandbox/.env.app). Writes tables shipments/rates/carriers/pickups under postal_v2.* via migrations/0001_init.sql (ran DROP SCHEMA IF EXISTS postal_v2 CASCADE; CREATE SCHEMA postal_v2; first)."
what_i_verified: "1) npm run build exited 0 (NODE_ENV=production). 2) npm run dev served / with a placeholder page. 3) Ran 'select 1 from postal_v2.shipments limit 1;' via psql — table exists. 4) journey.spec.ts not added yet; no UI surface to walk in step 2."
known_gaps: "No seed data yet (step 4). No UI routes other than /. No journey.spec.ts yet."
next_step_should_know: "Supabase client must be instantiated with { db: { schema: 'postal_v2' } } — the helper in src/lib/supabase/client.ts already does this; do not create a second client elsewhere."
journey_blocks_added: 0
```

**Rules:**
- Every value must be a concrete sentence describing YOUR step. Not `">"`, not `"TODO"`, not `"see above"`.
- Replace `"step-2"` with your actual step number (e.g. `"step-5"`, `"step-7.1"` for a defect subtask).
- `what_i_verified` MUST name commands and files you actually ran. "Looks good" / "builds fine" is rejected.
- If `what_i_verified` is just "npm run build passed" on a user-facing change, your task is NOT done — run the actual journey.
- If you cannot truthfully fill in `what_connects`, you built in isolation — that is the exact failure mode this harness exists to prevent. Go back to the task, wire the integration, then come back.
- The YAML block MUST be the LAST content in your final message. Anything after the closing ``` is ignored.
- Single-line plain strings only. No multi-line folded scalars (`>` / `|`). Put everything on one line per field. Quote strings that contain `:` or other YAML-special characters.

### If You Cannot Complete

1. Document exactly what is blocking you.
2. List what you tried and why it failed.
3. Specify what human input/action would unblock this.
4. Fill out the structured handoff anyway — `known_gaps` is where this belongs.

### Output Format

At the end, provide:
- The structured handoff (above) — this is mandatory
- Summary of changes made
- Files modified/created
- What works end-to-end vs what doesn't
- Any blockers or issues
- Whether the Definition of Done is met — answer honestly against the *journey*, not against a checklist of components
