# Phase 03: Xác thực & Xử lý các trường hợp biên (Edge cases)
Status: ✅ Completed
Dependencies: Phase 02

## 1. Objective (Mục tiêu)
Đảm bảo giải pháp sửa lỗi hoạt động ổn định trong mọi điều kiện biên và không gây tác động xấu đến các luồng tải nhạc khác. Các trường hợp cần kiểm tra:
1. **Thiếu file `.cover.jpg`:** Trường hợp yt-dlp không tải được `.cover.jpg` do lỗi API hoặc video không có thumbnail thật sự, hệ thống phải tự động fallback dùng thumbnail khác (`dynamicCover.jpg`) thay thế, hoặc bỏ qua nhẹ nhàng không làm crash ứng dụng.
2. **Thiếu `ffmpeg`:** Nếu hệ thống người dùng chưa cài `ffmpeg` (ví dụ trên môi trường test sạch), hàm cần cảnh báo hoặc bỏ qua mà không làm hỏng file nhạc gốc.
3. **Dọn dẹp tài nguyên:** Đảm bảo toàn bộ các file ảnh tạm bị xóa sạch sẽ sau khi nhúng, không để lại rác trong thư mục tải về của người dùng.

## 2. Các bước thực hiện

### Bước 3.1: Thêm cơ chế Fallback và Kiểm tra an toàn trong `embedTikTokCover`
1. [x] Cập nhật hàm `embedTikTokCover` trong `app.go` để xử lý fallback:
   - Nếu không tìm thấy file nào có đuôi `.cover.jpg`, hãy tìm kiếm các ảnh bìa khác được tạo ra bởi yt-dlp như `.dynamicCover.jpg` hoặc `.originCover.jpg` (dù là ảnh đen vẫn hơn là crash ứng dụng).
   - Kiểm tra xem file nhạc `.m4a` gốc có bị ảnh hưởng gì không nếu việc nhúng thất bại (bằng cách khôi phục hoặc bỏ qua).
   - Thêm kiểm tra `ffmpeg` xem có sẵn trong PATH không trước khi chạy lệnh. Nếu không có `ffmpeg`, log cảnh báo và bỏ qua bước nhúng để giữ nguyên file nhạc gốc cho người dùng.

### Bước 3.2: Viết Unit Test kiểm thử các trường hợp biên
1. [x] Thêm các ca kiểm thử trong `tiktok_cover_black_test.go` để giả lập các lỗi biên:
   - **Test 1:** Kiểm tra tải một video TikTok bình thường có nhúng cover art đầy đủ (Bài test chính từ Phase 1).
   - **Test 2:** Kiểm tra khi không có file ảnh cover (Giả lập bằng cách xóa file ảnh bìa trước khi nhúng) xem ứng dụng có chạy tiếp mượt mà không.
2. [x] Thực thi kiểm thử:
   ```bash
   go test -v -run TestTikTokBlackCover
   ```

### Bước 3.3: Chạy Integration Test trên toàn bộ ứng dụng
1. [x] Chạy lại toàn bộ bộ test của MusicYT để đảm bảo không xảy ra xung đột (regression):
   ```bash
   go test -v ./...
   ```
2. [x] Xác thực thực tế: Sử dụng một bài đăng TikTok để tải thử qua giao diện UI (khi chạy ứng dụng thực tế) và kiểm tra file nhạc bằng máy phát nhạc (như iTunes, VLC, Windows Media Player) để đảm bảo Cover hiển thị tuyệt đẹp.

## 3. Tiêu chí hoàn thành (Test Criteria)
- [x] Tất cả các bài kiểm thử trong `tiktok_cover_black_test.go` và toàn bộ project đều vượt qua (PASS) với màu xanh lá cây.
- [x] Thư mục lưu nhạc sau khi tải không chứa bất kỳ file thừa nào có đuôi `.jpg` (tự động dọn dẹp 100%).
- [x] File nhạc `.m4a` chứa ảnh bìa thực của video TikTok sắc nét, đúng kích thước 1500x2000 px.

---
Kế hoạch sửa lỗi hoàn tất! Bạn có thể quay lại trang kế hoạch tổng thể: [plan.md](file:///home/skul9x/Desktop/Test_code/MusicYT-main/plans/tiktok-cover-fix/plan.md)
