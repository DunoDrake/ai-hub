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
2. **Claim one compatible task.** List the required routing label in To Do, for example `backlog task list -s "To Do" -l dev-low --unassigned --plain`. Read it with `backlog task view <id> --plain`, then claim it using `backlog task edit <id> -a @<provider> -s "In Progress"`.
3. **Respect routing boundaries.** Claude may take any dev tier when needed. GPT may take `dev-medium` and `art`. Gemini takes `art`. DeepSeek takes `dev-low`. Never silently work outside those boundaries.
4. **Escalate instead of stretching.** If the task exceeds the assigned tier, append a concrete note, replace the routing label with the next correct tier, clear the assignee, and return it to To Do. Example: `backlog task edit <id> --remove-label dev-low --add-label dev-medium -a "" -s "To Do" --append-notes "Escalated: <reason>"`.
5. **One task per session.** Split it if it will not fit in one context window. Every split task must receive its own routing label.
6. **Plan before code.** Write the plan with `backlog task edit <id> --plan "..."` and wait for the user to approve it.
7. **Leave breadcrumbs.** After each milestone run `backlog task edit <id> --append-notes "what changed, what is next, blockers"`.
8. **Finish cleanly.** Check acceptance criteria with `--check-ac`, write `--final-summary`, then set status to Done. If the project has a Closed status, use it only for abandoned or intentionally cancelled work and record why in the final summary.
9. **Review higher-risk work.** After implementation, add `needs-review`, clear the assignee, and leave the task In Progress. `dev-high` requires another Claude session; GPT may review bounded implementation details but cannot approve architecture. Claude reviews `dev-medium`. `art` is reviewed by the peer art provider (Gemini reviews GPT; GPT reviews Gemini). The reviewer records evidence in notes, removes `needs-review`, and marks Done. `dev-low` may finish directly when verification passes.
10. **Sprints.** A sprint is a Backlog.md milestone. List it with `backlog task list -m "<sprint>" --plain`; create or move tasks with `-m "<sprint>"`. Do not create sprints unless the user asks.
11. **Report from evidence.** Summarize from task status, notes, and final summary; do not invent progress.

### Intake rule

If a task has no routing label, do not implement it. Classify it first, add exactly one of `dev-high`, `dev-medium`, `dev-low`, or `art`, then follow the workflow. If classification is genuinely ambiguous between materially different outcomes, ask the user; otherwise choose the narrowest sufficient tier.
