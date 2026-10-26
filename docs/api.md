# HTTP API

Local only. Requests need `Host: 127.0.0.1:<port>` or `localhost:<port>`. Non-GET requests also need a matching `Origin` header; otherwise `403`.

| Method | Path | Body | Result |
|---|---|---|---|
| GET | `/api/projects` | | `{ projects: [{ id, name, path, port, exists, initialized, isGit, running, url, summary, protocolStale }] }` |
| POST | `/api/projects` | `{ path, name? }` | `{ project }`. 400 non-absolute or missing path, 409 duplicate |
| DELETE | `/api/projects/:id` | | Stops dashboard, removes registry entry only |
| POST | `/api/projects/:id/init` | `{ prefix }` | Runs `backlog init`, applies agent protocol. 400 bad prefix, 409 already initialized |
| POST | `/api/projects/:id/start` | | Starts dashboard. 409 if not initialized |
| POST | `/api/projects/:id/stop` | | Stops dashboard |
| POST | `/api/projects/:id/sprints` | `{ name, dueDate? }` | Runs `backlog milestone add`. 400 bad name or `dueDate` (`YYYY-MM-DD`) or duplicate name, 409 not initialized |
| POST | `/api/projects/:id/assign` | `{ taskId, sprintId }` | Runs `backlog task edit <taskId> -m <sprintId>`. Empty `sprintId` clears the sprint. 400 bad ids or unknown task, 404 unknown sprint, 409 not initialized |
| POST | `/api/projects/:id/protocol` | | Rewrites the AI Hub block in `AGENTS.md` / `CLAUDE.md` from the current template. 409 not initialized |

`summary` is `{ counts: { <status>: n }, total, inProgress: [{ id, title, priority }], unplanned: [{ id, title }], unplannedTotal, sprints: [{ id, title, done, total, due, completed }] }`, or `{ error }` when `backlog task list --json` fails. `unplanned` is non-Done tasks with no sprint, capped at 50; `unplannedTotal` is the full count. If `backlog milestone list` fails or its output does not match the counts it prints, `sprints` is `[]` and `sprintsError` holds the message. It is `null` for uninitialized projects.

`protocolStale` is true when `AGENTS.md` or `CLAUDE.md` exists but does not contain the current protocol block.

A sprint is a Backlog.md milestone (`backlog/milestones/m-N - <name>.md`). `completed` is true when every task in it is Done and it has at least one task. The server checks that `sprintId` exists before assigning because `backlog task edit -m` accepts unknown milestones without error.
