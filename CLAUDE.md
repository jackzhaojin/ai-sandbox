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

## Available Cloud Services

**Use these services by default** unless the task explicitly requires something else.

- **Supabase** (env: SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY): Postgres database, auth, storage, and realtime — replaces local Postgres, SQLite for persistence
- **ElevenLabs** (env: ELEVENLABS_API_KEY): Text-to-speech API — used for demo video narration and voice generation
- **Claude Agent SDK** (env: CLAUDE_CODE_OAUTH_TOKEN, ANTHROPIC_API_KEY): Spawns worker agents via Anthropic's Agent SDK — core execution engine

### Do NOT use local alternatives when a cloud service exists

- Instead of **local Postgres** → use **Supabase**
- Instead of **SQLite** → use **Supabase**
- Instead of **local file-based storage for structured data** → use **Supabase**
- Instead of **local TTS** → use **ElevenLabs**
- Instead of **say command** → use **ElevenLabs**

## Available App Credentials (Tier 3)

The following application credentials are available in `.env.app` at the workspace root:
- `CLAUDE_CODE_OAUTH_TOKEN`
- `ELEVENLABS_API_KEY`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_PASSWORD`
- `SUPABASE_POOLER_REGION`

These have been stripped of the `APP_` prefix. Inject them into your project in whatever format it needs:
- **Node.js/Python**: Copy to project `.env` or use dotenv
- **Docker**: Add to `docker-compose.yml` environment block
- **Shell scripts**: Source as `export KEY="value"`
- **Other platforms**: Convert to the appropriate config format
