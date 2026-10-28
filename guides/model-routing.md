# Model routing for adopting projects

A label describes the work; the assignee identifies the provider actually doing it.
Exactly one routing label is required per executable task.

| Label | Default providers | Scope |
|---|---|---|
| `dev-high` | Claude | Architecture, ambiguity, high-risk integration, difficult debugging |
| `dev-medium` | GPT or Claude | Bounded multi-file implementation and established refactors |
| `dev-low` | DeepSeek or Claude | Mechanical, repetitive, straightforward changes |
| `art` | Gemini or GPT | Visual direction, UI composition, styling, image/video work |

These are project routing defaults, not a claim that another model is incapable.
Specific model/reasoning selection is an operator decision. If only GPT is available
for dev-high, the operator can explicitly authorize that one task without downgrading it.

## Resume, select, claim

```bash
backlog task list -a @gpt --plain
backlog-phase next --provider gpt --path .
backlog task view APP-12 --plain
backlog-phase claim APP-12 --provider gpt --path .
```

Resume assigned In Progress work first. `next` selects a dependency-ready, unassigned
To Do task within default routing, ordered by priority then ordinal.
`claim` validates under a local exclusive lock, writes through Backlog CLI, and verifies
the result. Do not replace it with a raw assignee/status edit.

Only after explicit operator authorization:

```bash
backlog-phase claim APP-12 --provider gpt --path . \
  --routing-override "Operator authorized GPT for APP-12; reason and review plan..."
```

The exception is recorded in notes; the task remains dev-high and assigned to @gpt.
The helper cannot authenticate operator consent. Never invent this authorization.

## Execution and review

Write the plan, obtain approval, implement, verify, and leave milestone breadcrumbs.
Use [the guarded workflow](workflow.md) for status transitions.

AI review means an actual separate reviewer session. Defaults: Claude reviews
dev-high/dev-medium; Gemini and GPT peer-review art. A user may explicitly select
another qualified reviewer, or perform manual review. Automated tests alone are
not an independent review. Even low-risk tasks use Review before Done on six-state repos.

If scope exceeds the tier, record why, replace the tier with the correct one,
clear ownership and return to To Do. For Review/resolved tickets use the guarded
reopen command first. Never relabel solely to evade routing restrictions.

## Handoff-safe checklist

Record task ID, actual provider, baseline commit, dirty paths to preserve, checkpoint,
plan, changed files, test commands/results, unresolved risks and next exact step.
Never claim approval, publication or completion without evidence.
