# Phase 03: Frontend UI & State
Status: ⬜ Pending
Dependencies: Phase 02

## Objective
Thiết kế bộ giao diện React, quản lý state cho tiến độ đang tải, giao tiếp thông suốt với Backend (Wails).

## Requirements
### Functional
- [ ] Ô nhập văn bản (Input) cho Link Video.
- [ ] Nút bấm "Tải Xuống". Cớ chế chỉ bấm được khi có Link và ko trong quá trình tải. 
- [ ] Nút hoặc Textbox hiển thị đường dẫn thư mục lưu nơi đầu ra file.
- [ ] Thanh progress bar chạy trượt từ 0 - 100% hiển thị rõ ràng con số thập phân.

### Non-Functional
- [ ] UI áp dụng TailwindCSS tạo cảm giác gọn nhẹ, hiện đại.
- [ ] Thông báo Toast xử lý lỗi và tương tác user mượt mà.

## Implementation Steps
1. [ ] Setup giao diện trong `App.tsx` (dọn template cũ). Xây khung form, progress.
2. [ ] Khai báo useState: `url`, `progress`, `isDownloading`, `saveLocation`.
3. [ ] Kết nối Window Events: dùng hook `EventsOn` trong `useEffect` để bắt id event `download-progress`.
4. [ ] Viết hàm `startDownload` gọi qua các methods được mapping auto bởi Wails.

## Files to Create/Modify
- `frontend/src/App.tsx` - Giao diện chính của ứng dụng.
- `frontend/src/components/ProgressBar.tsx` (tuỳ chọn) - Tách UI component.

## Test Criteria
- [ ] Gửi thử emit `%` giả định từ backend và thanh Progress bar render nhảy chính xác.
- [ ] User click Download, input bị vô hiệu hóa (Disabled) cho đến khi lệnh tải trả về hoàn thành hoặc fail.

---
Next Phase: [Phase 04](phase-04-advanced-logic.md)
