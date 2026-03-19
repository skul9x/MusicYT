# Phase 01: Setup Environment
Status: ✅ Complete
Dependencies: None

## Objective
Khởi tạo project Wails cơ bản, loại bỏ các file template dư thừa và chuẩn bị cấu trúc Frontend/Backend. Thỏa mãn tính siêu nhẹ.

## Requirements
### Functional
- [x] Khởi tạo Wails project với template `react-ts`.
- [x] Cài đặt Tailwind CSS cho frontend.
- [x] Dọn dẹp các file boilerplate không cần thiết của Wails.

### Non-Functional
- [ ] Cấu trúc code sạch sẽ, chia thư mục minh bạch.

## Implementation Steps
1. [x] Cài đặt hoặc đảm bảo Wails CLI đã sẵn sàng.
2. [x] Chạy lệnh `wails init` (Đã dev vào thư mục gốc MusicYT).
3. [x] cd vào `frontend` và cài đặt Tailwind CSS: `npm install -D tailwindcss postcss autoprefixer`, `npx tailwindcss init -p`.
4. [x] Cấu hình Tailwind trong `tailwind.config.js` và `index.css`.
5. [x] Tạo cấu trúc thư mục frontend: `src/components`, `src/hooks`.

## Files to Create/Modify
- `wails.json` - Update thông tin app.
- `frontend/tailwind.config.js` - Cấu hình quét file React.
- `frontend/src/index.css` - Import Tailwind core.

## Test Criteria
- [ ] Mở terminal chạy `wails dev` và giao diện React hiện lên kèm Tailwind styling hoạt động ổn định.

---
Next Phase: [Phase 02](phase-02-core-downloader.md)
