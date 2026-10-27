---
id: AIHU-3
title: T0.3 Quyết định cách đọc plan, notes, final summary mà không đọc file tay
status: Done
assignee:
  - '@claude'
created_date: '2026-10-27T06:53:00Z'
updated_date: '2026-10-27T07:15:00Z'
labels:
  - dev-high
  - adr
  - design
milestone: m-0
dependencies: []
priority: high
ordinal: 3000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
backlog task list --json không có plan, notes hay final summary, nhưng T2.2, T2.3, T3.1 và T4.1 đều cần chúng. README cam kết AI Hub không đọc file task, nên cần chốt hướng trước khi code.
So sánh ít nhất: backlog task view --plain theo từng ticket có cache, backlog search, và khả năng thêm trường vào JSON của backlog.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Ghi ADR bằng backlog decision create nêu lựa chọn, chi phí (số lần gọi CLI trên project 37 ticket) và rủi ro
- [x] #2 Chạy thử phương án được chọn trên IdleMagician và ghi thời gian thực đo được
- [x] #3 Nêu rõ phương án nào giữ nguyên cam kết AI Hub không đọc file task, hoặc đề nghị sửa cam kết đó
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Đo trên IdleMagician (37 task): list --json 70 ms; view --json tuần tự 2212 ms (60 ms/task); song song 8 còn 460 ms. task view --json có implementationPlan/Notes, finalSummary, readiness.blockingDependencies. Phương án chọn: task view --json có giới hạn song song + cache theo (id, updatedAt). Giữ nguyên cam kết "AI Hub không đọc file task". Ghi trong backlog/decisions/decision-1. Lưu ý: backlog decision create chỉ tạo khung rỗng, thân ADR phải điền tay vì CLI không có cờ nội dung.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Chốt cách đọc plan, notes, final summary qua backlog task view --json. Chi phí đã đo, giới hạn song song và cache được nêu trong decision-1. Phát hiện thêm: task view --json có readiness.blockingDependencies nên T1.1 nêu được tên ticket chặn.
<!-- SECTION:FINAL_SUMMARY:END -->
