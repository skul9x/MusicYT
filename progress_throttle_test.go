package main

import (
	"context"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"runtime"
	"strconv"
	"testing"
	"time"
)

func TestDownloadFile_Throttle(t *testing.T) {
	app := NewApp()
	ctx := context.WithValue(context.Background(), "is_test", true)
	app.startup(ctx)
	app.domReady(ctx)

	// Create an HTTP test server that serves a 100-byte response in chunks
	ts := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Length", "100")
		w.WriteHeader(http.StatusOK)
		// Write 100 bytes, 1 byte at a time
		for i := 0; i < 100; i++ {
			w.Write([]byte("a"))
			if flusher, ok := w.(http.Flusher); ok {
				flusher.Flush()
			}
		}
	}))
	defer ts.Close()

	tempDir, err := os.MkdirTemp("", "music-yt-download-file-test")
	if err != nil {
		t.Fatalf("Failed to create temp dir: %v", err)
	}
	defer os.RemoveAll(tempDir)

	destFile := filepath.Join(tempDir, "testfile.txt")
	err = app.DownloadFile(ts.URL, destFile, "install-progress")
	if err != nil {
		t.Fatalf("DownloadFile failed: %v", err)
	}

	app.eventsMu.Lock()
	events := app.emittedEvents
	app.eventsMu.Unlock()

	// Verify that the events were emitted correctly and throttled to integers
	var progressValues []float64
	for _, ev := range events {
		if ev.Name == "install-progress" {
			if len(ev.Data) > 0 {
				if val, ok := ev.Data[0].(float64); ok {
					progressValues = append(progressValues, val)
				} else {
					t.Errorf("Expected event data to be float64, got %T", ev.Data[0])
				}
			}
		}
	}

	if len(progressValues) == 0 {
		t.Fatalf("No install-progress events were emitted")
	}

	// Verify there are no duplicate progress values
	seen := make(map[float64]bool)
	for _, val := range progressValues {
		if seen[val] {
			t.Errorf("Duplicate progress event emitted: %f", val)
		}
		seen[val] = true

		// Check if the value is an integer float64 (i.e. val == float64(int(val)))
		if val != float64(int(val)) {
			t.Errorf("Non-integer progress event emitted: %f", val)
		}
	}

	// Last event should be 100
	if progressValues[len(progressValues)-1] != 100.0 {
		t.Errorf("Expected final progress to be 100.0, got %f", progressValues[len(progressValues)-1])
	}
}

func TestDownloadVideo_Throttle(t *testing.T) {
	app := NewApp()
	ctx := context.WithValue(context.Background(), "is_test", true)
	app.startup(ctx)
	app.domReady(ctx)

	// Create a temp directory for mock yt-dlp
	tempDir, err := os.MkdirTemp("", "music-yt-ytdlp-mock")
	if err != nil {
		t.Fatalf("Failed to create temp dir: %v", err)
	}
	defer os.RemoveAll(tempDir)

	// Create mock yt-dlp script
	var scriptContent string
	var scriptName string

	if runtime.GOOS == "windows" {
		scriptName = "yt-dlp.bat"
		scriptContent = `@echo off
echo [download]   0.0%%
echo [download]   0.5%%
echo [download]   1.2%%
echo [download]  10.0%%
echo [download]  10.4%%
echo [download]  10.6%%
echo [download] 100.0%%
`
	} else {
		scriptName = "yt-dlp"
		scriptContent = `#!/bin/sh
echo "[download]   0.0%"
echo "[download]   0.5%"
echo "[download]   1.2%"
echo "[download]  10.0%"
echo "[download]  10.4%"
echo "[download]  10.6%"
echo "[download] 100.0%"
`
	}

	scriptPath := filepath.Join(tempDir, scriptName)
	err = os.WriteFile(scriptPath, []byte(scriptContent), 0755)
	if err != nil {
		t.Fatalf("Failed to write mock script: %v", err)
	}

	// Set PATH to include tempDir
	oldPath := os.Getenv("PATH")
	newPath := tempDir + string(os.PathListSeparator) + oldPath
	os.Setenv("PATH", newPath)
	defer os.Setenv("PATH", oldPath)

	// We also need a dummy dest folder
	destDir, err := os.MkdirTemp("", "music-yt-dest")
	if err != nil {
		t.Fatalf("Failed to create dest dir: %v", err)
	}
	defer os.RemoveAll(destDir)

	// Run DownloadVideo
	err = app.DownloadVideo("https://youtube.com/watch?v=mock", destDir, "best")
	if err != nil {
		t.Fatalf("DownloadVideo failed: %v", err)
	}

	// Give the goroutine scanner some time to process
	time.Sleep(100 * time.Millisecond)

	app.eventsMu.Lock()
	events := app.emittedEvents
	app.eventsMu.Unlock()

	var progressValues []int
	for _, ev := range events {
		if ev.Name == "download-progress" {
			if len(ev.Data) > 0 {
				if strVal, ok := ev.Data[0].(string); ok {
					val, err := strconv.Atoi(strVal)
					if err != nil {
						t.Errorf("Failed to parse progress event value %q: %v", strVal, err)
					} else {
						progressValues = append(progressValues, val)
					}
				} else {
					t.Errorf("Expected event data to be string, got %T", ev.Data[0])
				}
			}
		}
	}

	if len(progressValues) == 0 {
		t.Fatalf("No download-progress events were emitted")
	}

	// Let's print out the progress values
	t.Logf("Emitted progress values: %v", progressValues)

	// Verify values are strictly increasing (no duplicates, no backwards progress)
	for i := 1; i < len(progressValues); i++ {
		if progressValues[i] <= progressValues[i-1] {
			t.Errorf("Progress values not strictly increasing: %v at index %d vs %d", progressValues, i, i-1)
		}
	}

	// Verify specific expected values based on rounding:
	// 0.0% -> 0
	// 0.5% -> 1
	// 1.2% -> 1 (filtered because <= lastProgress)
	// 10.0% -> 10
	// 10.4% -> 10 (filtered because <= lastProgress)
	// 10.6% -> 11
	// 100.0% -> 100
	// Thus we expect: [0, 1, 10, 11, 100]
	expected := []int{0, 1, 10, 11, 100}
	if len(progressValues) != len(expected) {
		t.Errorf("Expected progress values %v, got %v", expected, progressValues)
	} else {
		for i, v := range progressValues {
			if v != expected[i] {
				t.Errorf("At index %d: expected %d, got %d", i, expected[i], v)
			}
		}
	}
}

func TestDownloadGenericVideo_Throttle(t *testing.T) {
	app := NewApp()
	ctx := context.WithValue(context.Background(), "is_test", true)
	app.startup(ctx)
	app.domReady(ctx)

	// Create a temp directory for mock yt-dlp
	tempDir, err := os.MkdirTemp("", "music-yt-generic-ytdlp-mock")
	if err != nil {
		t.Fatalf("Failed to create temp dir: %v", err)
	}
	defer os.RemoveAll(tempDir)

	// Create mock yt-dlp script
	var scriptContent string
	var scriptName string

	if runtime.GOOS == "windows" {
		scriptName = "yt-dlp.bat"
		scriptContent = `@echo off
echo [download]   0.0%%
echo [download]   0.5%%
echo [download]   1.2%%
echo [download]  10.0%%
echo [download]  10.4%%
echo [download]  10.6%%
echo [download] 100.0%%
`
	} else {
		scriptName = "yt-dlp"
		scriptContent = `#!/bin/sh
echo "[download]   0.0%"
echo "[download]   0.5%"
echo "[download]   1.2%"
echo "[download]  10.0%"
echo "[download]  10.4%"
echo "[download]  10.6%"
echo "[download] 100.0%"
`
	}

	scriptPath := filepath.Join(tempDir, scriptName)
	err = os.WriteFile(scriptPath, []byte(scriptContent), 0755)
	if err != nil {
		t.Fatalf("Failed to write mock script: %v", err)
	}

	// Set PATH to include tempDir
	oldPath := os.Getenv("PATH")
	newPath := tempDir + string(os.PathListSeparator) + oldPath
	os.Setenv("PATH", newPath)
	defer os.Setenv("PATH", oldPath)

	// We also need a dummy dest folder
	destDir, err := os.MkdirTemp("", "music-yt-generic-dest")
	if err != nil {
		t.Fatalf("Failed to create dest dir: %v", err)
	}
	defer os.RemoveAll(destDir)

	// Run DownloadGenericVideo
	err = app.DownloadGenericVideo("https://vimeo.com/mock", destDir, "best")
	if err != nil {
		t.Fatalf("DownloadGenericVideo failed: %v", err)
	}

	// Give the goroutine scanner some time to process
	time.Sleep(100 * time.Millisecond)

	app.eventsMu.Lock()
	events := app.emittedEvents
	app.eventsMu.Unlock()

	var progressValues []int
	for _, ev := range events {
		if ev.Name == "download-progress" {
			if len(ev.Data) > 0 {
				if strVal, ok := ev.Data[0].(string); ok {
					val, err := strconv.Atoi(strVal)
					if err != nil {
						t.Errorf("Failed to parse progress event value %q: %v", strVal, err)
					} else {
						progressValues = append(progressValues, val)
					}
				} else {
					t.Errorf("Expected event data to be string, got %T", ev.Data[0])
				}
			}
		}
	}

	if len(progressValues) == 0 {
		t.Fatalf("No download-progress events were emitted")
	}

	// Let's print out the progress values
	t.Logf("Emitted progress values: %v", progressValues)

	// Verify values are strictly increasing
	for i := 1; i < len(progressValues); i++ {
		if progressValues[i] <= progressValues[i-1] {
			t.Errorf("Progress values not strictly increasing: %v at index %d vs %d", progressValues, i, i-1)
		}
	}

	expected := []int{0, 1, 10, 11, 100}
	if len(progressValues) != len(expected) {
		t.Errorf("Expected progress values %v, got %v", expected, progressValues)
	} else {
		for i, v := range progressValues {
			if v != expected[i] {
				t.Errorf("At index %d: expected %d, got %d", i, expected[i], v)
			}
		}
	}
}
