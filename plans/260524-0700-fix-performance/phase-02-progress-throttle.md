# Phase 02: Backend Progress Event Throttle

- **Trạng thái:** ✅ Đã hoàn thành (Completed)
- **Phụ thuộc:** [Phase 01: Backend Concurrency & Safety Fixes](file:///d:/skul9x/dev/MusicYT-main/plans/260524-0700-fix-performance/phase-01-backend-safety.md)

## 🩺 Mục tiêu & Giải pháp
Khắc phục triệt để **2 Cảnh báo Quan trọng** về mặt hiệu năng giao diện và truyền dẫn dữ liệu:
1. **Render Storm ở Frontend (🟡 Warning 3):** Chỉ phát sự kiện `download-progress` khi phần trăm tiến trình tải thay đổi theo số nguyên (giới hạn tối đa đúng 101 lần phát sự kiện từ 0% đến 100%).
2. **Nghẽn kênh truyền IPC khi cài đặt dependencies (🟡 Warning 4):** Áp dụng cơ chế lọc tương tự trong hàm `DownloadFile` khi tải `yt-dlp` và `ffmpeg`. Chỉ phát sự kiện `install-progress` khi số nguyên phần trăm tiến trình thay đổi.

---

## 📋 Yêu cầu (Requirements)

### Yêu cầu chức năng (Functional)
- [x] Cải tiến hàm phân tích stdout của `yt-dlp` trong `DownloadVideo`:
  - Khai báo một biến theo dõi `lastProgress int = -1`.
  - Ép kiểu tiến trình từ chuỗi phân tích được (`match[1]`) sang float, làm tròn thành integer.
  - Chỉ gọi `a.emitEvent("download-progress", ...)` nếu số nguyên này lớn hơn `lastProgress` hiện tại.
- [x] Áp dụng tương tự cho hàm `DownloadGenericVideo`:
  - Lọc sự kiện tải của Đa nền tảng để tránh nghẽn UI.
- [x] Cập nhật vòng lặp đọc buffer 32KB của hàm `DownloadFile`:
  - Khai báo biến `lastProgress int = -1`.
  - Tính toán `progressVal := float64(downloaded) / float64(total) * 100`.
  - Chuyển đổi thành số nguyên `progressInt := int(progressVal)`.
  - Chỉ phát sự kiện lên frontend khi `progressInt != lastProgress`.

### Yêu cầu phi chức năng (Non-Functional)
- [x] **Hiệu năng:** Tiết kiệm hàng ngàn chu kỳ CPU của Frontend cho việc render và vẽ lại giao diện liên tục.
- [x] **Băng thông:** Giảm tải cho kênh truyền dữ liệu IPC (Inter-Process Communication) của Wails.

---

## 🛠️ Các bước triển khai (Implementation Steps)
1. [x] **Chỉnh sửa hàm tải dependency:** Sửa đổi `DownloadFile` trong `app.go` để triển khai bộ lọc tiến trình cài đặt.
2. [x] **Chỉnh sửa luồng phân tích tiến trình tải video:** Tối ưu hóa hàm quét stdout của `yt-dlp` trong `DownloadVideo` để lọc tần suất phát `download-progress`.
3. [x] **Áp dụng cho Đa nền tảng:** Tích hợp bộ lọc tương tự vào `DownloadGenericVideo`.

---

## 📂 Các file cần chỉnh sửa (Files to Modify)
- [app.go](file:///d:/skul9x/dev/MusicYT-main/app.go) - Sửa đổi các hàm `DownloadFile`, `DownloadVideo`, và `DownloadGenericVideo`.

---

## 🧪 Tiêu chí kiểm thử (Test Criteria)
- [x] Khi đang tải file nhạc/video lớn, theo dõi console/logs xem sự kiện `download-progress` có được phát ra tuần tự từ `0, 1, 2, ..., 100` thay vì hàng nghìn dòng tiến trình lẻ (`45.12%`, `45.13%`, `45.15%`...) hay không.
- [x] Quá trình cài đặt Windows dependencies diễn ra trơn tru mà không có hiện tượng đứng hình giao diện.

---
Next Phase: [Phase 03: Frontend Integration & Testing](file:///d:/skul9x/dev/MusicYT-main/plans/260524-0700-fix-performance/phase-03-frontend-verify.md)
