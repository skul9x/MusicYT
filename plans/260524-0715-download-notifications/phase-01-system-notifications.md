# Phase 01: Xây dựng thông báo Native OS ở Backend Go

Trạng thái: ✅ Đã hoàn thành (Completed)
Phụ thuộc: Không có

## 🎯 Mục tiêu
Triển khai tính năng đẩy thông báo trực tiếp ra màn hình của hệ điều hành (Windows/macOS/Linux) từ backend Go. Tính năng này hoạt động độc lập, tự động phát hiện hệ điều hành và không cần cài đặt thêm bất kỳ thư viện Go cồng kềnh nào (Zero-Dependency).

---

## 📋 Yêu cầu kỹ thuật

### 1. Functional Requirements
- Tự động phát hiện hệ điều hành đang chạy (`runtime.GOOS`).
- **Windows**: Thực thi lệnh PowerShell ẩn, nạp Assembly `Windows.UI.Notifications` và phát một Toast Notification đúng chuẩn Windows 10/11 (gắn liền với AppID của hệ thống để hiển thị mượt mà).
- **macOS**: Sử dụng `osascript` để hiển thị thông báo Notification Center bản xứ.
- **Linux**: Sử dụng `notify-send` để gửi thông báo qua DBus.
- Hỗ trợ truyền tùy biến `Title` và `Message`.

### 2. Non-Functional Requirements
- **Không gây treo ứng dụng**: Việc gọi thông báo chạy dưới dạng goroutine độc lập để không cản trở luồng tải xuống hoặc phản hồi UI chính.
- **Không dùng thư viện bên ngoài**: Sử dụng các công cụ hệ thống có sẵn thông qua `os/exec`.
- **An toàn**: Lọc kỹ tham số đầu vào trước khi truyền vào dòng lệnh của OS.

---

## 🛠️ Các bước thực hiện

### Bước 1: Viết hàm thông báo trong `app.go`
Thêm hàm `NotifyDownloadComplete(title string, message string)` vào struct `App`:
1. Kiểm tra hệ điều hành qua `runtime.GOOS`.
2. Nếu là Windows:
   - Xây dựng chuỗi PowerShell script chuẩn sử dụng XML toast template.
   - Sử dụng `exec.Command("powershell", "-NoProfile", "-Command", script)` để gọi.
3. Nếu là macOS (darwin):
   - Gọi `exec.Command("osascript", "-e", fmt.Sprintf("display notification %q with title %q", message, title))`.
4. Nếu là Linux:
   - Gọi `exec.Command("notify-send", title, message)`.
5. Đóng gói quá trình thực thi script trong một goroutine `go a.execNotification(...)` để chạy bất đồng bộ hoàn toàn.

### Bước 2: Viết Unit Test kiểm tra
Tạo file test hoặc viết bổ sung trong `app_test.go` một hàm test `TestNotifyDownloadComplete` để đảm bảo:
- Hàm không bị crash hoặc panic trên các môi trường khác nhau.
- Xử lý mượt mà khi chuỗi truyền vào có ký tự đặc biệt, dấu ngoặc kép (`"`, `'`) hoặc biểu tượng cảm xúc (Emoji 🎉).

---

## 📂 Các file cần tạo / chỉnh sửa
- `app.go` — Bổ sung hàm `NotifyDownloadComplete`.
- `app_test.go` — Viết unit test để kiểm nghiệm tính ổn định của hàm.

---

## 🧪 Tiêu chí nghiệm thu (Test Criteria)
- [x] Thực thi hàm `NotifyDownloadComplete` trên Windows hiển thị một Toast Banner màu đen ở góc phải dưới màn hình.
- [x] Hàm chạy bất đồng bộ, phản hồi ngay lập tức về frontend mà không phải đợi script OS chạy xong.
- [x] Xử lý an toàn các ký tự đặc biệt và dấu ngoặc kép không gây lỗi cú pháp CLI.

---
Next Phase: [Phase 02: Thiết kế Glassmorphic Toast & Âm thanh](file:///d:/skul9x/dev/MusicYT-main/plans/260524-0715-download-notifications/phase-02-in-app-toasts.md)
