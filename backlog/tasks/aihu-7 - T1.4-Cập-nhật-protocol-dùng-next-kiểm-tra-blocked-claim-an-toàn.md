---
id: AIHU-7
title: 'T1.4 Cập nhật protocol: dùng next, kiểm tra blocked, claim an toàn'
status: Done
assignee: []
created_date: '2026-10-27T06:53:00Z'
updated_date: '2026-10-27T07:50:00Z'
labels:
  - dev-low
  - docs
  - protocol
milestone: m-1
dependencies:
  - AIHU-5
  - AIHU-6
priority: medium
ordinal: 7000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Sau khi T1.2 và T1.3 xong, đưa chúng vào templates/agent-protocol.md để mọi project được init đều dùng.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Protocol bước 2 dùng backlog-phase next và giao thức claim đã chốt
- [x] #2 Card hiện "Agent protocol out of date" cho project cũ và nút Update ghi đúng khối mới
- [x] #3 docs/model-routing.md khớp với protocol mới
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Updated shared template to use backlog-phase next then atomic claim and applied it to ai-hub AGENTS.md, CLAUDE.md, GEMINI.md via POST /protocol. Confirmed stale-project cards retain Update flow. docs/model-routing.md and repo setup docs match the command contract; helper symlink installed in ~/.local/bin.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Cut agent workflow over to ready selection plus atomic claim; documented installation/routing and preserved protocol-staleness detection/update behavior.
<!-- SECTION:FINAL_SUMMARY:END -->
