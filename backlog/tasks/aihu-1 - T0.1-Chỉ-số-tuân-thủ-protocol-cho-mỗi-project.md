---
id: AIHU-1
title: T0.1 Chỉ số tuân thủ protocol cho mỗi project
status: Done
assignee: []
created_date: '2026-10-27T06:53:00Z'
updated_date: '2026-10-27T07:50:00Z'
labels:
  - dev-medium
  - server
  - metrics
milestone: m-0
dependencies: []
priority: high
ordinal: 1000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Hiện chưa có cách biết agent có làm đúng protocol hay không. Số đo hiện tại: IdleMagician 15 Done nhưng 0 ticket có AC, 0 Final Summary, 0 Plan, 0 assignee; ai-live 3/11 có Final Summary.
Thêm GET /api/projects/:id/health chỉ dùng dữ liệu của backlog task list --json (AI Hub không đọc file task).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Trả về { total, oneTier, noTier, multiTier, withAC, doneTotal, doneWithAC, inProgressUnassigned, noPriority } khớp số đếm tay trên IdleMagician
- [x] #2 Mỗi chỉ số có mẫu số rõ ràng; project 0 ticket trả về 0, không chia cho 0
- [x] #3 docs/api.md mô tả endpoint; không ghi file nào trong repo của project
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Verified 2026-10-27: independent count over IdleMagician task-list JSON exactly matched API (37 total, 18 oneTier, 4 noTier, 0 multiTier, 18 withAC, 15 doneTotal, 0 doneWithAC, 0 unassigned In Progress, 4 noPriority). Empty fixture returned total 0 and null rates; git status remained unchanged.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Added read-only GET /api/projects/:id/health with protocol counters, explicit denominator rates, issue IDs, stale/blocked counts, API documentation, and zero-ticket behavior.
<!-- SECTION:FINAL_SUMMARY:END -->
