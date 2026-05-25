# Phase 01: Thiết lập môi trường kiểm thử & Viết Test tái hiện lỗi (TDD)
Status: ✅ Completed
Dependencies: None

## 1. Objective (Mục tiêu)
Thiết lập một bài kiểm thử tự động (Unit Test / Integration Test) có khả năng:
1. Tải video TikTok test bằng cấu hình `m4a_cover`.
2. Trích xuất ảnh bìa nhúng (embedded cover) từ file `.m4a` thu được bằng `ffmpeg`.
3. Phân tích ảnh bìa đã trích xuất: Đo độ sáng trung bình và tỉ lệ pixel đen để khẳng định xem ảnh bìa có bị đen hoàn toàn (100% black) hay không.
4. Đảm bảo bài test **phải thất bại (FAIL)** ở hiện tại (trước khi sửa lỗi) vì ảnh bìa tải về bị đen.

## 2. Các bước thực hiện
1. [x] Tạo file kiểm thử mới `tiktok_cover_black_test.go` trong thư mục gốc của dự án.
2. [x] Hiện thực hóa logic kiểm thử:
   - Dựng một thư mục tạm để lưu file tải về.
   - Gọi hàm `DownloadGenericVideo` của `App` với tham số `url = "https://www.tiktok.com/@nhacnghedixe/video/7638899412122488084"`, `savePath = tempDir`, `formatOption = "m4a_cover"`.
   - Tìm file `.m4a` được tạo ra trong thư mục tạm.
   - Gọi `ffmpeg -i <path_to_m4a> -an -vcodec copy <path_to_extracted_cover.jpg> -y` để trích xuất ảnh bìa.
   - Đọc ảnh bìa thu được bằng thư viện `image/jpeg` hoặc `image` chuẩn của Go.
   - Duyệt qua toàn bộ pixel của ảnh bìa, tính toán độ sáng trung bình (average brightness) của cả ảnh:
     $$\text{Brightness} = 0.299 \times R + 0.587 \times G + 0.114 \times B$$
   - Đo tỉ lệ phần trăm số pixel đen tuyệt đối (R, G, B = 0, 0, 0 hoặc rất gần 0).
   - Nếu tỉ lệ pixel đen > 99% hoặc độ sáng trung bình < 1.0, kết luận Cover Art bị đen và trả về lỗi `t.Errorf("Cover art is entirely black!")`.
3. [x] Chạy thử nghiệm bằng lệnh:
   ```bash
   go test -v -run TestTikTokBlackCover
   ```
   *Kỳ vọng:* Bài test phải thất bại (FAIL) do ảnh bìa tải về bị đen hoàn toàn.

## 3. Bản thảo File Test: `tiktok_cover_black_test.go`

```go
package main

import (
	"fmt"
	"image"
	_ "image/jpeg"
	_ "image/png"
	"math"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"testing"
)

func TestTikTokBlackCover(t *testing.T) {
	// 1. Tạo thư mục tạm
	tempDir, err := os.MkdirTemp("", "tiktok_cover_test_*")
	if err != nil {
		t.Fatalf("Failed to create temp dir: %v", err)
	}
	defer os.RemoveAll(tempDir)

	app := NewApp()
	testURL := "https://www.tiktok.com/@nhacnghedixe/video/7638899412122488084"

	t.Logf("Downloading TikTok audio with cover to: %s", tempDir)
	// 2. Tải nhạc kèm cover
	err = app.DownloadGenericVideo(testURL, tempDir, "m4a_cover")
	if err != nil {
		t.Fatalf("Failed to download video: %v", err)
	}

	// 3. Tìm file .m4a đã tải
	files, err := os.ReadDir(tempDir)
	if err != nil {
		t.Fatalf("Failed to read temp dir: %v", err)
	}

	var m4aPath string
	for _, file := range files {
		if strings.HasSuffix(file.Name(), ".m4a") {
			m4aPath = filepath.Join(tempDir, file.Name())
			break
		}
	}

	if m4aPath == "" {
		t.Fatalf("No .m4a file found in output directory")
	}
	t.Logf("Found downloaded audio file: %s", m4aPath)

	// 4. Dùng ffmpeg trích xuất cover art đã nhúng
	extractedCover := filepath.Join(tempDir, "extracted_cover.jpg")
	cmd := exec.Command("ffmpeg", "-i", m4aPath, "-an", "-vcodec", "copy", extractedCover, "-y")
	if err := cmd.Run(); err != nil {
		t.Fatalf("Failed to extract cover art using ffmpeg: %v", err)
	}

	// 5. Đọc và phân tích ảnh bìa
	file, err := os.Open(extractedCover)
	if err != nil {
		t.Fatalf("Failed to open extracted cover: %v", err)
	}
	defer file.Close()

	img, _, err := image.Decode(file)
	if err != nil {
		t.Fatalf("Failed to decode extracted image: %v", err)
	}

	bounds := img.Bounds()
	width, height := bounds.Dx(), bounds.Dy()
	totalPixels := width * height
	blackPixels := 0
	var totalBrightness float64 = 0

	for y := bounds.Min.Y; y < bounds.Max.Y; y++ {
		for x := bounds.Min.X; x < bounds.Max.X; x++ {
			r, g, b, _ := img.At(x, y).RGBA()
			// Giá trị trả về từ RGBA() nằm trong khoảng [0, 65535]
			rVal := float64(r) / 257.0
			gVal := float64(g) / 257.0
			bVal := float64(b) / 257.0

			// Tính độ sáng theo chuẩn ITU-R BT.601
			brightness := 0.299*rVal + 0.587*gVal + 0.114*bVal
			totalBrightness += brightness

			if rVal < 5.0 && gVal < 5.0 && bVal < 5.0 {
				blackPixels++
			}
		}
	}

	avgBrightness := totalBrightness / float64(totalPixels)
	blackPercent := (float64(blackPixels) / float64(totalPixels)) * 100.0

	t.Logf("Analysis Results:")
	t.Logf("- Image Size: %dx%d px", width, height)
	t.Logf("- Black Pixels: %d/%d (%.2f%%)", blackPixels, totalPixels, blackPercent)
	t.Logf("- Average Brightness: %.2f (0.0=pure black, 255.0=pure white)", avgBrightness)

	// Kiểm tra nếu cover bị đen (độ sáng trung bình < 1.0 hoặc > 99% pixel đen)
	if avgBrightness < 1.0 || blackPercent > 99.0 {
		t.Errorf("FAIL: Cover art is entirely black! Average brightness: %.2f, Black pixels: %.2f%%", avgBrightness, blackPercent)
	} else {
		t.Logf("SUCCESS: Cover art is a real image! Average brightness: %.2f", avgBrightness)
	}
}
```

## 4. Tiêu chí hoàn thành (Test Criteria)
- [x] File `tiktok_cover_black_test.go` được tạo và biên dịch thành công.
- [x] Chạy lệnh `go test -v -run TestTikTokBlackCover` và kết quả trả về là **FAIL** kèm log chỉ ra ảnh bị đen (độ sáng ≈ 0, 100% pixel đen).

---
Next Phase: [Phase 02: Implementation](file:///home/skul9x/Desktop/Test_code/MusicYT-main/plans/tiktok-cover-fix/phase-02-implementation.md)
