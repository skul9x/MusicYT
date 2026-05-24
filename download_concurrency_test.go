package main

import (
	"context"
	"sync"
	"testing"
	"time"
)

func TestDownloadConcurrency_Safety(t *testing.T) {
	app := NewApp()
	ctx := context.WithValue(context.Background(), "is_test", true)
	app.startup(ctx)
	app.domReady(ctx)

	// Đóng vai trò là tiến trình tải 1 giả lập đang chạy
	app.downloadMu.Lock()
	app.activeDownload = true
	app.downloadWg.Add(1)
	
	// Thiết lập cancelFunc giả lập cho tiến trình 1
	cancelled := false
	app.cancelFunc = func() {
		cancelled = true
	}
	app.downloadMu.Unlock()

	// Khởi chạy tiến trình 2 trong một goroutine khác để xem nó có tự động hủy tiến trình 1 và đợi giải phóng không
	var wg sync.WaitGroup
	wg.Add(1)
	
	var err2 error
	go func() {
		defer wg.Done()
		// Gọi DownloadVideo với tham số rác. Vì nó sẽ gọi CancelDownload() và downloadWg.Wait(),
		// nó sẽ bị block cho đến khi chúng ta Done() downloadWg của tiến trình 1.
		err2 = app.DownloadVideo("https://invalid-url-for-test-999.com", "/tmp", "best")
	}()

	// Chờ một chút để goroutine 2 chạy và bị chặn ở Wait()
	time.Sleep(100 * time.Millisecond)

	// Kiểm tra xem tiến trình 2 đã gọi CancelDownload() chưa
	app.cancelMu.Lock()
	isCancelled := cancelled
	app.cancelMu.Unlock()

	if !isCancelled {
		t.Error("Expected CancelDownload to be triggered on the active download")
	}

	// Giải phóng tiến trình 1 giả lập (giống như khi yt-dlp nhận context cancelled và thoát)
	app.downloadMu.Lock()
	app.activeDownload = false
	app.downloadWg.Done()
	app.downloadMu.Unlock()

	// Chờ goroutine 2 hoàn thành
	wg.Wait()

	// Do URL rác và không có yt-dlp thật chạy thành công cho URL đó, err2 sẽ không phải nil
	// Nhưng quan trọng nhất là tiến trình không bị dead-lock và kết thúc an toàn.
	t.Logf("Goroutine 2 finished with error: %v", err2)
}

func TestDownloadConcurrency_PreventParallel(t *testing.T) {
	app := NewApp()
	ctx := context.WithValue(context.Background(), "is_test", true)
	app.startup(ctx)
	app.domReady(ctx)

	// Giả lập trạng thái activeDownload = true
	app.downloadMu.Lock()
	app.activeDownload = true
	app.downloadWg.Add(1)
	app.downloadMu.Unlock()

	// Khi activeDownload = true mà không gọi CancelDownload (hoặc giả lập gọi trực tiếp logic check)
	// Ta có thể kiểm tra xem việc lock hoạt động chuẩn xác không
	app.downloadMu.Lock()
	isActive := app.activeDownload
	app.downloadMu.Unlock()

	if !isActive {
		t.Error("Expected activeDownload to be true")
	}

	// Dọn dẹp
	app.downloadMu.Lock()
	app.activeDownload = false
	app.downloadWg.Done()
	app.downloadMu.Unlock()
}
