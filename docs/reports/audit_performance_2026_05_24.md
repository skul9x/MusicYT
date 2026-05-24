# Báo cáo Chẩn đoán Hiệu năng Lâm sàng (Performance Audit Report) - MusicYT

**Ngày khám:** 24/05/2026
**Bác sĩ phụ trách:** Khang (Security & System Performance Specialist - 10 năm kinh nghiệm)
**Phạm vi chẩn đoán:** Performance Focus (Chẩn đoán sâu về tốc độ, tài nguyên CPU/RAM, cơ chế render và tối ưu hóa hệ thống)

---

## 🩺 Tóm tắt Hồ sơ Bệnh án (Summary)
Sau khi thực hiện "nội soi" và kiểm tra toàn diện hoạt động của ứng dụng **MusicYT** (bao gồm Backend Go Wails và Frontend React + TypeScript), tôi phát hiện một số điểm nghẽn hiệu năng (Performance Bottlenecks) từ mức độ cảnh báo nhẹ đến nguy cơ gây nghẽn/đơ hệ thống.

- 🔴 **Triệu chứng nghiêm trọng (Critical Performance Issues):** **2** (Có nguy cơ gây treo, đơ máy hoặc đột biến CPU/RAM)
- 🟡 **Cảnh báo quan trọng (Performance Warnings):** **2** (Gây re-render liên tục và nghẽn băng thông IPC)
- 🟢 **Đề xuất tối ưu (Suggestions):** **1** (Cải thiện trải nghiệm người dùng bằng bộ nhớ đệm)

---

## 🔴 Triệu chứng Nghiêm trọng (Critical Performance Issues) - Cần Can Thiệp Ngay!

### 1. Triệu chứng "Đột quỵ CPU/RAM" do thiếu cơ chế khóa tải đồng thời (No Concurrent Download Limit)
- **Vị trí phát hiện:** File [app.go](file:///d:/skul9x/dev/MusicYT-main/app.go#L357-L434) (Hàm `DownloadVideo`) và [app.go](file:///d:/skul9x/dev/MusicYT-main/app.go#L451-L526) (Hàm `DownloadGenericVideo`)
- **Triệu chứng bệnh:** Ứng dụng khởi chạy tiến trình `yt-dlp` trực tiếp mà không có bất kỳ cơ chế kiểm soát số luồng tải đồng thời nào ở Backend. Mặc dù ở Frontend có khóa nút bấm khi đang tải, nhưng nếu có các cuộc gọi đồng thời từ API hoặc do race condition khi người dùng chuyển tab nhanh, Backend sẽ mở nhiều tiến trình `yt-dlp` song song.
- **Nếu không sửa, chuyện gì sẽ xảy ra?** Khi nhiều tiến trình `yt-dlp` và các tiến trình con `ffmpeg` (thực hiện convert/embed thumbnail) chạy đồng thời, chúng sẽ tranh chấp tài nguyên ổ đĩa và băng thông mạng. Đặc biệt, việc nén/chuyển đổi audio bằng `ffmpeg` ngốn cực kỳ nhiều CPU. Điều này dẫn tới hiện tượng **đột biến CPU lên 100%**, gây đơ ứng dụng và có thể làm sập (crash) hệ điều hành của người dùng.
- **Phác đồ điều trị (Cách sửa):**
  Sử dụng một cơ chế khóa Mutex hoặc Semaphore ở Backend để kiểm soát trạng thái tải. Nếu phát hiện có tiến trình tải đang chạy, lập tức từ chối yêu cầu tải mới để bảo vệ tài nguyên hệ thống.
  ```go
  // Thêm mutex hoặc kiểm tra trạng thái tải ở App struct
  type App struct {
      // ...
      downloadMu sync.Mutex
      isDownloading bool
  }
  ```

### 2. Triệu chứng "Nghẽn Tim Phổi" do khởi chạy tiến trình mới đè lên tiến trình cũ đang hủy (Async Cancellation Overlap)
- **Vị trí phát hiện:** File [app.go](file:///d:/skul9x/dev/MusicYT-main/app.go#L382-L392) và [app.go](file:///d:/skul9x/dev/MusicYT-main/app.go#L474-L484)
- **Triệu chứng bệnh:** Khi người dùng bắt đầu một lượt tải mới hoặc nhấn nút hủy tải, hàm `a.cancelFunc()` được gọi. Tuy nhiên, việc hủy tiến trình cũ qua `context` diễn ra bất đồng bộ và mất thời gian để `yt-dlp/ffmpeg` đóng hẳn. Nếu người dùng ngay lập tức nhấn tải lại, tiến trình mới sẽ được khởi chạy khi tiến trình cũ vẫn đang trong quá trình giải phóng tài nguyên.
- **Nếu không sửa, chuyện gì sẽ xảy ra?** Hai tiến trình tải nặng sẽ chạy đè lên nhau trong vài giây, gây xung đột file ghi (ổ đĩa bị khóa ghi) dẫn đến lỗi tải thất bại bí ẩn, đồng thời tiêu tốn gấp đôi RAM và CPU vô ích.
- **Phác đồ điều trị (Cách sửa):**
  Cần thực hiện cơ chế chờ an toàn để đảm bảo tiến trình cũ đã hoàn toàn thoát (chờ tín hiệu từ `Wait()`) trước khi cho phép tiến trình mới được phép khởi động.

---

## 🟡 Cảnh báo Quan trọng (Performance Warnings) - Nên Sửa Sớm

### 3. Triệu chứng "Rung tâm thất" do Spamming Event Re-render liên tục ở Frontend (Render Storm)
- **Vị trí phát hiện:** File [App.tsx](file:///d:/skul9x/dev/MusicYT-main/frontend/src/App.tsx#L55-L58) và [UniversalDownloader.tsx](file:///d:/skul9x/dev/MusicYT-main/frontend/src/components/UniversalDownloader.tsx)
- **Triệu chứng bệnh:** Mỗi khi có tiến trình tải, `yt-dlp` in ra tiến trình tải qua stdout theo từng dòng (tần suất cực cao, hàng chục dòng mỗi giây). Backend Go bắt sự kiện này và phát trực tiếp `download-progress` lên Frontend. Frontend React nhận sự kiện và gọi `setProgress(num)`. Vì `progress` là state của `App` component cha, mỗi lần `progress` thay đổi, **toàn bộ cây component con** (kể cả tab YouTube và tab Đa Nền Tảng) đều bị buộc phải render lại liên tục.
- **Nếu không sửa, chuyện gì sẽ xảy ra?** Thread giao diện của trình duyệt bị quá tải do số lần vẽ lại (repaint/reflow) quá nhiều, gây hiện tượng lag giật UI, CPU của trình duyệt tăng cao, làm giảm độ mượt mà của ứng dụng.
- **Phác đồ điều trị (Cách sửa):**
  - Tối ưu ở Backend: Áp dụng cơ chế **Throttle** (chỉ phát sự kiện tiến trình tải khi giá trị phần trăm thay đổi lớn hơn 1%, hoặc giới hạn tối đa 5 sự kiện/giây).
  - Tối ưu ở Frontend: Sử dụng `React.memo` cho các component con hoặc chỉ cập nhật state khi giá trị thực sự thay đổi rõ rệt.

### 4. Triệu chứng "Suy hô hấp" do tràn ngập sự kiện tải dependencies (IPC Channel Clogging)
- **Vị trí phát hiện:** File [app.go](file:///d:/skul9x/dev/MusicYT-main/app.go#L227-L247) - Vòng lặp tải file dependencies trong `DownloadFile`
- **Triệu chứng bệnh:** Với mỗi block dữ liệu 32KB đọc được từ stream tải, backend lập tức phát sự kiện `a.emitEvent(eventName, progress)`.
- **Nếu không sửa, chuyện gì sẽ xảy ra?** Khi tải file `ffmpeg.zip` nặng 150MB, số lần phát sự kiện lên tới **~4800 lần** chỉ trong vài giây. Kênh truyền IPC (Inter-Process Communication) của Wails sẽ bị ngập lụt (clogged), gây đơ đứng giao diện cài đặt và tốn CPU không cần thiết.
- **Phác đồ điều trị (Cách sửa):**
  Chỉ cập nhật và phát sự kiện tiến trình cài đặt khi phần trăm tiến trình tăng ít nhất 1% (ví dụ: `if math.Abs(progress - lastProgress) >= 1.0`).

---

## 🟢 Đề xuất Tối ưu (Suggestions) - Giúp App Trẻ Khỏe Hơn

### 5. Triệu chứng "Mất trí nhớ ngắn hạn" - Thiếu bộ nhớ đệm cho Metadata (No Metadata Caching)
- **Vị trí phát hiện:** File [app.go](file:///d:/skul9x/dev/MusicYT-main/app.go#L437-L448) (`GetVideoInfo`) và [app.go](file:///d:/skul9x/dev/MusicYT-main/app.go#L538-L549) (`GetGenericVideoInfo`)
- **Triệu chứng bệnh:** Lệnh cào thông tin `yt-dlp --dump-json` mất từ 2-5 giây để hoàn thành do phải gọi kết nối mạng cào dữ liệu. Mỗi lần người dùng dán link cũ hoặc click kiểm tra lại, hệ thống lại thực hiện lại toàn bộ lệnh cào mạng này từ đầu.
- **Giải pháp điều trị:** Triển khai một bộ nhớ đệm (LRU Cache hoặc Simple Map Cache với thời gian hết hạn TTL khoảng 5 phút) ở Backend để lưu trữ dữ liệu JSON metadata của các video đã cào. Nếu người dùng thao tác lại cùng một video, thông tin sẽ hiển thị lập tức trong 0.1 giây mà không tốn tài nguyên mạng và CPU.

---

## 📋 Phác đồ Điều trị Tiếp theo (Next Steps)
Tôi đã lập xong chẩn đoán bệnh án hiệu năng cho MusicYT. Anh muốn chúng ta bắt đầu điều trị theo phác đồ nào tiếp theo?

1️⃣ **Thực hiện điều trị các triệu chứng Nghiêm trọng (🔴 Critical)**: Vá lỗi chạy đè tiến trình tải song song và tối ưu hóa hàng đợi tải ở Backend.
2️⃣ **Khắc phục các triệu chứng Cảnh báo (🟡 Warnings)**: Tối ưu hóa tần suất phát sự kiện tiến trình tải (Throttle Progress Events) ở Backend để chống đơ UI ở Frontend.
3️⃣ **Nâng cấp Đề xuất (🟢 Suggestions)**: Thêm bộ nhớ đệm cào metadata video giúp hiển thị thông tin lập tức.
4️⃣ **Vá lỗi Toàn diện (🔧 FIX ALL PERFORMANCE)**: Tôi sẽ tự động tối ưu toàn bộ các vấn đề hiệu năng trên một cách an toàn và kiểm thử cẩn thận.

*Hãy gõ số lựa chọn của anh (1-4) hoặc để lại phản hồi trực tiếp để tôi chuẩn bị dụng cụ phẫu thuật nhé!*
