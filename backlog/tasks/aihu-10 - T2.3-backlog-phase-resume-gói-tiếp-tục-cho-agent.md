---
id: AIHU-10
title: 'T2.3 backlog-phase resume: gói tiếp tục cho agent'
status: To Do
assignee: []
created_date: '2026-10-27T06:53:00Z'
labels:
  - dev-medium
  - cli
milestone: m-2
dependencies:
  - AIHU-3
priority: medium
ordinal: 10000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Bước 1 của protocol là "resume trước". Hiện agent phải chạy 2 đến 3 lệnh rồi tự ghép. Một lệnh nên in sẵn thứ cần để tiếp tục.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 backlog-phase resume --provider claude in ticket đang giữ: mô tả, AC chưa check, plan, note cuối, file đã sửa
- [ ] #2 Không có ticket đang giữ thì in gợi ý chạy next
- [ ] #3 Đầu ra dưới 200 dòng cho ticket có nhiều note, cắt note cũ
<!-- AC:END -->
