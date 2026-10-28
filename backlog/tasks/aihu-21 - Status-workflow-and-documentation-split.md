---
id: AIHU-21
title: Status workflow and documentation split
status: In Progress
assignee: []
created_date: '2026-10-28T05:39:00Z'
updated_date: '2026-10-28T07:12:00Z'
labels:
  - dev-high
  - needs-review
dependencies: []
references:
  - guides/repo-setup.md
  - docs/api.md
  - templates/agent-protocol.md
priority: high
type: enhancement
ordinal: 21000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Add Review for AI or manual review, Wontfix with a required reason, and Closed as terminal closure retaining the resolution. Preserve existing projects until opt-in migration. Separate AI Hub internal design/API/operations under docs/ from setup and workflow guides for adopting projects under guides/. Update shared protocol, UI, API, CLI, migration and QA.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Status workflow supports Review, Wontfix, and Closed with documented semantics and safe behavior for existing repositories
- [ ] #2 Review records whether it was AI or manual and captures reviewer evidence; Wontfix requires a reason note; Closed is the terminal ticket state
- [ ] #3 Board, filters, health metrics, roadmap metrics, and API docs remain coherent with the new status lifecycle
- [ ] #4 Internal AI Hub design/API/operations docs remain under docs/; adopting-project setup and workflow guides are separated under guides/ with clear usage notes
- [ ] #5 Existing repositories have a documented migration/setup path and automated plus targeted smoke verification passes
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Preserve pre-change worktree and handoff. 2. Add a shared lifecycle contract and guarded CLI/API transitions with durable review/resolution evidence, per-ticket locks, and opt-in migration backups. 3. Integrate six columns, review form, wontfix reason, closure and reopen flows; keep delivery counts separate from resolved/cancelled counts and adapt dependencies/gates. 4. Split internal docs/ from adopting-project guides/, fix templates/links and document setup/migration. 5. Exercise isolated real Backlog fixtures, regression/API tests and browser desktop/mobile QA; update handoff and leave honest independent/manual review state.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Operator-authorized routing exception: @gpt handling dev-high. User explicitly requested GPT continue AIHU-21 after switching model on 2026-10-28; preserve dev-high classification.

Pre-change snapshot: /Users/hue/.codex/handoffs/ai-hub-pre-AIHU-21.EW12Lu/worktree.tgz sha256 baefd427abc6494e587bfc7d6df08218aef660a1475fbc74041560c5253cc906. AIHU-20 preserved. User requested handoff-safe continuation. Adopt guides/ for other projects using AI Hub; docs/ retains internal design and operations. Plan authorized by request to continue.

Shared lifecycle API/CLI implementation and five regression tests pass against real Backlog 1.55.3, including migration backup, review checks, resolution/dependency semantics and concurrent lock rejection. Documentation consolidation and isolated API/browser QA in progress.

Implementation complete pending independent dev-high review. Evidence: node --test tests/*.test.mjs (7/7 pass); HTTP/CLI integration covers new and legacy opt-in repos, migration backups, AI/manual Review, Wontfix, Closed resolution, dependencies, gates and routing override. Chromium QA after launchctl reload: desktop board has 6 columns; mobile has 6 tabs with no horizontal overflow; no page errors observed. AI Hub repo migrated from [To Do, In Progress, Done] to [To Do, In Progress, Review, Done, Wontfix, Closed] with backup config.yml.ai-hub-1793170993974.bak. Remaining: independent Claude dev-high architecture review and final AC check.

2026-10-28 sync: re-verified node --check (server, backlog-phase, lib/workflow) and node --test tests/*.test.mjs = 7/7 pass; no broken relative links in README/docs/guides. docs/ = internal AI Hub design/API/ops; guides/ = adoption guides for projects using AI Hub (the 'third-party' label means these guides, not vendor docs). Committed and pushed to origin/main at user request. Still pending: independent dev-high review and AC check; AC left unchecked and status unchanged.
<!-- SECTION:NOTES:END -->
