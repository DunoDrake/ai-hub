---
id: AIHU-5
title: 'T1.2 backlog-phase next --provider: ticket kế tiếp cho từng agent'
status: Done
assignee: []
created_date: '2026-10-27T06:53:00Z'
updated_date: '2026-10-27T07:50:00Z'
labels:
  - dev-medium
  - cli
milestone: m-1
dependencies: []
priority: high
ordinal: 5000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Protocol hiện bắt agent tự list theo label rồi chọn. Dễ chọn sai tier hoặc chọn ticket đang bị chặn.
Thêm lệnh trả đúng một ticket nên làm tiếp cho provider đó.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 backlog-phase next --provider gpt chỉ trả ticket To Do, isReady, chưa gán, đúng ranh giới tier (GPT: dev-medium và art)
- [x] #2 Sắp xếp theo priority rồi ordinal; không có ticket phù hợp thì thoát mã 0 và in lý do
- [x] #3 Có --json; provider lạ báo lỗi rõ ràng
- [x] #4 Thử trên IdleMagician: DeepSeek không bao giờ nhận ticket dev-high
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Verified provider matrix and ordering on isolated repos and real projects: GPT selected dev-medium/art only, DeepSeek selected dev-low and never dev-high, unknown/missing providers fail clearly, no match exits 0, JSON output includes tier/task.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Added backlog-phase next with ready/unassigned/To Do filtering, strict provider tier boundaries, priority+ordinal ordering, JSON output, and clear empty/error responses.
<!-- SECTION:FINAL_SUMMARY:END -->
