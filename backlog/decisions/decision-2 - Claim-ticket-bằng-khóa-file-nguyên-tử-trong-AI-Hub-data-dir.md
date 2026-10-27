---
id: decision-2
title: Claim ticket bằng khóa file nguyên tử trong AI Hub data dir
date: '2026-10-27T07:36:00Z'
status: accepted
---
## Context

Claim trực tiếp dùng `backlog task edit <id> -a @provider -s "In Progress"` không nguyên tử. Thử 5 vòng với hai tiến trình GPT và Claude cùng claim một ticket: cả hai luôn thoát mã 0, người ghi cuối thắng ngẫu nhiên (Claude 3 vòng, GPT 2 vòng). Chỉ ghi rồi đọc lại không đủ: tiến trình A có thể đọc lại mình là chủ rồi tiến trình B mới ghi đè.

Backlog 1.55.3 không có lệnh claim, compare-and-swap hay lock trong `backlog --help` / `task edit --help`.

## Decision

Thêm `backlog-phase claim <ticket-id> --provider <name>`. Lệnh dùng khóa thư mục nguyên tử:

1. Tạo `~/.config/ai-hub/locks/<project-hash>-<ticket-id>.lock` bằng `mkdirSync`; chỉ một tiến trình thắng. Không lưu lock trong repo để không tạo git noise.
2. Trong khóa, đọc `task view --json` và từ chối nếu task không còn To Do, bị blocked (`isReady=false`), đã có assignee, hoặc tier không phù hợp provider.
3. Gọi `backlog task edit` để gán assignee và chuyển In Progress; đọc lại để xác nhận assignee/status.
4. Xóa khóa trong `finally`. Khóa cũ quá 60 giây được xem là stale và xóa trước một lần retry (process chết giữa claim).

Provider boundaries dùng chung với lệnh `next`: Claude dev-high/dev-medium/dev-low; GPT dev-medium/art; Gemini art; DeepSeek dev-low.

## Consequences

- Các agent dùng `backlog-phase claim`, không dùng `backlog task edit` trực tiếp để claim. Race trong cùng máy bị loại bỏ.
- Nếu agent ngoài AI Hub vẫn chạy `backlog task edit` trực tiếp, nó không tôn trọng khóa; protocol phải được cập nhật ở T1.4.
- Khóa là local-only. Hai máy cùng sửa một repo qua network filesystem không được bảo vệ; ngoài phạm vi AI Hub hiện tại.
- Stale timeout 60 giây cho phép phục hồi sau crash nhưng có cửa sổ nhỏ nếu một lệnh claim treo lâu hơn 60 giây. `task edit` hiện có timeout 15 giây, nên biên này an toàn hơn 4 lần timeout.
