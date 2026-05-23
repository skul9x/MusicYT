# Phase 01: Backend — Open Folder + Cover Art Format

Status: ✅ Completed
Dependencies: Không

## Objective

Bổ sung 2 chức năng backend:
1. Hàm `OpenOutputFolder` để mở thư mục output trong File Explorer.
2. Thêm format option `m4a_cover` cho `DownloadGenericVideo` để tải âm thanh kèm cover art từ bất kỳ nền tảng nào.

---

## Task 1: Thêm hàm `OpenOutputFolder` vào `app.go`

### Mô tả
Tạo hàm Go mới được Wails expose ra frontend. Hàm này nhận đường dẫn thư mục, kiểm tra tồn tại, rồi mở bằng lệnh native của OS.

### Implementation

Thêm vào file **`app.go`** (sau hàm `GetDefaultSavePath`):

```go
// OpenOutputFolder opens the given folder path in the system's native file explorer
func (a *App) OpenOutputFolder(folderPath string) error {
    folderPath = strings.TrimSpace(folderPath)
    if folderPath == "" {
        return fmt.Errorf("đường dẫn thư mục không được để trống")
    }

    // Kiểm tra thư mục tồn tại
    info, err := os.Stat(folderPath)
    if err != nil {
        return fmt.Errorf("thư mục không tồn tại: %v", err)
    }
    if !info.IsDir() {
        return fmt.Errorf("đường dẫn không phải là thư mục")
    }

    var cmd *exec.Cmd
    switch runtime.GOOS {
    case "windows":
        cmd = exec.Command("explorer", folderPath)
    case "darwin":
        cmd = exec.Command("open", folderPath)
    case "linux":
        cmd = exec.Command("xdg-open", folderPath)
    default:
        return fmt.Errorf("hệ điều hành không được hỗ trợ: %s", runtime.GOOS)
    }

    return cmd.Start()
}
```

### Lý do thiết kế
- Dùng `cmd.Start()` (không phải `cmd.Run()`) để không block UI chờ explorer đóng.
- Validate trước khi mở: kiểm tra empty path, path tồn tại, và phải là directory.
- Hỗ trợ cross-platform: Windows (`explorer`), macOS (`open`), Linux (`xdg-open`).

### Files to modify
- `app.go` — Thêm hàm `OpenOutputFolder`

---

## Task 2: Thêm format `m4a_cover` cho `DownloadGenericVideo`

### Mô tả
Hiện tại `DownloadGenericVideo` có 2 format:
- `best` → tải video MP4 chất lượng tốt nhất
- `m4a` → tải audio M4A (không embed thumbnail)

Cần thêm format mới `m4a_cover` để tải audio **kèm cover art** (embed thumbnail vào file M4A), tương tự cách tab YouTube dùng `--embed-thumbnail`.

### Implementation

Cập nhật **switch block** trong hàm `DownloadGenericVideo` ở file **`app.go`**:

```go
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
```

### Chi tiết kỹ thuật

**So sánh với tab YouTube Music:**

| Aspect | YouTube (`DownloadVideo`) | Đa Nền Tảng (`DownloadGenericVideo`) |
|--------|---------------------------|--------------------------------------|
| Format filter | `-x --audio-format m4a --embed-thumbnail` | `-f "best[vcodec^=h264]/best" -x --audio-format m4a --embed-thumbnail` |
| Lý do khác | YouTube có audio-only streams | TikTok/FB cần H264 filter để tránh ByteVC1 bug |

**Tại sao cần `-f "best[vcodec^=h264]/best"` trước `--embed-thumbnail`?**
- Các nền tảng như TikTok encode video bằng ByteVC1 (H.265/HEVC) — codec này gây lỗi `ffprobe` không đọc được audio stream.
- Filter `best[vcodec^=h264]/best` ép yt-dlp chọn format H.264, đảm bảo ffmpeg tách audio thành công.
- Đây là bug đã phát hiện và khắc phục trong session trước (xem `1.md`).

**`--embed-thumbnail` hoạt động thế nào?**
- yt-dlp tự động tải thumbnail từ nền tảng.
- Dùng FFmpeg (hoặc AtomicParsley nếu có) để embed vào file M4A.
- Nếu nền tảng không có thumbnail → file M4A vẫn được tạo bình thường, chỉ không có cover art.

### Files to modify
- `app.go` — Cập nhật switch block trong `DownloadGenericVideo`

---

## Task 3: Rebuild Wails bindings

### Mô tả
Sau khi thêm hàm `OpenOutputFolder` vào backend, cần chạy `wails generate module` để Wails tự sinh lại các file TypeScript bindings trong `frontend/wailsjs/go/main/`.

### Lệnh chạy
```powershell
cd d:\skul9x\dev\MusicYT-main
wails generate module
```

### Output mong đợi
File `frontend/wailsjs/go/main/App.d.ts` sẽ có thêm:
```typescript
export function OpenOutputFolder(arg1:string):Promise<void>;
```

File `frontend/wailsjs/go/main/App.js` sẽ có thêm wrapper tương ứng.

---

## Test Criteria
- [ ] Hàm `OpenOutputFolder` biên dịch không lỗi
- [ ] Hàm `OpenOutputFolder` mở đúng thư mục trên Windows
- [ ] `DownloadGenericVideo` với format `m4a_cover` tạo file M4A có embedded thumbnail
- [ ] Wails bindings sinh ra đúng TypeScript definition

## Notes
- **Không cần install thêm package Go nào** — tất cả import (`os`, `os/exec`, `runtime`, `strings`) đã có sẵn trong `app.go`.
- **AtomicParsley không bắt buộc** — FFmpeg là fallback đủ tốt cho hầu hết trường hợp. Nếu user muốn chất lượng cover art cao hơn, có thể cài thêm AtomicParsley sau.

---

Next Phase: [phase-02-frontend.md](./phase-02-frontend.md) — UI buttons & format option
