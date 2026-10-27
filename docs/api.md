# HTTP API

Local only. Requests need `Host: 127.0.0.1:<port>` or `localhost:<port>`. Non-GET requests also need a matching `Origin` header; otherwise `403`.

| Method | Path | Body | Result |
|---|---|---|---|
| GET | `/api/projects` | | `{ projects: [{ id, name, path, port, exists, initialized, isGit, running, url, summary, currentPhase, phaseProgress, gateStatus, protocolStale }] }` |
| POST | `/api/projects` | `{ path, name? }` | `{ project }`. 400 non-absolute or missing path, 409 duplicate |
| GET | `/api/fs` | `?path=<abs dir>` (default: home) | Read-only folder browser for the Add project popup: `{ path, parent, home, isGit, initialized, added, directories: [{ name, path, isGit, initialized, added }] }`. Sub-directories only, hidden ones skipped, never file contents. 400 relative or missing path, 403 unreadable directory |
| DELETE | `/api/projects/:id` | | Stops dashboard, removes registry entry only |
| POST | `/api/projects/:id/init` | `{ prefix }` | Runs `backlog init`, applies agent protocol. 400 bad prefix, 409 already initialized |
| POST | `/api/projects/:id/start` | | Starts dashboard. 409 if not initialized |
| POST | `/api/projects/:id/stop` | | Stops dashboard |
| POST | `/api/projects/:id/sprints` | `{ name, dueDate? }` | Runs `backlog milestone add`. 400 bad name or `dueDate` (`YYYY-MM-DD`) or duplicate name, 409 not initialized |
| POST | `/api/projects/:id/assign` | `{ taskId, sprintId }` | Runs `backlog task edit <taskId> -m <sprintId>`. Empty `sprintId` clears the sprint. 400 bad ids or unknown task, 404 unknown sprint, 409 not initialized |
| POST | `/api/projects/:id/protocol` | | Creates/updates the AI Hub block in `AGENTS.md`, `CLAUDE.md`, and `GEMINI.md` from the current template. 409 not initialized |
| GET | `/api/projects/:id/board` | | `{ project, statuses, modelTiers, closedEnabled, health, tasks: [{ id, title, status, priority, type, labels, modelTier, assignees, milestone, dueDate, updatedAt, isReady, stale, blockedBy, blockedError }], sprints, sprintsError }`. `isReady` is false while a dependency is not Done. For blocked tasks, `blockedBy` names those dependencies using bounded/cached `backlog task view --json` calls. `stale` is true for an In Progress ticket not updated for `AI_HUB_STALE_HOURS` (default 24). 409 not initialized |
| GET | `/api/projects/:id/health` | | Protocol-compliance counters from one `backlog task list --json` call: `{ total, open, doneTotal, inProgress, oneTier, noTier, multiTier, withAC, doneWithAC, doneAcAllChecked, inProgressUnassigned, stale, noPriority, blocked, rates: { routed, doneWithAC, doneAcChecked, inProgressAssigned }, ids: { noTier, multiTier, doneNoAC, doneAcOpen, inProgressUnassigned, stale, noPriority, blocked }, staleHours, generatedAt }`. Tier rates use open tickets; Done/AC rates use `doneTotal`; assignment rates use In Progress tickets. `doneTotal` counts status **Done** only: **Closed** is reserved by the shared protocol for abandoned/cancelled work and is excluded from completion-compliance rates. `rates` are percentages, or `null` when the denominator is 0. `ids` list the offending ticket ids. 409 not initialized |
| GET | `/api/projects/:id/metrics` | | `{ phases: [{ milestoneId, phase, done, total, percent, completed, dueDate, duration, gate }], velocity, trend, gatePassRate, generatedAt }`. Add `?format=csv` to download the same `phases` rows as CSV. 409 not initialized |
| POST | `/api/projects/:id/move` | `{ taskId, status }` | Runs `backlog task edit <taskId> -s <status>`. `status` is matched case-insensitively against configured statuses. 400 bad id or unknown status, 409 not initialized |
| POST | `/api/projects/:id/tasks` | `{ title, modelTier, sprintId? }` | Runs `backlog task create` with exactly one routing tier, optionally into a sprint. `modelTier`: `dev-high`, `dev-medium`, `dev-low`, or `art`. 400 bad input, 404 unknown sprint, 409 not initialized |
| POST | `/api/projects/:id/tier` | `{ taskId, modelTier }` | Replaces the existing routing-tier label while preserving ordinary labels. 400 bad input, 404 unknown task, 409 not initialized |
| POST | `/api/projects/:id/closed` | | Adds `"Closed"` to the inline `statuses:` list in the repo's `backlog/config.yml` (the CLI refuses `config set statuses`). 409 if already enabled or `statuses` is not an inline list |


`currentPhase` (string or null) is the title of the active milestone when tasks are in progress, or the earliest not-yet-completed milestone. `phaseProgress` is `{ total, done, percent }` for that phase or null if no phase. `gateStatus` is one of `not-started`, `in-progress`, `completed`, `approved`, `in-progress` (when gate decision is rework); derived from task counts and the latest gate decision record in `backlog/phase-gates.json`.

`metrics.phases` is sprint/milestone data ordered by milestone number, each enriched with `duration: { startedAt, estimatedDays, actualDays, ongoing } | null` (estimated from the milestone's due date when set; actual from the earliest task's `createdAt` to the latest finished task's `updatedAt`, or now while the phase is still open) and `gate: { decision, date, reviewer } | null` (the latest record for that milestone in `backlog/phase-gates.json`, written by `bin/backlog-phase.mjs gate --approve|--rework`; absent file means no gate decisions yet). `velocity` is the done/total per phase with at least one ticket. `trend` is the last 3 such phases' completion percent. `gatePassRate` is `{ approved, rework, percent } | null`, null when no phase has a gate decision.

`protocolStale` is true when any of `AGENTS.md`, `CLAUDE.md`, or `GEMINI.md` is missing or does not contain the current protocol block.

A sprint is a Backlog.md milestone (`backlog/milestones/m-N - <name>.md`). The server checks that `sprintId` exists before assigning because `backlog task edit -m` accepts unknown milestones without error.

**Closed counts as finished.** Backlog.md only counts `Done` toward milestone progress. AI Hub recomputes `done`, `total` and `completed` for every sprint from the task list, treating `Done` and `Closed` as finished, so sprint progress in AI Hub can be higher than `backlog milestone list`. Closed tasks are also left out of `unplanned`.

Model tiers are labels persisted by Backlog.md, not AI Hub-only state. See [`model-routing.md`](model-routing.md).
