package main

import (
	"bufio"
	"context"
	"fmt"
	"os"
	"os/exec"
	"regexp"
	"strings"

	wailsRuntime "github.com/wailsapp/wails/v2/pkg/runtime"
)

// App struct
type App struct {
	ctx context.Context
}

// NewApp creates a new App application struct
func NewApp() *App {
	return &App{}
}

// startup is called when the app starts. The context is saved
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
}

// SelectSavePath opens a native dialog to pick a folder for downloading
func (a *App) SelectSavePath() (string, error) {
	path, err := wailsRuntime.OpenDirectoryDialog(a.ctx, wailsRuntime.OpenDialogOptions{
		Title: "Chọn thư mục lưu video",
	})
	if err != nil {
		return "", err
	}
	return path, nil
}

// GetDefaultSavePath returns the user's Downloads folder or Home folder
func (a *App) GetDefaultSavePath() string {
	home, err := os.UserHomeDir()
	if err != nil {
		return "."
	}
	// Check common "Downloads" folder
	dlPath := home + "/Downloads"
	if _, err := os.Stat(dlPath); err == nil {
		return dlPath
	}
	return home
}

type DependencyStatus struct {
	OK      bool   `json:"ok"`
	Message string `json:"message"`
}

// CheckDependencies checks if yt-dlp is available in the system PATH
func (a *App) CheckDependencies() DependencyStatus {
	_, err := exec.LookPath("yt-dlp")
	if err != nil {
		return DependencyStatus{OK: false, Message: "yt-dlp not found. Please install it."}
	}
	_, err = exec.LookPath("ffmpeg")
	if err != nil {
		return DependencyStatus{OK: false, Message: "ffmpeg not found. Needed for high quality audio."}
	}
	return DependencyStatus{OK: true, Message: "Dependencies OK"}
}

// DownloadVideo starts downloading the video from the given URL to the target path
func (a *App) DownloadVideo(url string, savePath string, formatOption string) error {
	url = strings.TrimSpace(url)
	savePath = strings.TrimSpace(savePath)

	args := []string{
		url,
		"-o", savePath + "/%(title)s.%(ext)s",
		"--no-playlist",
		"--newline",
	}

	// Format selection logic
	switch formatOption {
	case "m4a":
		args = append(args, "-x", "--audio-format", "m4a", "--embed-thumbnail")
	case "1080p":
		args = append(args, "-f", "bestvideo[height<=1080]+bestaudio/best[height<=1080]")
	case "720p":
		args = append(args, "-f", "bestvideo[height<=720]+bestaudio/best[height<=720]")
	case "best":
		fallthrough
	default:
		args = append(args, "-f", "bestvideo+bestaudio/best")
	}

	cmd := exec.Command("yt-dlp", args...)

	stdout, err := cmd.StdoutPipe()
	if err != nil {
		return fmt.Errorf("failed to get stdout: %v", err)
	}

	if err := cmd.Start(); err != nil {
		return fmt.Errorf("failed to start yt-dlp: %v", err)
	}

	scanner := bufio.NewScanner(stdout)
	reProgress := regexp.MustCompile(`\[download\]\s+([\d\.]+)%`)

	go func() {
		for scanner.Scan() {
			line := scanner.Text()
			match := reProgress.FindStringSubmatch(line)
			if len(match) > 1 {
				progress := match[1]
				wailsRuntime.EventsEmit(a.ctx, "download-progress", progress)
			}
		}
	}()

	if err := cmd.Wait(); err != nil {
		return fmt.Errorf("yt-dlp error: %v", err)
	}

	return nil
}

// GetVideoInfo fetches metadata for the given URL
func (a *App) GetVideoInfo(url string) (string, error) {
	// Command: yt-dlp --dump-json --no-playlist [URL]
	cmd := exec.Command("yt-dlp", "--dump-json", "--no-playlist", url)
	
	output, err := cmd.Output()
	if err != nil {
		return "", fmt.Errorf("failed to fetch video info: %v", err)
	}

	return string(output), nil
}
