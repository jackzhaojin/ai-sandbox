# Agent Outputs Workspace

This directory is the centralized worker workspace for the Continuous Executive
Agent. Post-rebaseline (2026-04-17) it points at the `monorepo/legacy-v2.2`
worktree of `ai-sandbox` — a flat-layout archive where new monorepo-mode goals
also land in their `projects/{category}/{date}/{id}/` subdirectory. Worktree-
mode goals (the v2.3 default) write to their own per-project worktree at
`~/dev/ai-sandbox-worktrees/proj/<slug>/` instead and only consult this root
for shared `.env` and `.claude/`.

## Directory Structure

```
<this dir>/                # = `monorepo/legacy-v2.2` worktree of ai-sandbox
├── CLAUDE.md              # This file — workspace-wide instructions (do not modify)
├── .env                   # Worker env (synced from .env.worker; do not modify)
├── .env.app               # App credentials (Tier 3, APP_ prefix stripped; read-only)
├── .claude/               # Shared Claude skills and agents (do not modify)
│   ├── skills/            # Reusable skill definitions (use via Skill tool)
│   └── agents/            # Subagent definitions (use via Task tool)
└── projects/              # Legacy flat-layout project directories (monorepo mode)
    └── {category}/{date}/{id}/
```

## Rules

1. **Work ONLY in your assigned project directory.** Your prompt tells you which directory — it may be a `proj/<slug>` worktree at `~/dev/ai-sandbox-worktrees/proj/<slug>/` (worktree mode) or a path inside this monorepo workspace (monorepo mode).
2. **Navigate there first** before doing any work: `cd <your-project-path>`
3. **NEVER modify** this root CLAUDE.md, the root .env, the root .env.app, the root .claude/ directory, or other projects.
4. **Do NOT create .claude/ inside project folders.** Skills and agents are shared at the root only.
5. **Projects CAN have their own CLAUDE.md** — it inherits from root and adds project-specific context.
6. **Do NOT run `git init`** — both worktree-mode and monorepo-mode projects already share the parent `ai-sandbox` repo's git database. Commit your work from your project directory; the parent repo handles the rest.
7. If your project needs app-specific env vars, check `.env.app` at the root for available credentials, or create a separate `.env` inside the project directory.
{{SERVICES_SECTION}}{{APP_CREDS_SECTION}}