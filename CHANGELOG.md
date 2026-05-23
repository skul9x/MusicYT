# Changelog

## [2026-05-23]
### Added
- **Tab Đa Nền Tảng (Universal Download):** Hỗ trợ tải video/audio từ bất kỳ nền tảng nào (TikTok, Douyin, Facebook, Instagram, Twitter/X, Bilibili...)
- **Auto-Detect Platform Badge:** Tự động nhận diện thương hiệu logo của các mạng xã hội chính ngay khi người dùng dán link.
- **Tự động cài đặt ffprobe.exe:** Bổ sung download và cài đặt `ffprobe.exe` vào `C:\tools\` để hỗ trợ trích xuất codec âm thanh tốt nhất của `yt-dlp` trên Windows.
- **Bộ kiểm thử backend (Unit Testing):** Bổ sung file `app_test.go` kiểm thử đơn vị Go hoàn chỉnh (PASS 100%).

### Changed
- **Default "Chỉ Âm thanh" (YouTube Music):** Mặc định chọn định dạng `'m4a'` khi mở tab YouTube Music để tối ưu trải nghiệm người dùng.
- **Premium Tab Bar UI:** Thiết kế thanh tab Glassmorphism mượt mà để chuyển đổi nhanh chóng.

### Fixed
- Lỗi `WARNING: unable to obtain file audio codec with ffprobe` khi tải âm thanh TikTok do thiếu `ffprobe` trên môi trường Windows.
- Lỗi biên dịch JSX/TSX và đồng bộ hóa bindings kiểu dữ liệu của Wails.


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
