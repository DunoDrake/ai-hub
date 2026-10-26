## Task protocol (AI Hub)

Applies on top of the Backlog.md workflow above. Never edit `backlog/` markdown by hand; use the `backlog` CLI.

1. **Resume first.** At session start run `backlog task list --status "In Progress" --plain`. If a task is in progress, read it with `backlog task view <id> --plain` (plan, notes, acceptance criteria) and continue it before starting anything new.
2. **One task per session.** Pick a single task. Split it if it will not fit in one context window.
3. **Plan before code.** Write the plan with `backlog task edit <id> --plan "..."` and wait for the user to approve it.
4. **Leave breadcrumbs.** After each milestone run `backlog task edit <id> --append-notes "what changed, what is next, blockers"`. The next session resumes from these notes.
5. **Finish cleanly.** Check acceptance criteria with `--check-ac`, write `--final-summary`, then set status to Done.
6. **Report.** When the user asks for a report, summarize from `backlog task list --plain` and each task's notes and final summary; do not invent progress.
