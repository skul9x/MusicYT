# Phase 02: Cập nhật Frontend (React/TS)

Status: ✅ Completed
Dependencies: [Phase 01: Vá lỗi Backend (Go)](file:///d:/skul9x/dev/MusicYT-main/plans/260523-1835-fix-audit-issues/phase-01-backend.md)

## 🎯 Mục tiêu (Objective)
Cập nhật giao diện người dùng React + TypeScript để tích hợp nút "Hủy tải" (Cancel Download) trong cả 2 tab: YouTube Music và Đa Nền Tảng. Khi người dùng bấm nút này, ứng dụng sẽ gọi hàm `CancelDownload` ở Go Backend để ngắt tiến trình `yt-dlp` đang chạy ngầm.

---

## 📋 Yêu cầu (Requirements)

### 🟡 Nút Hủy tải trên Tab "YouTube Music" (`App.tsx`)
- [x] Import hàm `CancelDownload` từ file sinh tự động `wailsjs/go/main/App`.
- [x] Khi đang trong trạng thái `isDownloading === true`, hiển thị thêm một nút bấm "🚫 Hủy tải nhạc" nằm bên dưới thanh tiến trình (progress bar).
- [x] Khi người dùng click vào nút Hủy, thực thi cuộc gọi `CancelDownload()`, cập nhật dòng thông điệp trạng thái tạm thời là `"⏳ Đang gửi yêu cầu hủy..."`.
- [x] Xử lý lỗi trong khối `catch` của hàm `handleDownload`: nếu lỗi trả về do bị hủy (`signal: killed` hoặc tương tự), hiển thị thông báo thân thiện: `"❌ Đã hủy tải nhạc theo yêu cầu."`.

### 🟡 Nút Hủy tải trên Tab "Đa Nền Tảng" (`UniversalDownloader.tsx`)
- [x] Import hàm `CancelDownload` từ file sinh tự động `wailsjs/go/main/App` bên trong component `UniversalDownloader.tsx`.
- [x] Khi đang tải (`isDownloading === true`), hiển thị nút bấm "🚫 Hủy tải video" nằm bên dưới thanh tiến trình tương ứng.
- [x] Thực hiện cơ chế gọi hàm `CancelDownload()` tương tự khi click vào nút Hủy tải.
- [x] Bắt lỗi bị hủy trong `catch` ở hàm `handleDownload` của `UniversalDownloader` và cập nhật thông báo thân thiện.

---

## 🛠️ Các bước triển khai (Implementation Steps)

1. **Cập nhật `App.tsx`:**
   - Thêm `CancelDownload` vào danh sách hàm import từ `wailsjs/go/main/App`.
   - Cập nhật JSX tại khu vực `isDownloading ? (...) : (...)` ở Tab YouTube Music để vẽ thêm nút Hủy.
   - Sửa catch block trong `handleDownload`:
     ```typescript
     } catch (err: any) {
         if (err.toString().includes("context canceled") || err.toString().includes("killed")) {
             setStatusMessage("❌ Đã hủy tải nhạc theo yêu cầu.");
         } else {
             setStatusMessage(`❌ Lỗi: ${err}`);
         }
     }
     ```

2. **Cập nhật `UniversalDownloader.tsx`:**
   - Thêm import `CancelDownload`.
   - Cập nhật JSX tại khu vực `isDownloading ? (...) : (...)` để vẽ nút Hủy.
   - Sửa catch block trong `handleDownload` tương tự để bắt lỗi hủy context.

---

## 📂 Các file cần chỉnh sửa
- `frontend/src/App.tsx` - [Chỉnh sửa] Giao diện chính và logic Tab YouTube Music.
- `frontend/src/components/UniversalDownloader.tsx` - [Chỉnh sửa] Logic và UI của Tab Đa Nền Tảng.

---

## 🧪 Tiêu chí kiểm thử (Test Criteria)
- [x] Khi không tải gì, giao diện hiển thị bình thường như cũ.
- [x] Khi bấm "Bắt đầu tải", nút "Hủy tải" xuất hiện dưới thanh phần trăm.
- [x] Bấm nút "Hủy tải" lập tức dừng thanh tiến trình, nút chuyển màu và hiện thông báo `"❌ Đã hủy tải nhạc theo yêu cầu."`.
- [x] Tiến trình `yt-dlp.exe` (và các tiến trình con liên quan) trên Task Manager của Windows/Linux bị dừng và giải phóng hoàn toàn, không chạy ngầm.

---
Next Phase: [Phase 03: Kiểm thử tích hợp & Xác minh](file:///d:/skul9x/dev/MusicYT-main/plans/260523-1835-fix-audit-issues/phase-03-testing.md)
