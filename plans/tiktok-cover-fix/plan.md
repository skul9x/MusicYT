# Plan: Sửa lỗi Cover Art TikTok bị đen khi tải nhạc
Created: 2026-05-25
Status: 🟡 In Progress

## 1. Overview (Tổng quan)
Khi tải nhạc dạng `m4a_cover` từ TikTok, `yt-dlp` tự động nhúng `originCover` (là ảnh đen 100% do API TikTok cung cấp ở cuối danh sách thumbnail). Kế hoạch này sẽ thay đổi quy trình tải thành 2 bước (2-step download):
- **Bước 1**: Dùng `yt-dlp` tải nhạc và tất cả thumbnail riêng biệt (không nhúng tự động).
- **Bước 2**: Tìm đúng file `.cover.jpg` (ảnh bìa thật) và dùng `ffmpeg` để nhúng thủ công, sau đó dọn dẹp các file tạm.

## 2. Tech Stack & Công cụ
- **Backend**: Go (Wails)
- **Công cụ hỗ trợ**: `yt-dlp` (phiên bản mới nhất), `ffmpeg` (để nhúng cover)
- **Testing**: Thư viện kiểm thử của Go (`testing`) cùng các hàm xử lý ảnh để kiểm tra độ sáng trung bình (average brightness) của ảnh bìa được trích xuất.

## 3. Danh sách các Phases

| Phase | Tên Giai Đoạn | Trạng thái | Tiến độ | File chi tiết |
| :--- | :--- | :--- | :--- | :--- |
| **01** | Thiết lập môi trường kiểm thử & Viết Test tái hiện lỗi (TDD) | ⬜ Pending | 0% | [phase-01-test-setup.md](file:///home/skul9x/Desktop/Test_code/MusicYT-main/plans/tiktok-cover-fix/phase-01-test-setup.md) |
| **02** | Hiện thực hóa logic Tải 2 bước & Hàm helper nhúng Cover | ⬜ Pending | 0% | [phase-02-implementation.md](file:///home/skul9x/Desktop/Test_code/MusicYT-main/plans/tiktok-cover-fix/phase-02-implementation.md) |
| **03** | Xác thực & Xử lý các trường hợp biên (Edge cases) | ⬜ Pending | 0% | [phase-03-verification.md](file:///home/skul9x/Desktop/Test_code/MusicYT-main/plans/tiktok-cover-fix/phase-03-verification.md) |

## 4. Quick Commands
- Chạy thử nghiệm tái hiện lỗi: `go test -v -run TestTikTokBlackCover`
- Chạy kiểm thử toàn bộ: `go test -v ./...`
- Lưu lại context làm việc: `/save-brain`

---
Next Phase: [Phase 01: Test Setup](file:///home/skul9x/Desktop/Test_code/MusicYT-main/plans/tiktok-cover-fix/phase-01-test-setup.md)
