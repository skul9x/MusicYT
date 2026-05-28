# Phase 02: Xây dựng Giao diện Chọn File Cookies & Kết nối Frontend
Status: ✅ Completed
Dependencies: Phase 01

## 1. Objective (Mục tiêu)
Thiết kế giao diện người dùng cấu hình Cookies cao cấp trong Frontend React, cho phép người dùng:
1. Bật/tắt tính năng "Vượt chặn bảo mật bằng Cookies" (Bypass) bằng một nút gạt Toggle hoặc Checkbox thời thượng.
2. Lưu trữ đường dẫn tệp tin cookies.txt bền vững vào `localStorage` của ứng dụng để tự động nạp lại khi mở app.
3. Khi người dùng click nút "Chọn tệp", gọi hàm bridge backend `SelectCookiesFile()` để kích hoạt hộp thoại chọn file native OS (chạy hoàn hảo trên cả Windows và Linux).
4. Hiển thị đường dẫn tệp tin đã chọn cực kỳ trực quan, kèm theo nút "Hủy/Xóa" file cấu hình.
5. Truyền tham số `cookiesFile` từ state React xuống các hàm gọi backend `DownloadGenericVideo` và `GetGenericVideoInfo`.

## 2. Yêu cầu Chi tiết (Requirements)
### Functional:
- [x] Bổ sung khối giao diện điều khiển cấu hình Cookies vào file `frontend/src/components/UniversalDownloader.tsx` (ngay dưới trường nhập link và chọn định dạng).
- [x] Sử dụng các biến `localStorage` sau:
  - `music_yt_enable_cookies`: "true" / "false" (trạng thái kích hoạt bypass)
  - `music_yt_cookies_file_path`: đường dẫn tuyệt đối của file `.txt` được chọn.
- [x] Đặt sự kiện click cho nút "Chọn file cookies.txt" để gọi `window.go.main.App.SelectCookiesFile()`.
- [x] Truyền tham số `cookiesFile` (lấy từ state hoặc trực tiếp từ localStorage nếu bật bypass) vào làm đối số thứ 4 của hàm `DownloadGenericVideo` và đối số thứ 2 của hàm `GetGenericVideoInfo`.
- [x] Tích hợp tính năng này tương tự cho tab YouTube Music nếu cần vượt chặn độ tuổi/chặn bot của YouTube!

### Non-Functional / UI UX Vibe:
- [x] Thể hiện đúng triết lý thiết kế cao cấp:
  - Card Glassmorphism với viền mờ `border-white/10` và nền `bg-white/5 backdrop-blur-md`.
  - Hiển thị tooltip hoặc dòng hướng dẫn nhanh: *"Cách lấy: Cài extension 'Get cookies.txt LOCALLY' trên Firefox/Chrome/Edge, xuất file cookies.txt của TikTok rồi chọn file đó tại đây."*
  - Micro-animations mượt mà khi mở rộng/thu hẹp khu vực cài đặt.

---

## 3. Các bước thực hiện (Implementation Steps)

### Bước 1: Khai báo bridge API trong TypeScript frontend
Đảm bảo định nghĩa TypeScript của `App` chứa hàm chọn file mới:
```typescript
// Trong file định nghĩa type của Wails (nếu có auto-generate hoặc khai báo thủ công)
export function SelectCookiesFile(): Promise<string>;
```

### Bước 2: Thiết kế giao diện cấu hình Cookies trong React
1. Mở file `frontend/src/components/UniversalDownloader.tsx`.
2. Tạo Component con hoặc viết inline khối điều khiển:
   ```tsx
   const [enableCookies, setEnableCookies] = useState<boolean>(
     localStorage.getItem("music_yt_enable_cookies") === "true"
   );
   const [cookiesPath, setCookiesPath] = useState<string>(
     localStorage.getItem("music_yt_cookies_file_path") || ""
   );

   const handleSelectFile = async () => {
     try {
       const path = await window.go.main.App.SelectCookiesFile();
       if (path) {
         setCookiesPath(path);
         localStorage.setItem("music_yt_cookies_file_path", path);
       }
     } catch (err) {
       console.error("Lỗi chọn file:", err);
     }
   };
   ```
3. Lưu trạng thái `enableCookies` vào `localStorage` mỗi khi thay đổi toggle.

### Bước 3: Cập nhật hàm kích hoạt tải xuống
Khi người dùng bấm nút "Bắt đầu tải", truyền tham số cookie:
```typescript
const cookieToPass = enableCookies ? cookiesPath : "";
await window.go.main.App.DownloadGenericVideo(
  url.trim(),
  saveLocation,
  format,
  cookieToPass
);
```

---

## 4. Kịch bản Kiểm thử Thủ công & Tích hợp (Manual Verification Cases)

1. **Test Case 1: Lưu trữ cấu hình**
   - Click bật bypass -> Chọn file -> F5 làm mới ứng dụng -> Xác nhận cài đặt bypass và đường dẫn file vẫn được lưu chính xác.
2. **Test Case 2: Hủy chọn file**
   - Click nút "Xóa/Hủy" cạnh đường dẫn file -> UI hiển thị lại trạng thái "Chưa chọn file" -> Gọi API backend truyền chuỗi rỗng `""`.
3. **Test Case 3: Trải nghiệm chọn file OS Native**
   - Click "Chọn file" trên cả máy Windows và Linux -> Hộp thoại mở ra hoạt động mượt mà, chỉ cho phép chọn file đuôi `.txt`.

---

## 5. Tiêu chí Hoàn thành (Test Criteria)
- [ ] Biên dịch frontend thành công không có bất kỳ lỗi TypeScript/React lint nào.
- [ ] Giao diện hiển thị tuyệt đẹp, phản hồi tức thì khi người dùng tương tác.

---
Next Phase: [Phase 03: Kiểm thử Đa nền tảng](file:///home/skul9x/Desktop/Test_code/MusicYT-main/plans/tiktok-cookies-fix/phase-03-verification.md)
