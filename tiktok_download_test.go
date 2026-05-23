package main

import (
	"context"
	"os"
	"testing"
)

func TestTikTokAudioDownload(t *testing.T) {
	app := NewApp()
	
	// Skip if dependencies are missing
	status := app.CheckDependencies()
	if !status.YtdlpOK || !status.FfmpegOK {
		t.Skip("Skipping test because yt-dlp or ffmpeg is not installed")
	}
	
	// Create context
	ctx := context.WithValue(context.Background(), "is_test", true)
	app.startup(ctx)

	// We'll download to the current folder or a temp subfolder
	tempDir, err := os.MkdirTemp("", "tiktok_test_*")
	if err != nil {
		t.Fatalf("Failed to create temp dir: %v", err)
	}
	defer os.RemoveAll(tempDir)

	url := "https://www.tiktok.com/@nhacnghedixe/video/7634440732828306709"
	t.Logf("Starting TikTok audio download test for URL: %s", url)

	err = app.DownloadGenericVideo(url, tempDir, "m4a")
	if err != nil {
		t.Fatalf("Download failed: %v", err)
	}

	t.Log("Download completed successfully!")
}
