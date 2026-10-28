# AI Hub architecture

AI Hub is a loopback-only dashboard over Backlog.md, not a hosted ticket database
or an AI inference service. Task data stays in each project repository.

```text
index.html (project cards, board, review dialog)
    │ local HTTP; writes require matching Origin
    ▼
server.mjs ─── registry / child dashboards / summaries / metrics
    │
    ├── lib/workflow.mjs ◄── bin/backlog-phase.mjs
    │       │ shared validation + local per-ticket lock
    │       ▼
    └── Backlog CLI ───► project backlog/ (tasks, notes, milestones)

templates/agent-protocol.md ─► managed blocks in provider instruction files
```

## Ownership

| Component | Responsibility |
|---|---|
| `index.html` | Responsive board, six-state menus/forms, evidence display, delivery roadmap |
| `server.mjs` | Loopback API, project registry, CLI orchestration, dependency enrichment and counters |
| `lib/workflow.mjs` | Transition validation, resolution predicates, audit record, locks, config migration |
| `bin/backlog-phase.mjs` | Selection/atomic claims, guarded moves, workflow setup and phase gates |
| `templates/agent-protocol.md` | Source of managed provider instructions |
| `guides/` | Adoption contract for other projects |

## State and evidence

```text
To Do → In Progress → Review ── approval + checked AC/DoD ──► Done ──► Closed
          │             │                                         resolution:done
          └── reason ───┴───────────────────────────────► Wontfix ─► Closed
                                                                  resolution:wontfix
Review / resolved ── reason ──► To Do or In Progress (reopen)
```

Review records mode (AI/manual), reviewer and evidence. Approval is a real action by
that reviewer, not inferred from test success. Closure preserves resolution labels;
reopening clears the current labels while preserving historical notes. UI and CLI
use the same guards. Full command contract: [workflow guide](../guides/workflow.md).

## Read model

Task lists provide counters and routing. Relevant task details enrich review history,
resolution diagnostics and dependency readiness with bounded concurrent CLI reads.
Summary/detail caches use a four-second TTL and move operations invalidate them.
Delivered totals exclude declined/unknown Closed. A resolved phase may have less
than 100% delivery because scope was explicitly declined. Gate review must accept that.
Recent delivered items sort by latest update, not a dedicated completion timestamp.

## Compatibility and trust boundary

New project init installs the six-state workflow. Existing projects are opt-in:
migration backs up config, preserves custom statuses and does not rewrite tasks.
Legacy Closed is not guessed into a resolution. Native Backlog readiness knows only
Done; AI Hub additionally permits Closed with resolution:done.

The workflow is for trusted local users. Reviewer strings are not authentication.
Local locks coordinate helper/API clients sharing the same data directory, not raw
CLI writes or Git edits across machines. No automatic AI review is performed.
Config migration supports inline status arrays and fails closed on unsupported YAML.

## Verification

Run `node --test tests/*.test.mjs` with Backlog installed. Tests use temporary repos
and a separate registry; never use production tasks as destructive test fixtures.
Inspect desktop/mobile review forms and keyboard cancellation after UI changes.
See [session handoff](SESSION_HANDOFF.md) for the current checkpoint and QA evidence.
