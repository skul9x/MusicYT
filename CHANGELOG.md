# Changelog

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
