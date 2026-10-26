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
2. Not initialized yet: enter a letters-only task prefix and press **Init Backlog**. This runs `backlog init --defaults`, creates `AGENTS.md`, `CLAUDE.md`, and `GEMINI.md`, and appends the shared task and model-routing protocol from `templates/agent-protocol.md`.
3. Each initialized card has a **Sprints** section: type a name (and optional due date), press **Add sprint**. A sprint is a Backlog.md milestone, so it shows on that project's own dashboard. Open tasks without a sprint are listed under **Not in a sprint** with a dropdown to assign each one; the same can be done with `backlog task edit <id> -m "<sprint>"`.
   If the card shows "Agent protocol ... out of date", press **Update** to rewrite the AI Hub block in `AGENTS.md`, `CLAUDE.md`, and `GEMINI.md` (needed once per existing project after upgrading AI Hub).
4. Press **Start dashboard**, then **Open dashboard** for that project's own board.
5. **Stop** ends only the dashboard process. **Remove** drops the project from AI Hub and stops its dashboard; repo files are kept.
6. **Open board** opens AI Hub's responsive Kanban cockpit. Desktop shows four fitted columns; mobile uses status tabs and one column at a time, avoiding horizontal scrolling. Ticket headers show model badges: Claude, GPT, DeepSeek, or the Gemini+GPT art pair; unrouted work is visibly marked. Drag or use the Move control, filter by text/sprint/priority/model, and create routed tickets from the To Do column.
7. Project rows keep status, counts and actions visible while sprint details stay collapsed. Expand the sprint drawer only when planning. This keeps several repositories readable in one viewport.
8. If a project has no Closed column, the board shows **Enable Closed column**. It adds `"Closed"` to `statuses` in the repo's `backlog/config.yml`. Closed tickets count as finished in AI Hub sprint progress; Backlog.md's own dashboard still counts only Done.

AI Hub shares AI Live's visual system: JetBrains Mono, a 32px technical grid, translucent panels with a lime status rail, compact uppercase controls, semantic cyan/green/purple/amber/rose states, and a persisted light/dark theme toggle. AI Hub keeps its own task-routing layout rather than copying AI Live's monitoring widgets.
Provider marks are local monochrome SVGs from [Lobe Icons](https://github.com/lobehub/lobe-icons), pinned from `@lobehub/icons-static-svg@1.101.0` under the MIT license. They are rendered as theme-colored masks; provider names remain visible text and monogram fallbacks remain available when CSS masks are unsupported. Attribution and the full license are in `assets/providers/LICENSE.lobe-icons`.


## How it works

| Part | Where |
|---|---|
| Registry (name, path, port) | `~/.config/ai-hub/projects.json` |
| Tasks, plans, notes | `<repo>/backlog/` Markdown, versioned with the repo |
| Dashboard | `backlog browser` per project, port from 6500-6599, bound to 127.0.0.1 |
| Dashboard logs | `~/.config/ai-hub/logs/<id>.log` |
| Agent protocol | Block between `AI-HUB PROTOCOL START/END` in the repo's `AGENTS.md`, `CLAUDE.md`, and `GEMINI.md` |
| Provider icons | `assets/providers/` (local SVGs; no runtime CDN dependency) |

AI Hub never reads or writes task files itself. It shells out to `backlog` (`init`, `task list --json`, `browser`).

## Docs

- `docs/operations.md` — service setup, env vars, troubleshooting
- `docs/api.md` — HTTP API
- `docs/model-routing.md` — provider capabilities, routing labels, claim/escalation/review lifecycle
- `docs/repo-setup.md` — reproducible setup for new and existing repositories

### Roadmap Template

Projects can adopt a **phase-driven roadmap**: phases are Backlog.md milestones named `Phase N - <name>`, each closed by a manual review gate. The board's **Project roadmap** panel and **Phase metrics** are read from the project's real milestones (any number of phases); milestones not named `Phase N` (for example a "needs user" bucket) are left out of the roadmap.

- **Quick start (5 min):** [`docs/roadmap-quickstart.md`](docs/roadmap-quickstart.md)
- **Full guide:** [`docs/roadmap-guide.md`](docs/roadmap-guide.md)
- **Visual diagram:** [`roadmap-diagram.html`](roadmap-diagram.html)
- **Phase completion checklist:** [`templates/phase-completion-checklist.md`](templates/phase-completion-checklist.md)
- **Phase retrospective:** [`templates/phase-retrospective.md`](templates/phase-retrospective.md)

The roadmap is **optional**; projects can create custom sprints or work without milestones. AI Hub supports both.
