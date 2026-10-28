# Ticket workflow

Enable this workflow per project using [setup and migration](repo-setup.md).

| Status | Meaning | Required evidence |
|---|---|---|
| To Do | Queued work | One routing label and clear AC |
| In Progress | Owned implementation | Approved plan and progress notes |
| Review | Waiting for AI or manual review | Mode, reviewer, handoff/evidence |
| Done | Accepted delivery | Actual review approval; every AC/DoD checked |
| Wontfix | Intentionally not implementing | Nonempty reason |
| Closed | Ticket lifecycle ended | Previous Done or Wontfix resolution retained |

Normal flow: To Do → In Progress → Review → Done → Closed.
Alternative: unresolved work → Wontfix → Closed.
Review/resolved work can reopen to To Do or In Progress with a reason.

## Board

Use the Move menu or drag a card. Review/Done opens a dialog for AI/manual mode,
reviewer and evidence. Wontfix opens a reason form. Cancel makes no write.
Ticket details show the latest decision; earlier audit notes remain in Backlog.
Desktop scrolls across columns; mobile uses a status tab per column.

AI review is a recorded review route, **not an automatic model call**. A separate
AI session must actually inspect the work. Manual review means the named user has
reviewed it. Neither selecting a mode nor passing tests constitutes approval.
Reviewer names are local metadata, not authenticated identities or signatures.

## CLI: handoff and approval

```bash
backlog-phase move APP-12 --status Review --mode ai --reviewer @claude \
  --notes "Implementation and verification evidence; review requested" --path .
```

Or use `--mode manual --reviewer Hue`. After the real review, the reviewer records
each satisfied criterion (repeat `--check-ac <number>` / `--check-dod <number>`):

```bash
backlog task edit APP-12 --check-ac 1 --check-ac 2
backlog-phase move APP-12 --status Done --mode manual --reviewer Hue \
  --notes "Actual approval, checks performed, accepted limitations" --path .
backlog-phase move APP-12 --status Closed --path .
```

Done requires at least one AC, all AC checked and no unchecked DoD. Approval writes
the review evidence as the final summary; preserve the implementation handoff in notes.
Use `--expected-status Review` to reject a stale dialog or automation request.
`--dry-run` validates and prints the intended CLI arguments without writing the task.

## Wontfix and rework

```bash
backlog-phase move APP-13 --status Wontfix --notes "Superseded by APP-20; no longer needed" --path .
backlog-phase move APP-13 --status Closed --path .
backlog-phase move APP-12 --status "In Progress" --notes "Review found a regression; reproduce and fix" --path .
```

Reopening clears resolution/review labels, not audit history. To Do also clears the
assignee; In Progress retains it, so assign the actual implementation owner explicitly
when handing rework back from a reviewer. To change a resolved outcome, reopen first.

## Accounting and dependencies

- Delivered: Done, or Closed with `resolution:done`.
- Declined: Wontfix, or Closed with `resolution:wontfix`.
- Resolved: Done, Wontfix and Closed. Resolved does not mean delivered.
- Legacy Closed without a resolution: counted separately as unknown; never delivered.
- A dependency is satisfied only by delivered work. Wontfix, unknown Closed,
  missing dependencies and unresolved dependencies remain blocking.

Backlog.md 1.55.3 natively treats only Done as a satisfied dependency. AI Hub's board
and `backlog-phase next/claim` additionally recognize explicitly delivered Closed.
The native Backlog dashboard/readiness can therefore differ. Use the AI Hub helper
for selection, claims and lifecycle transitions. Do not silently remove a dependency
because its prerequisite was declined; a human must reconsider the dependency/scope.

## Persistence and boundaries

The HTTP API and helper share `lib/workflow.mjs`. Each transition makes one Backlog
CLI edit under a local exclusive lock, storing status, reserved labels and a versioned
`AI-HUB-WORKFLOW` JSON line in implementation notes. Reserved labels are `needs-review`,
`review:ai`, `review:manual`, `review:approved`, `resolution:done`, `resolution:wontfix`.
Do not hand-edit them to simulate review. Other labels are preserved.

Locks coordinate AI Hub clients on the same workstation/data directory. Raw Backlog
edits, Git merges and other machines can bypass them; this is a trusted local workflow,
not an authorization service. The API validates transitions but does not authenticate
reviewers. Verify suspicious legacy records before reporting progress.
