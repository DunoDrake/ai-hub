---
id: AIHU-20
title: Project accomplishment summary and setup docs
status: In Progress
assignee: []
created_date: '2026-10-28T05:10:00Z'
updated_date: '2026-10-28T05:12:00Z'
labels:
  - dev-medium
  - needs-review
dependencies: []
priority: high
type: enhancement
ordinal: 20000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Project cards show current phase and ticket counts, but do not summarize what the project has actually delivered. The roadmap terminology and per-project setup expectations are also easy to misread. Add a concise completed-work summary to the project view and document the supported phase-driven delivery roadmap workflow so new repositories can set it up consistently.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Project view shows completed deliverables or recently completed tickets, not only done/total counts
- [ ] #2 Roadmap and feature-development terminology is explicit in the UI and documentation
- [ ] #3 Setup documentation explains milestones, Phase N naming, task grouping, gates, and non-roadmap custom sprints
- [ ] #4 Existing project and board behavior remains compatible, and automated verification passes
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Inspect existing summary/board payloads and project-card rendering; preserve current milestone and custom-sprint behavior. 2. Add a bounded completed-work summary derived from real Done tasks, including recent completed ticket titles and phase-level counts without exposing private paths. 3. Update project-card and board wording to distinguish the optional phase-driven delivery roadmap from feature/sprint planning. 4. Update README and roadmap setup docs with milestone naming, task grouping, review gates, completed-work expectations, and non-roadmap custom sprints. 5. Run automated verification plus targeted API/UI smoke checks for empty, active, completed, and custom-sprint projects.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Implemented completed-work summary and delivery-roadmap terminology. Server summary now exposes completedWork.total plus five latest Done tickets (Closed excluded); project cards render Delivered work; board labels now say Delivery roadmap and Delivery phase metrics. Updated README, docs/repo-setup.md, docs/roadmap-guide.md, docs/roadmap-quickstart.md, and docs/api.md. Verification: node --check server.mjs passed; inline index.html script parse passed; git diff --check passed; backlog config/task/milestone smoke commands passed; isolated API smoke returned completedWork for 9 Done tickets and preserved phase/health data.
<!-- SECTION:NOTES:END -->
