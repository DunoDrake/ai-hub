# Agent Guidance: Phase-Driven Roadmap Workflow

This project uses a **phase-driven roadmap** to structure work. Read this before starting a task.

## Understanding Phases

The project is divided into four sequential phases, each with a manual review gate:

| Phase | Goal | Timeline | Manual Gate |
|-------|------|----------|-------------|
| **0: Foundation** | Setup, architecture, core | Week 1–2 | Architecture review |
| **1: Features** | Develop main capabilities | Week 3–5 | Feature completeness review |
| **2: Polish** | Test, optimize, refine | Week 6–7 | Quality & UX review |
| **3: Release** | Final QA, docs, deploy | Week 8 | Release readiness review |

## Before You Start a Task

1. **Check current phase:**
   ```bash
   backlog milestone list
   ```
   Only tasks in the **active phase** should be in progress. Don't work on later phases until current phase is reviewed and approved.

2. **Verify phase status:**
   ```bash
   backlog task list --status "In Progress" --status "Done"
   ```
   If Phase N-1 is not fully done and reviewed, confirm with team lead before starting Phase N.

3. **Read the task ticket:**
   ```bash
   backlog task view <ID> --plain
   ```
   Pay attention to:
   - **Acceptance criteria:** Task is done when ALL are met
   - **Milestone:** Confirms which phase this ticket belongs to
   - **Notes:** Previous sessions may have left context

## During Task Work

1. **Update progress frequently:**
   ```bash
   backlog task edit <ID> --append-notes "Progress: implemented X, tested Y, next: Z"
   ```
   This helps the next session understand where you left off.

2. **Respect phase boundaries:**
   - Phase 0 tasks focus on **infrastructure**: don't add features yet
   - Phase 1 tasks focus on **features**: don't optimize for performance
   - Phase 2 tasks focus on **quality**: fix bugs, improve UX, optimize
   - Phase 3 tasks focus on **release**: docs, final testing, deployment setup

3. **If you hit a blocker:**
   ```bash
   backlog task edit <ID> --append-notes "BLOCKED: reason. Needs: X from person@email."
   ```
   Flag it in standup; don't force it into a later phase.

## Completing a Task

When acceptance criteria are met:

```bash
backlog task edit <ID> --check-ac          # Verify all criteria are met
backlog task edit <ID> --final-summary "..."  # Summary of work done
backlog task edit <ID> --status Done       # Close the ticket
```

Example summary:
```
Final summary: Implemented user authentication with JWT. Tests cover login, logout, token refresh, and edge cases (expired token, malformed JWT). All acceptance criteria met. Code reviewed by lead. Ready for Phase 1 integration testing.
```

## Phase Completion & Gate Review

When all tickets in a phase are "Done":

1. **Gather deliverables** (docs, code, test results)
2. **Fill out the completion checklist**: copy [`templates/phase-completion-checklist.md`](./phase-completion-checklist.md)
   into `backlog/phase-<N>-completion-checklist.md` and work through deliverables and gate questions
3. **Notify product owner** for review gate (schedule 30–60 min)
4. **Review checklist** is phase-specific (see [`docs/roadmap-guide.md`](../docs/roadmap-guide.md))
5. **Outcome:**
   - ✓ **Approved** → Run a [phase retrospective](./phase-retrospective.md), then proceed to next phase
   - ✗ **Changes requested** → Reopen and rework Phase N tickets

## Example: Phase 0 → Phase 1 Transition

**Phase 0 is done. Lead reviews:**
- ✓ Architecture documented and clear
- ✓ Core modules decoupled and tested
- ✓ CI/CD pipeline reliable
- ✓ Coding standards enforced

**Approved.** Now:
```bash
# Create Phase 1 tickets
backlog task create "P1-1 Login feature" -m "Phase 1: Features" --ac "Login form works" --ac "Auth validates"
backlog task create "P1-2 Dashboard feature" -m "Phase 1: Features" --ac "Dashboard renders" --ac "Data loads"
# ... more Phase 1 tickets

# Start work on Phase 1
backlog task edit APP-4 --status "In Progress"
```

## Troubleshooting

**Q: Can I start Phase 1 while Phase 0 is still in progress?**  
A: No. Phase gates are intentional checkpoints. Work Phase 0 to completion, get review, then start Phase 1. If it's blocked, escalate.

**Q: A Phase 1 task reveals we need to rework Phase 0 architecture?**  
A: That's what the review gate is for. Rework Phase 0, re-review, then proceed with reworked Phase 1 approach.

**Q: Can I split a large task across phases?**  
A: No. Each task should fit in one phase. If a task is too large, split it into smaller tickets **within the same phase**.

**Q: What if we discover a bug in Phase 2 that's in Phase 0 code?**  
A: Fix it. Don't backport it to Phase 0; apply the fix in Phase 2 and update notes explaining the fix. Phase 0 code is "done"; Phase 2 "quality" phase ensures such issues are caught.

---

## References

- **Quick start:** [`docs/roadmap-quickstart.md`](../roadmap-quickstart.md) (setup in 5 min)
- **Full guide:** [`docs/roadmap-guide.md`](../roadmap-guide.md) (phase details, gates, tips)
- **Roadmap diagram:** [`roadmap-diagram.html`](../roadmap-diagram.html) (visual workflow)
- **Backlog.md CLI:** `backlog --help` for all commands

---

**Questions?** Reach out to your tech lead or product owner at the start of each phase.
