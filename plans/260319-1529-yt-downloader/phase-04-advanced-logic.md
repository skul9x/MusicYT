# Phase 04: Advanced Features (Quality & Playlists)
Status: ⬜ Pending
Dependencies: Phase 03

## Objective
Cover toàn bộ Edge Cases đã xác nhận với User: Mặc định không tải Playlist, tuỳ chọn Quality, xuất file âm thanh `m4a` và tự động gắn Cover Art của YouTube vào file tải về.

## Requirements
### Functional
- [ ] Option vô hiệu hóa Playlist: Thêm flag `--no-playlist` vào hệ thống core downloader Go.
- [ ] Nâng cấp UI ở Frontend: Thêm nút Select (Dropdown) để User chọn Option tải: `Mặc định tốt nhất`, `Video 1080p`, `Video 720p`, `Chỉ tải Âm thanh (m4a)`.
- [ ] Mapping tuỳ chọn Audio sang flag `-x --audio-format m4a` và `--embed-thumbnail` đối với yt-dlp để lấy ảnh bìa.

### Non-Functional
- [ ] Đảm bảo thư viện `ffmpeg` của người dùng có hỗ trợ gắn thumbnail vào `m4a` mà không bị gián đoạn tiến trình.
- [ ] Tránh giật lag ứng dụng nếu yt-dlp load thông tin lâu.

## Implementation Steps
1. [ ] Map giá trị Format string lên Dropdown options tại file `App.tsx`.
2. [ ] Truyền chuỗi option này qua Go ở hàm `DownloadVideo`.
3. [ ] Tại hàm `DownloadVideo`, nếu formatOption là "m4a", push các flags (`--extract-audio`, `--audio-format`, `m4a`, `--embed-thumbnail`) vào mảng tham số của `exec.Command`.
4. [ ] Khớp biến số `--no-playlist` vào biến khởi tạo lệnh để luôn bảo vệ người dùng không bị tải lạc.

## Files to Create/Modify
- `app.go` - Sửa param logic.
- `frontend/src/App.tsx` - Sửa giao diện Dropdown chọn định dạng.

## Test Criteria
- [ ] Copy URL của video nằm trong playlist tải -> Chỉ thấy 1 video duy nhất.
- [ ] Chuyển trạng thái sang `m4a`, bấm tải -> Kết quả sinh file ra `.m4a` mở lên nghe có hình ảnh đại diện (thumbnail) của video hiển thị chuẩn.

---
Next Phase: [Phase 05](phase-05-integration-testing.md)
