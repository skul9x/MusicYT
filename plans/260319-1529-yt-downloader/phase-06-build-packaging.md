# Phase 06: Build & Guide Documentation
Status: ⬜ Pending
Dependencies: Phase 05

## Objective
Giữ đúng tiêu chí sản phẩm dung lượng siêu nhẹ (chỉ gộp mã nguồn React và nhân Wails) - Yt-dlp do User tự tải gộp vào PATH môi trường. Tài liệu hoá để User dễ thở khi cài đặt.

## Requirements
### Functional
- [ ] Build wails production: `wails build -clean -upx`
- [ ] Kiểm tra file thực thi thu được (sẽ rất nhẹ quanh 10-15MB).
- [ ] Soạn 1 file văn bản hướng dẫn thân thiện gửi kèm cho end-user. Textbox UI (có thể) đính kèm 1 nút bấm tới file hướng dẫn.

### Non-Functional
- [ ] Đổi tên, thay Icon của ứng dụng cho chuyên nghiệp (Không dùng mặc định hình robot đỏ Wails).
- [ ] Tài liệu cần có hình minh họa (đường dẫn wiki github) hoặc mô tả từng bước Step-by-step thiết lập PATH Environments Variables của Window.

## Implementation Steps
1. [ ] Cấu hình sửa icon tại `build/windows/icon.ico`.
2. [ ] Cài đặt UPX (tuỳ chọn) để nén tối đa binary `go`.
3. [ ] Chạy lệnh `wails build`.
4. [ ] Gom thành 1 thư mục dạng zip: Gồm file `yt-downloader.exe` + `README_CAI_DAT.md` gửi khách.

## Files to Create/Modify
- `docs/README_CAI_DAT.md` - (Sẽ soạn thảo nội dung file Hướng dẫn cài đặt).

## Test Criteria
- [ ] Bạn thử test đưa file nén cho một máy tính Windows hoàn toàn sạch sẽ, xem làm theo HD có dễ không và test app bấm có chạy không.

---
**Congratulations! Project Completed.**
