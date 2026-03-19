# 🎵 MusicYT - YouTube Downloader Siêu Nhẹ

**MusicYT** là một ứng dụng Desktop hiện đại, mượt mà và cực kỳ nhẹ (chỉ khoảng 12-15MB), được thiết kế để giúp Anh tải nhạc hoặc video từ YouTube một cách nhanh chóng nhất. Ứng dụng tích hợp phong cách thiết kế **Glassmorphism** sang trọng và trải nghiệm "Vibe Coding" đậm chất công nghệ.

---

## ✨ 1. Tính năng chính

- **Tải nhạc High-Res:** Tự động trích xuất âm thanh chất lượng cao định dạng `.m4a`.
- **Gắn Cover Art:** Tự động tải và nhúng ảnh đại diện (Thumbnail) của YouTube vào file nhạc cực đẹp. 🖼️
- **Đa dạng chất lượng:** Hỗ trợ tải Video 1080p Full HD, 720p HD hoặc chỉ lấy âm thanh.
- **Giao diện Glassmorphism:** Hiệu ứng làm mờ kính hiện đại, hỗ trợ Dark Mode và animation mượt mà.
- **Bảo vệ người dùng:** Tự chọn thư mục tải mặc định, chặn tải Playlist lớn để tránh treo máy.
- **Tốc độ:** Tận dụng tối đa sức mạnh của `yt-dlp` - engine tải video tốt nhất hiện nay.

---

## 🚀 2. Hướng dẫn cài đặt

MusicYT là ứng dụng "Portable" siêu nhẹ, Anh chỉ cần tải về và chạy ngay. Tuy nhiên, để app hoạt động tốt nhất, Anh cần chuẩn bị 2 "động cơ" nhỏ sau:

### Cho Windows:
1.  Tải **yt-dlp.exe** từ [GitHub](https://github.com/yt-dlp/yt-dlp/releases).
2.  Tải **ffmpeg.exe** từ [Gyan.dev](https://www.gyan.dev/ffmpeg/builds/).
3.  Bỏ 2 file này vào một thư mục (ví dụ `C:\tools\`) và thêm nó vào **Environment Variables (PATH)** của hệ thống.

### Cho Linux:
Cài đặt qua dòng lệnh:
```bash
sudo curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp && sudo chmod a+rx /usr/local/bin/yt-dlp
sudo apt update && sudo apt install ffmpeg
```

---

## 🛠️ 3. Cách Build từ Source Code

Nếu Anh muốn tự tay đóng gói ứng dụng:

### Yêu cầu:
- **Go 1.21+**
- **Node.js 18+**
- **Wails CLI** (`go install github.com/wailsapp/wails/v2/cmd/wails@latest`)

### Các bước:
1.  Clone repo: `git clone https://github.com/skul9x/MusicYT.git`
2.  Di chuyển vào thư mục: `cd MusicYT`
3.  Chạy ở chế độ Dev: `wails dev`
4.  Build bản Production: 
    - **Windows:** `wails build -platform windows/amd64 -nsis` (Tạo file .exe và bộ cài Setup)
    - **Linux:** `wails build -platform linux/amd64 -package` (Tạo file .deb)

---

## 📂 4. Cấu trúc thư mục

- `/app.go`: Logic xử lý Backend (Go) - nơi giao tiếp với `yt-dlp`.
- `/frontend/src`: Giao diện React + Tailwind CSS.
- `/main.go`: Điểm khởi đầu của ứng dụng Wails.
- `/wails.json`: Cấu hình của dự án Wails.
- `/docs`: Tài liệu hướng dẫn sử dụng.

---

## 📜 5. Bản quyền & Giấy phép

Ứng dụng được thiết kế và phát triển bởi **Tuấn (Senior Developer)**. 
Bản quyền © 2026 **Nguyễn Duy Trường** • All Rights Reserved.

---

### ⚠️ Lưu ý:
*Dự án này được tạo ra cho mục đích sử dụng cá nhân và học thuật. Vui lòng tôn trọng quyền tác giả của video Anh tải xuống.* 🎶🔥🚀
