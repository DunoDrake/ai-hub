---
id: AIHU-16
title: T4.2 Gate dùng lint trước khi approve
status: To Do
assignee: []
created_date: '2026-10-27T06:53:00Z'
labels:
  - dev-low
  - cli
milestone: m-4
dependencies:
  - AIHU-15
priority: medium
ordinal: 16000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
backlog-phase gate --approve hiện kiểm AC và docs. Thêm lint vào cùng chỗ.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Approve thất bại nếu lint còn vi phạm trong phase, trừ khi --force
- [ ] #2 Kết quả lint hiện trong khối checklist của gate
<!-- AC:END -->
