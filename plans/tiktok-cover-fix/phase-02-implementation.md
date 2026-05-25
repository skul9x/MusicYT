# Phase 02: Hiện thực hóa logic Tải 2 bước & Hàm helper nhúng Cover
Status: ✅ Completed
Dependencies: Phase 01

## 1. Objective (Mục tiêu)
Khắc phục triệt để lỗi bằng cách thay đổi logic tải nhạc TikTok kèm ảnh bìa trong `app.go`. Chuyển từ việc tự động nhúng của `yt-dlp` sang cơ chế:
1. Gọi `yt-dlp` tải nhạc `.m4a` và tất cả các ảnh bìa có sẵn ở định dạng `.jpg`.
2. Định vị file `.cover.jpg` (ảnh bìa thật chất lượng cao) trong thư mục lưu.
3. Sử dụng `ffmpeg` nhúng file `.cover.jpg` này làm ảnh bìa chính thức cho file `.m4a`.
4. Dọn dẹp tất cả các file ảnh tạm (`*.cover.jpg`, `*.originCover.jpg`, `*.dynamicCover.jpg`).

## 2. Các bước thực hiện

### Bước 2.1: Cập nhật cấu hình yt-dlp trong hàm `DownloadGenericVideo`
1. [x] Mở file `app.go` và tìm đến dòng `527` (case `"m4a_cover"`).
2. [x] Thay đổi các đối số truyền vào `args` để hướng dẫn `yt-dlp` không tự động nhúng cover, mà chỉ tải nhạc và lưu lại tất cả thumbnails dưới dạng `.jpg`:
   ```go
   case "m4a_cover":
       args = append(args, "-f", "best[vcodec^=h264]/best", "-x", "--audio-format", "m4a",
           "--write-all-thumbnails", "--convert-thumbnails", "jpg", "--no-embed-thumbnail")
   ```

### Bước 2.2: Hiện thực hóa hàm helper `embedTikTokCover` trong `app.go`
1. [x] Thêm hàm helper `embedTikTokCover` vào `app.go`. Hàm này có trách nhiệm quét thư mục lưu, tìm file `.cover.jpg` tương ứng, gọi `ffmpeg` nhúng cover art và dọn dẹp file tạm.
2. [x] **Mã giả chi tiết của hàm helper:**
   ```go
   func (a *App) embedTikTokCover(savePath string) error {
       // 1. Quét thư mục savePath để tìm các file *.m4a và *.cover.jpg tương ứng
       files, err := os.ReadDir(savePath)
       if err != nil {
           return fmt.Errorf("failed to read save directory: %v", err)
       }

       // 2. Tìm tất cả file .cover.jpg có trong thư mục
       for _, file := range files {
           if file.IsDir() {
               continue
           }
           
           fileName := file.Name()
           if strings.HasSuffix(fileName, ".cover.jpg") {
               baseName := strings.TrimSuffix(fileName, ".cover.jpg")
               
               // Tìm file m4a tương ứng (cùng tên gốc)
               m4aName := baseName + ".m4a"
               m4aPath := filepath.Join(savePath, m4aName)
               
               // Kiểm tra nếu file m4a tồn tại
               if _, err := os.Stat(m4aPath); err == nil {
                   coverPath := filepath.Join(savePath, fileName)
                   tempOutPath := filepath.Join(savePath, baseName + "_temp_embed.m4a")

                   // 3. Thực thi ffmpeg nhúng cover art
                   // Lệnh: ffmpeg -i music.m4a -i cover.jpg -map 0:a -map 1:v -c:a copy -c:v:0 mjpeg -disposition:v attached_pic temp.m4a -y
                   cmd := exec.Command("ffmpeg", "-i", m4aPath, "-i", coverPath,
                       "-map", "0:a", "-map", "1:v",
                       "-c:a", "copy", "-c:v:0", "mjpeg",
                       "-disposition:v", "attached_pic",
                       tempOutPath, "-y")
                   
                   prepareCommand(cmd) // Đảm bảo hoạt động tốt trên Windows/Linux ẩn cửa sổ cmd
                   
                   if err := cmd.Run(); err != nil {
                       return fmt.Errorf("failed to run ffmpeg embed command: %v", err)
                   }

                   // 4. Ghi đè file temp lên file gốc
                   if err := os.Rename(tempOutPath, m4aPath); err != nil {
                       return fmt.Errorf("failed to replace original file: %v", err)
                   }
               }
           }
       }

       // 5. Dọn dẹp sạch sẽ các file ảnh thumbnail tạm thời (cover, originCover, dynamicCover)
       for _, file := range files {
           name := file.Name()
           if strings.HasSuffix(name, ".cover.jpg") || 
              strings.HasSuffix(name, ".originCover.jpg") || 
              strings.HasSuffix(name, ".dynamicCover.jpg") {
               _ = os.Remove(filepath.Join(savePath, name))
           }
       }

       return nil
   }
   ```

### Bước 2.3: Gọi hàm `embedTikTokCover` sau khi yt-dlp hoàn tất tải xuống
1. [x] Ở cuối hàm `DownloadGenericVideo` (khoảng dòng `588`), sau khi lệnh `cmd.Wait()` kết thúc thành công:
2. [x] Thêm logic kiểm tra xem nếu `formatOption == "m4a_cover"`, thì gọi hàm `a.embedTikTokCover(savePath)` để tiến hành nhúng.
   ```go
   if err := cmd.Wait(); err != nil {
       return fmt.Errorf("yt-dlp error: %v", err)
   }

   // THÊM MỚI: Nhúng cover thủ công cho TikTok
   if formatOption == "m4a_cover" {
       if err := a.embedTikTokCover(savePath); err != nil {
           return fmt.Errorf("lỗi nhúng cover art: %v", err)
       }
   }

   return nil
   ```

## 3. Tiêu chí hoàn thành (Test Criteria)
- [x] File `app.go` biên dịch thành công không gặp bất kỳ lỗi cú pháp nào.
- [x] Chạy lệnh `go test -v -run TestTikTokBlackCover` và kết quả trả về là **PASS** (thành công), độ sáng trung bình của cover > 5.0, phần trăm pixel đen thấp.

---
Next Phase: [Phase 03: Verification](file:///home/skul9x/Desktop/Test_code/MusicYT-main/plans/tiktok-cover-fix/phase-03-verification.md)
