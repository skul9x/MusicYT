# Phase 03: Kiểm thử tích hợp & Xác minh (Integration Testing & Verification)

Status: ✅ Completed
Dependencies: [Phase 02: Cập nhật Frontend (React/TS)](file:///d:/skul9x/dev/MusicYT-main/plans/260523-1835-fix-audit-issues/phase-02-frontend.md)

## 🎯 Mục tiêu (Objective)
Thực hiện chạy thử nghiệm tích hợp toàn bộ các tính năng vừa vá lỗi để đảm bảo tính an toàn bảo mật, tính năng nạp PATH động hoạt động trơn tru và cơ chế hủy tiến trình giải phóng 100% tài nguyên CPU/Internet.

---

## 📋 Kịch bản kiểm thử (Test Cases)

### 🧪 Test Case 1: Kiểm thử bảo mật chặn UNC Path (NTLM Hash Leak Prevention)
* **Các bước thực hiện:**
  1. Ở Tab YouTube Music, đổi đường dẫn lưu trữ thành một UNC path mạng giả lập như: `\\127.0.0.1\share` hoặc `//localhost/share`.
  2. Bấm nút **📂 Mở thư mục**.
* **Kết quả mong muốn:**
  - Ứng dụng hiển thị lỗi màu đỏ: `❌ không hỗ trợ đường dẫn mạng UNC để đảm bảo bảo mật`.
  - Không có tiến trình `explorer` nào được gọi, không có kết nối SMB mạng nào được tạo ra.

### 🧪 Test Case 2: Kiểm thử chuẩn hóa đường dẫn (Path Normalization)
* **Các bước thực hiện:**
  1. Cấu hình thư mục lưu ở Windows bằng dấu gạch chéo chuẩn UNIX: `C:/Users/Admin/Downloads` (hoặc tương đương).
  2. Bấm nút **📂 Mở thư mục**.
* **Kết quả mong muốn:**
  - Thư mục được mở thành công trên Windows Explorer mà không bị lỗi mở thư mục mặc định (*My Documents*).
  - Check log/output Go thấy đường dẫn truyền vào explorer đã được đổi thành `C:\Users\Admin\Downloads`.

### 🧪 Test Case 3: Kiểm thử nạp biến môi trường động (PATH Propagation Test)
* **Các bước thực hiện:**
  1. Giả lập môi trường chưa cài đặt yt-dlp bằng cách tạm thời xóa thư mục `C:\tools` (nếu có) hoặc đổi tên file `yt-dlp.exe` trong đó.
  2. Bật ứng dụng lên, app sẽ báo thiếu dependency.
  3. Bấm nút Tự động cài đặt dependencies.
  4. Sau khi cài đặt hoàn tất, kiểm tra ngay xem app đã báo Dependencies OK chưa mà không được tắt app bật lại.
* **Kết quả mong muốn:**
  - Ứng dụng tự động phát hiện được công cụ ngay lập tức sau khi tải xong, chuyển trạng thái sang màu xanh lục OK mà không cần khởi động lại.

### 🧪 Test Case 4: Kiểm thử Hủy tiến trình tải (Process Cancellation Test)
* **Các bước thực hiện:**
  1. Dán một liên kết video/nhạc rất dài (ví dụ: video dài 1 tiếng hoặc danh sách phát).
  2. Bấm **Bắt đầu tải**.
  3. Khi thanh tiến trình hiển thị phần trăm (ví dụ: 5%), bấm nút **🚫 Hủy tải nhạc** (hoặc **🚫 Hủy tải video**).
  4. Mở Task Manager (Windows) hoặc Monitor (Linux) để kiểm tra các tiến trình `yt-dlp` và `ffmpeg`.
* **Kết quả mong muốn:**
  - Dòng trạng thái báo: `❌ Đã hủy tải nhạc theo yêu cầu.` (hoặc tương tự).
  - Tiến trình tải dừng ngay lập tức.
  - Các tiến trình `yt-dlp.exe` và `ffmpeg.exe` biến mất hoàn toàn khỏi danh sách tiến trình đang hoạt động (không còn chạy ngầm gây rò rỉ tài nguyên).

---

## 🚀 Lệnh chạy thử nghiệm & Build kiểm tra
* Chạy ứng dụng ở chế độ nhà phát triển để xem log trực tiếp:
  ```powershell
  wails dev
  ```
* Biên dịch bản build production hoàn thiện để test trên cả Windows/Linux:
  ```powershell
  wails build
  ```
