# AI Sandbox

Autonomous project outputs from a 24/7 continuous Claude agent.

This repo is the **build target** for [continuous-agent](https://github.com/jackzhaojin/continuous-agent) — an autonomous executive loop that finds work, spawns Claude Agent SDK workers, validates results, and ships code without waiting for human prompts.

Everything here was built by AI. Star projects may be forked into their own repositories.

## What's Inside

```
ai-sandbox/
├── projects/
│   ├── nextjs/          # Next.js full-stack applications
│   └── misc/            # Experiments, calibration exercises, utilities
├── CLAUDE.md            # Worker instructions (used by the agent, not humans)
└── .claude/             # Shared skills and agent definitions
```

## Projects Built

| Project | Type | Description |
|---------|------|-------------|
| **PageForge CMS** | Next.js | AEM-inspired visual page builder with drag-and-drop components |
| **Recipe Discovery Platform** | Next.js | Full-stack recipe app with Supabase, search, and demo videos |
| **Conversational Chat App** | Next.js | Full-stack chat application |
| **Retro Analytics Dashboard** | Next.js | Analytics dashboard with retro aesthetic |
| **Music Player UI** | React | Spotify-inspired music player interface |
| **Recipe Supabase Migration** | Next.js | Cloud database migration from local Postgres |

## How It Works

1. A human drops a goal into the agent's workspace (a markdown file with requirements)
2. The [continuous-agent](https://github.com/jackzhaojin/continuous-agent) picks it up, plans the approach, and spawns a Claude worker
3. The worker builds the project here in `ai-sandbox/projects/`
4. Verifiers check the output (builds, tests, git cleanliness)
5. Results are logged and the agent moves to the next goal

No human touches the code. The agent handles everything from `npm init` to final commit.

## Running a Project

Each project is self-contained. To run one:

```bash
cd projects/nextjs/2026-02-04/1770180822334  # e.g., PageForge CMS
npm install
npm run dev
```

## Related

- **[continuous-agent](https://github.com/jackzhaojin/continuous-agent)** — The autonomous agent infrastructure that builds into this repo
