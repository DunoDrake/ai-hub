---
id: AIHU-23
title: >-
  Quyết định: thay dashboard native bằng view AI Hub (docs, decisions, task
  detail)
status: To Do
assignee: []
created_date: '2026-10-28T09:06:00Z'
labels:
  - dev-high
dependencies:
  - AIHU-22
references:
  - server.mjs
  - docs/architecture.md
priority: low
type: task
ordinal: 23000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Dashboard native của Backlog.md (backlog browser) là lý do AI Hub phải spawn process con cho từng project. AI Hub board đã có 6 cột, review, health, metrics, dependency; phần native còn độc quyền là xem docs, decisions và chi tiết task đầy đủ. Cần quyết định có nên bỏ hẳn process con bằng cách tự dựng các view đó hay không, trước khi đầu tư thêm vào native dashboard. Đây là quyết định kiến trúc khó đảo ngược nên cần ghi lại bằng decision record.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Khảo sát và ghi lại: dữ liệu docs/decisions/task detail đọc được qua CLI hay phải gọi API của dashboard native; chi phí và độ ổn định khi Backlog.md đổi version (parseSprints đã từng là điểm giòn)
- [ ] #2 So sánh tối thiểu 3 phương án (giữ native + AIHU-22, tự dựng view trong AI Hub, hybrid) với tradeoff; chọn một phương án
- [ ] #3 Ghi decision record bằng 'backlog decision create' và liên kết vào task này
- [ ] #4 Nếu chọn bỏ native: tạo task triển khai có routing label và AC riêng; nếu giữ: ghi rõ lý do trong decision. Không tự triển khai trong task này
<!-- AC:END -->
