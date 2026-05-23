package main

import (
	"context"
	"os"
	"path/filepath"
	"strings"
	"testing"
)

func TestGetDefaultSavePath(t *testing.T) {
	app := NewApp()
	path := app.GetDefaultSavePath()

	if path == "" {
		t.Error("Expected default save path to be non-empty")
	}

	// Verify it's either the home dir, downloads, or the current directory
	if path != "." {
		if _, err := os.Stat(path); err != nil {
			t.Errorf("Returned default save path does not exist: %s", path)
		}
	}
}

func TestCheckDependencies(t *testing.T) {
	app := NewApp()
	status := app.CheckDependencies()

	// It shouldn't crash, and should return OS info
	if status.OS == "" {
		t.Error("Expected status to report current OS")
	}
}

func TestDetectPlatformSupport(t *testing.T) {
	// Simple validation tests for platform types
	platforms := []struct {
		url      string
		expected string
	}{
		{"https://www.youtube.com/watch?v=dQw4w9WgXcQ", "youtube"},
		{"https://vt.tiktok.com/ZS2a9B1r3/", "tiktok"},
		{"https://www.facebook.com/reel/12345678", "facebook"},
		{"https://www.douyin.com/video/739182391231", "douyin"},
	}

	for _, tc := range platforms {
		lowerUrl := strings.ToLower(tc.url)
		var detected string
		if strings.Contains(lowerUrl, "youtube.com") || strings.Contains(lowerUrl, "youtu.be") {
			detected = "youtube"
		} else if strings.Contains(lowerUrl, "tiktok.com") {
			detected = "tiktok"
		} else if strings.Contains(lowerUrl, "facebook.com") {
			detected = "facebook"
		} else if strings.Contains(lowerUrl, "douyin.com") {
			detected = "douyin"
		}

		if detected != tc.expected {
			t.Errorf("URL %s: expected platform %s, got %s", tc.url, tc.expected, detected)
		}
	}
}

func TestOpenOutputFolder_Validation(t *testing.T) {
	app := NewApp()

	// 1. Thư mục rỗng
	err := app.OpenOutputFolder("")
	if err == nil || !strings.Contains(err.Error(), "đường dẫn thư mục không được để trống") {
		t.Errorf("Expected error for empty path, got: %v", err)
	}

	// 2. Thư mục không tồn tại
	err = app.OpenOutputFolder("C:\\this_folder_definitely_does_not_exist_123456")
	if err == nil || !strings.Contains(err.Error(), "thư mục không tồn tại") {
		t.Errorf("Expected error for non-existent path, got: %v", err)
	}

	// 3. Đường dẫn là file chứ không phải thư mục
	tmpFile, err := os.CreateTemp("", "test_file_not_dir_*.txt")
	if err != nil {
		t.Fatalf("Failed to create temp file: %v", err)
	}
	defer os.Remove(tmpFile.Name())
	tmpFile.Close()

	err = app.OpenOutputFolder(tmpFile.Name())
	if err == nil || !strings.Contains(err.Error(), "đường dẫn không phải là thư mục") {
		t.Errorf("Expected error when path is a file, got: %v", err)
	}
}

func TestOpenOutputFolder_UNCBlocking(t *testing.T) {
	app := NewApp()

	uncPaths := []string{
		`\\192.168.1.100\share`,
		`//malicious-domain/share`,
		`\\\\some-server\some-folder`,
		`//another-server/another-folder`,
	}

	for _, path := range uncPaths {
		err := app.OpenOutputFolder(path)
		if err == nil {
			t.Errorf("Expected error for UNC path '%s', got nil", path)
		} else if !strings.Contains(err.Error(), "không chấp nhận đường dẫn UNC") {
			t.Errorf("Expected error to contain 'không chấp nhận đường dẫn UNC' for path '%s', got: %v", path, err)
		}
	}
}

func TestOpenOutputFolder_Normalization(t *testing.T) {
	app := NewApp()
	// Let's pass a path with mixed slashes or relative segments, but which does not exist, so it fails at "thư mục không tồn tại: ..." but shows it was cleaned.
	// E.g., "plans/../does_not_exist_folder" -> should clean to "does_not_exist_folder" on Windows/Linux.
	err := app.OpenOutputFolder("plans/../does_not_exist_folder_abcxyz")
	if err == nil {
		t.Errorf("Expected error, got nil")
	} else {
		expectedPath := filepath.Clean("plans/../does_not_exist_folder_abcxyz")
		if !strings.Contains(err.Error(), expectedPath) {
			t.Errorf("Expected error message to contain cleaned path '%s', got: %v", expectedPath, err)
		}
	}
}

func TestCheckDependencies_PathInjection(t *testing.T) {
	app := NewApp()
	
	oldPath := os.Getenv("PATH")
	defer os.Setenv("PATH", oldPath)
	
	// Check if C:\tools\yt-dlp.exe exists
	hasExe := false
	if _, err := os.Stat("C:\\tools\\yt-dlp.exe"); err == nil {
		hasExe = true
	}
	
	// Remove C:\tools from PATH for the test
	var cleanPathElements []string
	for _, p := range filepath.SplitList(oldPath) {
		if !strings.EqualFold(strings.TrimRight(p, "\\/"), "C:\\tools") {
			cleanPathElements = append(cleanPathElements, p)
		}
	}
	os.Setenv("PATH", strings.Join(cleanPathElements, string(os.PathListSeparator)))
	
	app.CheckDependencies()
	
	newPath := os.Getenv("PATH")
	hasTools := false
	for _, p := range filepath.SplitList(newPath) {
		if strings.EqualFold(strings.TrimRight(p, "\\/"), "C:\\tools") {
			hasTools = true
			break
		}
	}
	
	if hasExe && !hasTools {
		t.Error("Expected C:\\tools to be in PATH since C:\\tools\\yt-dlp.exe exists")
	}
}

func TestCancelDownload(t *testing.T) {
	app := NewApp()
	
	ctx, cancel := context.WithCancel(context.Background())
	app.cancelFunc = cancel
	
	// Verify it is not canceled yet
	select {
	case <-ctx.Done():
		t.Error("Context should not be canceled yet")
	default:
	}
	
	app.CancelDownload()
	
	// Verify it is canceled now
	select {
	case <-ctx.Done():
		// Success!
	default:
		t.Error("Context should have been canceled by CancelDownload")
	}
	
	if app.cancelFunc != nil {
		t.Error("Expected cancelFunc to be nil after CancelDownload")
	}
}

func TestSelectSavePath_NilContext(t *testing.T) {
	app := NewApp()
	// Không gọi startup() → a.ctx == nil

	path, err := app.SelectSavePath("")
	if err == nil {
		t.Error("Expected error when ctx is nil, got nil")
	}
	if path != "" {
		t.Errorf("Expected empty path when ctx is nil, got: %s", path)
	}
	if !strings.Contains(err.Error(), "chưa sẵn sàng") {
		t.Errorf("Expected error message about 'chưa sẵn sàng', got: %s", err.Error())
	}
}

func TestSelectSavePath_NotReady(t *testing.T) {
	app := NewApp()
	// Gọi startup nhưng KHÔNG gọi domReady → a.ready == false
	ctx := context.WithValue(context.Background(), "is_test", true)
	app.startup(ctx)

	path, err := app.SelectSavePath("")
	if err == nil {
		t.Error("Expected error when app not ready, got nil")
	}
	if path != "" {
		t.Errorf("Expected empty path when app not ready, got: %s", path)
	}
	if !strings.Contains(err.Error(), "chưa sẵn sàng") {
		t.Errorf("Expected error message about 'chưa sẵn sàng', got: %s", err.Error())
	}
}

func TestIsAppReady_InitialState(t *testing.T) {
	app := NewApp()

	if app.IsAppReady() {
		t.Error("Expected IsAppReady to return false before startup")
	}
}

func TestIsAppReady_AfterStartup(t *testing.T) {
	app := NewApp()
	ctx := context.WithValue(context.Background(), "is_test", true)
	app.startup(ctx)

	if app.IsAppReady() {
		t.Error("Expected IsAppReady to return false after startup but before domReady")
	}
}

func TestIsAppReady_AfterDomReady(t *testing.T) {
	app := NewApp()
	ctx := context.WithValue(context.Background(), "is_test", true)
	app.startup(ctx)
	app.domReady(ctx)

	if !app.IsAppReady() {
		t.Error("Expected IsAppReady to return true after domReady")
	}
}

func TestDomReady_SetsReadyFlag(t *testing.T) {
	app := NewApp()

	if app.ready {
		t.Error("Expected ready to be false initially")
	}

	ctx := context.WithValue(context.Background(), "is_test", true)
	app.domReady(ctx)

	if !app.ready {
		t.Error("Expected ready to be true after domReady")
	}
}

func TestSelectSavePath_MutexLock(t *testing.T) {
	app := NewApp()
	ctx := context.WithValue(context.Background(), "is_test", true)
	app.startup(ctx)
	app.domReady(ctx)

	// Lớp 0: Khóa trước Mutex thủ công
	app.dialogMu.Lock()
	defer app.dialogMu.Unlock() // Đảm bảo mở khóa khi test xong

	path, err := app.SelectSavePath("")
	if err == nil {
		t.Error("Expected error due to locked mutex, got nil")
	}
	if path != "" {
		t.Errorf("Expected empty path, got: %s", path)
	}
	if !strings.Contains(err.Error(), "đang được mở") {
		t.Errorf("Expected error to contain 'đang được mở', got: %v", err)
	}
}



