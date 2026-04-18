# ai-sandbox

AI-built projects worth demoing. Each project lives on its own branch, built in an isolated git worktree by autonomous coding agents. Finished work gets merged to `main` and served from here.

## How it works

This repo uses a **worktree-per-project** model instead of a monorepo folder structure:

- **`base` branch** — Frozen init commit (license + `.gitignore`). Every new project forks from here.
- **`proj/<name>` branches** — One branch per project, developed in its own worktree with full local isolation (`.env`, `node_modules`, build artifacts stay per-worktree).
- **`main` branch** — Where finished demos land after merge. This is the public-facing branch.

Projects are created and built by two systems:
- **Harness pipelines** — Multi-agent plan-then-build workflows (spec agents plan, build agents implement, validator agents verify)
- **24x7 executive agent** — A continuously-running autonomous agent that picks goals from a queue, spawns workers, validates results, and moves to the next task

Both systems use the same input format (`PROMPT.md` with YAML frontmatter) and write output to worktrees off this repo.

## Creating a new project

```bash
# From the ai-sandbox repo checkout:
git worktree add ~/dev/ai-sandbox-worktrees/proj/<project-name> -b proj/<project-name> base
```

This creates an isolated working directory at `~/dev/ai-sandbox-worktrees/proj/<project-name>/` on a new branch forked from `base`.

**Tiered-namespace convention:** worktree paths mirror branch names exactly. A branch named `<namespace>/<slug>` lives at `~/dev/ai-sandbox-worktrees/<namespace>/<slug>/`. Today: `proj/*` for new project work, `monorepo/legacy-v2.2` for the pre-rebaseline archive.

## Previous work

This repo was rebaselined on 2026-04-17 to switch from a monorepo flat layout to the worktree-per-project model. The pre-rebaseline history is preserved on a separate branch:

| Source | Model | Where to find it |
|---|---|---|
| `monorepo/legacy-v2.2` branch | Monorepo with per-project subfolders (`projects/{react,nextjs,node,misc}/<date>/<slug>/`) | [github.com/jackzhaojin/ai-sandbox/tree/monorepo/legacy-v2.2](https://github.com/jackzhaojin/ai-sandbox/tree/monorepo/legacy-v2.2) — also checkout-able as a worktree at `~/dev/ai-sandbox-worktrees/monorepo/legacy-v2.2/` |
| [harness-v2-test](https://github.com/jackzhaojin/harness-v2-test) | Single repo, per-vendor branches | [jackzhaojin.github.io/harness-v2-test](https://jackzhaojin.github.io/harness-v2-test/) |

## License

[Apache 2.0](LICENSE)
