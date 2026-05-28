# Phase 01: Bổ sung hàm chọn file & cờ Cookies ở Backend
Status: ✅ Completed
Dependencies: None

## 1. Objective (Mục tiêu)
Nâng cấp Backend Go (`app.go`) để tiếp nhận đường dẫn file cookies từ Frontend và truyền chính xác vào `yt-dlp` dưới dạng tham số dòng lệnh `--cookies /path/to/cookies.txt`.
Tồn tại một hàm tiện ích `SelectCookiesFile` ở Backend sử dụng Wails runtime dialog để hiển thị hộp thoại chọn file native OS trên cả Linux và Windows.

## 2. Yêu cầu Chi tiết (Requirements)
### Functional:
- [x] Chỉnh sửa chữ ký (signature) của các hàm tải xuống và đọc metadata trong `app.go`:
  - `DownloadGenericVideo(url string, savePath string, formatOption string, cookiesFile string) error`
  - `GetGenericVideoInfo(url string, cookiesFile string) (string, error)`
- [x] Tạo hàm tiện ích native ở backend cho phép người dùng chọn file `.txt`:
  - `SelectCookiesFile() (string, error)`
  - Sử dụng `wailsRuntime.OpenFileDialog` với bộ lọc định dạng giới hạn chỉ hiển thị các tệp `.txt` (Text Files).
- [x] Xử lý logic ghép tham số (argument builder) một cách an toàn:
  - Nếu `cookiesFile` không rỗng và tệp tin đó tồn tại trên đĩa cứng (`os.Stat` hợp lệ), tự động chèn thêm `--cookies` và `<cookiesFile>` vào tham số gọi của `exec.CommandContext`.
  - Nếu `cookiesFile` rỗng hoặc tệp không tồn tại, bỏ qua việc chèn cờ `--cookies` (hành vi mặc định).
- [x] Đảm bảo tương thích ngược: Các cuộc gọi không dùng cookie vẫn chạy bình thường.

### Non-Functional:
- [x] Hoạt động trơn tru trên cả hai hệ điều hành: **Windows** và **Linux**.
- [x] Đường dẫn tệp chứa khoảng trắng hoặc ký tự đặc biệt (ví dụ: `C:\Users\My Name\cookies.txt` hoặc `/home/user/my cookies/cookies.txt`) phải được Go và hệ điều hành xử lý an toàn mà không gây lỗi phân tách dòng lệnh.

---

## 3. Các bước thực hiện (Implementation Steps)

### Bước 1: Sửa file `app.go`
1. Thay đổi chữ ký của hàm `DownloadGenericVideo` và `GetGenericVideoInfo` để bổ sung tham số `cookiesFile string`.
2. Tạo hàm helper `buildCookiesArgs(cookiesFile string) []string` để sinh cờ `--cookies`:
   ```go
   func (a *App) buildCookiesArgs(cookiesFile string) []string {
       if cookiesFile == "" {
           return []string{}
       }
       // Kiểm tra xem file có tồn tại không
       if _, err := os.Stat(cookiesFile); os.IsNotExist(err) {
           return []string{}
       }
       return []string{"--cookies", cookiesFile}
   }
   ```
3. Chèn kết quả của `buildCookiesArgs` vào mảng tham số gọi `yt-dlp` trong:
   - `DownloadGenericVideo`
   - `GetGenericVideoInfo`
4. Hiện thực hàm `SelectCookiesFile`:
   ```go
   func (a *App) SelectCookiesFile() (string, error) {
       if a.ctx == nil {
           return "", fmt.Errorf("ứng dụng chưa khởi tạo ngữ cảnh")
       }
       filePath, err := wailsRuntime.OpenFileDialog(a.ctx, wailsRuntime.OpenDialogOptions{
           Title: "Chọn file cookies.txt",
           Filters: []wailsRuntime.FileFilter{
               {DisplayName: "Text Files (*.txt)", Pattern: "*.txt"},
           },
       })
       if err != nil {
           return "", err
       }
       return filePath, nil
   }
   ```

### Bước 2: Tạo File Test `tiktok_cookies_test.go`
Viết Unit Test để đảm bảo hàm ghép tham số hoạt động chính xác trong mọi tình huống.

---

## 4. Đặc tả File Test: `tiktok_cookies_test.go`
Tạo file `/home/skul9x/Desktop/Test_code/MusicYT-main/tiktok_cookies_test.go` với nội dung kiểm thử:

```go
package main

import (
	"os"
	"path/filepath"
	"testing"
)

func TestTikTokCookiesArgsGeneration(t *testing.T) {
	app := NewApp()

	// Case 1: Đường dẫn cookies rỗng
	args := app.buildCookiesArgs("")
	if len(args) != 0 {
		t.Errorf("Expected 0 args for empty cookies path, got %v", args)
	}

	// Case 2: Đường dẫn file không tồn tại thực tế
	args = app.buildCookiesArgs("this_file_does_not_exist_12345.txt")
	if len(args) != 0 {
		t.Errorf("Expected 0 args for non-existent file, got %v", args)
	}

	// Case 3: Đường dẫn file hợp lệ và tồn tại
	tempDir, err := os.MkdirTemp("", "cookies_test_*")
	if err != nil {
		t.Fatalf("Failed to create temp dir: %v", err)
	}
	defer os.RemoveAll(tempDir)

	dummyCookiesFile := filepath.Join(tempDir, "cookies.txt")
	if err := os.WriteFile(dummyCookiesFile, []byte("# Netscape HTTP Cookie File"), 0644); err != nil {
		t.Fatalf("Failed to write dummy cookies: %v", err)
	}

	args = app.buildCookiesArgs(dummyCookiesFile)
	if len(args) != 2 {
		t.Fatalf("Expected 2 args, got %v", args)
	}
	if args[0] != "--cookies" || args[1] != dummyCookiesFile {
		t.Errorf("Expected [--cookies %s], got %v", dummyCookiesFile, args)
	}
}
```

---

## 5. Tiêu chí Hoàn thành (Test Criteria)
- [x] Biên dịch `app.go` thành công không có lỗi cú pháp.
- [x] Chạy lệnh `go test -v -run TestTikTokCookiesArgsGeneration` đạt kết quả **PASS**.

---
Next Phase: [Phase 02: Giao diện Cấu hình](file:///home/skul9x/Desktop/Test_code/MusicYT-main/plans/tiktok-cookies-fix/phase-02-frontend.md)
