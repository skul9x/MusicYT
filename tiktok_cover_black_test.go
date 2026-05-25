package main

import (
	"image"
	_ "image/jpeg"
	_ "image/png"
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

func TestTikTokCoverMissingCover(t *testing.T) {
	// 1. Tạo thư mục tạm
	tempDir, err := os.MkdirTemp("", "tiktok_missing_cover_test_*")
	if err != nil {
		t.Fatalf("Failed to create temp dir: %v", err)
	}
	defer os.RemoveAll(tempDir)

	// 2. Tạo file .m4a giả lập và file .cover.jpg giả lập
	m4aPath := filepath.Join(tempDir, "test_song.m4a")
	if err := os.WriteFile(m4aPath, []byte("dummy audio content"), 0644); err != nil {
		t.Fatalf("Failed to create dummy m4a: %v", err)
	}

	coverPath := filepath.Join(tempDir, "test_song.cover.jpg")
	if err := os.WriteFile(coverPath, []byte("dummy image content"), 0644); err != nil {
		t.Fatalf("Failed to create dummy cover: %v", err)
	}

	// 3. Giả lập bằng cách xóa file ảnh bìa trước khi nhúng
	if err := os.Remove(coverPath); err != nil {
		t.Fatalf("Failed to delete cover file for simulation: %v", err)
	}

	app := NewApp()
	// 4. Chạy embedTikTokCover
	err = app.embedTikTokCover(tempDir)
	if err != nil {
		t.Errorf("Expected no error when cover is missing, but got: %v", err)
	}

	// 5. Đảm bảo file .m4a vẫn tồn tại và không bị xóa/corrupt
	if _, err := os.Stat(m4aPath); os.IsNotExist(err) {
		t.Errorf("FAIL: Original .m4a file was deleted or lost!")
	} else {
		content, err := os.ReadFile(m4aPath)
		if err != nil {
			t.Fatalf("Failed to read m4a: %v", err)
		}
		if string(content) != "dummy audio content" {
			t.Errorf("FAIL: Original .m4a file content was corrupted!")
		}
		t.Logf("SUCCESS: Original .m4a file is safe and untouched!")
	}
}
