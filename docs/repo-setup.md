# Set up another repository

Use AI Hub for setup. It keeps Backlog.md and provider instruction files consistent.

Before agents claim work, install AI Hub's helper once on the workstation:

```bash
mkdir -p ~/.local/bin
ln -sfn /absolute/path/to/ai-hub/bin/backlog-phase.mjs ~/.local/bin/backlog-phase
backlog-phase --help
```

`backlog-phase claim` provides the local atomic claim lock. Do not replace it with raw `backlog task edit -a ... -s "In Progress"`; concurrent raw claims silently overwrite each other.

## New repository

1. Add the absolute repository path in AI Hub.
2. Enter a letters-only task prefix and press **Init Backlog**.
3. AI Hub runs `backlog init --defaults --agent-instructions agents,claude,gemini` and installs the shared protocol into:
   - `AGENTS.md` for OMP/Codex/GPT-compatible agents;
   - `CLAUDE.md` for Claude Code;
   - `GEMINI.md` for Gemini CLI.
4. Open the AI Hub board. Press **Enable Closed column** if this project uses cancelled work.
5. Create every executable ticket with one model tier: `dev-high`, `dev-medium`, `dev-low`, or `art`.
6. Commit the generated `backlog/`, `AGENTS.md`, `CLAUDE.md`, and `GEMINI.md` files with the repository.

## Existing Backlog.md repository

1. Add it to AI Hub. The card reports **Agent protocol ... out of date** when any provider file is absent or stale.
2. Press **Update**. AI Hub preserves content outside its managed markers and updates only the block between:

   ```text
   <!-- AI-HUB PROTOCOL START -->
   <!-- AI-HUB PROTOCOL END -->
   ```

3. If `GEMINI.md` is absent, AI Hub creates it. It copies only the Backlog.md-managed guideline block from an existing instruction file, then appends the shared AI Hub protocol; it does not copy repo-specific Codex or Claude prose.
4. Classify old open tasks. The AI Hub board shows a yellow `no model tier` chip and can set a tier from the ticket dropdown. CLI equivalent:

   ```bash
   backlog task edit TASK-1 --add-label dev-medium
   ```

5. Remove conflicting tier labels so each task has exactly one. To replace a tier:

   ```bash
   backlog task edit TASK-1 --remove-label dev-low --add-label dev-medium
   ```

## Provider session startup

The provider reads its normal instruction file, then follows the shared protocol.

| Provider | Instruction file | Queue command |
|---|---|---|
| Claude | `CLAUDE.md` | `backlog task list -s "To Do" -l dev-high --unassigned --plain` |
| GPT | `AGENTS.md` | `backlog task list -s "To Do" -l dev-medium --unassigned --plain` |
| Gemini | `GEMINI.md` | `backlog task list -s "To Do" -l art --unassigned --plain` |
| DeepSeek | `AGENTS.md` | `backlog task list -s "To Do" -l dev-low --unassigned --plain` |

GPT may also list `art`; Gemini should not claim dev tiers. Claude can accept an escalated dev task from any lower tier. DeepSeek should escalate rather than attempt medium/high-level work.

## Verify setup

Run from the repository root:

```bash
backlog config get statuses
backlog task list --json
backlog milestone list --show-completed --plain
```

Then check:

- all three instruction files exist;
- each open task has exactly one routing label;
- no queued task has a stale assignee;
- a model can claim, update notes, and change status through the CLI;
- `Closed` is present only when the project uses cancelled work.

## Updating the shared protocol later

Edit `templates/agent-protocol.md` in AI Hub once. Restart AI Hub, then press **Update** on each stale project card. Do not maintain separate hand-written routing tables in each repository.
