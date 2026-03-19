Kế Hoạch & Thuật Toán Phát Triển App Tải Video YouTube (Wails + Go + yt-dlp)1. Tổng quan dự án (Project Overview)Mục tiêu: Tạo một ứng dụng Desktop siêu nhẹ, gọi trực tiếp yt-dlp qua command line để tải video/audio từ YouTube và hàng ngàn trang web khác.Nền tảng hỗ trợ: Windows 10/11, Linux, macOS.Công nghệ cốt lõi:Frontend: React + TypeScript + Tailwind CSS (Vite).Backend (Core): Go (Golang) + Wails v2 framework.Core Downloader: yt-dlp (thực thi dưới dạng tiến trình con - Child Process) và ffmpeg (để gộp hình và tiếng).2. Kiến trúc hệ thống (Architecture)Khác với Tauri dùng IPC qua HTTP/WebSocket cục bộ, Wails tự động tạo ra các binding JavaScript (TypeScript) từ các hàm Go, cho phép Frontend gọi Backend như một hàm JS bình thường.Frontend (React): Cung cấp giao diện người dùng. Lắng nghe các sự kiện (Events) được Go phát ra để cập nhật UI.Backend (Go Layer):Quản lý hộp thoại lưu file (Save Dialog) bằng native OS API.Spawn process (tạo luồng) để chạy file thực thi yt-dlp.Bắt và phân tích chuỗi log (stdout) của yt-dlp bằng Regex để trích xuất % tiến độ.Emit % tiến độ đó về cho React.3. Kế hoạch phát triển (Development Plan)Giai đoạn 1: Khởi tạo dự ánCài đặt Go (>= 1.20) và Wails CLI (go install github.com/wailsapp/wails/v2/cmd/wails@latest).Tải file binary của yt-dlp và ffmpeg (đặt cùng thư mục với app hoặc cấu hình biến môi trường PATH).Khởi tạo Wails: wails init -n yt-downloader -t react-ts.Giai đoạn 2: Phát triển Backend (Go & OS Exec)Viết hàm SelectSavePath gọi runtime.SaveFileDialog để chọn nơi lưu file.Viết hàm GetVideoInfo sử dụng cờ yt-dlp --dump-json <url>.Viết hàm DownloadVideo sử dụng cờ yt-dlp --newline -o <path> <url>. Quét từng dòng output để lấy phần trăm.Giai đoạn 3: Phát triển UI/UX (Frontend)Import các hàm binding từ thư mục wailsjs/go/main/App.Sử dụng EventsOn từ @wailsio/runtime để bắt sự kiện tải.Vẽ UI đơn giản với input url, nút tải và thanh progress bar.Giai đoạn 4: Đóng gói (Bundle)Biên dịch ứng dụng với lệnh wails build.Viết script (hoặc dùng tính năng embed của Go) để đóng gói kèm file binary yt-dlp và ffmpeg bên trong app (Portable) hoặc yêu cầu người dùng cài đặt sẵn.4. Thuật toán xử lý cốt lõi (Core Algorithms)4.1. Thuật toán Phân tích Chuỗi Tiến độ (Regex Parsing)Do yt-dlp là một CLI tool, nó in tiến độ ra Console. Ta phải ép nó in từng dòng mới (bằng cờ --newline) thay vì ghi đè dòng (mặc định), sau đó dùng Regular Expression để cắt lấy số.Output của yt-dlp: [download]  45.5% of 50.00MiB at 1.50MiB/s ETA 00:15Regex gom nhóm: \[download\]\s+([\d\.]+)% (Lấy số 45.5).4.2. Luồng thực thi Tải VideosequenceDiagram
    participant UI as Frontend (React)
    participant Core as Wails (Go)
    participant OS as HĐH (OS Exec)
    participant YT as yt-dlp CLI

    UI->>Core: Gọi App.SelectSavePath()
    Core-->>UI: Trả về C:\Downloads\video.mp4
    UI->>Core: Gọi App.DownloadVideo(url, path)
    Core->>OS: exec.Command("yt-dlp", "--newline", ...)
    OS->>YT: Khởi chạy tiến trình yt-dlp
    
    loop Quét Output (Stdout Scanner)
        YT-->>OS: In ra "[download] 10.5% ..."
        OS-->>Core: Đọc chuỗi qua StdoutPipe
        Core->>Core: Regex Match -> 10.5
        Core-->>UI: runtime.EventsEmit("progress", 10.5)
    end
    
    YT-->>OS: Process Exit (Code 0)
    Core-->>UI: Trả về "Hoàn tất"
5. Hướng dẫn Triển khai Mã nguồn (Snippets)Bước 1: Code Backend Go (app.go)Thêm các hàm xử lý gọi CLI và Regex vào file app.go.package main

import (
	"bufio"
	"context"
	"fmt"
	"os/exec"
	"regexp"
	"strconv"

	"[github.com/wailsapp/wails/v2/pkg/runtime](https://github.com/wailsapp/wails/v2/pkg/runtime)"
)

type App struct {
	ctx context.Context
}

func NewApp() *App {
	return &App{}
}

func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
}

// 1. Hàm gọi Hộp thoại lưu file của Hệ điều hành
func (a *App) SelectSavePath() (string, error) {
	return runtime.SaveFileDialog(a.ctx, runtime.SaveDialogOptions{
		Title:           "Chọn nơi lưu Video",
		DefaultFilename: "video_tai_ve.mp4",
		Filters: []runtime.FileFilter{
			{DisplayName: "MP4 Video", Pattern: "*.mp4"},
		},
	})
}

// 2. Hàm Tải video và Bắn event tiến độ
func (a *App) DownloadVideo(url string, savePath string) (string, error) {
	// Lệnh yt-dlp: yt-dlp --newline -o "đường_dẫn_lưu" "url"
    // Lưu ý: Đảm bảo yt-dlp.exe đã nằm trong PATH hoặc bạn trỏ đường dẫn tuyệt đối tới nó
	cmd := exec.Command("yt-dlp", "--newline", "-o", savePath, url)

	// Lấy pipe chứa log hiển thị của cmd
	stdout, err := cmd.StdoutPipe()
	if err != nil {
		return "", err
	}

	if err := cmd.Start(); err != nil {
		return "", err
	}

	// Scanner để đọc từng dòng (line by line)
	scanner := bufio.NewScanner(stdout)
	
	// Regex tìm mẫu: "[download]  15.5%" -> Lấy số 15.5
	re := regexp.MustCompile(`\[download\]\s+([\d\.]+)%`)

	for scanner.Scan() {
		line := scanner.Text()
		match := re.FindStringSubmatch(line)
		
		if len(match) > 1 {
			// Ép kiểu chuỗi thành số thập phân (float64)
			progress, err := strconv.ParseFloat(match[1], 64)
			if err == nil {
				// Bắn sự kiện về cho React JS
				runtime.EventsEmit(a.ctx, "download-progress", progress)
			}
		}
	}

	// Đợi tiến trình yt-dlp kết thúc
	if err := cmd.Wait(); err != nil {
		return "", fmt.Errorf("Lỗi khi tải: %v", err)
	}

	return "Tải hoàn tất!", nil
}
Bước 2: Xử lý ở Frontend React (frontend/src/App.tsx)Wails sẽ tự động sinh ra file trong frontend/wailsjs/go/main/App.js mỗi khi bạn lưu file Go. Ta chỉ cần import vào dùng.import { useState, useEffect } from 'react';
import { DownloadVideo, SelectSavePath } from "../wailsjs/go/main/App";
import { EventsOn, EventsOff } from "../wailsjs/runtime/runtime";

function App() {
  const [url, setUrl] = useState('');
  const [progress, setProgress] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    // Đăng ký lắng nghe sự kiện từ Go
    EventsOn("download-progress", (p: number) => {
      setProgress(p);
    });

    // Cleanup khi component unmount
    return () => {
      EventsOff("download-progress");
    };
  }, []);

  const startDownload = async () => {
    if (!url) return;

    try {
      // 1. Gọi Go mở Dialog chọn nơi lưu
      const savePath = await SelectSavePath();
      if (!savePath) return; // Hủy nếu người dùng tắt dialog

      setIsDownloading(true);
      setProgress(0);

      // 2. Gọi Go bắt đầu tải
      const resultMsg = await DownloadVideo(url, savePath);
      alert(resultMsg);

    } catch (error) {
      alert(`Đã xảy ra lỗi: ${error}`);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="p-8 flex flex-col gap-4 w-screen h-screen bg-gray-50">
      <h1 className="text-2xl font-bold text-center mb-4">Wails + yt-dlp Downloader</h1>
      
      <input 
        type="text" 
        placeholder="Dán link YouTube, TikTok, Facebook..." 
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        className="border p-3 rounded shadow-sm w-full"
      />
      
      <button 
        onClick={startDownload} 
        disabled={isDownloading || !url}
        className="bg-red-600 hover:bg-red-700 text-white font-bold p-3 rounded shadow transition-all disabled:opacity-50"
      >
        {isDownloading ? 'Đang xử lý...' : 'Tải Xuống Ngay'}
      </button>

      {isDownloading && (
        <div className="w-full bg-gray-300 rounded-full h-4 mt-6 overflow-hidden shadow-inner">
          <div 
            className="bg-green-500 h-4 rounded-full transition-all duration-300" 
            style={{ width: `${progress}%` }}
          ></div>
          <p className="text-center font-mono mt-2">{progress}%</p>
        </div>
      )}
    </div>
  );
}

export default App;
6. Các lưu ý quan trọng khi dùng yt-dlp & Wails (Best Practices)Phụ thuộc Binary (External Dependencies):App của bạn hiện đang cần yt-dlp và ffmpeg để hoạt động.Cách giải quyết tốt nhất: Khi build app, hãy tạo một thư mục bin chứa sẵn yt-dlp.exe và ffmpeg.exe. Trong file Go, thay vì gõ "yt-dlp", hãy trỏ đường dẫn tuyệt đối tới file binary đó (Dùng os.Executable() để lấy thư mục hiện tại của app -> trỏ tới thư mục bin).Cập nhật yt-dlp:Vì cấu trúc web thay đổi liên tục, bạn nên code thêm một hàm UpdateYtDlp() gọi lệnh yt-dlp -U qua exec.Command để người dùng có thể tự update tool từ trong giao diện ứng dụng.Chặn Cửa sổ Console mọc lên (Trên Windows):Mặc định khi dùng os/exec trên Windows nó có thể làm nháy lên 1 cửa sổ CMD màu đen.Hãy cấu hình thuộc tính ẩn tiến trình (SysProcAttr) trong Go (chỉ áp dụng cho build Windows):cmd := exec.Command("yt-dlp", ...)
cmd.SysProcAttr = &syscall.SysProcAttr{HideWindow: true}
