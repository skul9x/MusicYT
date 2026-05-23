# Plan: Open Output Folder + Cover Art cho Đa Nền Tảng

Created: 2026-05-23 18:12
Status: ✅ Completed

## Overview

Hai tính năng cần thêm vào MusicYT:

1. **Nút "Mở thư mục Output"** — thêm vào cả 2 tab "YouTube Music" và "Đa Nền Tảng", cho phép user bấm mở thẳng thư mục chứa file đã tải trong File Explorer / Nautilus.
2. **Định dạng "Âm thanh + Cover Art"** — thêm vào tab "Đa Nền Tảng" (UniversalDownloader), tương tự option `m4a + cover` bên tab YouTube Music (dùng `--embed-thumbnail`).

## Phạm vi thay đổi

### Backend (Go)
- `app.go`: Thêm hàm `OpenOutputFolder(path string)` — dùng `os/exec` gọi `explorer` (Windows) / `xdg-open` (Linux) / `open` (macOS).
- `app.go`: Cập nhật hàm `DownloadGenericVideo` — thêm case `m4a_cover` để xử lý download audio kèm embed thumbnail cho các nền tảng ngoài YouTube.

### Frontend (React/TypeScript)
- `App.tsx` (tab YouTube Music): Thêm button "📂 Mở thư mục" bên cạnh hiển thị đường dẫn lưu.
- `UniversalDownloader.tsx` (tab Đa Nền Tảng): Thêm button "📂 Mở thư mục" tương tự + thêm option format "🎵 Âm thanh + Cover Art".

### Wails Bindings
- Bindings sẽ tự sinh lại khi build, nhưng frontend cần import hàm mới `OpenOutputFolder`.

## Tech Stack
- Backend: Go + Wails v2
- Frontend: React + TypeScript + TailwindCSS
- Engine: yt-dlp + ffmpeg

## Phases

| Phase | Name | Status | Est. Tasks |
|-------|------|--------|------------|
| 01 | Backend — Open Folder + Cover Art format | ✅ Completed | 5 |
| 02 | Frontend — UI buttons & format option | ✅ Completed | 7 |
| 03 | Integration & Testing | ✅ Completed | 4 |

**Tổng:** 16 tasks | Ước tính: 1 session

## Quick Commands
- Start Phase 1: `/code phase-01`
- Check progress: `/next`
