# Plan: Sửa lỗi TikTok Chặn Tải Nhạc bằng File Cookies.txt (Cách B - Khuyên Dùng)
Created: 2026-05-28
Status: 🟡 In Progress

## 1. Overview (Tổng quan)
Khi tải nhạc từ TikTok gặp lỗi `exit status 1` (`Unexpected response from webpage request`), nguyên nhân là TikTok chặn các bot tự động bằng hệ thống bảo mật / Captcha.
Kế hoạch này sẽ giải quyết triệt để vấn đề bằng cách **gửi kèm tệp Cookie Netscape (`.txt`)** được xuất từ trình duyệt thực tế của bạn (Firefox, Chrome, Edge, Opera...) trên cả hai hệ điều hành **Linux** và **Windows**.

### Vì sao chọn Cách B (File cookies.txt) là tối ưu nhất?
1. **Hoạt động đa nền tảng 100%**: Hỗ trợ xuất sắc cả Windows và Linux.
2. **Không lo xung đột**: Tránh hoàn toàn lỗi "Database is locked" khi trình duyệt đang mở (vì không truy cập trực tiếp SQLite của browser).
3. **Bất chấp Sandbox/Quyền hạn**: Vượt qua rào cản của môi trường Snap (trên Linux) hoặc quyền Admin (trên Windows).
4. **Hỗ trợ mọi trình duyệt**: Dù bạn dùng Edge, Chrome, Firefox, hay Brave, chỉ cần cài extension xuất cookie ra file `.txt` là hoạt động hoàn hảo.

## 2. Tech Stack & Thiết kế
- **Backend**: Go (Wails) - Bổ sung hàm chọn file native `SelectCookiesFile` và truyền cờ `--cookies /path/to/cookies.txt` vào lệnh `yt-dlp` của `DownloadGenericVideo` và `GetGenericVideoInfo`.
- **Frontend**: React (Vite + Tailwind CSS) - Thêm khu vực cấu hình cấu hình "Bypass TikTok Captcha", cho phép chọn file `.txt` và lưu đường dẫn bền vững vào `localStorage`.
- **Testing**: Tạo các file test Go tự động xác thực việc kết hợp cờ `--cookies` không gây lỗi cú pháp và chạy thử nghiệm tích hợp.

## 3. Danh sách các Giai đoạn (Phases)

| Phase | Tên Giai Đoạn | Trạng thái | Tiến độ | File chi tiết |
| :--- | :--- | :--- | :--- | :--- |
| **01** | Bổ sung hàm chọn file & cờ Cookies ở Backend | ⬜ Pending | 0% | [phase-01-backend.md](file:///home/skul9x/Desktop/Test_code/MusicYT-main/plans/tiktok-cookies-fix/phase-01-backend.md) |
| **02** | Xây dựng Giao diện Chọn File Cookies & Kết nối Frontend | ⬜ Pending | 0% | [phase-02-frontend.md](file:///home/skul9x/Desktop/Test_code/MusicYT-main/plans/tiktok-cookies-fix/phase-02-frontend.md) |
| **03** | Kiểm thử Tích hợp Đa nền tảng (Windows & Linux) | ⬜ Pending | 0% | [phase-03-verification.md](file:///home/skul9x/Desktop/Test_code/MusicYT-main/plans/tiktok-cookies-fix/phase-03-verification.md) |

## 4. Quick Commands
- Chạy thử nghiệm kiểm tra cờ cookies: `go test -v -run TestTikTokCookiesArgsGeneration`
- Chạy toàn bộ kiểm thử: `go test -v ./...`
- Lưu trữ ngữ cảnh làm việc: `/save-brain`

---
Next Phase: [Phase 01: Backend & Test Setup](file:///home/skul9x/Desktop/Test_code/MusicYT-main/plans/tiktok-cookies-fix/phase-01-backend.md)
