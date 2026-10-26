# Operations

## Environment

| Variable | Default | Purpose |
|---|---|---|
| `PORT` | `4880` | Manager port, bound to 127.0.0.1 |
| `AI_HUB_DATA_DIR` | `~/.config/ai-hub` | Registry and dashboard logs |
| `BACKLOG_BIN` | `backlog` | Backlog.md CLI path |
| `AI_HUB_DASH_FROM` / `AI_HUB_DASH_TO` | `6500` / `6599` | Dashboard port range |

## macOS LaunchAgent

`~/Library/LaunchAgents/com.hue.ai-hub.plist` uses an absolute Node path and `PATH` that contains the directory holding `backlog` (launchd has no shell profile). Pattern is identical to `com.hue.ai-live`.

```bash
launchctl bootstrap gui/$(id -u) ~/Library/LaunchAgents/com.hue.ai-hub.plist
launchctl print gui/$(id -u)/com.hue.ai-hub
launchctl kickstart -k gui/$(id -u)/com.hue.ai-hub
launchctl bootout gui/$(id -u)/com.hue.ai-hub
```

Log: `/tmp/ai-hub-4880.log`.

## Behavior to know

- Dashboards are child processes of the manager. Stopping or restarting the manager (SIGTERM/SIGINT) stops them; start them again from the UI. A SIGKILL of the manager can leave an orphan dashboard; the next **Start** reuses it if the port still belongs to a `backlog` process.
- Each project keeps the same dashboard port in the registry. If another process holds it, **Start** reallocates a free port from the range.
- Projects are initialized with `--include-remote false` so `backlog` never waits on the network. Repos without `.git` use `--no-git`.
- The summary on each card comes from `backlog task list --json` and `backlog milestone list --show-completed --plain`, cached 4 seconds. The sprint list is parsed from the plain text output (tested with 1.55.3). `parseSprints` checks the parsed rows against the counts the CLI prints; on mismatch the card shows a red "Unrecognized `backlog milestone list` output" line and the sprint list is empty. That means the format changed and `parseSprints` in `server.mjs` needs updating.

## Troubleshooting

| Symptom | Check |
|---|---|
| Start fails with "Dashboard did not start" | `~/.config/ai-hub/logs/<id>.log` |
| Card shows a red error line | Run `backlog task list --json` in that repo |
| "Missing" badge | Directory moved or deleted; Remove and re-add |
| `backlog` not found under launchd | Add its directory to `PATH` in the plist |
| "Unrecognized `backlog milestone list` output" | Backlog.md upgrade changed the text format; fix `parseSprints` |
| "Agent protocol ... out of date" | Press **Update** on the card, or `POST /api/projects/:id/protocol` |
