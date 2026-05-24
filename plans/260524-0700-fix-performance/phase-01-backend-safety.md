# Phase 01: Backend Concurrency & Safety Fixes

- **Trạng thái:** ✅ Đã hoàn thành (Completed)
- **Phụ thuộc:** Không có (Bắt đầu dự án)

## 🩺 Mục tiêu & Giải pháp
Khắc phục triệt để **2 Triệu chứng Nghiêm trọng**:
1. **Quá tải CPU/RAM khi tải song song (🔴 Critical 1):** Backend Go sẽ sử dụng khóa loại trừ (`sync.Mutex`) và cờ trạng thái `activeDownload` để ngăn chặn chạy nhiều luồng `yt-dlp` đồng thời.
2. **Khởi chạy tiến trình mới đè lên tiến trình cũ đang hủy (🔴 Critical 2):** Sử dụng `sync.WaitGroup` để đồng bộ hóa, bắt buộc tiến trình mới phải đợi cho đến khi tiến trình đang chạy trước đó hoàn tất hủy hoàn toàn và giải phóng tài nguyên.

---

## 📋 Yêu cầu (Requirements)

### Yêu cầu chức năng (Functional)
- [x] Thêm các trường bảo vệ đồng thời vào cấu trúc `App` trong `app.go`:
  - `downloadMu sync.Mutex` - Đồng bộ hóa truy cập trạng thái tải.
  - `activeDownload bool` - Cờ đánh dấu đang có tiến trình tải hoạt động.
  - `downloadWg sync.WaitGroup` - Đồng bộ hóa chờ tiến trình tải cũ hủy xong.
- [x] Bổ sung cơ chế khóa trong các hàm tải chính:
  - `DownloadVideo`
  - `DownloadGenericVideo`
- [x] Sửa đổi logic `CancelDownload`:
  - Tự động hủy context và đảm bảo `downloadWg` giải phóng khi tiến trình thực sự kết thúc.
- [x] Sửa đổi logic khởi chạy tải mới:
  - Gọi hủy tiến trình cũ (`a.CancelDownload()`).
  - Gọi chặn an toàn (`a.downloadWg.Wait()`) để chờ tiến trình cũ giải phóng hoàn toàn trước khi tiếp tục.

### Yêu cầu phi chức năng (Non-Functional)
- [x] **Hiệu năng:** Ngăn chặn hoàn toàn việc RAM/CPU bị chiếm dụng nhân đôi do chạy song song.
- [x] **Độ tin cậy:** Tránh lỗi xung đột tranh chấp ghi đè file trên đĩa cứng (File lock).

---

## 🛠️ Các bước triển khai (Implementation Steps)
1. [x] **Chẩn đoán cấu trúc:** Cập nhật định nghĩa `App` struct trong `app.go` để bổ sung các công cụ đồng bộ.
2. [x] **Xây dựng cơ chế khóa an toàn:** Viết phương thức phụ trợ `acquireDownloadLock` và giải phóng lock tương ứng để bọc an toàn trong các hàm tải.
3. [x] **Áp dụng cơ chế đồng bộ WaitGroup:** Tích hợp `a.downloadWg` vào `DownloadVideo` và `DownloadGenericVideo`, đặt `a.downloadWg.Add(1)` và `defer a.downloadWg.Done()`.
4. [x] **Kiểm soát hủy tải:** Đảm bảo khi gọi `CancelDownload()`, signal hủy được truyền xuống tiến trình và không gây dead-lock.

---

## 📂 Các file cần chỉnh sửa (Files to Modify)
- [app.go](file:///d:/skul9x/dev/MusicYT-main/app.go) - Bổ sung biến bảo vệ đồng bộ, tích hợp Mutex & WaitGroup vào các hàm `DownloadVideo`, `DownloadGenericVideo`, `CancelDownload`.

---

## 🧪 Tiêu chí kiểm thử (Test Criteria)
- [x] Kiểm tra xem khi bấm tải video thứ nhất, nếu có yêu cầu tải video thứ hai gửi xuống Backend, Backend sẽ từ chối hoặc xếp hàng an toàn thay vì chạy song song cả hai tiến trình `yt-dlp`.
- [x] Kiểm tra khi bấm nút **Hủy** rồi nhấn **Tải lại** ngay lập tức, tiến trình cũ kết thúc hoàn toàn trước khi tiến trình mới khởi động.
- [x] Đảm bảo không xảy ra hiện tượng treo đơ hay dead-lock trong Go runtime.

---
Next Phase: [Phase 02: Backend Progress Event Throttle](file:///d:/skul9x/dev/MusicYT-main/plans/260524-0700-fix-performance/phase-02-progress-throttle.md)
