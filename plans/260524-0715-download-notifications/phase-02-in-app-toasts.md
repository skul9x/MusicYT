# Phase 02: Thiết kế Glassmorphic Toast & Âm thanh trong ứng dụng

Trạng thái: ✅ Đã hoàn thành (Completed)
Phụ thuộc: [Phase 01](file:///d:/skul9x/dev/MusicYT-main/plans/260524-0715-download-notifications/phase-01-system-notifications.md)

## 🎯 Mục tiêu
Xây dựng một thành phần thông báo Toast nổi (Floating Toast Banner) siêu đẹp ngay bên trong giao diện ứng dụng React. Toast này sẽ tuân theo ngôn ngữ thiết kế Glassmorphism (Kính mờ) cao cấp của MusicYT, hỗ trợ phản hồi thính giác qua âm thanh "Ting" tinh tế, và hiển thị nút hành động thông minh.

---

## 📋 Yêu cầu kỹ thuật

### 1. Giao diện Premium Glassmorphism
- **Màu sắc & Phông nền**: Sử dụng `backdrop-blur-md bg-white/[0.03] border border-white/10`.
- **Hiệu ứng phát sáng**: Đổ bóng nhẹ với sắc xanh dịu `shadow-[0_10px_40px_rgba(16,185,129,0.12)]`.
- **Bố cục (Layout)**: Hiển thị ở góc trên bên phải màn hình.
- **Micro-interactions & Animation**:
  - Khi xuất hiện: Trượt mượt mà từ phải sang trái kết hợp fade-in.
  - Khi biến mất: Trượt ngược lại sang phải kết hợp fade-out.
  - Tích hợp thanh tiến trình thời gian chạy ngược (Visual progress bar countdown) từ 100% về 0% trong vòng 6 giây dưới đáy Toast để báo hiệu thời điểm tự đóng.

### 2. Các hành động thông minh (Quick Actions)
- Hiển thị nút `📂 Mở thư mục` trực tiếp trên Toast. Khi click, gọi hàm `OpenOutputFolder` ở backend Go để mở Windows Explorer chỉ định đúng file đã tải.
- Nút tắt nhanh `✕` ở góc trên để đóng Toast thủ công bất cứ lúc nào.

### 3. Hiệu ứng âm thanh (Audio Chime)
- Tích hợp một file âm thanh hoàn tất siêu ngắn (dạng Chime/Ding) được mã hóa dưới dạng chuỗi base64 trực tiếp trong mã nguồn (để không cần tải file ngoài).
- Sử dụng API HTML5 Audio: `new Audio("data:audio/wav;base64,...").play()` khi Toast được kích hoạt.
- Âm lượng dịu nhẹ (30%) để không gây khó chịu cho người dùng.

---

## 🛠️ Các bước thực hiện

### Bước 1: Tạo Component React mới `GlassToast.tsx`
Tạo file mới `frontend/src/components/GlassToast.tsx` chứa:
- Định nghĩa kiểu dữ liệu `Toast`: `id`, `title`, `message`, `type` (success, error, info), `folderPath`.
- Component `<GlassToastItem>` quản lý vòng đời đóng tự động (6 giây) bằng `useEffect` và vẽ thanh progress countdown.
- Component `<GlassToastContainer>` là cổng chứa danh sách các Toast đang hiển thị.

### Bước 2: Nạp âm thanh thính giác
- Tạo chuỗi base64 của một âm thanh nhẹ nhàng như "Complete Sound Chime".
- Viết helper function `playNotificationSound()` để gọi và kích hoạt âm thanh.

---

## 📂 Các file cần tạo / chỉnh sửa
- `frontend/src/components/GlassToast.tsx` — **[NEW]** Thiết kế và quản lý hiển thị các Toasts.
- `frontend/src/index.css` — Bổ sung các custom keyframes cho animations trượt và thanh progress thời gian chạy ngược nếu Tailwind mặc định không đáp ứng đủ.

---

## 🧪 Tiêu chí nghiệm thu (Test Criteria)
- [x] Khi thêm một toast thành công, toast xuất hiện ở góc trên bên phải, có nền kính mờ và viền phát sáng emerald cực đẹp.
- [x] Âm thanh phát lên êm dịu, không bị giật hay méo tiếng.
- [x] Click vào nút `📂 Mở thư mục` trên Toast mở ra đúng thư mục lưu tệp tải về mà không có lỗi.
- [x] Thanh đếm ngược ở đáy Toast chạy mượt mà từ phải qua trái, hết 6 giây Toast tự động trượt mất.

---

Next Phase: [Phase 03: Tích hợp hoàn thiện & Kiểm thử tổng thể](file:///d:/skul9x/dev/MusicYT-main/plans/260524-0715-download-notifications/phase-03-integration-verify.md)

