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
