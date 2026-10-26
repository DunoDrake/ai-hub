# Quick Start: Phase-Driven Roadmap

Get a new project set up with the four-phase roadmap in 5 minutes.

## Prerequisites

- Project repo initialized with git
- `backlog.md` CLI installed (`npm i -g backlog.md`)
- AI Hub dashboard running (see `./operations.md`)

## Steps

### 1. Initialize Backlog in Your Project

```bash
cd /path/to/your-project
backlog init --defaults --task-prefix <PROJ>
```

Replace `<PROJ>` with a 2–4 letter prefix (e.g., `app`, `web`, `api`).

Example:
```bash
backlog init --defaults --task-prefix APP
```

This creates `backlog/` directory and scaffolds config.

### 2. Create Phase Milestones

Run this in your project root:

```bash
backlog milestone add "Phase 0: Foundation"
backlog milestone add "Phase 1: Features"
backlog milestone add "Phase 2: Polish"
backlog milestone add "Phase 3: Release"
```

Or use the shell script below to automate it:

**`scripts/init-roadmap.sh`** (save in project root):

```bash
#!/bin/bash
set -e

echo "Initializing phase-driven roadmap..."

backlog milestone add "Phase 0: Foundation" \
  --description "Repository setup, architecture, core infrastructure"

backlog milestone add "Phase 1: Features" \
  --description "Develop and integrate main capabilities"

backlog milestone add "Phase 2: Polish" \
  --description "Optimize, test, refine UX and user experience"

backlog milestone add "Phase 3: Release" \
  --description "Final QA, documentation, production readiness"

echo "✓ Four phase milestones created"
echo ""
echo "Next: Create tickets in backlog/ or dashboard"
echo "  backlog task create \"P0-1 Repository setup\" -m \"Phase 0: Foundation\" --ac \"CI/CD runs\""
```

Make executable and run:
```bash
chmod +x scripts/init-roadmap.sh
./scripts/init-roadmap.sh
```

### 3. Create Phase 0 Tickets

Create your first Phase 0 tickets:

```bash
backlog task create "P0-1 Repository setup" \
  -m "Phase 0: Foundation" \
  --ac "CI/CD pipeline configured" \
  --ac "Lint and format rules established" \
  --ac "Pre-commit hooks working"

backlog task create "P0-2 Architecture design" \
  -m "Phase 0: Foundation" \
  --ac "Architecture diagram documented" \
  --ac "Module layout and dependencies clear" \
  --ac "Design review passed"

backlog task create "P0-3 Core modules" \
  -m "Phase 0: Foundation" \
  --ac "Utilities and base classes ready" \
  --ac "Data models defined" \
  --ac "Tests for core module passing"
```

Adjust ticket count and titles to your project.

### 4. Add Project to AI Hub

In AI Hub dashboard:

1. Click **Add project**
2. Paste absolute path to your project
3. Click **Add project**
4. Click **Start dashboard**
5. Click **Open dashboard**

You'll see your project's Kanban board with all tickets in "To Do" column, grouped under Phase 0: Foundation milestone.

### 5. Work Phase 0

Team members:
- Pick tickets from the board
- Move to "In Progress"
- Update with notes: `backlog task edit <ID> --append-notes "progress"`
- Mark "Done" when acceptance criteria met

Example:
```bash
backlog task edit APP-1 --append-notes "CI/CD configured with GitHub Actions, linting via ESLint"
backlog task edit APP-1 --status Done
```

### 6. Phase 0 Manual Review

When all Phase 0 tickets are "Done":

1. **Gather deliverables:**
   - Architecture document (in `docs/` or `backlog/`)
   - Core module code
   - Passing CI/CD
   - Code quality baseline

2. **Schedule 30–60 min review** with product owner or tech lead

3. **Review checklist:**
   - ✓ Architecture supports planned features?
   - ✓ Core modules decoupled and testable?
   - ✓ CI/CD reliable?
   - ✓ Coding standards enforced?
   - ✓ Documentation clear?

4. **Outcome:**
   - **Approved** → Create Phase 1 tickets, continue
   - **Changes needed** → Reopen Phase 0 tickets, rework

### 7. Repeat for Phase 1, 2, 3

When Phase 0 approved:

```bash
# Create Phase 1 tickets
backlog task create "P1-1 Feature one" \
  -m "Phase 1: Features" \
  --ac "Feature accepts input" \
  --ac "Feature returns output" \
  --ac "Unit tests passing"

backlog task create "P1-2 Feature two" -m "Phase 1: Features"
# ... more P1 tickets
```

Same flow: work tickets → review gate → Phase 2 → Phase 3 → production ready.

---

## Template: Phase 0 Tickets (Customize for Your Project)

| ID | Title | Acceptance Criteria |
|----|----|---|
| P0-1 | Repository setup | CI/CD runs; lint passes; pre-commit hooks |
| P0-2 | Architecture | Diagram documented; modules clear; design reviewed |
| P0-3 | Core modules | Base classes ready; data models defined; tests passing |
| P0-4 | Build system | Transpile/bundle verified; output validates |
| P0-5 | Logging & monitoring | Debug output works; metrics collected |

## Template: Phase 1 Tickets

| ID | Title | Acceptance Criteria |
|----|----|---|
| P1-1 | Feature 1 | Feature works; docs clear; tests passing |
| P1-2 | Feature 2 | Feature integrated; no circular deps |
| P1-3 | Feature 3 | Feature complete; acceptance criteria met |
| P1-4 | Feature 4 | Feature optional; design supports it |
| P1-5 | API contracts | Exports documented; signatures final |
| P1-6 | Integration test | All features work together; no regressions |

## Tips

- **Milestone due dates:** Add deadlines with `backlog milestone add ... --due-date 2026-11-15`
- **Ticket estimates:** Use labels or priority; adjust per your workflow
- **Backlog dashboard:** Open with `backlog browser` to manage Kanban board manually
- **Notes breadcrumbs:** Leave `--append-notes` at each major checkpoint; helps next session resume

---

## Roadmap Diagram

See the full workflow: [roadmap-diagram.html](../roadmap-diagram.html)

Visualizes:
- Four phases in sequence
- Manual review gates between phases
- Development and review lanes
- Decision points and approval flow

---

## Next Steps

- Read full guide: [`docs/roadmap-guide.md`](./roadmap-guide.md)
- Set up model routing: [`docs/model-routing.md`](./model-routing.md)
- Review AI Hub operations: [`docs/operations.md`](./operations.md)
