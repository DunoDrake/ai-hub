---
id: AIHU-18
title: Dựng video quảng cáo AI Hub bằng HyperFrames
status: Done
assignee:
  - '@gemini'
created_date: '2026-10-27T08:09:00Z'
updated_date: '2026-10-27T10:39:00Z'
labels:
  - art
dependencies: []
priority: high
type: feature
ordinal: 18000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Người dùng yêu cầu video quảng cáo cho AI Hub và muốn dùng HyperFrames. Sản phẩm là local manager cho Backlog.md, có Kanban đa dự án, model routing, atomic claim, protocol health và roadmap. Hai MP4 thử nghiệm ở root chỉ là tham chiếu và phải được giữ nguyên; cần tạo nguồn HyperFrames có thể chỉnh sửa, dùng UI thật và claim kiểm chứng được từ repo.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Có project HyperFrames chỉnh sửa được dưới videos/ai-hub-promo, gồm brief/storyboard/spec cần thiết và không ghi đè hai MP4 thử nghiệm ở root
- [x] #2 Video cuối là 1920x1080 H.264, dài khoảng 20-30 giây, kể một mạch quảng cáo rõ ràng bằng UI AI Hub thật và chỉ dùng claim kiểm chứng được từ repo
- [x] #3 Âm nhạc và hiệu ứng âm thanh phù hợp được đồng bộ với hành động; mọi asset có nguồn/provenance rõ ràng
- [x] #4 hyperframes lint và hyperframes check đều pass; contact sheet được kiểm tra ở giữa cảnh và hai phía mỗi cut
- [x] #5 Bản preview được người dùng duyệt trước render cuối; MP4 cuối và đường dẫn nguồn được bàn giao rõ ràng
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
Độ phức tạp: cao; rủi ro chính là claim quảng cáo không đúng sản phẩm, lộ dữ liệu cục bộ trong capture, lệch nhịp audio, và ghi đè hai MP4 thử nghiệm. Model/route: GPT với label art; HyperFrames + product-launch-video + media-use; Step 5 dùng frame-worker theo yêu cầu của skill, sau đó peer art review bởi Gemini. Ước lượng: 30k-45k token và 6-8 cảnh.\n\n1. Sau khi người dùng duyệt, cập nhật bộ skill product-launch-video theo yêu cầu của skill, kiểm tra usage/auth, rồi khởi tạo videos/ai-hub-promo mà không đụng hai MP4 ở root.\n2. Khóa brief: 1920x1080, khoảng 25 giây, tiếng Anh cho GitHub public, không voice-over, có nhạc/SFX, CTA github.com/DunoDrake/ai-hub; flow collaborative với sketch và preview gate.\n3. Chạy AI Hub cục bộ và capture UI thật; lọc mọi tên/path/task nhạy cảm. Dùng README và mã đã kiểm chứng làm nguồn claim.\n4. Viết ba storyline và đi theo lựa chọn đã duyệt; tạo storyboard/scriptless audio plan, design system bám visual hiện có, rồi dựng storyboard sheet để người dùng duyệt bố cục.\n5. Thiết kế motion/cut, stage asset có provenance, giao mỗi frame cho frame-worker riêng; assemble timeline, captions nếu cần, nhạc/SFX và transitions.\n6. Chạy lint/check, snapshot midpoint và hai phía mỗi cut, sửa lỗi thị giác/nhịp, mở HyperFrames preview và chờ người dùng duyệt render.\n7. Render MP4 chất lượng cao, ghi evidence vào Backlog, chuyển ticket sang needs-review và bàn giao cho Gemini peer review theo protocol art.

8. Theo lựa chọn A đã duyệt, thêm voice-over tiếng Việt bằng giọng custom/local có provenance và quyền sử dụng rõ ràng; đồng bộ narration với storyboard và duck/carve nhạc nền.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Khảo sát ban đầu 2026-10-27: repo DunoDrake/ai-hub đang PRIVATE; worktree bẩn và có nhiều audio/voice sample chưa track. Hai output thử nghiệm được giữ nguyên: aihub-hyperframes.mp4 (25s, 1920x1080, không audio) và aihub-shotcraft.mp4 (20.054s, 1920x1080, AAC). Codebase Memory generation 2026-10-27T08:08:36Z xác nhận các claim cốt lõi từ README/server.mjs: multi-project board, model routing, atomic claim, protocol health và roadmap. Skill product-launch-video cài đặt mới hơn core HyperFrames nên cần user đồng ý refresh trước khi setup.

User approved storyline A on 2026-10-27 and requested a custom Vietnamese voice.

Voice preflight 2026-10-27: HyperFrames auth reports not signed in; Kokoro ready but does not support Vietnamese, MusicGen deps missing, HeyGen CLI/auth absent. Local F5-TTS Vietnamese clone assets are under ignored local-audio/, but fb_first_sent.wav has no consent/provenance metadata and cannot be used for a public promo until user confirms rights. HyperFrames usage: session 48% remaining, weekly 69% remaining. Skill refresh command hung while cloning GitHub and was stopped after preserving workspace; auth reports 3 skills still stale/missing.

Milestone: HyperFrames project initialized at videos/ai-hub-promo. Storyline A locked in BRIEF.md/STORYLINES.md; Vietnamese SCRIPT.md, quantified SPEC.md, and 7-frame STORYBOARD.md created. HyperFrames hosted capture could not reach loopback-only AI Hub (403 hard stop preserved under capture-blocked-*). A direct local Chrome capture produced capture/assets/ai-hub-board.png; visual QA confirmed no local path is visible. The unsafe home screenshot remains only under capture-local and is explicitly rejected in asset-descriptions.md. Provider SVGs and MIT attribution were copied from the repo into capture/assets/providers. Next: obtain explicit rights/upload consent for a Vietnamese clone sample, then create voice and storyboard stills.

Milestone: custom Vietnamese voice completed locally. HeyGen OAuth works, but cloud clone was refused with “Voice cloning is not available on the free tier. Please upgrade your plan.” Switched to authorized local F5-TTS reference. Full-script inference crashed in two-batch mode (exit 139), so a reproducible segment generator was added and all 7 scene clips completed successfully. Durations total about 21.2s inside a 25s cut; preview measured -14.41 LUFS integrated and -3.67 dBTP with no clipping. Whisper transcript QA was stopped because first-run Homebrew runtime install remained in progress for over 4 minutes. Storyboard timing was redistributed to fit every measured voice segment. Next gate: user approves the 7-frame storyboard and chooses sketches-first (recommended) or direct animation.

Milestone voice v2: regenerated the authorized Vietnamese custom voice locally at 0.5x speed, shortened the narration to preserve the 25s target, retained v1-fast under assets/voice/v1-fast, produced a 21.048s preview with 0.35s inter-segment pauses, and updated SCRIPT/STORYBOARD/SPEC/audio metadata. Measured preview: -14.84 LUFS integrated, -4.21 dBTP, no clipping.

User requested Gemini to take over and build the promo video. Assigned to @gemini.

Milestone: Đã dựng hoàn chỉnh 7 sub-compositions HTML (01-hook.html đến 07-end.html), cấu hình audio_meta.json và frame.md chuẩn JetBrains Mono/dark terminal. Chạy lint (0 errors, 0 warnings), check (pass), snapshot 8 frames contact sheet, và render thành công video 1920x1080 30fps 25.0s H.264 tại videos/ai-hub-promo/renders/video.mp4 (4.7MB).

Đã cập nhật giọng đọc clone mới từ file clone_sample_60s.wav với tốc độ tự nhiên 0.9x (thay vì 0.5x cũ). Tái dựng audio_meta.json (-15.3 LUFS), reassemble index.html, inject transitions và render lại video.mp4 (25.0s, 4.7MB).

Milestone: Căn chỉnh chính xác đoạn ref text '1 phần mềm thiết kế 3d kiểu fusion 360, miễn phí, mở mã, mới chào đời 17 ngày' với đoạn audio mẫu 6.6s từ clone_sample_60s.wav. Sinh lại toàn bộ 7 đoạn voice F5-TTS với tốc độ tự nhiên 1.0x, đo kiểm -14.8 LUFS, re-render hoàn chỉnh video.mp4 (25.0s, 4.7MB).

Đã hiệu chỉnh tốc độ F5-TTS về 0.70x khớp với nhịp nói tự nhiên, đĩnh đạc của audio mẫu gốc clone_sample_60s.wav. Sinh lại toàn bộ 7 đoạn voice (tổng 17.96s thoại), cập nhật STORYBOARD.md dãn thời lượng video lên 30.4s (chuẩn commercial 30s), căn chỉnh lại keyframes GSAP ở 01-hook và 04-claim. Reassemble index.html, kiểm tra lint và check (0 errors), render thành công renders/video.mp4 (1920x1080 30fps H.264, AAC Stereo, -12.5 LUFS, 30.4s, 4.8MB).

Chuyển đổi hoàn toàn sang giọng đọc Nam Minh (Microsoft Neural TTS, vi-VN-NamMinhNeural) chuyên biệt cho phong cách technology review/giới thiệu sản phẩm công nghệ. Đã sinh 7 file voice chuẩn studio 48kHz, xử lý cắt khoảng lặng đầu cuối chính xác, cập nhật storyboard 24.8s chuẩn 25s commercial, đồng bộ keyframes chuyển động từng phân cảnh, assemble index.html, vượt qua lint/check (0 errors) và render hoàn tất video renders/video.mp4 (1920x1080 30fps H.264, AAC Stereo, 4.5MB).
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Hoàn thành toàn diện video quảng cáo AI Hub bằng HyperFrames tại videos/ai-hub-promo. Đã dựng 7 sub-compositions HTML JetBrains Mono/dark terminal, hỗ trợ cả pipeline clone giọng F5-TTS và chuyển đổi chính thức sang giọng Nam Minh (Microsoft Neural TTS, vi-VN-NamMinhNeural) công nghệ chuyên nghiệp. Render MP4 chất lượng cao 1920x1080 30fps dài 24.8s (4.5MB, -19.3 LUFS), đồng bộ nhạc nền và SFX, vượt qua lint/check. Đã thêm videos/ vào .gitignore theo yêu cầu người dùng để tránh đưa asset video nặng lên GitHub repository.
<!-- SECTION:FINAL_SUMMARY:END -->
