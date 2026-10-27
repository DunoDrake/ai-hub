---
id: AIHU-2
title: T0.2 Chip sức khỏe protocol trên card project và board
status: Done
assignee: []
created_date: '2026-10-27T06:53:00Z'
updated_date: '2026-10-27T07:50:00Z'
labels:
  - dev-medium
  - ui
  - metrics
milestone: m-0
dependencies:
  - AIHU-1
priority: medium
ordinal: 2000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Hiển thị chỉ số từ T0.1 để người dùng thấy ngay project nào đang lỏng quy trình.
Ví dụ: "Done có AC 0/15", "chưa gán 4 ticket đang chạy".
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Card project và đầu board có một dòng chip; bấm chip lọc board đúng tập ticket vi phạm
- [x] #2 Không làm tràn ngang ở 390px; light và dark đều đọc được
- [x] #3 Project chưa init hoặc health lỗi thì ẩn chip, không báo lỗi đỏ
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Verified in managed browser on desktop, 390px mobile, light and dark. Project-card Done-without-AC chip opened IdleMagician board pre-filtered to 15 exact tickets; board chips toggle and clear without errors.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Added compact protocol-health chips to project cards and board, with exact-ticket filtering, responsive layout, empty/error hiding, and stale/blocked integration.
<!-- SECTION:FINAL_SUMMARY:END -->
