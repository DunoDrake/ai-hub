---
id: AIHU-4
title: T1.1 Hiện dependency và isReady trên board
status: Done
assignee: []
created_date: '2026-10-27T06:53:00Z'
updated_date: '2026-10-27T07:50:00Z'
labels:
  - dev-medium
  - server
  - ui
milestone: m-1
dependencies:
  - AIHU-3
priority: high
ordinal: 4000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
backlog đã tính isReady (task phụ thuộc chưa Done thì false) nhưng /board của AI Hub bỏ trường này, nên người và agent không thấy ticket nào đang bị chặn.
Theo decision-1: task list --json chỉ có isReady. Tên ticket chặn lấy từ task view --json (readiness.blockingDependencies), chỉ gọi cho ticket có isReady=false, song song tối đa 6 và cache theo (id, updatedAt).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 /api/projects/:id/board trả isReady và danh sách ticket chặn cho từng task
- [x] #2 Ticket bị chặn có chip "blocked by AIHU-n"; bấm chip nhảy tới ticket đó
- [x] #3 Bộ lọc state có thêm "Ready to claim" (To Do, isReady, chưa gán)
- [x] #4 Kiểm tra trên repo thử có 2 ticket phụ thuộc nhau, hoàn thành ticket gốc thì chip biến mất sau lần refresh kế
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Verified on isolated two-ticket repo through live server/UI: dependent task showed blocked by TASK-1 and chip navigated to blocker; after TASK-1 became Done, next board auto-refresh changed dependent to ready. Board API exposes isReady, blockedBy, blockedError; state filter includes Ready to claim and Blocked.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Enriched blocked tasks through bounded cached task-view calls, exposed blocker IDs, added blocker navigation and Ready/Blocked state filters, and verified dependency transition end to end.
<!-- SECTION:FINAL_SUMMARY:END -->
