# Changelog

## [2026-03-20]
### Added
- **Hướng dẫn & Tự cài đặt công cụ (Installation Guide):** Màn hình hướng dẫn tự động bật lên khi thiếu `yt-dlp` hoặc `ffmpeg`.
- **Auto-Installer (Windows):** Tự tải binaries về `C:\tools` và tự động cập nhật System PATH bằng PowerShell.
- **Auto-Installer (Linux):** Tích hợp `pkexec` để cài đặt an toàn `curl`, `yt-dlp` và `ffmpeg` qua `apt`.
- **Cơ chế Tự cập nhật (Self-Update):** Nút "Fix Lỗi Tải Video" để ép cập nhật `yt-dlp` khi YouTube đổi thuật toán.
- **Progress Tracking:** Hiển thị tiến trình tải công cụ trên UI (Windows).

### Changed
- Refactor `App.tsx` tách biệt logic hướng dẫn cài đặt thành component `InstallGuideModal.tsx` riêng biệt.
- Backend `app.go` hỗ trợ đa nền tảng hơn với detection OS trả về frontend.

### Fixed
- Lỗi không nhận diện đúng môi trường (OS Tab) khi mới khởi động ứng dụng.


## [2026-03-19]
### Added
- Giao diện mới theo phong cách Vibe Cosing (Glassmorphism).
- Tính năng tự động định vị thư mục Downloads mặc định cho người dùng.
- Hỗ trợ phím `Enter` để rút gọn thao tác tải.
- Xác thực URL YouTube cơ bản bằng `includes` trên JS.

### Changed
- Refactor `App.tsx` áp dụng thiết kế thẻ kính (glass card) và gradient neon.
- Logic Backend `app.go` giờ đây gọn gàng hơn, tối giản code thừa liên quan đến `runtime`.

### Fixed
- Lỗi import không đồng đều và module JS không nhận type .d.ts của Wails.
