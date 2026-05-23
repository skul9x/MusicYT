# Phase 03: Testing & Verification — Kiểm Thử & Đảm Bảo Chất Lượng

Status: ✅ Completed
Dependencies: Phase 01, Phase 02

## Objective
Thực hiện viết unit tests, chạy kiểm thử tích hợp, chạy type-check ở frontend và biên dịch kiểm tra để đảm bảo hệ thống không bị hồi quy (regression) và hoạt động cực kỳ ổn định.

---

## Chi tiết kế hoạch kiểm thử

### 1. Cập nhật các Unit Tests cũ
Các test case hiện tại trong `app_test.go` như `TestSelectSavePath_NilContext` và `TestSelectSavePath_NotReady` đang gọi `app.SelectSavePath()` không tham số. Cần cập nhật thành `app.SelectSavePath("")` để phù hợp với signature mới.

### 2. Viết thêm Unit Test chuyên sâu cho cơ chế Khóa Mutex (BUG 1)
**File:** [app_test.go](file:///d:/skul9x/dev/MusicYT-main/app_test.go)

Thêm một test case cực kỳ thông minh để xác minh Mutex:
- Khởi tạo app ở trạng thái Ready.
- Chủ động khoá `app.dialogMu` thủ công trước.
- Gọi `app.SelectSavePath("")`.
- Kỳ vọng nhận về lỗi `"hộp thoại đang được mở"` và đường dẫn rỗng.

```go
func TestSelectSavePath_MutexLock(t *testing.T) {
	app := NewApp()
	ctx := context.WithValue(context.Background(), "is_test", true)
	app.startup(ctx)
	app.domReady(ctx)

	// Lớp 0: Khóa trước Mutex thủ công
	app.dialogMu.Lock()
	defer app.dialogMu.Unlock() // Đảm bảo mở khóa khi test xong

	path, err := app.SelectSavePath("")
	if err == nil {
		t.Error("Expected error due to locked mutex, got nil")
	}
	if path != "" {
		t.Errorf("Expected empty path, got: %s", path)
	}
	if !strings.Contains(err.Error(), "đang được mở") {
		t.Errorf("Expected error to contain 'đang được mở', got: %v", err)
	}
}
```

### 3. Quy trình chạy kiểm thử

#### Bước 3.1: Chạy kiểm thử Go Backend
```powershell
go test -v -count=1 ./...
```
**Yêu cầu:** Tất cả các test cases (bao gồm test Mutex mới và các test download cũ) phải **PASS** 100%.

#### Bước 3.2: Tái sinh mã nguồn Wails Bindings
```powershell
wails generate module
```
**Yêu cầu:** Biên dịch thành công, sinh ra tệp `App.d.ts` và `App.js` mới hỗ trợ tham số `arg1:string` cho hàm `SelectSavePath`.

#### Bước 3.3: Type check Frontend
```powershell
cd frontend
npx tsc --noEmit
```
**Yêu cầu:** TypeScript không báo bất kỳ lỗi kiểu dữ liệu nào.

---

## Các tệp sẽ sửa đổi
* [app_test.go](file:///d:/skul9x/dev/MusicYT-main/app_test.go) — Cập nhật 2 tests cũ và thêm 1 test mới.

---

## Tiêu chuẩn thành công (Success Criteria)
- [x] Backend Go biên dịch thành công.
- [x] Chạy `go test ./...` tất cả các tests PASS.
- [x] Sinh thành công Wails bindings mới mà không có lỗi.
- [x] Frontend `tsc --noEmit` hoàn thành không lỗi.
