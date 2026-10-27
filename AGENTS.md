
<!-- BACKLOG.MD GUIDELINES START -->
<!-- backlog.md-instructions-version: 1.55.3 -->
<CRITICAL_INSTRUCTION>

## Backlog.md Workflow

This project uses Backlog.md for task and project management.

**At the beginning of each conversation in this project, run `backlog instructions overview` before answering or taking action. Re-read it only if you have not read it yet in the current conversation.**

Use the overview to decide whether to search, read, create, or update Backlog tasks.

Before task lifecycle actions, read the matching detailed guide:
- `backlog instructions task-creation` before creating or splitting tasks
- `backlog instructions task-execution` before planning, changing status or assignee, adding a plan or implementation notes, or implementing task work
- `backlog instructions task-finalization` before checking acceptance criteria, writing final summaries, or moving tasks to terminal statuses

Use `backlog <command> --help` before running unfamiliar commands. Help shows options, fields, and examples.

Do not edit Backlog task, draft, document, decision, or milestone markdown files directly. Use the `backlog` CLI so metadata, relationships, and history stay consistent.

</CRITICAL_INSTRUCTION>
<!-- BACKLOG.MD GUIDELINES END -->

<!-- AI-HUB PROTOCOL START -->
## Task protocol (AI Hub)

Applies on top of the Backlog.md workflow above. Never edit `backlog/` task, milestone, decision, or document Markdown by hand; use the `backlog` CLI.

### Model routing contract

Every executable task must have exactly one routing label. The label describes the work; the assignee records which provider actually claimed it.

| Label | Primary model | Scope |
|---|---|---|
| `dev-high` | Claude | Architecture, ambiguous requirements, cross-system or high-risk changes, difficult debugging, final integration decisions |
| `dev-medium` | GPT | Normal feature work, bounded multi-file implementation, refactors with established patterns, integration work |
| `dev-low` | DeepSeek | Mechanical edits, config/data updates, straightforward single-file changes, repetitive migrations |
| `art` | Gemini or GPT | Visual direction, UI composition, assets, animation, styling, image/video prompts; GPT may also implement medium-complexity UI code |

Provider assignee handles are `@claude`, `@gpt`, `@gemini`, and `@deepseek`. Do not infer a provider from the task title when a routing label exists.

### Execution workflow

1. **Resume your work first.** At session start, list tasks assigned to your provider with `backlog task list -a @<provider> --plain`. Resume any assigned In Progress task before claiming another.
2. **Choose one compatible ready task.** Run `backlog-phase next --provider <provider> --path .`. It returns one To Do task that is unassigned, dependency-ready, and within the provider's routing boundary, ordered by priority then ordinal. Read it with `backlog task view <id> --plain`.
3. **Claim atomically.** Run `backlog-phase claim <id> --provider <provider> --path .`. Never claim with raw `backlog task edit`: concurrent raw claims both report success and the last writer silently wins. If `backlog-phase` is missing, stop and ask the operator to install AI Hub's `bin/backlog-phase.mjs` on `PATH`; do not bypass the claim lock.
4. **Respect routing boundaries.** Claude may take `dev-high`, `dev-medium`, or `dev-low`. GPT may take `dev-medium` or `art`. Gemini takes `art`. DeepSeek takes `dev-low`. Never silently work outside those boundaries.
5. **Escalate instead of stretching.** If the task exceeds the assigned tier, append a concrete note, replace the routing label with the next correct tier, clear the assignee, and return it to To Do. Example: `backlog task edit <id> --remove-label dev-low --add-label dev-medium -a "" -s "To Do" --append-notes "Escalated: <reason>"`.
6. **One task per session.** Split it if it will not fit in one context window. Every split task must receive its own routing label.
7. **Plan before code.** Write the plan with `backlog task edit <id> --plan "..."` and wait for the user to approve it.
8. **Leave breadcrumbs.** After each milestone run `backlog task edit <id> --append-notes "what changed, what is next, blockers"`.
9. **Finish cleanly.** Check acceptance criteria with `--check-ac`, write `--final-summary`, then set status to Done. If the project has a Closed status, use it only for abandoned or intentionally cancelled work and record why in the final summary.
10. **Review higher-risk work.** After implementation, add `needs-review`, clear the assignee, and leave the task In Progress. `dev-high` requires another Claude session; GPT may review bounded implementation details but cannot approve architecture. Claude reviews `dev-medium`. `art` is reviewed by the peer art provider (Gemini reviews GPT; GPT reviews Gemini). The reviewer records evidence in notes, removes `needs-review`, and marks Done. `dev-low` may finish directly when verification passes.
11. **Sprints.** A sprint is a Backlog.md milestone. List it with `backlog task list -m "<sprint>" --plain`; create or move tasks with `-m "<sprint>"`. Do not create sprints unless the user asks.
12. **Report from evidence.** Summarize from task status, notes, and final summary; do not invent progress.

### Intake rule

If a task has no routing label, do not implement it. Classify it first, add exactly one of `dev-high`, `dev-medium`, `dev-low`, or `art`, then follow the workflow. If classification is genuinely ambiguous between materially different outcomes, ask the user; otherwise choose the narrowest sufficient tier.
<!-- AI-HUB PROTOCOL END -->
