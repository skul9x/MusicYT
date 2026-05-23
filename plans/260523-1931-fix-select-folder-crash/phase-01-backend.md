# Phase 01: Backend Fix — SelectSavePath Crash Protection
Status: 🟢 Completed
Dependencies: Không

## Objective
Sửa hàm `SelectSavePath` trong `app.go` để KHÔNG BAO GIỜ crash toàn bộ ứng dụng, kể cả khi:
- `a.ctx` bị nil
- Windows COM thread conflict (STA/MTA)
- Go version mới xung đột Wails thread

Áp dụng cho cả **Windows** và **Linux**.

## Root Cause Recap
```
User click "Thay đổi" → Frontend gọi SelectSavePath() 
→ Go Backend gọi wailsRuntime.OpenDirectoryDialog(a.ctx, ...)
→ CRASH vì:
   1. a.ctx có thể nil (race condition khi startup)
   2. Windows yêu cầu STA thread cho Shell Dialog
   3. Go 1.23+ thay đổi thread management
```

## Implementation Steps

### 1. [x] Thêm Nil Guard cho `a.ctx`
**File:** [app.go](file:///D:/skul9x/dev/MusicYT-main/app.go) — Line 38-46

**Before:**
```go
func (a *App) SelectSavePath() (string, error) {
	path, err := wailsRuntime.OpenDirectoryDialog(a.ctx, wailsRuntime.OpenDialogOptions{
		Title: "Chọn thư mục lưu video",
	})
	if err != nil {
		return "", err
	}
	return path, nil
}
```

**After:**
```go
func (a *App) SelectSavePath() (result string, err error) {
	// Lớp 1: Nil Guard — chặn crash khi context chưa khởi tạo
	if a.ctx == nil {
		return "", fmt.Errorf("ứng dụng chưa sẵn sàng, vui lòng thử lại sau giây lát")
	}

	// Lớp 2: Panic Recovery — hứng mọi panic từ Windows COM/STA conflict
	defer func() {
		if r := recover(); r != nil {
			err = fmt.Errorf("không thể mở hộp thoại chọn thư mục: %v", r)
			result = ""
		}
	}()

	// Lớp 3: Gọi native dialog an toàn
	path, dialogErr := wailsRuntime.OpenDirectoryDialog(a.ctx, wailsRuntime.OpenDialogOptions{
		Title: "Chọn thư mục lưu video",
	})
	if dialogErr != nil {
		return "", fmt.Errorf("lỗi khi mở hộp thoại: %v", dialogErr)
	}

	return path, nil
}
```

**Giải thích thiết kế:**
- **Named return values** (`result string, err error`) — Bắt buộc để `defer recover()` có thể gán giá trị trả về
- **Nil guard** — Chặn nil pointer dereference tuyệt đối
- **Panic recovery** — Bảo vệ khỏi crash COM trên Windows, không ảnh hưởng Linux

> **Lưu ý:** KHÔNG dùng `runtime.LockOSThread()` ở đây vì Wails v2.12.0 đã tự xử lý việc marshal dialog về GUI thread chính. Thêm `LockOSThread` có thể gây deadlock với Wails internal dispatch. Nếu sau khi áp dụng vẫn crash, sẽ escalate lên Phase riêng xử lý `LockOSThread` + `go-ole`.

### 2. [x] Thêm cơ chế `OnDomReady` để đảm bảo context ready
**File:** [main.go](file:///D:/skul9x/dev/MusicYT-main/main.go) — Thêm `OnDomReady` callback

Hiện tại `main.go` chỉ có `OnStartup` — context được gán tại đây nhưng Frontend có thể gọi `SelectSavePath` trước khi DOM fully ready.

**Before (main.go line 19-31):**
```go
err := wails.Run(&options.App{
    Title:  "yt-downloader",
    Width:  1024,
    Height: 768,
    AssetServer: &assetserver.Options{
        Assets: assets,
    },
    BackgroundColour: &options.RGBA{R: 27, G: 38, B: 54, A: 1},
    OnStartup:        app.startup,
    Bind: []interface{}{
        app,
    },
})
```

**After:**
```go
err := wails.Run(&options.App{
    Title:  "yt-downloader",
    Width:  1024,
    Height: 768,
    AssetServer: &assetserver.Options{
        Assets: assets,
    },
    BackgroundColour: &options.RGBA{R: 27, G: 38, B: 54, A: 1},
    OnStartup:        app.startup,
    OnDomReady:       app.domReady,
    Bind: []interface{}{
        app,
    },
})
```

### 3. [x] Thêm `domReady` method và flag `ready`
**File:** [app.go](file:///D:/skul9x/dev/MusicYT-main/app.go)

Thêm field `ready` vào struct `App` và method `domReady`:

```go
type App struct {
	ctx        context.Context
	cancelMu   sync.Mutex
	cancelFunc context.CancelFunc
	ready      bool  // true khi DOM đã sẵn sàng
}

// domReady is called when the frontend DOM is ready
func (a *App) domReady(ctx context.Context) {
	a.ready = true
}
```

Cập nhật `SelectSavePath` để check thêm `a.ready`:
```go
if a.ctx == nil || !a.ready {
    return "", fmt.Errorf("ứng dụng chưa sẵn sàng, vui lòng thử lại sau giây lát")
}
```

### 4. [x] Thêm method `IsAppReady` để Frontend có thể check
**File:** [app.go](file:///D:/skul9x/dev/MusicYT-main/app.go)

```go
// IsAppReady returns true if the application backend is fully initialized
func (a *App) IsAppReady() bool {
	return a.ctx != nil && a.ready
}
```

Frontend sẽ gọi method này trước khi cho phép user click "Thay đổi".

## Files to Create/Modify
| File | Action | Purpose |
|------|--------|---------|
| [app.go](file:///D:/skul9x/dev/MusicYT-main/app.go) | MODIFY | Sửa `SelectSavePath`, thêm `domReady`, `IsAppReady`, thêm field `ready` |
| [main.go](file:///D:/skul9x/dev/MusicYT-main/main.go) | MODIFY | Thêm `OnDomReady` callback |

## Test Criteria
- [x] `SelectSavePath` trả về error (không crash) khi `a.ctx == nil`
- [x] `SelectSavePath` trả về error (không crash) khi `a.ready == false`
- [x] `recover()` bắt được panic giả lập (test với panic inject)
- [x] `IsAppReady()` trả `false` trước `domReady`, `true` sau
- [x] App hoạt động bình thường trên cả Windows và Linux

## Notes
- **Không dùng `runtime.LockOSThread()`** — Wails v2.12 đã marshal dialog calls. Thêm vào có thể gây deadlock.
- **Không cần thêm dependency `go-ole`** — Wails đã wrap COM calls internally.
- Giải pháp này tương thích cả Windows + Linux vì nil guard và recover() là Go standard.
- Trên Linux, dialog dùng GTK/Zenity nên không gặp vấn đề COM thread.

---
Next Phase: [phase-02-frontend.md](file:///D:/skul9x/dev/MusicYT-main/plans/260523-1931-fix-select-folder-crash/phase-02-frontend.md)
