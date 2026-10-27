---
id: AIHU-9
title: T2.2 Mẫu handoff note chuẩn và lệnh kiểm tra
status: To Do
assignee: []
created_date: '2026-10-27T06:53:00Z'
labels:
  - dev-medium
  - protocol
  - cli
milestone: m-2
dependencies:
  - AIHU-3
priority: medium
ordinal: 9000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Notes hiện là văn bản tự do nên provider kế tiếp phải đoán. Chuẩn hóa: Đã xong / Việc kế / Vướng mắc / File đã sửa / Cách kiểm chứng.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 templates/handoff-note.md và đoạn tương ứng trong protocol
- [ ] #2 backlog-phase handoff <id> --check báo thiếu mục nào trong note mới nhất (theo hướng đọc note đã chốt ở T0.3)
- [ ] #3 Ticket có note đúng mẫu thì lệnh thoát 0; thiếu thì thoát 1 kèm danh sách mục thiếu
<!-- AC:END -->
