# Delivery roadmap quickstart

First complete [repository setup](repo-setup.md). A roadmap is optional: it describes
delivery stages and outcomes, while a feature backlog lists individual capabilities.

## Create only the phases you need

```bash
backlog milestone add "Phase 0 - Foundation"
backlog task create "Verify build" -m "Phase 0 - Foundation" \
  -l dev-medium --ac "Clean build passes"
```

Use `Phase N - <name>` (or `Phase N: <name>`) for roadmap phases.
Ordinary sprint names remain board filters, not roadmap phases.
The optional four-phase template is described in [the full guide](roadmap-guide.md).
Do not create milestones on someone else's behalf without their request.

## Execute and review

```bash
backlog-phase next --provider gpt --path .
backlog-phase claim APP-1 --provider gpt --path .
backlog task edit APP-1 --plan "Implement, verify, hand off for review"
# Obtain approval, implement and run the checks.
backlog task edit APP-1 --append-notes "Changes, test results, remaining risks"
backlog-phase move APP-1 --status Review --mode manual --reviewer Hue \
  --notes "Build passed; please inspect the diff and recorded evidence" --path .
```

The reviewer follows [workflow.md](workflow.md) to approve Done, request changes,
or record Wontfix. Closed ends a resolved ticket and retains its result.

## Phase gate

```bash
backlog-phase status 0 --path . --json
backlog-phase gate 0 --path .
# Only after actual review and acceptance of any descoped items:
backlog-phase gate 0 --approve --reviewer Hue --notes "Actual gate decision" --path .
# Preview next phase; run without dry-run only if authorized:
backlog-phase advance 0 --dry-run --path .
```

A gate needs a nonempty resolved phase, resolution evidence for Wontfix/Closed,
no pending review, checked delivery AC, and existing referenced docs.
Wontfix resolves scope but never inflates delivered totals or satisfies dependencies.
Explicitly accept descoped work at the gate; 100% resolved is not 100% delivered.

Project cards show up to three recent delivered tickets (the API returns up to five),
ordered by latest task update rather than a historical completion timestamp.
Metrics distinguish delivered, resolved, Wontfix and unknown legacy Closed.

See [the full guide](roadmap-guide.md), [routing](model-routing.md), and
[AI Hub operations](../docs/operations.md).
