# Kế hoạch: Hệ thống thông báo hoàn tất tải nhạc & video (Premium Notifications)

Người thực hiện: **Hà (Product Manager) & Antigravity**
Thời gian tạo: **24/05/2026 - 07:15**
Trạng thái: ✅ Đã hoàn thành (Completed)

---

## 💡 Tổng Quan & Vấn đề UX
Hiện tại, khi MusicYT hoàn tất tải nhạc hoặc video, ứng dụng chỉ hiển thị một dòng chữ nhỏ ở dưới cùng: `"🎉 Hoàn tất! Nhạc đã nằm trong máy anh."`.
Dòng thông báo này rất nhỏ, không nổi bật, và cực kỳ dễ bị bỏ qua nếu người dùng đang lướt web, nghe nhạc, hoặc thu nhỏ app xuống khay hệ thống (system tray/background).

Để mang lại **trải nghiệm Premium (State-of-the-Art UX)**, chúng ta sẽ xây dựng một hệ thống thông báo 2 lớp:
1. **Thông báo hệ thống (OS Native Notification)**: Khi ứng dụng đang chạy ẩn, hệ thống sẽ đẩy thông báo Toast (trên Windows 10/11), Notification Center (macOS) hoặc `notify-send` (Linux).
2. **Thông báo Glassmorphic Toast trong ứng dụng (In-App Premium Toast)**: Hiển thị một banner kính mờ tuyệt đẹp ở góc màn hình với hiệu ứng trượt mượt mà, tích hợp sẵn nút `📂 Mở thư mục` để người dùng truy cập tệp vừa tải tức thì.
3. **Âm thanh thông báo (Audio Chime)**: Phát ra một âm thanh "Ting" nhẹ nhàng, tinh tế để kích thích thính giác người dùng.

---

## 🛠️ Công Nghệ & Giải Pháp Kỹ Thuật
- **Backend (Go)**: Viết hàm `NotifyDownloadComplete` gọi script hệ điều hành (không dùng thư viện ngoài để giữ ứng dụng siêu nhẹ):
  - *Windows*: Sử dụng PowerShell gọi runtime native API `Windows.UI.Notifications.ToastNotification`.
  - *macOS*: Sử dụng `osascript` gọi `display notification`.
  - *Linux*: Sử dụng `notify-send`.
- **Frontend (React/TypeScript + Tailwind)**:
  - Tự thiết kế component `<GlassToast>` tùy biến hoàn toàn (không cài thêm thư viện npm nặng).
  - Tích hợp HTML5 Audio cho âm thanh thông báo.
  - Sử dụng Tailwind CSS backdrop-blur, gradient glow, và animation transitions.

---

## 📋 Các giai đoạn triển khai (Phases)

| Phase | Tên giai đoạn | Trạng thái | Tiến độ |
|-------|---------------|------------|---------|
| [Phase 01](file:///d:/skul9x/dev/MusicYT-main/plans/260524-0715-download-notifications/phase-01-system-notifications.md) | Xây dựng thông báo Native OS ở Backend Go | ✅ Đã hoàn thành | 100% |
| [Phase 02](file:///d:/skul9x/dev/MusicYT-main/plans/260524-0715-download-notifications/phase-02-in-app-toasts.md) | Thiết kế Glassmorphic Toast & Âm thanh | ✅ Đã hoàn thành | 100% |
| [Phase 03](file:///d:/skul9x/dev/MusicYT-main/plans/260524-0715-download-notifications/phase-03-integration-verify.md) | Tích hợp hoàn thiện & Kiểm thử tổng thể | ✅ Đã hoàn thành | 100% |

---

## 🚀 Các lệnh nhanh (Quick Commands)
- Xem tiến độ kế hoạch: `/next`
- Bắt đầu thực hiện Phase 3: `/code plans/260524-0715-download-notifications/phase-03-integration-verify.md`
