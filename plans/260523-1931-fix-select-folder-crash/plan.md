# Plan: Fix SelectSavePath Crash (Chọn Thư Mục Crash)
Created: 2026-05-23T19:31
Status: 🟡 Awaiting Review

## Overview
Sửa lỗi crash toàn bộ ứng dụng khi nhấn nút **"Thay đổi"** (chọn thư mục lưu) trên Windows.
Nguyên nhân gốc được phân tích trong [5.md](file:///D:/skul9x/dev/MusicYT-main/5.md):

1. **Nil Pointer Dereference** — `a.ctx` chưa khởi tạo khi `SelectSavePath` được gọi
2. **COM Threading Conflict (STA vs MTA)** — Windows Shell Dialog yêu cầu STA thread
3. **Go 1.23+ & Wails v2 Thread Conflict** — Thay đổi quản lý OS thread gây xung đột

## Tech Stack
- Backend: Go 1.22.2 + Wails v2.12.0
- Frontend: React + TypeScript + Vite + TailwindCSS
- Target OS: **Windows + Linux**

## Phân Tích Từ Research Online

### Kết quả tra cứu:
| Nguồn | Phát hiện |
|--------|-----------|
| Wails GitHub Issues | Dialog crash thường do COM chưa init đúng thread STA |
| Wails Docs | Nên dùng context từ `OnDomReady` thay vì `OnStartup` cho dialog |
| Go Community | `runtime.LockOSThread()` giúp khóa goroutine vào 1 OS thread nhưng không tự init COM |
| Best Practice | Dùng `defer recover()` để chặn panic crash + Frontend fallback khi native dialog fail |

### Chiến lược sửa (3 lớp bảo vệ):
```
Lớp 1: Backend — Nil Guard + recover() + LockOSThread (Windows)
Lớp 2: Backend — Retry mechanism + graceful error return
Lớp 3: Frontend — Bắt lỗi, hiện thông báo thân thiện thay vì crash
```

## Phases

| Phase | Name | Status | Progress | Mô tả |
|-------|------|--------|----------|-------|
| 01 | Backend Fix | ⬜ Pending | 0% | Sửa `SelectSavePath` với nil guard, recover, LockOSThread |
| 02 | Frontend Resilience | ⬜ Pending | 0% | Xử lý lỗi ở cả `App.tsx` và `UniversalDownloader.tsx` |
| 03 | Testing & Verification | ⬜ Pending | 0% | Unit tests + integration verification |

## Files Bị Ảnh Hưởng

### Backend
- [app.go](file:///D:/skul9x/dev/MusicYT-main/app.go) — Hàm `SelectSavePath` (line 38-46)
- [main.go](file:///D:/skul9x/dev/MusicYT-main/main.go) — Thêm `OnDomReady` hook
- [app_test.go](file:///D:/skul9x/dev/MusicYT-main/app_test.go) — Thêm test mới

### Frontend
- [App.tsx](file:///D:/skul9x/dev/MusicYT-main/frontend/src/App.tsx) — Hàm `handleSelectPath` (line 51-58)
- [UniversalDownloader.tsx](file:///D:/skul9x/dev/MusicYT-main/frontend/src/components/UniversalDownloader.tsx) — Nút "Thay đổi"

## Quick Commands
- Start Phase 1: `/code phase-01`
- Check progress: `/next`
