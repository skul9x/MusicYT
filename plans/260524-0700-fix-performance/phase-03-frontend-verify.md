# Phase 03: Frontend Integration & Testing

- **Trạng thái:** ✅ Đã hoàn thành (Completed)
- **Phụ thuộc:** [Phase 02: Backend Progress Event Throttle](file:///d:/skul9x/dev/MusicYT-main/plans/260524-0700-fix-performance/phase-02-progress-throttle.md)

## 🩺 Mục tiêu & Giải pháp
Tích hợp giao diện Frontend và tiến hành kiểm tra tổng quát (Integration Testing) toàn bộ hệ thống sau khi vá lỗi hiệu năng:
1. Đảm bảo Frontend React hoạt động hoàn hảo với tần suất sự kiện mới từ Backend (nhận tiến trình số nguyên mượt mà).
2. Chạy các unit test Go sẵn có của dự án để kiểm chứng không làm hỏng các tính năng cốt lõi.
3. Thực hiện kiểm thử thủ công và đo lường CPU tải thực tế.

---

## 📋 Yêu cầu (Requirements)

### Yêu cầu chức năng (Functional)
- [x] Chạy các Go unit test hiện có để xác minh tính ổn định:
  - `app_test.go`
  - `select_path_test.go`
  - `tiktok_download_test.go`
- [x] Xác minh Frontend React (`App.tsx` và `UniversalDownloader.tsx`):
  - Kiểm tra xem tiến trình thanh trượt chạy mượt mà.
  - Các nút bấm bị khóa và mở khóa đúng lúc khi bắt đầu và hoàn tất tải.

### Yêu cầu phi chức năng (Non-Functional)
- [x] **Mượt mà (Fluidity):** Thanh tiến trình React tăng dần đều từ 0% đến 100% không bị khựng giật.
- [x] **Độ ổn định:** App hoạt động trơn tru sau nhiều lượt tải và hủy liên tục.

---

## 🛠️ Các bước triển khai (Implementation Steps)
1. [x] **Kiểm thử Unit Test Go:** Chạy lệnh `go test -v ./...` trong workspace để xác minh toàn bộ các test case Go vượt qua thành công.
2. [x] **Kiểm thử Tải & Hủy liên tục:** Chạy ứng dụng ở chế độ nhà phát triển, tiến hành tải một video YouTube dài, nhấn Hủy, rồi lập tức nhấn Tải lại để kiểm chứng tính năng chặn đè và đợi đồng bộ.
3. [x] **Kiểm chứng CPU/RAM:** Theo dõi CPU tiêu thụ của trình duyệt (Wails Webview) khi tải để so sánh độ mượt so với trước khi tối ưu.

---

## 📂 Các file cần kiểm tra/chạy (Files to Run)
- Lệnh chạy kiểm thử backend: `go test -v ./...`
- Lệnh chạy kiểm thử frontend và build: `wails dev` (hoặc build dev server)

---

## 🧪 Tiêu chí nghiệm thu (Acceptance Criteria)
- [ ] Toàn bộ unit tests Go vượt qua `PASS`.
- [ ] Thanh tiến trình tăng mượt mà, không bị giật đơ giao diện.
- [ ] Chức năng Hủy tải hoạt động nhanh chóng, không để lại tiến trình `yt-dlp` chạy ngầm.

---
*Hoàn tất chẩn đoán và điều trị hiệu năng!*
