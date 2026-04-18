---
name: worker-base
description: >
  Core worker instructions for all autonomous agent workers. Includes constitution limits,
  workspace rules (worktree default, monorepo legacy), navigation protocol, technology
  preferences, and execution guidelines. Loaded for EVERY worker task regardless of type or vendor.
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

## Project Context

Your assigned project workspace is `{{PROJECT_PATH}}`. The shape of that workspace depends on the goal's `build_target`:

- **`worktree` (v2.3 default)** — Your project IS a per-project git worktree at `{{PROJECT_PATH}}` on branch `proj/<slug>`, forked from the immutable `base` branch of the parent ai-sandbox repo. Your CWD is already this worktree. Shared `.env`, `.env.app`, `.claude/`, and a worktree-specific `CLAUDE.md` live at this worktree's root.
- **`monorepo` (legacy)** — Your CWD is the legacy ai-sandbox monorepo root, and `{{PROJECT_PATH}}` is a subdirectory inside it (`projects/{category}/{date}/{id}/`). Multiple projects coexist in this workspace. Shared `.env`, `.env.app`, `.claude/`, and the monorepo `CLAUDE.md` live at the workspace root, NOT in your subdirectory.
- **`existing`** — `{{PROJECT_PATH}}` is an external project owned by the user. Respect its existing conventions; do not inject `.env` / `.gitignore` / scaffolding.

**Your Project Directory:** `{{PROJECT_PATH}}`

### IMPORTANT — Navigate and Assess First

Before doing ANY work, navigate to your project directory and assess existing state:

```bash
cd {{PROJECT_PATH}}                 # No-op for worktree mode (already there); navigates for monorepo
git log --oneline -10 2>/dev/null   # See what's already been built
git diff --stat 2>/dev/null         # Check for uncommitted work
ls -la                              # Understand project structure
```

**A previous worker may have already made progress on this task** (e.g., due to a timeout or restart). Review what exists before writing any code. If the project already has files, commits, or partial implementations that align with your task, **continue from where it left off** — do not start over. Only redo work if what exists is broken beyond repair.

### Workspace Rules

- **ALL files you create or modify MUST be inside `{{PROJECT_PATH}}`**
- Do NOT modify the workspace root `CLAUDE.md`, `.env` (worker env), `.env.app`, or `.claude/` directory — these are shared
- Do NOT modify any other project's directory
- **Do NOT create a nested `.claude/` inside your project.** Skills and agents are shared at the workspace root — use them via the Skill/Task tools instead of copying
- **Projects CAN have their own CLAUDE.md** — CLAUDE.md inherits hierarchically, so a project-level CLAUDE.md adds to (not replaces) the root one
- Do NOT run `git init` — your workspace already shares the parent ai-sandbox repo's git database. Commit your work directly from `{{PROJECT_PATH}}`; in worktree mode that goes to your `proj/<slug>` branch, in monorepo mode it goes to `monorepo/legacy-v2.2`

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

**⚠️ CRITICAL: every value must describe YOUR actual work in THIS step. Do not copy text from this skill file. Do not invent work you didn't do. Honest under-claiming beats fabricated over-claiming every time.**

**Emit EXACTLY this YAML shape, replacing each `<...>` placeholder with a real sentence describing what YOU did:**

```yaml
step: "<the step id assigned to you — e.g. step-4, or step-4.1 if this is a defect subtask>"
what_i_built: "<ONE concrete sentence about what YOU produced this step. For a research/planning step, name the plan document you wrote. For a scaffold step, name the files and directories you created. For a feature step, name the components/routes/tables. Do NOT describe work that belongs to a future step.>"
what_connects: "<Where does YOUR code read state FROM, and where does it write state TO? Name real file paths, route names, hook names, table names. If this step is pure research and connects to nothing yet, say 'none yet — research step, no runtime wiring.'>"
what_i_verified: "<The actual commands YOU ran this step, and what YOU saw. Examples of valid answers: 'Read prior project at path X, noted 12 API routes, no commands run.' OR 'Ran npm install (succeeded), npm run build (succeeded, NODE_ENV=production), npm run dev served / at localhost:3000 with default page.' Do NOT write verification you did not perform.>"
known_gaps: "<What you knowingly did NOT do in this step. Be specific. If truly nothing is missing, say 'none known'.>"
next_step_should_know: "<One or two non-obvious facts the next worker won't spot in the diff — env expectations, file-naming conventions, gotchas you hit.>"
journey_blocks_added: 0
```

**Forbidden — these cause automatic rejection:**
- Copying any text from this skill file verbatim (including the phrase `postal_v2` if your task doesn't actually use it, or `Next.js 15 scaffold` if you didn't run the scaffold, etc.).
- Writing values that describe a future step's work as if it were yours.
- Placeholder literals like `<...>`, `TODO`, `see above`, `same as before`, `N/A`.
- Multi-line folded scalars (`>` or `|`). Every value is a single-line double-quoted string.
- Any content after the closing ``` of the YAML block — the harness reads to the last closing fence and ignores the rest.

**Research/planning steps (no code built):** A valid handoff still uses the YAML block. Example field values for a research step:
- `what_i_built`: `"Research plan document at <your actual path>.md covering stack choice, table schema, and 6-step wizard flow."`
- `what_connects`: `"none yet — research step, no runtime wiring."`
- `what_i_verified`: `"Read prior-run project files at /path/..., grepped for API routes and table names, wrote plan.md with the findings. No commands run."`
- `known_gaps`: `"Nothing built yet — all implementation is in subsequent steps."`
- `journey_blocks_added`: `0`

**Scaffold/build steps (actual code):** A valid handoff names real filenames YOU created and real commands YOU ran with their exit codes and observed behavior.

**Failure modes the validator checks for (don't be these):**
- `what_connects` that lists no upstream and no downstream → you built in isolation.
- `what_i_verified` that says "npm run build passed" on a user-facing change → compilation isn't verification of behavior.
- Handoff text matching another step's handoff word-for-word → you copied someone else's work.
- `journey_blocks_added` > 0 but `tests/e2e/journey.spec.ts` has no new `test(...)` blocks → you lied.

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
