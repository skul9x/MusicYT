package main

import (
	"bufio"
	"context"
	"fmt"
	"io"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"regexp"
	"runtime"
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
	OK       bool   `json:"ok"`
	Message  string `json:"message"`
	OS       string `json:"os"`
	YtdlpOK  bool   `json:"ytdlp_ok"`
	FfmpegOK bool   `json:"ffmpeg_ok"`
}

// CheckDependencies checks if yt-dlp and ffmpeg are available in the system PATH
func (a *App) CheckDependencies() DependencyStatus {
	ytdlpOK := true
	ffmpegOK := true

	_, err := exec.LookPath("yt-dlp")
	if err != nil {
		ytdlpOK = false
	}
	_, err = exec.LookPath("ffmpeg")
	if err != nil {
		ffmpegOK = false
	}

	ok := ytdlpOK && ffmpegOK
	msg := "Dependencies OK"
	if !ok {
		msg = "Missing dependencies"
	}

	return DependencyStatus{
		OK:       ok,
		Message:  msg,
		OS:       runtime.GOOS,
		YtdlpOK:  ytdlpOK,
		FfmpegOK: ffmpegOK,
	}
}

// DownloadFile downloads a file and emits progress
func (a *App) DownloadFile(url string, dest string, eventName string) error {
	out, err := os.Create(dest)
	if err != nil {
		return err
	}
	defer out.Close()

	resp, err := http.Get(url)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	buf := make([]byte, 1024*32) // 32KB
	var downloaded int64
	total := resp.ContentLength

	for {
		n, err := resp.Body.Read(buf)
		if n > 0 {
			out.Write(buf[0:n])
			downloaded += int64(n)
			if total > 0 {
				progress := float64(downloaded) / float64(total) * 100
				wailsRuntime.EventsEmit(a.ctx, eventName, progress)
			}
		}
		if err == io.EOF {
			break
		}
		if err != nil {
			return err
		}
	}
	wailsRuntime.EventsEmit(a.ctx, eventName, 100.0)
	return nil
}

// SetupWindowsDependencies automates Windows installation
func (a *App) SetupWindowsDependencies() error {
	if runtime.GOOS != "windows" {
		return fmt.Errorf("this function is only for Windows")
	}

	toolsDir := "C:\\tools"
	if err := os.MkdirAll(toolsDir, 0755); err != nil {
		return fmt.Errorf("failed to create C:\\tools: %v", err)
	}

	wailsRuntime.EventsEmit(a.ctx, "install-status", "Đang tải yt-dlp...")
	err := a.DownloadFile("https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe", filepath.Join(toolsDir, "yt-dlp.exe"), "install-progress")
	if err != nil {
		return fmt.Errorf("failed to download yt-dlp: %v", err)
	}

	wailsRuntime.EventsEmit(a.ctx, "install-status", "Đang tải và giải nén ffmpeg (vui lòng chờ)...")
	psScript := `
	$ProgressPreference = 'SilentlyContinue'
	Invoke-WebRequest -Uri "https://github.com/BtbN/FFmpeg-Builds/releases/download/latest/ffmpeg-master-latest-win64-gpl.zip" -OutFile "C:\tools\ffmpeg.zip"
	Expand-Archive -Path "C:\tools\ffmpeg.zip" -DestinationPath "C:\tools\ffmpeg_extracted" -Force
	Move-Item -Path "C:\tools\ffmpeg_extracted\ffmpeg-master-latest-win64-gpl\bin\ffmpeg.exe" -Destination "C:\tools\ffmpeg.exe" -Force
	Remove-Item "C:\tools\ffmpeg.zip"
	Remove-Item "C:\tools\ffmpeg_extracted" -Recurse -Force
	`
	cmd := exec.Command("powershell", "-NoProfile", "-Command", psScript)
	if err := cmd.Run(); err != nil {
		return fmt.Errorf("failed to install ffmpeg: %v", err)
	}

	wailsRuntime.EventsEmit(a.ctx, "install-status", "Đang cập nhật biến môi trường (PATH)...")
	pathScript := `
	$currentPath = [Environment]::GetEnvironmentVariable("Path", [EnvironmentVariableTarget]::User)
	if ($currentPath -notmatch "C:\\tools") {
		$newPath = $currentPath + ";C:\tools"
		[Environment]::SetEnvironmentVariable("Path", $newPath, [EnvironmentVariableTarget]::User)
	}
	`
	cmd = exec.Command("powershell", "-NoProfile", "-Command", pathScript)
	if err := cmd.Run(); err != nil {
		return fmt.Errorf("failed to update PATH: %v", err)
	}

	wailsRuntime.EventsEmit(a.ctx, "install-status", "Hoàn tất cài đặt trên Windows!")
	return nil
}

// SetupLinuxDependencies automates Linux installation using pkexec
func (a *App) SetupLinuxDependencies() error {
	if runtime.GOOS != "linux" {
		return fmt.Errorf("this function is only for Linux")
	}

	wailsRuntime.EventsEmit(a.ctx, "install-status", "Đang yêu cầu quyền quản trị (sudo)...")
	script := `
	curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp && 
	chmod a+rx /usr/local/bin/yt-dlp && 
	apt-get update && 
	apt-get install -y ffmpeg
	`

	cmd := exec.Command("pkexec", "bash", "-c", script)
	output, err := cmd.CombinedOutput()
	if err != nil {
		return fmt.Errorf("lỗi cài đặt: %v. Output: %s", err, string(output))
	}

	wailsRuntime.EventsEmit(a.ctx, "install-status", "Hoàn tất cài đặt trên Linux!")
	return nil
}

// UpdateYtdlp checks for and installs yt-dlp updates
func (a *App) UpdateYtdlp() error {
	wailsRuntime.EventsEmit(a.ctx, "install-status", "⏳ Đang kiểm tra và cập nhật yt-dlp...")
	
	if runtime.GOOS == "windows" {
		cmd := exec.Command("yt-dlp", "-U")
		output, err := cmd.CombinedOutput()
		if err != nil {
			return fmt.Errorf("Lỗi cập nhật: %v. Output: %s", err, string(output))
		}
		wailsRuntime.EventsEmit(a.ctx, "install-status", "✅ Hoàn tất cập nhật!")
		return nil
	} else if runtime.GOOS == "linux" {
		wailsRuntime.EventsEmit(a.ctx, "install-status", "⏳ Đang yêu cầu quyền quản trị (sudo) để cập nhật...")
		cmd := exec.Command("pkexec", "yt-dlp", "-U")
		output, err := cmd.CombinedOutput()
		if err != nil {
			return fmt.Errorf("Lỗi cập nhật: %v. Output: %s", err, string(output))
		}
		wailsRuntime.EventsEmit(a.ctx, "install-status", "✅ Hoàn tất cập nhật!")
		return nil
	}
	
	return fmt.Errorf("hệ điều hành không được hỗ trợ")
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
