# HTTP API

Local only. Requests need `Host: 127.0.0.1:<port>` or `localhost:<port>`. Non-GET requests also need a matching `Origin` header; otherwise `403`.

| Method | Path | Body | Result |
|---|---|---|---|
| GET | `/api/projects` | | `{ projects: [{ id, name, path, port, exists, initialized, isGit, running, url, summary }] }` |
| POST | `/api/projects` | `{ path, name? }` | `{ project }`. 400 non-absolute or missing path, 409 duplicate |
| DELETE | `/api/projects/:id` | | Stops dashboard, removes registry entry only |
| POST | `/api/projects/:id/init` | `{ prefix }` | Runs `backlog init`, applies agent protocol. 400 bad prefix, 409 already initialized |
| POST | `/api/projects/:id/start` | | Starts dashboard. 409 if not initialized |
| POST | `/api/projects/:id/stop` | | Stops dashboard |

`summary` is `{ counts: { <status>: n }, total, inProgress: [{ id, title, priority }] }`, or `{ error }` when `backlog task list --json` fails. It is `null` for uninitialized projects.
