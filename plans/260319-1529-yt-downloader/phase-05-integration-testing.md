# Phase 05: Integration & Testing
Status: ⬜ Pending
Dependencies: Phase 04

## Objective
Kiểm thử tải trọn vẹn tích hợp giữa Backend Go, Tiến trình con yt-dlp. Quét các trường hợp sập mạng, lỗi timeout.

## Requirements
### Functional
- [ ] Quản lý luồng dọn dẹp các tệp tải rác/tạm (như file `.f123.mp4` trong quá trình hợp nhất Audio+Video chưa xong).
- [ ] Popup Alert khi không kết nối được mạng Internet hoặc sai URL.

### Non-Functional
- [ ] Mượt mà, không memory leak do mở pipe sai cách.
- [ ] Giả lập các môi trường test khác như Youtube Shorts.

## Implementation Steps
1. [ ] Thực thi End-to-End từ bước UI cho đến mở thư mục Explorer check file output.
2. [ ] Nếu tải đang diễn ra, chặn tuyệt đối việc User tắt lén Dialog hoặc ấn gửi lại liên tục.
3. [ ] Bắt trường hợp người dùng copy dòng chữ tào lao thay vì URL rồi bấm gửi. Trả về thông báo "URL không hợp lệ".

## Files to Create/Modify
- `app.go` - Handling các err.Error() sạch hơn để bắn về FrontEnd.
- `frontend/src/App.tsx` - Thêm Regex Regex matching cơ bản URL Validator.

## Test Criteria
- [ ] Ngắt wifi lúc Progress bar chạy ~ 30%, kết quả UI trả về thông báo lỗi, Progress bar ngưng đọng hoặc reset.
- [ ] Chép chuỗi text "xin chào" nhấn Enter thay tải, thông báo "Sai định dạng URL".

---
Next Phase: [Phase 06](phase-06-build-packaging.md)
