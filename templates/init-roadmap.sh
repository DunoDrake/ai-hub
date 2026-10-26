#!/bin/bash
# Phase-Driven Roadmap Initialization Script
# 
# Usage: ./scripts/init-roadmap.sh [--with-retrospective]
#        (Run from project root after backlog init)
#
# Creates four phase milestones for the phase-driven workflow:
# - Phase 0: Foundation
# - Phase 1: Features  
# - Phase 2: Polish
# - Phase 3: Release
#
# Flags:
#   --with-retrospective   Also drop the phase completion checklist and phase
#                         retrospective templates into backlog/ for reuse at
#                         every phase gate (see docs/roadmap-guide.md).
#
# See: https://github.com/YOUR_REPO/docs/roadmap-guide.md

set -e

WITH_RETROSPECTIVE=false
for arg in "$@"; do
  case "$arg" in
    --with-retrospective) WITH_RETROSPECTIVE=true ;;
    *)
      echo "Unknown option: $arg" >&2
      echo "Usage: $0 [--with-retrospective]" >&2
      exit 1
      ;;
  esac
done

echo "🚀 Initializing phase-driven roadmap..."
echo ""

# Create phase milestones
echo "Creating milestones..."

backlog milestone add "Phase 0: Foundation" \
  --description "Repository setup, architecture, core infrastructure"

echo "  ✓ Phase 0: Foundation"

backlog milestone add "Phase 1: Features" \
  --description "Develop and integrate main capabilities"

echo "  ✓ Phase 1: Features"

backlog milestone add "Phase 2: Polish" \
  --description "Optimize, test, refine UX and user experience"

echo "  ✓ Phase 2: Polish"

backlog milestone add "Phase 3: Release" \
  --description "Final QA, documentation, production readiness"

echo "  ✓ Phase 3: Release"

echo ""
echo "✓ Roadmap initialized successfully!"
echo ""

if [ "$WITH_RETROSPECTIVE" = true ]; then
  echo "Adding phase completion checklist and retrospective templates..."
  mkdir -p backlog

  cat > backlog/phase-completion-checklist.md <<'TEMPLATE_EOF'
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
TEMPLATE_EOF

  cat > backlog/phase-retrospective.md <<'TEMPLATE_EOF'
# Phase Retrospective: {{PHASE_NAME}}

Run this after the [phase completion checklist](./phase-completion-checklist.md) is approved, and
before the next phase's tickets are created. Copy it into `backlog/` so it's versioned with the
project history:

```bash
cp templates/phase-retrospective.md "backlog/phase-${PHASE_NUMBER}-retrospective.md"
```

**Phase:** {{PHASE_NAME}}
**Dates:** {{PHASE_START_DATE}} – {{PHASE_END_DATE}}
**Participants:** {{NAMES}}
**Facilitated by:** {{NAME}}

---

## 1. What went well

List what worked — practices, decisions, tools, or collaboration patterns worth repeating in the
next phase.

- ______________________
- ______________________
- ______________________

## 2. What was hard

List friction points — blockers, unclear requirements, tooling gaps, underestimated work, or
coordination problems. Be specific enough that the next phase can act on it, not just vent.

- ______________________
- ______________________
- ______________________

## 3. What to improve for next phase

Concrete, actionable changes for the next phase. Each item should be small enough to actually do,
and ideally owned by someone.

| Improvement | Owner | How we'll know it worked |
|---|---|---|
| | | |
| | | |

## 4. Velocity

Pull these numbers from Backlog.md rather than estimating from memory:

```bash
backlog task list -m "{{PHASE_NAME}}" --status "Done" --plain   # count + list of completed tickets
```

| Metric | Planned | Actual |
|---|---|---|
| Tickets completed | | |
| Phase duration (weeks) | | |
| Tickets / week | | |
| Hours spent (if tracked) | | |
| Hours / ticket (if tracked) | | |

Notes on variance (why actual differed from planned, if it did):

```
(free-form notes)
```

## 5. Carry-forward items

Anything raised here that isn't resolved before the next phase starts should become a tracked
ticket, not just a note. List them and their ticket IDs once created:

| Carry-forward item | Ticket ID | Target phase |
|---|---|---|
| | | |

---

**Next phase kickoff:** once this retrospective is filed, create next phase's tickets per
your project's `docs/roadmap-guide.md` and start work.
TEMPLATE_EOF

  echo "  ✓ backlog/phase-completion-checklist.md"
  echo "  ✓ backlog/phase-retrospective.md"
  echo ""
fi

echo "Next steps:"
echo "  1. Create Phase 0 tickets:"
echo "     backlog task create \"P0-1 Repository setup\" -m \"Phase 0: Foundation\" --ac \"CI/CD configured\""
echo ""
echo "  2. Track progress:"
echo "     backlog milestone list"
echo "     backlog task list --status \"In Progress\""
echo ""
echo "  3. Open dashboard (from AI Hub):"
echo "     - Add project to AI Hub"
echo "     - Start dashboard"
echo "     - Open board to see tasks grouped by phase"
echo ""
