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
	"sync"

	wailsRuntime "github.com/wailsapp/wails/v2/pkg/runtime"
)

// App struct
type App struct {
	ctx                    context.Context
	cancelMu               sync.Mutex
	cancelFunc             context.CancelFunc
	ready                  bool // true khi DOM đã sẵn sàng
	selectPathPanicForTest bool // true để giả lập panic khi chọn thư mục
	dialogMu               sync.Mutex // ← THÊM MỚI: Bảo vệ chặn concurrent dialog calls
	lastResolvedDefaultDir string     // ← THÊM MỚI: Dành cho Unit Test kiểm tra Bug 4
}

// NewApp creates a new App application struct
func NewApp() *App {
	return &App{}
}

// startup is called when the app starts. The context is saved
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
}

// domReady is called when the frontend DOM is ready
func (a *App) domReady(ctx context.Context) {
	a.ready = true
}

// IsAppReady returns true if the application backend is fully initialized
func (a *App) IsAppReady() bool {
	return a.ctx != nil && a.ready
}

// SelectSavePath opens a native dialog to pick a folder for downloading.
// currentPath is passed from the frontend to open the dialog in the currently selected directory if valid.
func (a *App) SelectSavePath(currentPath string) (result string, err error) {
	// Lớp 0: Khóa Mutex chống double-click hoặc concurrent dialog calls
	if !a.dialogMu.TryLock() {
		return "", fmt.Errorf("hộp thoại chọn thư mục đang được mở")
	}
	defer a.dialogMu.Unlock()

	// Lớp 1: Nil Guard — chặn crash khi context chưa khởi tạo hoặc DOM chưa sẵn sàng
	if a.ctx == nil || !a.ready {
		return "", fmt.Errorf("ứng dụng chưa sẵn sàng, vui lòng thử lại sau giây lát")
	}

	// Lớp 2: Panic Recovery — hứng mọi panic từ Windows COM/STA conflict
	defer func() {
		if r := recover(); r != nil {
			err = fmt.Errorf("không thể mở hộp thoại chọn thư mục: %v", r)
			result = ""
		}
	}()

	// Xác định DefaultDirectory tối ưu cho UX (BUG 4)
	defaultDir := a.GetDefaultSavePath()
	if currentPath != "" {
		cleanPath := filepath.Clean(currentPath)
		if info, err := os.Stat(cleanPath); err == nil && info.IsDir() {
			defaultDir = cleanPath
		}
	}
	a.lastResolvedDefaultDir = defaultDir

	// Nếu là test context, chặn không gọi OpenDirectoryDialog để tránh crash Wails
	if a.ctx != nil && a.ctx.Value("is_test") == true {
		return "/mock/path", nil
	}

	// Lớp 3: Gọi native dialog an toàn
	if a.selectPathPanicForTest {
		panic("simulated COM thread panic")
	}

	path, dialogErr := wailsRuntime.OpenDirectoryDialog(a.ctx, wailsRuntime.OpenDialogOptions{
		Title:            "Chọn thư mục lưu video",
		DefaultDirectory: defaultDir, // ← THÊM MỚI: Tự động mở ở thư mục hiện tại
	})
	if dialogErr != nil {
		return "", fmt.Errorf("lỗi khi mở hộp thoại: %v", dialogErr)
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

// OpenOutputFolder opens the given folder path in the system's native file explorer
func (a *App) OpenOutputFolder(folderPath string) error {
	folderPath = strings.TrimSpace(folderPath)
	if folderPath == "" {
		return fmt.Errorf("đường dẫn thư mục không được để trống")
	}

	// Chuẩn hóa đường dẫn bằng filepath.Clean
	cleanPath := filepath.Clean(folderPath)

	// Chặn tuyệt đối đường dẫn mạng UNC bắt đầu bằng \\ hoặc //
	if strings.HasPrefix(cleanPath, "\\\\") || strings.HasPrefix(cleanPath, "//") ||
		strings.HasPrefix(folderPath, "\\\\") || strings.HasPrefix(folderPath, "//") {
		return fmt.Errorf("không chấp nhận đường dẫn UNC để tránh rò rỉ NTLM Hash")
	}

	// Kiểm tra thư mục tồn tại và thực sự là thư mục
	info, err := os.Stat(cleanPath)
	if err != nil {
		return fmt.Errorf("thư mục không tồn tại: %v", err)
	}
	if !info.IsDir() {
		return fmt.Errorf("đường dẫn không phải là thư mục")
	}

	var cmd *exec.Cmd
	switch runtime.GOOS {
	case "windows":
		cmd = exec.Command("explorer", cleanPath)
	case "darwin":
		cmd = exec.Command("open", cleanPath)
	case "linux":
		cmd = exec.Command("xdg-open", cleanPath)
	default:
		return fmt.Errorf("hệ điều hành không được hỗ trợ: %s", runtime.GOOS)
	}

	return cmd.Start()
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
	if runtime.GOOS == "windows" {
		if _, err := os.Stat("C:\\tools\\yt-dlp.exe"); err == nil {
			pathEnv := os.Getenv("PATH")
			hasTools := false
			paths := filepath.SplitList(pathEnv)
			for _, p := range paths {
				if strings.EqualFold(strings.TrimRight(p, "\\/"), "C:\\tools") {
					hasTools = true
					break
				}
			}
			if !hasTools {
				newPath := "C:\\tools" + string(os.PathListSeparator) + pathEnv
				os.Setenv("PATH", newPath)
			}
		}
	}

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
				a.emitEvent(eventName, progress)
			}
		}
		if err == io.EOF {
			break
		}
		if err != nil {
			return err
		}
	}
	a.emitEvent(eventName, 100.0)
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

	a.emitEvent("install-status", "Đang tải yt-dlp...")
	err := a.DownloadFile("https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe", filepath.Join(toolsDir, "yt-dlp.exe"), "install-progress")
	if err != nil {
		return fmt.Errorf("failed to download yt-dlp: %v", err)
	}

	a.emitEvent("install-status", "Đang tải và giải nén ffmpeg (vui lòng chờ)...")
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

	a.emitEvent("install-status", "Đang cập nhật biến môi trường (PATH)...")
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

	a.emitEvent("install-status", "Hoàn tất cài đặt trên Windows!")
	return nil
}

// SetupLinuxDependencies automates Linux installation using pkexec
func (a *App) SetupLinuxDependencies() error {
	if runtime.GOOS != "linux" {
		return fmt.Errorf("this function is only for Linux")
	}

	a.emitEvent("install-status", "Đang yêu cầu quyền quản trị (sudo)...")
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

	a.emitEvent("install-status", "Hoàn tất cài đặt trên Linux!")
	return nil
}

// UpdateYtdlp checks for and installs yt-dlp updates
func (a *App) UpdateYtdlp() error {
	a.emitEvent("install-status", "⏳ Đang kiểm tra và cập nhật yt-dlp...")
	
	if runtime.GOOS == "windows" {
		cmd := exec.Command("yt-dlp", "-U")
		output, err := cmd.CombinedOutput()
		if err != nil {
			return fmt.Errorf("Lỗi cập nhật: %v. Output: %s", err, string(output))
		}
		a.emitEvent("install-status", "✅ Hoàn tất cập nhật!")
		return nil
	} else if runtime.GOOS == "linux" {
		a.emitEvent("install-status", "⏳ Đang yêu cầu quyền quản trị (sudo) để cập nhật...")
		cmd := exec.Command("pkexec", "yt-dlp", "-U")
		output, err := cmd.CombinedOutput()
		if err != nil {
			return fmt.Errorf("Lỗi cập nhật: %v. Output: %s", err, string(output))
		}
		a.emitEvent("install-status", "✅ Hoàn tất cập nhật!")
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

	a.cancelMu.Lock()
	if a.cancelFunc != nil {
		a.cancelFunc()
	}
	var ctx context.Context
	if a.ctx != nil {
		ctx, a.cancelFunc = context.WithCancel(a.ctx)
	} else {
		ctx, a.cancelFunc = context.WithCancel(context.Background())
	}
	a.cancelMu.Unlock()

	defer func() {
		a.cancelMu.Lock()
		if a.cancelFunc != nil {
			a.cancelFunc()
			a.cancelFunc = nil
		}
		a.cancelMu.Unlock()
	}()

	cmd := exec.CommandContext(ctx, "yt-dlp", args...)

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
				a.emitEvent("download-progress", progress)
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

// DownloadGenericVideo starts downloading video/audio from any platform supported by yt-dlp
func (a *App) DownloadGenericVideo(url string, savePath string, formatOption string) error {
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
		args = append(args, "-f", "best[vcodec^=h264]/best", "-x", "--audio-format", "m4a")
	case "m4a_cover":
		args = append(args, "-f", "best[vcodec^=h264]/best", "-x", "--audio-format", "m4a", "--embed-thumbnail")
	case "best":
		fallthrough
	default:
		args = append(args, "-f", "bv*+ba/b", "--merge-output-format", "mp4")
	}

	a.cancelMu.Lock()
	if a.cancelFunc != nil {
		a.cancelFunc()
	}
	var ctx context.Context
	if a.ctx != nil {
		ctx, a.cancelFunc = context.WithCancel(a.ctx)
	} else {
		ctx, a.cancelFunc = context.WithCancel(context.Background())
	}
	a.cancelMu.Unlock()

	defer func() {
		a.cancelMu.Lock()
		if a.cancelFunc != nil {
			a.cancelFunc()
			a.cancelFunc = nil
		}
		a.cancelMu.Unlock()
	}()

	cmd := exec.CommandContext(ctx, "yt-dlp", args...)

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
				a.emitEvent("download-progress", progress)
			}
		}
	}()

	if err := cmd.Wait(); err != nil {
		return fmt.Errorf("yt-dlp error: %v", err)
	}

	return nil
}

// CancelDownload cancels any ongoing download process
func (a *App) CancelDownload() {
	a.cancelMu.Lock()
	defer a.cancelMu.Unlock()
	if a.cancelFunc != nil {
		a.cancelFunc()
		a.cancelFunc = nil
	}
}

// GetGenericVideoInfo fetches metadata for any supported URL
func (a *App) GetGenericVideoInfo(url string) (string, error) {
	cmd := exec.Command("yt-dlp", "--dump-json", "--no-playlist", url)
	
	output, err := cmd.Output()
	if err != nil {
		return "", fmt.Errorf("failed to fetch video info: %v", err)
	}

	return string(output), nil
}

// emitEvent is a helper to safely call EventsEmit and recover from any panic when running in test mode
func (a *App) emitEvent(name string, optionalData ...interface{}) {
	if a.ctx == nil || a.ctx.Value("is_test") == true {
		return
	}
	defer func() {
		if r := recover(); r != nil {
			// Suppress panic during tests
		}
	}()
	wailsRuntime.EventsEmit(a.ctx, name, optionalData...)
}

