# Phase 01: Backend Fix — Tránh Concurrent Dialog & Hỗ Trợ DefaultDirectory

Status: ✅ Completed
Dependencies: Không

## Objective
Nâng cấp Backend Go trong `app.go` để giải quyết triệt để 2 lỗi hệ thống:
1. **BUG 1 (🔴):** Chống Race Condition bằng `sync.Mutex` để chặn đứng lỗi double-click gây crash ứng dụng trên Windows.
2. **BUG 4 (🟢):** Hỗ trợ `DefaultDirectory` thông qua tham số `currentPath` truyền từ frontend để tối ưu hóa trải nghiệm người dùng (mở hộp thoại đúng thư mục đang lưu).

---

## Chi tiết thay đổi đề xuất

### 1. Thêm `dialogMu` vào struct `App`
**File:** [app.go](file:///d:/skul9x/dev/MusicYT-main/app.go)
Thêm trường `dialogMu` thuộc kiểu `sync.Mutex` để quản lý trạng thái hiển thị của native dialog.

```go
type App struct {
	ctx                    context.Context
	cancelMu               sync.Mutex
	cancelFunc             context.CancelFunc
	ready                  bool // true khi DOM đã sẵn sàng
	selectPathPanicForTest bool // true để giả lập panic khi chọn thư mục
	dialogMu               sync.Mutex // ← THÊM MỚI: Bảo vệ chặn concurrent dialog calls
}
```

### 2. Sửa đổi signature và logic hàm `SelectSavePath`
**File:** [app.go](file:///d:/skul9x/dev/MusicYT-main/app.go)

**Thay đổi:**
- Nhận thêm đối số `currentPath string`.
- Sử dụng `a.dialogMu.TryLock()` để kiểm tra xem có hộp thoại nào đang mở hay không. Nếu có, lập tức trả về lỗi `"hộp thoại đang được mở"` để tránh xung đột luồng COM trên Windows.
- Phân tích và validate `currentPath`. Nếu đường dẫn hợp lệ và tồn tại trên đĩa cứng dưới dạng thư mục, sử dụng nó làm `DefaultDirectory`. Nếu không, tự động fallback về `a.GetDefaultSavePath()`.

```go
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
```

---

## Các tệp sẽ sửa đổi
* [app.go](file:///d:/skul9x/dev/MusicYT-main/app.go) — Cập nhật struct `App` và hàm `SelectSavePath`.

---

## Kế hoạch kiểm thử & Xác minh (Backend)
1. **Kiểm tra biên dịch:** Đảm bảo code Go biên dịch thành công mà không có lỗi cú pháp.
2. **Unit Tests:** Cập nhật các test case cũ để tương thích với signature mới của `SelectSavePath("")`.
3. **Concurrent Test:** Viết unit test giả lập gọi song song `SelectSavePath` từ nhiều goroutine để xác nhận Mutex hoạt động đúng (goroutine thứ hai phải nhận được lỗi).
