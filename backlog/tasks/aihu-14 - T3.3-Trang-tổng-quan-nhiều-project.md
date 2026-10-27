---
id: AIHU-14
title: T3.3 Trang tổng quan nhiều project
status: To Do
assignee: []
created_date: '2026-10-27T06:53:00Z'
labels:
  - dev-medium
  - ui
  - server
milestone: m-3
dependencies:
  - AIHU-1
  - AIHU-8
priority: low
ordinal: 14000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Khi có 5 project trở lên, người dùng cần thấy ngay project nào có ticket stale, thiếu bằng chứng hoặc không ai đang chạy.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Một bảng gộp: project, phase hiện tại, số đang chạy, stale, thiếu bằng chứng
- [ ] #2 Sắp xếp theo mức cần chú ý; bấm một dòng mở board project đó
- [ ] #3 Không gọi quá 1 lần /health và /board cho mỗi project mỗi lần refresh
<!-- AC:END -->
