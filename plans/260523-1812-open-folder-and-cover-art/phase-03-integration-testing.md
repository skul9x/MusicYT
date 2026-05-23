# Phase 03: Integration & Testing

Status: ✅ Completed
Dependencies: Phase 01 + Phase 02

## Objective

Kiểm tra end-to-end cả 2 tính năng mới, đảm bảo hoạt động đúng trên Windows.

---

## Task 1: Build & Verify Wails Bindings

### Bước thực hiện

```powershell
cd d:\skul9x\dev\MusicYT-main
wails generate module
```

### Kiểm tra

- [x] File `frontend/wailsjs/go/main/App.d.ts` có hàm `OpenOutputFolder`
- [x] File `frontend/wailsjs/go/main/App.js` có wrapper `OpenOutputFolder`
- [x] Frontend compile không lỗi TypeScript

---

## Task 2: Test "Mở thư mục" trên cả 2 tab

### Kịch bản test

| # | Tab | Hành động | Kết quả mong đợi |
|---|-----|-----------|-------------------|
| 1 | YouTube Music | Click "📂 Mở thư mục" khi có save path | Windows Explorer mở đúng thư mục |
| 2 | YouTube Music | Click "📂 Mở thư mục" khi chưa chọn path | Button bị disabled, không click được |
| 3 | Đa Nền Tảng | Click "📂 Mở thư mục" khi có save path | Windows Explorer mở đúng thư mục |
| 4 | Đa Nền Tảng | Click "📂 Mở thư mục" khi đang download | Button bị disabled |

---

## Task 3: Test "Âm thanh + Cover Art" với link TikTok

### Kịch bản test

| # | URL | Format | Kết quả mong đợi |
|---|-----|--------|-------------------|
| 1 | Link TikTok (có nhạc) | `m4a_cover` | File .m4a tải về, mở trong media player thấy có thumbnail |
| 2 | Link TikTok (có nhạc) | `m4a` | File .m4a tải về, KHÔNG có thumbnail |
| 3 | Link Facebook video | `m4a_cover` | File .m4a tải về có thumbnail |
| 4 | Link TikTok | `best` | File .mp4 tải về bình thường |

### Cách kiểm tra cover art embedded

**Cách 1 — Windows File Properties:**
- Chuột phải file .m4a → Properties → Details tab → xem có "Album art" không

**Cách 2 — Windows Media Player / VLC:**
- Mở file .m4a bằng player → nếu hiện ảnh thumbnail = thành công

**Cách 3 — ffprobe (chính xác nhất):**
```powershell
$env:Path += ";C:\tools"
ffprobe -v quiet -show_entries stream=codec_type -of default=noprint_wrappers=1 "path\to\file.m4a"
```
Nếu output có `codec_type=video` → có embedded thumbnail.

---

## Task 4: Dev Build & Full Test

### Bước thực hiện

```powershell
cd d:\skul9x\dev\MusicYT-main
wails dev
```

### Checklist cuối

- [x] App khởi động không lỗi
- [x] Tab YouTube Music: hiển thị đúng 4 format + nút "Mở thư mục"
- [x] Tab Đa Nền Tảng: hiển thị đúng 3 format (Video / Âm thanh / Nhạc + Cover)
- [x] Tab Đa Nền Tảng: nút "Mở thư mục" hoạt động
- [x] Download audio + cover art thành công từ TikTok
- [x] Status message hiển thị đúng theo format
- [x] Không có lỗi console / TypeScript errors

---

## Rollback Plan

Nếu `--embed-thumbnail` gây lỗi trên một số nền tảng:
1. Fallback: remove `--embed-thumbnail` khỏi args, file M4A vẫn được tạo bình thường
2. Thông báo user: "Cover art không khả dụng cho nền tảng này"
3. Long-term: Cài thêm AtomicParsley cho kết quả embed thumbnail ổn định hơn

---

Previous Phase: [phase-02-frontend.md](./phase-02-frontend.md)
