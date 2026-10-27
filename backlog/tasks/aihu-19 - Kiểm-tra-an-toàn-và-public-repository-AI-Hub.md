---
id: AIHU-19
title: Kiểm tra an toàn và public repository AI Hub
status: To Do
assignee: []
created_date: '2026-10-27T08:09:00Z'
labels:
  - dev-high
dependencies: []
priority: high
type: task
ordinal: 19000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
GitHub repository DunoDrake/ai-hub hiện PRIVATE và người dùng yêu cầu public. Worktree hiện có nhiều thay đổi cùng các file audio/voice cá nhân chưa track, nên phải kiểm tra tracked content lẫn toàn bộ Git history trước khi đổi visibility để tránh công khai bí mật, dữ liệu cá nhân hoặc asset không đủ quyền.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Tracked tree và toàn bộ Git history được quét secrets, token, dữ liệu cá nhân, đường dẫn cục bộ nhạy cảm và binary/asset có rủi ro; mọi blocker được xử lý hoặc ghi rõ trước khi public
- [ ] #2 LICENSE, README, hướng dẫn cài đặt/chạy và attribution đủ cho người dùng public; kiểm tra liên quan đều pass trên commit dự kiến phát hành
- [ ] #3 Chỉ các file đã duyệt được commit/push; các file audio, voice sample, output thử nghiệm và thay đổi không liên quan không bị đưa lên ngoài ý muốn
- [ ] #4 Repository DunoDrake/ai-hub được đổi visibility sang PUBLIC bằng GitHub CLI và gh repo view xác nhận PUBLIC
- [ ] #5 Một fresh clone từ URL public cài đặt/chạy kiểm tra thành công theo README
<!-- AC:END -->
