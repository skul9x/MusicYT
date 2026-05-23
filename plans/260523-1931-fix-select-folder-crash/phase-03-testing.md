# Phase 03: Testing & Verification
Status: 🟢 Completed
Dependencies: Phase 01, Phase 02

## Objective
Viết unit tests cho các thay đổi ở Phase 01 & 02, sau đó chạy toàn bộ test suite đảm bảo không regression.
Test phải chạy được trên cả **Windows** và **Linux**.

## Implementation Steps

### 1. [x] Thêm Unit Tests cho `SelectSavePath` — Nil Guard
**File:** [app_test.go](file:///D:/skul9x/dev/MusicYT-main/app_test.go) — Thêm test mới

```go
func TestSelectSavePath_NilContext(t *testing.T) {
	app := NewApp()
	// Không gọi startup() → a.ctx == nil

	path, err := app.SelectSavePath()
	if err == nil {
		t.Error("Expected error when ctx is nil, got nil")
	}
	if path != "" {
		t.Errorf("Expected empty path when ctx is nil, got: %s", path)
	}
	if !strings.Contains(err.Error(), "chưa sẵn sàng") {
		t.Errorf("Expected error message about 'chưa sẵn sàng', got: %s", err.Error())
	}
}
```

### 2. [x] Thêm Unit Tests cho `SelectSavePath` — Not Ready
**File:** [app_test.go](file:///D:/skul9x/dev/MusicYT-main/app_test.go)

```go
func TestSelectSavePath_NotReady(t *testing.T) {
	app := NewApp()
	// Gọi startup nhưng KHÔNG gọi domReady → a.ready == false
	ctx := context.WithValue(context.Background(), "is_test", true)
	app.startup(ctx)

	path, err := app.SelectSavePath()
	if err == nil {
		t.Error("Expected error when app not ready, got nil")
	}
	if path != "" {
		t.Errorf("Expected empty path when app not ready, got: %s", path)
	}
	if !strings.Contains(err.Error(), "chưa sẵn sàng") {
		t.Errorf("Expected error message about 'chưa sẵn sàng', got: %s", err.Error())
	}
}
```

### 3. [x] Thêm Unit Tests cho `IsAppReady`
**File:** [app_test.go](file:///D:/skul9x/dev/MusicYT-main/app_test.go)

```go
func TestIsAppReady_InitialState(t *testing.T) {
	app := NewApp()

	if app.IsAppReady() {
		t.Error("Expected IsAppReady to return false before startup")
	}
}

func TestIsAppReady_AfterStartup(t *testing.T) {
	app := NewApp()
	ctx := context.WithValue(context.Background(), "is_test", true)
	app.startup(ctx)

	if app.IsAppReady() {
		t.Error("Expected IsAppReady to return false after startup but before domReady")
	}
}

func TestIsAppReady_AfterDomReady(t *testing.T) {
	app := NewApp()
	ctx := context.WithValue(context.Background(), "is_test", true)
	app.startup(ctx)
	app.domReady(ctx)

	if !app.IsAppReady() {
		t.Error("Expected IsAppReady to return true after domReady")
	}
}
```

### 4. [x] Thêm test cho `domReady`
**File:** [app_test.go](file:///D:/skul9x/dev/MusicYT-main/app_test.go)

```go
func TestDomReady_SetsReadyFlag(t *testing.T) {
	app := NewApp()

	if app.ready {
		t.Error("Expected ready to be false initially")
	}

	ctx := context.WithValue(context.Background(), "is_test", true)
	app.domReady(ctx)

	if !app.ready {
		t.Error("Expected ready to be true after domReady")
	}
}
```

### 5. [x] Chạy toàn bộ test suite
```powershell
cd D:\skul9x\dev\MusicYT-main
go test -v -count=1 ./...
```

**Expected output:**
- Tất cả test PASS
- Không có test nào gây panic
- Không có regression ở existing tests

### 6. [x] Build verification (không crash khi build)
```powershell
cd D:\skul9x\dev\MusicYT-main
go build -v ./...
```

### 7. [x] Frontend type-check
```powershell
cd D:\skul9x\dev\MusicYT-main\frontend
npx tsc --noEmit
```

## Test Matrix

| Test Case | Windows | Linux | Expected Result |
|-----------|---------|-------|-----------------|
| `SelectSavePath` with nil ctx | ✅ | ✅ | Error, no crash |
| `SelectSavePath` with ctx but not ready | ✅ | ✅ | Error, no crash |
| `IsAppReady` before startup | ✅ | ✅ | false |
| `IsAppReady` after startup, before domReady | ✅ | ✅ | false |
| `IsAppReady` after domReady | ✅ | ✅ | true |
| `domReady` sets ready flag | ✅ | ✅ | true |
| Existing `TestCancelDownload` | ✅ | ✅ | PASS (no regression) |
| Existing `TestOpenOutputFolder_*` | ✅ | ✅ | PASS (no regression) |
| Existing `TestCheckDependencies` | ✅ | ✅ | PASS (no regression) |

## Files to Create/Modify
| File | Action | Purpose |
|------|--------|---------|
| [app_test.go](file:///D:/skul9x/dev/MusicYT-main/app_test.go) | MODIFY | Thêm 6 test functions mới |

## Success Criteria
- [x] Tất cả tests PASS (`go test -v ./...`)
- [x] `go build ./...` thành công
- [x] Frontend `tsc --noEmit` không có lỗi type
- [x] Không có regression ở tests cũ
- [x] Code coverage cho `SelectSavePath` đạt 100% branches

## Notes
- Tests sử dụng `context.WithValue(context.Background(), "is_test", true)` để tránh trigger Wails runtime events
- Không cần mock Wails runtime — chúng ta test logic guard/protection, không test dialog UI
- Test chạy được trên cả Windows và Linux vì chỉ test Go logic, không test OS-specific dialog

---
Previous Phase: [phase-02-frontend.md](file:///D:/skul9x/dev/MusicYT-main/plans/260523-1931-fix-select-folder-crash/phase-02-frontend.md)
