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
{{SERVICES_SECTION}}{{APP_CREDS_SECTION}}