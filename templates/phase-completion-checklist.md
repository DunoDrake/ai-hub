# Phase Completion Checklist: {{PHASE_NAME}}

Use this checklist at the end of a phase, before the manual review gate described in your
project's roadmap guide (`docs/roadmap-guide.md`). Copy it into `backlog/` (e.g.
`backlog/phase-0-completion-checklist.md`) and fill it in as the phase wraps up — don't
leave it as an afterthought during the gate meeting itself.

```bash
cp templates/phase-completion-checklist.md "backlog/phase-${PHASE_NUMBER}-completion-checklist.md"
```

**Phase:** {{PHASE_NAME}} (e.g. "Phase 0: Foundation")
**Milestone:** `backlog milestone view "{{PHASE_NAME}}"`
**Date prepared:** {{DATE}}
**Prepared by:** {{NAME}}

---

## 1. Ticket status

- [ ] All tickets in this milestone are `Done`: `backlog task list -m "{{PHASE_NAME}}" --status "Done"`
- [ ] No tickets remain `To Do` or `In Progress` in this milestone
- [ ] Any descoped or deferred tickets are explicitly noted below, with the reason and the phase they moved to

Deferred tickets (if any):

| Ticket | Reason deferred | Moved to phase |
|---|---|---|
| | | |

## 2. Deliverables

Check off what this phase actually produced. Use the phase's "Definition of Done" in your
project's `docs/roadmap-guide.md` as the source of truth; the table below is a quick
reference, not a replacement.

| Phase | Typical deliverables |
|---|---|
| 0: Foundation | Architecture doc, decoupled core modules, working CI/CD, baseline code quality metrics |
| 1: Features | Features implemented against acceptance criteria, integration tests passing, API contracts documented |
| 2: Polish | Performance benchmarks met, accessibility checks passed, test coverage target met, docs updated |
| 3: Release | Security review complete, deployment procedure tested, rollback plan verified, release notes finalized |

Deliverables for **this** phase:

- [ ] Documentation updated (architecture doc / API docs / user guides / changelog — whichever applies)
- [ ] Tests passing (unit, integration, and/or end-to-end as applicable to this phase)
- [ ] Test coverage meets the phase's target, or gaps are explicitly accepted below
- [ ] Code review complete and sign-off recorded for every ticket (not just merged — reviewed)
- [ ] No known critical or high-severity bugs open against this phase's tickets
- [ ] Phase-specific deliverable: ____________________
- [ ] Phase-specific deliverable: ____________________

Accepted gaps (coverage, deferred bugs, etc.), with owner and follow-up plan:

| Gap | Owner | Follow-up / target phase |
|---|---|---|
| | | |

## 3. Gate review questions

Answer these in the review meeting. "No" or "unsure" on any question should block approval
until resolved or explicitly accepted as a tracked risk.

- [ ] **Architecture sound?** Does the current design support the next phase's planned work without
      rework? Any known debt — is it written down and assigned?
- [ ] **Quality met?** Do tests, coverage, and manual QA give confidence this phase's work is correct?
- [ ] **Scope met?** Does delivered work match the phase's acceptance criteria and Definition of Done,
      not a reduced version of it?
- [ ] **Blockers?** Are there any open blockers, external dependencies, or unresolved questions that
      would affect the next phase?
- [ ] **Regressions?** Did this phase break anything from a prior phase? If so, is it fixed or tracked?
- [ ] **Ready for next phase?** Can the next phase's tickets be created and started immediately, or do
      they depend on something still missing here?

Notes / discussion:

```
(free-form notes from the review meeting go here)
```

## 4. Decision

- [ ] **Approved** — proceed to the next phase
- [ ] **Changes requested** — reopen the listed tickets, rework, and re-review before proceeding

If changes requested, list exactly what must change and which tickets reopen:

| Ticket | Required change |
|---|---|
| | |

## 5. Approval

- [ ] I have reviewed the deliverables and gate questions above and approve this phase as complete.

**Reviewer name:** ______________________
**Role:** ______________________
**Date:** ______________________
**Signature / approval record:** ______________________

---

Once approved, consider running a [phase retrospective](./phase-retrospective.md) before starting the
next phase's tickets.
