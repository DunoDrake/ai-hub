# AI Hub

Local manager for [Backlog.md](https://github.com/MrLesk/Backlog.md) project boards. You add projects by hand; each project gets its own Kanban dashboard (To Do / In Progress / Done). AI agents read and write tasks through the `backlog` CLI inside each repo, so they can resume work and report progress.

## Requirements

- Node.js 18+
- `npm i -g backlog.md` (tested with 1.55.3)

## Run

```bash
./start.sh            # http://127.0.0.1:4880/
```

Always-on service on macOS: see `docs/operations.md`.

## Use

1. Open `http://127.0.0.1:4880/`, paste the absolute path of a repo, press **Add project**. Nothing is discovered or added automatically.
2. Not initialized yet: enter a letters-only task prefix and press **Init Backlog**. This runs `backlog init --defaults`, creates `AGENTS.md` and `CLAUDE.md`, and appends the shared task protocol from `templates/agent-protocol.md`.
3. Press **Start dashboard**, then **Open dashboard** for that project's own board.
4. **Stop** ends only the dashboard process. **Remove** drops the project from AI Hub and stops its dashboard; repo files are kept.

## How it works

| Part | Where |
|---|---|
| Registry (name, path, port) | `~/.config/ai-hub/projects.json` |
| Tasks, plans, notes | `<repo>/backlog/` Markdown, versioned with the repo |
| Dashboard | `backlog browser` per project, port from 6500-6599, bound to 127.0.0.1 |
| Dashboard logs | `~/.config/ai-hub/logs/<id>.log` |
| Agent protocol | Block between `AI-HUB PROTOCOL START/END` in the repo's `AGENTS.md` / `CLAUDE.md` |

AI Hub never reads or writes task files itself. It shells out to `backlog` (`init`, `task list --json`, `browser`).

## Docs

- `docs/operations.md` — service setup, env vars, troubleshooting
- `docs/api.md` — HTTP API
