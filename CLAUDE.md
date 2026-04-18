# Worktree Project Workspace

You are working in a per-project git worktree at `/Users/jackjin/dev/ai-sandbox-worktrees/proj/expense-tracker-supabase` on branch `proj/expense-tracker-supabase`, forked from the immutable `base` branch of the parent ai-sandbox repo. This is the v2.3 default build target.

## Layout

- `.env` — Worker env (do not modify)
- `.env.app` — App credentials (Tier 3, `APP_` prefix stripped; read-only)
- `.claude/` — Shared skills and agents (do not modify; use via Skill/Task tools)
- `LICENSE`, `.gitignore` — Inherited from `base` (do not modify)
- All other files: yours to create / modify

## Rules

1. **Stay in this worktree.** Do not `cd` to `~/dev/ai-sandbox/` or to any other worktree. Your assigned project path IS this directory.
2. **Do NOT run `git init`.** This worktree shares the parent ai-sandbox repo's git database. `git add` / `git commit` from here commits to the `proj/expense-tracker-supabase` branch.
3. **Branch is `proj/expense-tracker-supabase`** off the immutable `base` branch. Don't switch branches; commit your work directly here.
4. **Do NOT create a nested `.claude/`** — the one at this worktree root is shared by Skill/Task tools.
5. **Projects CAN have their own CLAUDE.md** — it inherits from this root file and adds project-specific context.

## Available App Credentials (Tier 3)

Available in `.env.app` at this worktree root:
- `CLAUDE_CODE_OAUTH_TOKEN`
- `ELEVENLABS_API_KEY`
- `SUPABASE_URL`
- `SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SECRET_KEY`
- `SUPABASE_PASSWORD`
- `SUPABASE_POOLER_REGION`

These are stripped of the `APP_` prefix. Inject into your project format (`.env.local`, dotenv, docker-compose, etc.) as needed.
