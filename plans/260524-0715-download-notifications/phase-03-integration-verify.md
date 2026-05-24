# Phase 03: Tích hợp hoàn thiện & Kiểm thử tổng thể

Trạng thái: ✅ Đã hoàn thành (Completed)
Phụ thuộc: [Phase 02](file:///d:/skul9x/dev/MusicYT-main/plans/260524-0715-download-notifications/phase-02-in-app-toasts.md)

## 🎯 Mục tiêu
Đấu nối toàn bộ hệ thống thông báo: kích hoạt từ quá trình hoàn tất tải nhạc/video trong `App.tsx` và `UniversalDownloader.tsx` để liên kết tới cả thông báo Native OS ở Backend và Glassmorphic Toast ở Frontend. Tiến hành thử nghiệm, vá lỗi UX và nghiệm thu sản phẩm.

---

## 📋 Yêu cầu kỹ thuật

### 1. Kích hoạt thông báo liên hoàn (Double Notification)
Khi một tiến trình tải (YouTube hoặc Đa nền tảng) hoàn thành thành công:
- **Bước 1**: Đẩy thông báo ra Hệ điều hành thông qua việc gọi hàm backend `NotifyDownloadComplete(title, message)`.
- **Bước 2**: Đẩy thông báo Glassmorphic Toast lên góc phải màn hình của ứng dụng React thông qua Toast State Manager.
- **Bước 3**: Kích hoạt âm thanh thông báo.
- **Bước 4**: Cập nhật progress về 100%.

### 2. Trải nghiệm người dùng thông minh
- Tự động lấy tên video để làm nội dung thông báo. Nếu tên file quá dài, tự động rút gọn (Truncate) bằng dấu ba chấm để không phá vỡ bố cục giao diện của cả Toast hệ thống lẫn Toast trong app.
- Khi tải gặp lỗi, thay vì hiện Toast thành công, hệ thống sẽ hiển thị một Toast màu đỏ cảnh báo lỗi (`type: "error"`) giúp người dùng nhận diện ngay vấn đề.

---

## 🛠️ Các bước thực hiện

### Bước 1: Khởi tạo Container trong `App.tsx`
1. Nhập `<GlassToastContainer>` vào file chính `App.tsx`.
2. Tạo hàm tiện ích `addToast(title, message, type, folderPath)` sử dụng React state để dễ dàng thêm thông báo từ bất kỳ đâu.
3. Thay thế các dòng log status message hoàn tất bằng việc gọi đồng thời:
   - `addToast("Tải thành công! 🎉", "Nhạc đã được lưu vào máy.", "success", saveLocation)`
   - `NotifyDownloadComplete("MusicYT - Hoàn tất tải", "Nhạc của anh đã sẵn sàng tại: " + saveLocation)`

### Bước 2: Tích hợp cho Đa Nền Tảng (`UniversalDownloader.tsx`)
1. Truyền hàm `addToast` từ `App.tsx` xuống `UniversalDownloader.tsx` dưới dạng props.
2. Khi `DownloadGenericVideo` hoàn tất thành công, gọi đồng thời `addToast(...)` và `NotifyDownloadComplete(...)` tương tự như tab YouTube Music.

### Bước 3: Nghiệm thu & Tinh chỉnh
- Biên dịch lại ứng dụng và chạy thử nghiệm.
- Kiểm tra độ trượt của animation, kiểm tra âm thanh phát ra khi ứng dụng đang focus hoặc đang chạy ngầm.
- Kiểm tra tính năng click nút `📂 Mở thư mục` trên Toast đảm bảo nó kích hoạt đúng file explorer.

---

## 📂 Các file cần tạo / chỉnh sửa
- `frontend/src/App.tsx` — Đóng vai trò là đầu mối phân phối sự kiện tải xong và hiển thị Container Toasts.
- `frontend/src/components/UniversalDownloader.tsx` — Liên kết các sự kiện tải xong của Tab Đa nền tảng vào hệ thống Toast.

---

## 🧪 Tiêu chí nghiệm thu (Test Criteria)
- [x] Tải nhạc từ tab YouTube: Khi thanh progress đạt 100%, đồng thời phát ra tiếng ting nhẹ, Toast hệ điều hành hiện lên, và một Glass Toast trượt ra góc phải màn hình.
- [x] Tải video đa nền tảng: Toast hiển thị đúng định dạng (Nhạc, Nhạc + Cover, hoặc Video MP4).
- [x] Thử nghiệm khi app ở chế độ Background: Ẩn app xuống, bấm tải xong chờ đợi → OS Notification bật lên báo hoàn tất. Bấm vào thông báo đó hoặc quay lại app để kiểm nghiệm.
- [x] Bấm nút `📂 Mở thư mục` trên Toast trong giao diện React: Thư mục chứa file tải lập tức được mở ra thành công.
