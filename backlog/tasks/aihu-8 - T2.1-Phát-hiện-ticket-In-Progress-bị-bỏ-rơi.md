---
id: AIHU-8
title: T2.1 Phát hiện ticket In Progress bị bỏ rơi
status: Done
assignee: []
created_date: '2026-10-27T06:53:00Z'
updated_date: '2026-10-27T07:50:00Z'
labels:
  - dev-medium
  - server
  - ui
milestone: m-2
dependencies: []
priority: medium
ordinal: 8000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Ticket In Progress không cập nhật nhiều giờ thường là agent hết context hoặc bị ngắt. Board có sẵn updatedAt nên làm được ngay.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Ngưỡng mặc định 24 giờ, đổi được bằng biến môi trường AI_HUB_STALE_HOURS
- [x] #2 Ticket quá ngưỡng có chip "stale 2d" và nằm trong bộ lọc state
- [x] #3 Ticket Done hoặc To Do không bao giờ bị gắn stale
- [x] #4 Kiểm tra với updatedAt giả lập qua và dưới ngưỡng
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Verified isStale boundaries with fixed timestamps and live server override AI_HUB_STALE_HOURS=0. In Progress fixture became stale in API/health; To Do and Done remain excluded. UI state filter and age chip render stale age (hours or days).
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Added configurable stale detection (default 24h), health IDs/counts, Stale state filter, and per-ticket age chips using updatedAt/createdAt.
<!-- SECTION:FINAL_SUMMARY:END -->
