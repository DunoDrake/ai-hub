---
id: decision-1
title: Đọc plan, notes, final summary bằng backlog task view --json
date: '2026-10-27T07:14:00Z'
status: accepted
---
## Context

Các ticket T2.2, T2.3, T3.1 và T4.1 cần đọc Implementation Plan, Implementation Notes và Final Summary của từng task. `backlog task list --json` KHÔNG có các trường này (đã kiểm chứng trên backlog 1.55.3: chỉ có id, title, status, labels, milestone, assignees, acceptanceCriteriaCount, isReady, updatedAt, ...). README cam kết AI Hub không đọc hay ghi file task, nên cần một đường đọc qua CLI.

## Decision

Dùng `backlog task view <id> --json`. Lệnh này có `implementationPlan`, `implementationNotes`, `finalSummary`, `acceptanceCriteria`, `dependencies`, `readiness` ({isReady, isBlocked, blockingDependencies, missingDependencies}) và `dependencyGraph`.

Quy tắc đọc:

1. Dữ liệu rẻ (health, board, stale, ready) chỉ dùng `task list --json`, một lần gọi cho cả project.
2. Chỉ gọi `task view --json` khi thật sự cần plan, notes, summary hoặc tên ticket chặn, và chỉ cho tập ticket liên quan (Done trong khoảng thời gian báo cáo, hoặc ticket đang xét).
3. Gọi song song có giới hạn (tối đa 6 tiến trình) và cache theo cặp (id, updatedAt) để không gọi lại ticket chưa đổi.

Phương án đã loại:

- Đọc file markdown trực tiếp: nhanh nhất nhưng phá cam kết "AI Hub không đọc file task" và dính vào định dạng file nội bộ của backlog.
- `backlog search --json`: dùng được cho tìm kiếm nhưng không đảm bảo trả đủ trường plan, notes cho mọi task.
- Chờ backlog thêm trường vào `task list --json`: không kiểm soát được thời điểm.

## Consequences

Đo thực tế trên IdleMagician (37 task, backlog 1.55.3, máy này):

| Cách gọi | Thời gian |
|---|---|
| `task list --json` (1 lần) | khoảng 70 ms |
| `task view --json` tuần tự, 37 task | 2212 ms (trung bình 60 ms/task) |
| song song 4 | 676 ms |
| song song 8 | 460 ms |
| tổng dữ liệu 37 task | khoảng 99 KB |

Vì vậy không nên gọi `task view` cho toàn bộ project ở mỗi lần refresh 5 giây. Báo cáo và lint chỉ chạy khi người dùng yêu cầu, hoặc dùng cache theo updatedAt.

Cam kết "AI Hub không đọc file task" được giữ nguyên. README không cần sửa.

Hệ quả với `isBlocked` và `blockingDependencies`: lấy từ `task view --json`, nên T1.1 có thể nêu tên ticket chặn mà không cần đọc file. Với chi phí khoảng 60 ms/ticket, chỉ gọi cho ticket có isReady=false.
