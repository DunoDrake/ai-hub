---
id: AIHU-22
title: >-
  Dashboard native theo yêu cầu: bỏ Start/Stop, tự start khi mở, tự stop khi
  idle
status: To Do
assignee: []
created_date: '2026-10-28T09:06:00Z'
updated_date: '2026-10-28T09:06:00Z'
labels:
  - dev-medium
dependencies: []
references:
  - server.mjs
  - index.html
  - docs/operations.md
  - docs/api.md
priority: medium
type: enhancement
ordinal: 22000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Hiện mỗi project có nút Start/Stop dashboard và startDashboard() (server.mjs) spawn một process 'backlog browser' riêng trên port 6500-6599. Người dùng không hiểu vì sao phải mở thêm server khi AI Hub đã có board riêng (#board/<id>). Giữ dashboard native của Backlog.md như một view phụ, nhưng quản lý vòng đời ẩn: người dùng chỉ bấm Open, không phải biết có process con.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Card project không còn nút Start/Stop; có một nút 'Open native dashboard' tự start process nếu chưa chạy rồi mở link
- [ ] #2 Process native tự stop sau thời gian idle cấu hình được (env AI_HUB_DASH_IDLE_MINUTES, có giá trị mặc định); mở lại thì start lại
- [ ] #3 Tái sử dụng logic reuse/allocate port hiện có; manager shutdown vẫn dọn hết process con; không để orphan khi idle-stop
- [ ] #4 API: endpoint start/stop cũ được thay hoặc giữ tương thích có chủ đích; docs/api.md, docs/operations.md, README.md và guides liên quan được cập nhật cùng thay đổi
- [ ] #5 Có test (node --test tests/*.test.mjs) cho idle-stop và mở lại; smoke thật: mở, chờ idle, xác nhận process và port đã được giải phóng
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Lưu ý cho worker: native dashboard là process riêng, traffic không đi qua manager, nên 'idle' không tự biết được. Cần chọn cách đo (vd. đếm kết nối lsof, hoặc proxy, hoặc heartbeat từ tab AI Hub) và ghi lý do vào plan. Nếu không đo được đáng tin thì escalate lên dev-high thay vì đoán.
<!-- SECTION:NOTES:END -->
