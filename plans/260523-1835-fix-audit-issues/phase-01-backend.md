# Phase 01: Vá lỗi Backend (Go)

Status: ✅ Completed
Dependencies: None

## 🎯 Mục tiêu (Objective)
Cải tạo phần backend trong file `app.go` nhằm giải quyết toàn bộ các lỗ hổng bảo mật, lỗi nạp biến môi trường và thiết lập cơ chế huỷ tải tiến trình bằng Go Context.

## 📋 Yêu cầu (Requirements)

### 🔴 Bảo mật & Tương thích đường dẫn (`OpenOutputFolder`)
- [x] Sử dụng `filepath.Clean` để chuẩn hóa đường dẫn, tự động đổi dấu gạch chéo `/` thành `\` trên Windows và giữ nguyên trên Linux.
- [x] Chặn tuyệt đối đường dẫn mạng UNC bắt đầu bằng `\\` hoặc `//` nhằm ngăn chặn rò rỉ mã băm mật khẩu Windows NTLM Hash.
- [x] Kiểm tra thư mục tồn tại và đảm bảo nó thực sự là một thư mục bằng `os.Stat` sau khi chuẩn hóa.

### 🔴 Khắc phục lỗi PATH trong tiến trình hiện tại (`CheckDependencies`)
- [x] Kiểm tra nếu chạy trên hệ điều hành Windows, chủ động kiểm tra sự tồn tại của file `C:\tools\yt-dlp.exe`.
- [x] Nếu file tồn tại nhưng thư mục `C:\tools` chưa có trong biến môi trường `PATH` của tiến trình hiện tại, tự động nạp vào bằng `os.Setenv("PATH", ...)` ngay trước khi kiểm tra để người dùng không cần khởi động lại ứng dụng.

### 🟡 Hỗ trợ Hủy tải nhạc (`DownloadVideo` & `DownloadGenericVideo`)
- [x] Thêm các trường `cancelMu sync.Mutex` và `cancelFunc context.CancelFunc` vào cấu trúc `App struct` trong `app.go`.
- [x] Cấu hình hàm tải sử dụng `exec.CommandContext(ctx, ...)` thay vì `exec.Command(...)`.
- [x] Tạo một hàm Go mới có tên `CancelDownload()` để hủy tiến trình tải bằng cách gọi hàm `cancelFunc` của context hiện tại.

---

## 🛠️ Các bước triển khai (Implementation Steps)

1. **Khởi tạo cơ chế Context hủy tải:**
   - Import gói `"sync"` trong `app.go`.
   - Cấu trúc lại `App struct`:
     ```go
     type App struct {
         ctx        context.Context
         cancelMu   sync.Mutex
         cancelFunc context.CancelFunc
     }
     ```
   
2. **Cập nhật hàm `OpenOutputFolder`:**
   - Thực hiện chuẩn hóa và chặn đường dẫn UNC.
   - Mở Explorer/xdg-open với đường dẫn đã chuẩn hóa.

3. **Cập nhật hàm `CheckDependencies`:**
   - Thêm phần tự nạp `C:\tools` vào `PATH` trên Windows trước khi gọi `exec.LookPath`.

4. **Tích hợp Context hủy vào các hàm tải nhạc:**
   - Cập nhật `DownloadVideo` và `DownloadGenericVideo` để quản lý và sử dụng context hủy.
   - Viết hàm `CancelDownload()`.

5. **Đăng ký bindings:**
   - Chạy lệnh `wails generate module` để tự sinh lại các file bindings cho hàm `CancelDownload` ở frontend.

---

## 📂 Các file cần tạo/chỉnh sửa
- `app.go` - [Chỉnh sửa] Chứa toàn bộ logic backend chính của ứng dụng Wails.

---

## 🧪 Tiêu chí kiểm thử (Test Criteria)
- [x] Hàm `OpenOutputFolder` mở đúng thư mục trên Windows/Linux mà không bị treo.
- [x] Trả về lỗi bảo mật khi truyền đường dẫn dạng `\\192.168.1.100\share` hoặc `//malicious-domain/share`.
- [x] Nhấn tải tự động dependencies trên Windows không còn yêu cầu khởi động lại app để hoạt động.
- [x] Chạy lệnh `wails generate module` thành công, sinh ra wrapper `CancelDownload` trong `frontend/wailsjs/go/main/App.js` và `App.d.ts`.

---
Next Phase: [Phase 02: Cập nhật Frontend (React/TS)](file:///d:/skul9x/dev/MusicYT-main/plans/260523-1835-fix-audit-issues/phase-02-frontend.md)
