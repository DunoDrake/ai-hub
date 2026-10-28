# Agent guidance: delivery phases

Use this optional template only when the project has chosen phase gates.
Read the managed AI Hub protocol and the project's own roadmap first.

1. Resume your assigned work; inspect the current phase and gate.
2. Select and atomically claim one compatible task using `backlog-phase next/claim`.
3. Record the plan and wait for approval. Preserve unrelated edits and checkpoint
   before cross-file or workflow changes.
4. Implement against acceptance criteria; record concrete test results and risks.
5. Hand off to Review with AI/manual mode, reviewer identity and evidence.
6. Only the actual reviewer approves Done. Wontfix needs a reason. Closed follows
   Done/Wontfix and retains the outcome. Reopen with a reason if rework is needed.

```bash
backlog task edit APP-1 --append-notes "Implemented X; tested Y; next Z"
backlog-phase move APP-1 --status Review --mode manual --reviewer Hue \
  --notes "Evidence and requested review scope" --path .
```

For phase completion, use [the checklist](phase-completion-checklist.md), gather
deliverables and obtain the owner's gate decision. Keep a retrospective in project
docs, or create/edit a Backlog document using its CLI. Never write Backlog Markdown
by hand. A declined ticket is resolved scope, not delivered functionality.

- [Workflow](../guides/workflow.md)
- [Quickstart](../guides/roadmap-quickstart.md)
- [Full roadmap guide](../guides/roadmap-guide.md)
