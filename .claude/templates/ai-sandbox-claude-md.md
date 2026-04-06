# Agent Outputs Workspace

This is a **monorepo** containing all projects built by the Continuous Executive Agent.
Multiple independent projects coexist here, each in its own subdirectory.

## Directory Structure

```
ai-sandbox/
├── CLAUDE.md              # This file — workspace-wide instructions (do not modify)
├── .env                   # Worker env (synced from .env.worker; do not modify)
├── .env.app               # App credentials (Tier 3, APP_ prefix stripped; read-only)
├── .claude/               # Shared Claude skills and agents (do not modify)
│   ├── skills/            # Reusable skill definitions (use via Skill tool)
│   └── agents/            # Subagent definitions (use via Task tool)
└── projects/              # All project directories
    └── {category}/{date}/{id}/
```

## Rules

1. **Work ONLY in your assigned project directory.** Your prompt tells you which directory.
2. **Navigate there first** before doing any work: `cd <your-project-path>`
3. **NEVER modify** this root CLAUDE.md, the root .env, the root .env.app, the root .claude/ directory, or other projects.
4. **Do NOT create .claude/ inside project folders.** Skills and agents are shared at the root only.
5. **Projects CAN have their own CLAUDE.md** — it inherits from root and adds project-specific context.
6. **Do NOT run `git init`** — this is a monorepo. Commit your work to the monorepo's git from your project directory.
7. If your project needs app-specific env vars, check `.env.app` at the root for available credentials, or create a separate `.env` inside the project directory.

## MANDATORY: Visual Testing for Web Projects

If you are building a website or web UI, you MUST visually verify your work before marking a step complete. Use `playwright-cli` (already installed) to open a browser, take snapshots, and verify pages render correctly.

```bash
# Start dev server, open browser, verify
npm run dev &
sleep 3
playwright-cli open http://localhost:3000
playwright-cli snapshot
playwright-cli screenshot
playwright-cli close
```

**Untested UI that compiles but renders blank is a failure.** Always verify visually.
{{SERVICES_SECTION}}{{APP_CREDS_SECTION}}