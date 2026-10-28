# AI Hub

Local manager for [Backlog.md](https://github.com/MrLesk/Backlog.md) project boards. You add projects by hand; each project gets its own Kanban dashboard (To Do / In Progress / Review / Done / Wontfix / Closed). AI agents read and write tasks through the `backlog` CLI inside each repo, so they can resume work and report progress.

## Requirements

- Node.js 18+
- `npm i -g backlog.md` (tested with 1.55.3)
- `backlog-phase` on `PATH` for atomic agent claims. From this checkout: `mkdir -p ~/.local/bin && ln -sfn "$PWD/bin/backlog-phase.mjs" ~/.local/bin/backlog-phase` (ensure `~/.local/bin` is on `PATH`).

## Run

```bash
./start.sh            # http://127.0.0.1:4880/
```

Always-on service on macOS: see `docs/operations.md`.

## Use

1. Open `http://127.0.0.1:4880/` and press **Add project**. A popup lists your folders: click to select, double-click (or `→`) to open one, or type/paste a path and press Enter. Press **Add this folder**. Folders already added are marked and cannot be added twice. Nothing is discovered or added automatically.
2. Not initialized yet: enter a letters-only task prefix and press **Init Backlog**. This runs `backlog init --defaults`, creates `AGENTS.md`, `CLAUDE.md`, and `GEMINI.md`, and appends the shared task and model-routing protocol from `templates/agent-protocol.md`.
3. Each initialized card has a **Sprints** section: type a name (and optional due date), press **Add sprint**. A sprint is a Backlog.md milestone, so it shows on that project's own dashboard. Open tasks without a sprint are listed under **Not in a sprint** with a dropdown to assign each one; the same can be done with `backlog task edit <id> -m "<sprint>"`.
   If the card shows "Agent protocol ... out of date", press **Update** to rewrite the AI Hub block in `AGENTS.md`, `CLAUDE.md`, and `GEMINI.md` (needed once per existing project after upgrading AI Hub).
4. Press **Start dashboard**, then **Open dashboard** for that project's own board.
5. **Stop** ends only the dashboard process. **Remove** drops the project from AI Hub and stops its dashboard; repo files are kept.
6. **Open board** opens AI Hub's responsive Kanban cockpit. Desktop shows six horizontally scrollable columns; mobile uses status tabs and one column at a time, avoiding horizontal scrolling. Ticket headers show model badges: Claude, GPT, DeepSeek, or the Gemini+GPT art pair; unrouted work is visibly marked. Drag or use the Move control, filter by text/sprint/priority/model, and create routed tickets from the To Do column.
7. Project rows keep status, delivery phase, delivered work, counts and actions visible while sprint details stay collapsed. The delivered-work list includes `Done` and explicitly delivered `Closed` tickets. Wontfix and unclassified legacy Closed are never accomplishments; recent items are sorted by latest update. Expand the sprint drawer only when planning. This keeps several repositories readable in one viewport.
8. Existing projects opt in using **Enable review workflow**; config is backed up and custom statuses retained. New projects start with all six states. Review records AI/manual mode, reviewer and evidence; Wontfix requires a reason; Closed ends a Done/Wontfix ticket without losing its resolution. Reopening requires a reason. Selecting AI review does not invoke a model automatically.

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

### Agent work selection

Use `bin/backlog-phase.mjs` to choose and atomically claim work without two agents overwriting each other:

```bash
node bin/backlog-phase.mjs next --provider gpt --path /absolute/project
node bin/backlog-phase.mjs claim TASK-12 --provider gpt --path /absolute/project
```

The board's **Protocol health** chips expose missing model tiers, delivered tickets without acceptance criteria, unchecked AC, unassigned/stale In Progress work, and blocked tasks. Clicking a chip filters to the exact tickets. State filters also include **Ready to claim**, **Blocked**, and **Stale**.

## Docs

- [docs/](docs/README.md) — AI Hub design, architecture diagram, API, operations and handoff.
- [guides/](guides/README.md) — setup, migration, workflow and roadmap instructions for projects using AI Hub.

`guides` is short and conventional. These are adoption guides, not vendor-authored “third-party docs.” Keep each topic in one home and link across the boundary.

### Delivery roadmap vs feature backlog

AI Hub's roadmap is a **phase-driven delivery roadmap**, not a complete product strategy document. It answers: which delivery phase is active, how many tickets are complete, what was recently delivered, and whether the phase gate passed. A feature backlog answers a different question: which capabilities or tickets should be built next.

Projects can opt into the roadmap by creating Backlog.md milestones named `Phase N - <name>` and grouping tickets under them. Each phase can be closed by a manual review gate. The board's **Delivery roadmap** and **Delivery phase metrics** are read from the project's real milestones (any number of phases); milestones not named `Phase N` (for example a `needs user` bucket or a feature-only sprint) remain available in the board but are left out of the roadmap visualization.

- **Quick start (5 min):** [`guides/roadmap-quickstart.md`](guides/roadmap-quickstart.md)
- **Full guide:** [`guides/roadmap-guide.md`](guides/roadmap-guide.md)
- **Visual diagram:** [`roadmap-diagram.html`](roadmap-diagram.html)
- **Phase completion checklist:** [`templates/phase-completion-checklist.md`](templates/phase-completion-checklist.md)
- **Phase retrospective:** [`templates/phase-retrospective.md`](templates/phase-retrospective.md)

The roadmap is **optional**; projects can create custom sprints for feature planning or work without milestones. AI Hub supports both. Use the roadmap for phase-level outcomes and gates, and use ordinary sprints for feature slices, experiments, maintenance, or ad-hoc work.
