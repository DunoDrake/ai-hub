---
id: AIHU-6
title: T1.3 Thiết kế claim có kiểm tra va chạm giữa các agent
status: Done
assignee: []
created_date: '2026-10-27T06:53:00Z'
updated_date: '2026-10-27T07:50:00Z'
labels:
  - dev-high
  - design
  - concurrency
milestone: m-1
dependencies: []
priority: high
ordinal: 6000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Claim hiện là `backlog task edit -a @x -s "In Progress"`, không nguyên tử: hai agent cùng đọc To Do rồi cùng claim sẽ ghi đè nhau mà không ai biết.
Đã kiểm chứng trên backlog 1.55.3: `task edit --help` và `backlog --help` không có cờ khóa hay claim. Cần giao thức đủ an toàn mà không thêm hạ tầng.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Mô tả giao thức claim: đọc lại assignee sau khi ghi và nhường nếu bị ghi đè; nêu rõ cửa sổ rủi ro còn lại
- [x] #2 Chạy thử hai tiến trình claim cùng một ticket và ghi lại kết quả thật
- [x] #3 Quyết định có cần lệnh backlog-phase claim hay chỉ sửa protocol; ghi ADR
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Raw two-process experiment: both writers returned 0 in all five rounds; last writer won non-deterministically (Claude 3, GPT 2). Atomic claim race then ran 10 rounds with exactly one winner each round (Claude 8, GPT 2); losing process returned 1. ADR decision-2 records local lock, stale timeout, readback, and remaining local-only/raw-writer risk.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Chose and implemented backlog-phase claim using an atomic per-project/task directory lock, validation, assignment/status update, readback ownership verification, stale-lock recovery, and an accepted ADR.
<!-- SECTION:FINAL_SUMMARY:END -->
