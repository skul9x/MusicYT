# Kế hoạch Điều trị & Tối ưu Hiệu năng (Performance Fix Plan) - MusicYT

- **Mã hồ sơ:** `plans/260524-0700-fix-performance`
- **Ngày tạo:** 24/05/2026
- **Trạng thái:** ✅ Đã hoàn thành (Completed)
- **Bác sĩ phụ trách:** Hà (Product Manager - Strategy Lead) & Khang (Security & Performance Specialist)

---

## 💡 Tổng quan Dự án & Mục tiêu
Mục tiêu của kế hoạch này là khắc phục triệt để **2 Triệu chứng Nghiêm trọng** (Lỗi quá tải CPU/RAM khi tải song song, và xung đột tiến trình khi hủy/tải lại) cùng **2 Cảnh báo Quan trọng** (Nghẽn băng thông IPC, và hiện tượng "Render Storm" đơ giật UI ở Frontend do spam sự kiện tải).

---

## 🛠️ Công nghệ Sử dụng (Tech Stack)
- **Backend:** Go (Wails v2.12.0) với các thư viện tiêu chuẩn (`sync`, `context`, `os/exec`).
- **Frontend:** React 18 + TypeScript.

---

## 📋 Danh sách các Giai đoạn Điều trị (Phases)

| Giai đoạn | Tên Giai Đoạn | Trạng thái | Tiến độ | Mô tả |
| :--- | :--- | :---: | :---: | :--- |
| **Phase 01** | [Backend Concurrency & Safety Fixes](file:///d:/skul9x/dev/MusicYT-main/plans/260524-0700-fix-performance/phase-01-backend-safety.md) | ✅ Completed | 100% | Khóa tải song song ở Backend và đồng bộ hóa an toàn khi hủy tải. |
| **Phase 02** | [Backend Progress Event Throttle](file:///d:/skul9x/dev/MusicYT-main/plans/260524-0700-fix-performance/phase-02-progress-throttle.md) | ✅ Completed | 100% | Giảm tải Render Storm & IPC Clogging bằng cách lọc tần suất phát sự kiện. |
| **Phase 03** | [Frontend Integration & Testing](file:///d:/skul9x/dev/MusicYT-main/plans/260524-0700-fix-performance/phase-03-frontend-verify.md) | ✅ Completed | 100% | Tích hợp giao diện React, chạy các Go unit tests và kiểm thử tải thực tế. |

---

## 🎯 Chỉ số Đánh giá Thành công (KPIs)
- **Độ ổn định:** Không xuất hiện bất kỳ tiến trình `yt-dlp` hay `ffmpeg` chạy ngầm hay chạy chồng chéo lãng phí sau khi nhấn hủy.
- **Tần suất sự kiện:** Số lượng sự kiện IPC gửi từ Go lên React giảm **~98%** (từ hàng nghìn sự kiện xuống tối đa 101 sự kiện cho mỗi lượt tải).
- **Mức tiêu thụ CPU:** CPU trình duyệt giảm rõ rệt khi đang tải, giao diện mượt mà không bị lag giật.

---

## ⌨️ Phím tắt & Lệnh hỗ trợ nhanh
- Bắt đầu Phase 1: `/code phase-01`
- Kiểm tra tiến độ: `/next`
- Lưu trữ ngữ cảnh: `/save-brain`

---
*Kế hoạch chi tiết của từng Phase được lưu trữ tại các file tương ứng trong thư mục này.*
