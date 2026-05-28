# Phase 03: Kiểm thử Tích hợp Đa nền tảng (Windows & Linux)
Status: ✅ Completed
Dependencies: Phase 01 & Phase 02

## 1. Objective (Mục tiêu)
Kiểm thử tích hợp toàn bộ hệ thống từ Frontend tới Backend và xác thực độ bền bỉ của giải pháp nạp file `cookies.txt` (Cách B) dưới môi trường thực tế của cả **Windows** và **Linux** đối với nhiều trình duyệt khác nhau (Firefox, Chrome, Edge...).

Đảm bảo sau phase này:
1. Người dùng vượt chặn bảo mật TikTok thành công 100% nhờ file `cookies.txt`.
2. Không xảy ra lỗi phân tách đường dẫn hệ điều hành khi đường dẫn file chứa dấu cách hoặc ký tự đặc biệt tiếng Việt.
3. Không gây lỗi hay crash backend khi file cookie bị xóa hoặc không hợp lệ.

---

## 2. Các trường hợp biên cần kiểm thử & giải quyết (Edge Cases)

### 🚨 Biên 1: Đường dẫn file chứa khoảng trắng hoặc ký tự đặc biệt
- **Tình huống**: Trên Windows, đường dẫn chứa khoảng trắng rất phổ biến (ví dụ: `C:\Users\Nguyen Van A\Downloads\cookies.txt`). Trên Linux cũng tương tự (ví dụ: `/home/skul9x/Tải về/cookies.txt`).
- **Cách xử lý**: Logic backend Go sử dụng mảng tham số của `exec.CommandContext` (truyền trực tiếp phần tử thay vì ghép thành một chuỗi duy nhất) để hệ điều hành tự động bao bọc và xử lý an toàn, tránh lỗi phân tách đối số.

### 🚨 Biên 2: File cookies.txt không đúng định dạng Netscape
- **Tình huống**: Người dùng chọn nhầm một file văn bản bất kỳ hoặc file JSON thay vì định dạng cookies chuẩn Netscape (bắt đầu bằng `# Netscape HTTP Cookie File`).
- **Cách xử lý**:
  - `yt-dlp` sẽ bỏ qua hoặc báo lỗi định dạng cụ thể.
  - Backend bắt chuỗi lỗi cảnh báo định dạng để hiển thị thông tin hướng dẫn hữu ích trên UI thay vì hiện lỗi thô.

---

## 3. Bản thảo File Test Tích Hợp: `tiktok_integration_test.go`
Tạo file kiểm thử tích hợp thực tế `/home/skul9x/Desktop/Test_code/MusicYT-main/tiktok_integration_test.go` để chạy kiểm thử luồng thực:

```go
package main

import (
	"os"
	"path/filepath"
	"strings"
	"testing"
)

func TestTikTokIntegrationWithCookiesFile(t *testing.T) {
	// Kiểm tra nếu đang chạy trong môi trường CI/CD không có file cookie thực tế thì bỏ qua
	customCookiePath := os.Getenv("TIKTOK_COOKIES_PATH")
	if customCookiePath == "" {
		t.Skip("Skipping live integration test: TIKTOK_COOKIES_PATH environment variable is not set")
	}

	// Đảm bảo tệp cookie tồn tại
	if _, err := os.Stat(customCookiePath); os.IsNotExist(err) {
		t.Fatalf("Specified cookie file does not exist: %s", customCookiePath)
	}

	app := NewApp()
	tempDir, err := os.MkdirTemp("", "tiktok_live_file_test_*")
	if err != nil {
		t.Fatalf("Failed to create temp dir: %v", err)
	}
	defer os.RemoveAll(tempDir)

	// Thử tải video TikTok thực tế bằng file cookies.txt
	testURL := "https://www.tiktok.com/@nhacnghedixe/video/7638899412122488084"
	t.Logf("Attempting download with cookies file: %s ...", customCookiePath)
	
	err = app.DownloadGenericVideo(testURL, tempDir, "m4a_cover", customCookiePath)
	if err != nil {
		t.Fatalf("Download failed even with cookies file: %v", err)
	}

	// Xác nhận tệp tải xuống tồn tại và không rỗng
	files, err := os.ReadDir(tempDir)
	if err != nil {
		t.Fatalf("Failed to read temp dir: %v", err)
	}
	
	foundAudio := false
	for _, file := range files {
		if strings.HasSuffix(file.Name(), ".m4a") {
			foundAudio = true
			info, _ := file.Info()
			t.Logf("Downloaded file: %s (%d bytes)", file.Name(), info.Size())
			if info.Size() < 1000 {
				t.Errorf("Downloaded file is too small, check if it is corrupted")
			}
		}
	}
	
	if !foundAudio {
		t.Errorf("No audio file (.m4a) was found in temp directory")
	}
	
	t.Logf("SUCCESS: Downloaded successfully with cookies file!")
}
```

---

## 4. Các bước Xác thực cuối cùng (Final Verification Steps)
1. **Chạy test sinh tham số**:
   ```bash
   go test -v -run TestTikTokCookiesArgsGeneration
   ```
2. **Chạy test tích hợp với file cookies thực tế**:
   - Xuất file `cookies.txt` của TikTok từ Chrome/Firefox/Edge.
   - Chạy lệnh kiểm thử bằng cách truyền biến môi trường chứa đường dẫn tệp cookie:
     ```bash
     export TIKTOK_COOKIES_PATH="/home/skul9x/Downloads/cookies.txt"
     go test -v -run TestTikTokIntegrationWithCookiesFile
     ```
3. **Chạy thử trên giao diện Wails (npm run dev)**:
   - Nạp file `cookies.txt` qua UI.
   - Thử tải một link TikTok và kiểm tra xem có tải về mượt mà cùng ảnh bìa hay không.

---

## 5. Tiêu chí Hoàn thành (Test Criteria)
- [x] Mọi bài kiểm thử tự động đạt kết quả **PASS**.
- [x] Tính năng chạy ổn định trên cả **Windows** và **Linux** mà không gặp bất kỳ lỗi xung đột đường dẫn nào.
