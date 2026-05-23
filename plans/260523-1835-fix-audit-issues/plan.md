# Kế hoạch sửa lỗi và tối ưu hóa hệ thống (Audit Fixes Plan)

Created: 2026-05-23 18:35
Status: ✅ Completed

## 🩺 Tổng quan (Overview)
Kế hoạch này tập trung giải quyết triệt để 4 vấn đề quan trọng được chỉ ra trong báo cáo chẩn đoán lâm sàng (`docs/reports/audit_20260523.md`):
1. **🔴 Bảo mật:** Vá lỗi rò rỉ mã băm Windows (NTLM Hash Leak) qua đường dẫn UNC trong hàm mở thư mục.
2. **🔴 Vận hành:** Sửa lỗi PATH không tự nạp sau khi cài đặt dependency (`yt-dlp`, `ffmpeg`) trên Windows.
3. **🟡 Trải nghiệm:** Thêm cơ chế Hủy tải nhạc (`Cancel Download`) ở cả Backend (Go Context) và Frontend (UI).
4. **🟡 Tương thích:** Chuẩn hóa đường dẫn chứa dấu gạch chéo (`/` và `\`) trên Windows khi mở thư mục.

---

## 🛠️ Công nghệ & Kỹ thuật áp dụng
* **Backend:** Go (`os/exec`, `context.Context`, `sync.Mutex`, `path/filepath`)
* **Frontend:** React + TypeScript (Wails bindings, quản lý trạng thái nút hủy)

---

## 📋 Các giai đoạn triển khai (Phases)

| Phase | Tên giai đoạn | Trạng thái | Tiến độ |
|-------|---------------|------------|---------|
| 01 | [Vá lỗi Backend (Go)](file:///d:/skul9x/dev/MusicYT-main/plans/260523-1835-fix-audit-issues/phase-01-backend.md) | ✅ Completed | 100% |
| 02 | [Cập nhật Frontend (React/TS)](file:///d:/skul9x/dev/MusicYT-main/plans/260523-1835-fix-audit-issues/phase-02-frontend.md) | ✅ Completed | 100% |
| 03 | [Kiểm thử tích hợp & Xác minh](file:///d:/skul9x/dev/MusicYT-main/plans/260523-1835-fix-audit-issues/phase-03-testing.md) | ✅ Completed | 100% |

---

## ➡️ Hướng dẫn thực hiện tiếp theo
1. Duyệt qua toàn bộ kế hoạch và các file `phase-*.md` chi tiết.
2. Xác nhận đồng ý để bắt đầu triển khai code sửa lỗi backend.
