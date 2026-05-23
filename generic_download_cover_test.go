package main

import (
	"context"
	"os"
	"path/filepath"
	"strings"
	"testing"
)

func TestDownloadGenericVideo_M4aCover(t *testing.T) {
	app := NewApp()

	// Skip if dependencies are missing
	status := app.CheckDependencies()
	if !status.YtdlpOK || !status.FfmpegOK {
		t.Skip("Skipping test because yt-dlp or ffmpeg is not installed")
	}

	// Create context
	ctx := context.WithValue(context.Background(), "is_test", true)
	app.startup(ctx)

	// Create a temp folder for downloading
	tempDir, err := os.MkdirTemp("", "tiktok_cover_test_*")
	if err != nil {
		t.Fatalf("Failed to create temp dir: %v", err)
	}
	defer os.RemoveAll(tempDir)

	url := "https://www.tiktok.com/@nhacnghedixe/video/7634440732828306709"
	t.Logf("Starting TikTok audio download with cover art test for URL: %s", url)

	err = app.DownloadGenericVideo(url, tempDir, "m4a_cover")
	if err != nil {
		t.Fatalf("Download with m4a_cover failed: %v", err)
	}

	// Verify that an m4a file was created in the temp directory
	files, err := os.ReadDir(tempDir)
	if err != nil {
		t.Fatalf("Failed to read temp dir: %v", err)
	}

	var m4aFileFound bool
	var m4aFileName string
	for _, file := range files {
		if !file.IsDir() && strings.HasSuffix(strings.ToLower(file.Name()), ".m4a") {
			m4aFileFound = true
			m4aFileName = file.Name()
			break
		}
	}

	if !m4aFileFound {
		t.Error("Expected an .m4a file to be created, but none was found")
	} else {
		filePath := filepath.Join(tempDir, m4aFileName)
		info, err := os.Stat(filePath)
		if err != nil {
			t.Errorf("Failed to stat created file: %v", err)
		} else if info.Size() == 0 {
			t.Error("Created .m4a file is empty")
		} else {
			t.Logf("Successfully downloaded: %s (%d bytes)", m4aFileName, info.Size())
		}
	}
}
