# Set up a project with AI Hub

These are instructions for repositories adopting AI Hub. AI Hub's own architecture,
API and service operations live in [docs/](../docs/README.md).

## Prerequisites

Use a Node runtime that supports ES modules and the installed Backlog.md CLI.
This workflow is tested with Node 24 and Backlog.md 1.55.3. Run `node --version`
and `backlog --version` before diagnosing compatibility.

Install the helper on PATH by symlinking the file in the AI Hub checkout (do not
copy only the script: it imports `../lib/workflow.mjs`):

```bash
mkdir -p ~/.local/bin
ln -s /absolute/path/to/ai-hub/bin/backlog-phase.mjs ~/.local/bin/backlog-phase
backlog-phase --help
```

If a helper already exists, inspect its destination before replacing it.

## New repository

1. Add its absolute directory path in AI Hub.
2. Choose a letters-only prefix and press **Init Backlog**.
3. AI Hub initializes Backlog, enables all six workflow states, then installs
   the shared protocol into `AGENTS.md`, `CLAUDE.md` and `GEMINI.md`.
4. Create tickets with exactly one routing label and measurable acceptance criteria.
5. Commit the generated config, tasks and instruction files with your project.

CLI-only setup:

```bash
backlog init --defaults --task-prefix APP --include-remote false --agent-instructions agents,claude,gemini
backlog-phase workflow --path .
backlog task create "First feature" -l dev-medium --ac "Expected behavior verified"
```

Add the repo to AI Hub and press **Update** to install the managed AI Hub protocol.
The CLI workflow command changes statuses only; it does not install instructions.

## Existing repository: opt-in migration

1. Save a checkpoint of config, task data and instruction files.
2. Add the repo to AI Hub. Merely adding/opening it does not migrate statuses.
3. Preview: `backlog-phase workflow --path . --dry-run`.
4. Press **Enable review workflow** on its board, or run
   `backlog-phase workflow --path .` and then **Update** on its project card.
5. Verify the config and instruction diff. The board action also updates the protocol.

Migration creates a sibling `config.yml.ai-hub-<timestamp>.bak`, retains unrelated
config keys, preserves custom status names and puts Closed last. It is idempotent.
Only inline YAML status arrays are supported; unsupported forms fail without changes.
No existing task is relabeled or moved. Old Done tickets remain delivered. Old Closed
tickets without a resolution stay unknown, never silently delivered.

For an old Closed ticket, inspect history, reopen with a reason, then reclassify:
Review → Done → Closed for verified delivery, or Wontfix with a reason → Closed.
Do not infer delivery merely from a task title.

Recovery: compare the backup with the current config before restoring. Once tickets use
new statuses, do not restore a three-state config over them; reconcile those tickets first.
Instruction updates preserve text outside the AI-HUB markers. Review the Git diff.
Stale locks require checking the recorded PID and unfinished operation before removal.

## Verify setup

```bash
backlog config get statuses
backlog task list --json
backlog-phase next --provider gpt --path .
```

Check all three instruction files, one tier per executable task, correct assignees,
and a real review/closure cycle on a disposable fixture. Review mode is a recorded
workflow choice, not an automatic model invocation.

## Choose delivery planning

Use `Phase N - <name>` milestones for staged delivery and phase gates.
Use other milestone names for ordinary feature sprints or maintenance.
Do not create a phase roadmap unless the project needs it.

Continue with [workflow](workflow.md), [model routing](model-routing.md), and
[roadmap quickstart](roadmap-quickstart.md).
