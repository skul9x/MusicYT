# 🎵 Hướng Dẫn Cài Đặt MusicYT

Chúc mừng Anh đã sở hữu **MusicYT** - ứng dụng tải nhạc siêu nhẹ và hiện đại! Để ứng dụng hoạt động mượt mà nhất, Anh vui lòng thực hiện theo các bước sau:

---

## 🚀 Bước 1: Cài đặt Dependencies (Bắt buộc)
MusicYT sử dụng công cụ **yt-dlp** và **ffmpeg** để xử lý tải video và âm thanh. Anh cần đảm bảo máy tính đã cài đặt chúng.

### 1. Tải yt-dlp
*   Truy cập: [yt-dlp Releases](https://github.com/yt-dlp/yt-dlp/releases)
*   Tải file `yt-dlp.exe`.
*   Copy file này vào một thư mục cố định (ví dụ: `C:\tools\`).

### 2. Tải ffmpeg (Nếu muốn tải m4a/mp3 chất lượng cao)
*   Truy cập: [ffmpeg.org](https://ffmpeg.org/download.html) hoặc tải bản build sẵn cho Windows tại [gyan.dev](https://www.gyan.dev/ffmpeg/builds/).
*   Giải nén và copy các file trong thư mục `bin` (đặc biệt là `ffmpeg.exe`) vào cùng thư mục với `yt-dlp.exe` (ví dụ: `C:\tools\`).

---

## 🛠️ Bước 2: Thêm vào PATH Hệ thống
Để MusicYT có thể "gọi" được các công cụ này ở bất cứ đâu:

1.  Nhấn phím **Windows**, gõ `Environment Variables` và chọn **Edit the system environment variables**.
2.  Chọn nút **Environment Variables...**.
3.  Trong phần **System variables**, tìm biến **Path** và nhấn **Edit**.
4.  Nhấn **New** và dán đường dẫn thư mục chứa công cụ vào (ví dụ: `C:\tools\`).
5.  Nhấn **OK** liên tiếp để lưu lại.

---

## 🎧 Bước 3: Chạy MusicYT
Bây giờ Anh chỉ cần mở file `MusicYT.exe`, dán link YouTube, chọn định dạng và tận hưởng thôi!

*   **Tốt nhất:** Tải video chất lượng cao nhất.
*   **Chỉ Âm thanh:** Tải file `.m4a` có kèm sẵn ảnh bìa (thumbnail) cực đẹp.

---

### ⚠️ Lưu ý:
*   Nếu app báo lỗi "yt-dlp not found", Anh vui lòng kiểm tra lại Bước 2 xem đã khởi động lại máy hoặc terminal chưa.
*   Đảm bảo link YouTube là link công khai (Public) hoặc Không công khai (Unlisted). Link riêng tư sẽ không tải được.

**Chúc Anh có những giây phút nghe nhạc tuyệt vời!** 🚀🔥
