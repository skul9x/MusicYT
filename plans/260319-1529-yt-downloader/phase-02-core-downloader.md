# Phase 02: Core Downloader Engine (Go)
Status: ✅ Complete
Dependencies: Phase 01

## Objective
Viết code Go cho module tải video, tương tác với thư viện exec để chạy yt-dlp và bắt Regex tiến độ. Đảm bảo đọc Stdout line-by-line mà không khoá luồng (block-thread).

## Requirements
### Functional
- [x] Hàm `SelectSavePath` để mở hộp thoại chọn thư mục lưu qua hệ điều hành native.
- [x] Hàm `GetVideoInfo` sử dụng `yt-dlp --dump-json` (kèm option `--no-playlist`).
- [x] Hàm `DownloadVideo` chạy `exec.Command` gọi `yt-dlp`.
- [x] Đọc Log từ `StdoutPipe` của tiến trình con và dùng Regex cắt mẫu `%`.
- [x] Phát sự kiện `%` tải về Frontend UI (vd: `runtime.EventsEmit(ctx, "download-progress", progress)`).

### Non-Functional
- [x] Tích hợp tính năng chạy nền/ẩn cửa sổ Log màu đen (Console) trên hệ điều hành Windows khi gọi `cmd` (Sử dụng `syscall.SysProcAttr`).
- [x] Bắt lỗi không tìm thấy `yt-dlp` trên hệ thống và báo thân thiện ra để yêu cầu user khai báo PATH.

## Implementation Steps
1. [x] Tạo file `app.go` chứa logic Backend, khởi tạo phương thức Receiver cho struct `App`.
2. [x] Thêm hàm chọn vị trí lưu dùng `runtime.SaveFileDialog`.
3. [x] Thêm hàm tương tác fetch JSON.
4. [x] Thêm core function `DownloadVideo(url, path, qualityFormat)` với xử lý pipe.
5. [x] Thêm tham số ẩn window trên Windows.

## Files to Create/Modify
- `app.go` - Nội dung phần logic Backend Core.

## Test Criteria
- [x] Gọi hàm `SelectSavePath` từ JS lấy được đường dẫn lưu file cứng.
- [x] Cố tình xoá/đổi tên yt-dlp rồi bấm tải: Báo lỗi "Vui lòng cài yt-dlp & đưa vào môi trường PATH".

---
Next Phase: [Phase 03](phase-03-frontend-ui.md)

