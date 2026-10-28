# Delivery roadmap: phase-driven development

A structured four-phase roadmap template for managing projects through AI Hub and Backlog.md.

## Overview

This roadmap divides project execution into four distinct phases, each with grouped tickets and a manual review gate. The workflow ensures quality control at phase boundaries while enabling parallel development within each phase.

## Roadmap terminology

This is a **phase-driven delivery roadmap**: it communicates delivery stages, phase completion, review gates, and the work recently delivered. It is not a replacement for a product strategy or a detailed feature backlog. Feature tickets remain the execution units; milestones group them; phases add a higher-level delivery sequence.

Use milestone names in the form `Phase N - <name>` when a milestone should appear in AI Hub's Delivery roadmap. Use any other milestone name for a normal feature sprint, experiment, maintenance bucket, or unplanned work that should remain on the board without becoming a roadmap phase. On each project card, delivered work includes Done and Closed with resolution:done. Wontfix and unclassified legacy Closed are excluded. Recent items are sorted by update time. Resolved scope is tracked separately from delivered work.

**Visual diagram:** [`roadmap-diagram.html`](../roadmap-diagram.html) (open in browser)

## Phase Structure

### Phase 0: Foundation
**Goal:** Establish core infrastructure and architecture.

**Typical tickets (3–5):**
- `P0-1` Repository setup (CI/CD, structure, tools)
- `P0-2` Architecture design (patterns, dependencies, layering)
- `P0-3` Core modules (utilities, base classes, logging)
- `P0-4` Data structures (schemas, models, persistence)
- `P0-5` Build system verification (transpile, bundle, lint)

**Definition of Done:**
- Architecture documented and reviewed
- Core modules testable and decoupled
- CI/CD pipeline working
- Baseline code quality metrics established

**Manual Review Gate:**
- Product owner / tech lead reviews architecture
- Verify foundation can support all planned features
- Approve or request rework before Phase 1

---

### Phase 1: Core Features
**Goal:** Develop and integrate the main capabilities.

**Typical tickets (4–6):**
- `P1-1` Feature 1 (primary capability)
- `P1-2` Feature 2 (secondary capability)
- `P1-3` Feature 3 (additional capability)
- `P1-4` Feature 4 (integration, hooks, or optional)
- `P1-5` API / module contracts (expose, document)
- `P1-6` Integration testing (cross-module scenarios)

**Definition of Done:**
- All features implemented against acceptance criteria
- Features integrated and working together
- API contracts finalized and documented
- Unit and integration tests passing
- No critical bugs in main paths

**Manual Review Gate:**
- Product owner reviews feature completeness
- Verify all Phase 1 features meet requirements
- Check integration quality (no data leaks, circular deps)
- Approve or request changes before Phase 2

---

### Phase 2: Polish & Optimization
**Goal:** Refine, optimize, and test thoroughly.

**Typical tickets (3–5):**
- `P2-1` Performance optimization (profiling, bottleneck fixes)
- `P2-2` UI/UX polish (visual refinement, accessibility)
- `P2-3` Comprehensive testing (edge cases, security, load)
- `P2-4` Error handling (user-facing messages, logging)
- `P2-5` Documentation updates (API docs, user guides)

**Definition of Done:**
- Performance benchmarks meet targets
- UI passes accessibility (a11y) checks
- Test coverage > 80% for critical paths
- All known bugs triaged (fixed or deferred)
- Documentation is complete and accurate

**Manual Review Gate:**
- Product owner reviews polish and UX
- Verify test coverage and critical bug closure
- Check performance against baseline
- Sign off on user-facing quality before Phase 3

---

### Phase 3: Release Preparation
**Goal:** Final validation and production readiness.

**Typical tickets (2–4):**
- `P3-1` Final QA and edge-case testing
- `P3-2` Release documentation (changelog, migration guides)
- `P3-3` Security audit and hardening
- `P3-4` Deployment procedure and rollback plan

**Definition of Done:**
- No P0/P1 bugs remaining
- Security review completed
- Deployment procedure tested
- Rollback plan documented and verified
- Release notes finalized

**Manual Review Gate:**
- Product owner / ops team approves release readiness
- Verify deployment procedure is safe
- Confirm all compliance / security requirements met
- Final sign-off before production deployment

---

## How to Use This Roadmap

### 1. Set Up Your Project
```bash
# In your project repo
backlog init --defaults --task-prefix <PROJ>

# Choose 2–4 letter prefix (e.g., "app", "web", "api")
# Backlog creates backlog/ directory
```

### 2. Create Phase Milestones
```bash
backlog milestone add "Phase 0: Foundation"
backlog milestone add "Phase 1: Features"
backlog milestone add "Phase 2: Polish"
backlog milestone add "Phase 3: Release"
```

### 3. Create Tickets per Phase
For Phase 0, create tickets:
```bash
backlog task create "P0-1 Repository setup" -l dev-medium -m "Phase 0: Foundation" --ac "CI/CD pipeline runs" --ac "Lint passes"
backlog task create "P0-2 Architecture design" -l dev-high -m "Phase 0: Foundation" --ac "Architecture reviewed"
# ... more Phase 0 tickets
```

Repeat for Phase 1, 2, 3 with appropriate titles and acceptance criteria.

### 4. Track Progress
```bash
# View Phase 0 progress
backlog task list --status "To Do" -m "Phase 0: Foundation"
backlog task list --status "In Progress"
backlog task list --status "Done" -m "Phase 0: Foundation"
```

### 5. Phase Gate: Manual Review
When Phase 0 is nonempty and all tickets are resolved (Done, Wontfix or Closed with recorded resolution):

1. **Pull together deliverables:**
   - Architecture document
   - Core module source
   - CI/CD status
   - Baseline metrics

2. **Schedule review:**
   - Product owner / tech lead
   - 30–60 minutes

3. **Review checklist:**
   - Does architecture support planned features?
   - Are core modules decoupled?
   - Is CI/CD reliable?
   - Are coding standards enforced?
   - Use [`templates/phase-completion-checklist.md`](../templates/phase-completion-checklist.md) to work
     through deliverables and gate questions systematically, and record reviewer/date approval.

4. **Decision:**
   - ✓ **Approve** → Proceed to Phase 1
   - ✗ **Request changes** → Reopen Phase 0 tickets, rework, re-review

### 6. Move to Next Phase
Once approved:
```bash
# Mark Phase 0 milestone as complete (optional, for clarity)
# Then begin Phase 1

backlog task create "P1-1 Feature One" -l dev-medium -m "Phase 1: Features" --ac "Accepts input" --ac "Returns result"
# ... continue with Phase 1 tickets
```

---

## Tips for Success

### Ticket Guidelines
- **Title:** Clear, action-oriented (`"Implement user login"` not `"Work on auth"`)
- **Acceptance Criteria:** 2–3 measurable outcomes per ticket
- **Assign to:** Individual dev owner (not the whole team)
- **Estimate:** T-shirt sizes (S/M/L) or story points if using your system

### Phase Boundaries
- **Don't skip reviews:** Manual gates catch architecture/quality issues early
- **Don't mix phases:** Start Phase 1 only after Phase 0 approved
- **Parallel work:** Within a phase, team can work multiple tickets in parallel
- **Blockers:** If a ticket blocks others, escalate to daily standup

### AI Agent Integration
Agents resume work from phase context. Example flow:
1. Check `backlog task list --status "In Progress"`
2. Read ticket acceptance criteria
3. Update with `backlog task edit <id> --append-notes "<progress>"`
4. Hand off to Review, then obtain actual approval before Done; close only after resolution. Follow [workflow.md](workflow.md).

---

## Template Files

| File | Purpose |
|------|---------|
| `backlog/` | Markdown task, milestone, and decision logs |
| `backlog/config.yml` | Statuses, categories, archiving rules |
| `AGENTS.md` | AI agent instructions (protocol block injected by AI Hub init) |
| `CLAUDE.md` / `GEMINI.md` | Provider-specific instructions |
| `templates/phase-completion-checklist.md` | Gate-review checklist kept in project docs or imported via Backlog document CLI |
| `templates/phase-retrospective.md` | Retrospective kept in project docs or imported via Backlog document CLI |

All are versioned with your repo. Milestones track phase progress in Backlog.md's own dashboard; AI Hub's board also displays phase and roadmap metadata from the task milestone field.

---

## Customization

Feel free to adapt phases to your project:
- **Rename** phases (e.g., "Discovery" instead of "Foundation")
- **Add/remove** tickets (3–6 per phase is typical, not rigid)
- **Extend tickets** within a phase if the work is large
- **Set due dates** on milestones if needed (`backlog milestone add "Phase 1" --due-date 2026-11-15`)

The key invariants:
1. One review gate per phase
2. Grouped tickets under milestones
3. Manual approval before phase transition
4. All tickets versioned in repo

---

## References

- [Backlog.md documentation](https://github.com/MrLesk/Backlog.md)
- [AI Hub setup](./repo-setup.md)
- [Model routing](./model-routing.md)
