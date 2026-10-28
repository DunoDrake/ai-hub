# AI Hub session handoff

## Checkpoint before AIHU-21 — 2026-10-28

- Base: `main`, commit `0ff394f`.
- Pre-existing, uncommitted AIHU-20 changes: README.md, server.mjs, index.html,
  docs/api.md, docs/repo-setup.md, docs/roadmap-guide.md, docs/roadmap-quickstart.md.
  Preserve them. AIHU-20 remains In Progress / needs-review, unassigned.
- AIHU-21 was To Do / dev-high / unassigned. The user explicitly asked GPT to
  continue after switching models. Keep dev-high; record a task-specific routing
  exception instead of pretending this is lower-risk work.
- Recoverable pre-change archive (outside Git):
  `/Users/hue/.codex/handoffs/ai-hub-pre-AIHU-21.EW12Lu/worktree.tgz`.
  Contains source, docs, templates, Backlog records and provider instructions;
  excludes personal media and Git internals. Extract into a separate directory
  for comparison; do not overwrite a newer worktree wholesale.
- Prior AIHU-20 verification was syntax + one real API smoke check. It did not
  include browser QA or regression fixtures for alternate statuses.

## Approved intent and working contract

- Add Review (AI or manual), Wontfix (mandatory reason), Closed (ticket closure).
- Keep Done for accepted delivery; Closed retains whether the resolution was
  delivered or wontfix. Old Closed tickets must not silently become delivered.
- Preserve old projects until explicit per-project workflow enablement. Upgrade
  this AI Hub repository as the integration example after tests.
- `docs/`: AI Hub architecture, API, operations and handoffs.
- `guides/`: adoption/setup/workflow instructions for projects using AI Hub.
  The earlier third-party label was ambiguous; these are integration guides,
  not documentation authored by external vendors.
- Validate API, CLI, dependencies, metrics, migration and desktop/mobile UI.
- No push or public-repository change is part of this task.

## Resume

Read AIHU-21 through Backlog CLI, inspect git status and this file, then run the
verification commands recorded below. Continue the existing work; do not reset
AIHU-20 edits. Final independent/manual review must be recorded truthfully.

## Current checkpoint — 2026-10-28

- AIHU-21 implementation is complete but intentionally remains In Progress,
  unassigned and `needs-review` pending an independent dev-high review.
- `node --test tests/*.test.mjs`: 7/7 tests passed. This includes isolated real
  Backlog 1.55.3 fixtures, HTTP API, CLI transitions, migration backup/idempotence,
  review evidence, Wontfix/Closed resolution, dependency readiness, phase gates,
  routing override and legacy-project opt-in.
- Real local Chromium QA after reloading `com.hue.ai-hub`: desktop board exposed
  six columns; mobile exposed six tabs with no horizontal overflow; no page errors.
  Screenshots: `/tmp/aihub-board-six.png`, `/tmp/aihub-board-mobile.png`.
- AI Hub itself was migrated through `node bin/backlog-phase.mjs workflow --path .
  --json`; backup: `/Users/hue/tektale/ai-hub/backlog/config.yml.ai-hub-1793170993974.bak`.
- Documentation split is now `docs/` (internal architecture/API/operations) and
  `guides/` (adopting-project setup/workflow/routing/roadmap). `guides/README.md`
  explains the naming choice; no `docs/third-party/` folder was created because
  these are first-party adoption guides, not vendor reference material.
- Service was reloaded with `launchctl kickstart -k gui/$(id -u)/com.hue.ai-hub`.

Next exact step: an independent reviewer should inspect the diff and run the tests,
then use Backlog CLI to check the five AIHU-21 acceptance criteria and mark the task
Done only if the review is actually approved. Do not claim review approval from this
handoff alone.
