# Phase 02: Frontend Resilience — Xử Lý Lỗi Dialog Thân Thiện
Status: ✅ Completed
Dependencies: Phase 01

## Objective
Cải thiện frontend để:
1. **Bắt lỗi** khi `SelectSavePath` trả về error thay vì crash
2. **Hiện thông báo** thân thiện cho user thay vì crash im lặng
3. **Disable nút "Thay đổi"** khi app chưa sẵn sàng (dùng `IsAppReady`)
4. Áp dụng cho cả 2 tab: **YouTube Music** và **Đa Nền Tảng**

## Implementation Steps

### 1. [x] Cập nhật `App.tsx` — Thêm app ready state
**File:** [App.tsx](file:///D:/skul9x/dev/MusicYT-main/frontend/src/App.tsx)

Thêm state `appReady` và import `IsAppReady`:

```diff
-import { CheckDependencies, SelectSavePath, DownloadVideo, GetDefaultSavePath, OpenOutputFolder, CancelDownload } from '../wailsjs/go/main/App';
+import { CheckDependencies, SelectSavePath, DownloadVideo, GetDefaultSavePath, OpenOutputFolder, CancelDownload, IsAppReady } from '../wailsjs/go/main/App';
```

```diff
 const [showGuide, setShowGuide] = useState(false);
+const [appReady, setAppReady] = useState(false);
```

Trong `useEffect`, thêm polling check `IsAppReady`:

```typescript
useEffect(() => {
    // ... existing code ...

    // Check if app backend is ready
    const checkReady = async () => {
        try {
            const ready = await IsAppReady();
            setAppReady(ready);
        } catch {
            setAppReady(false);
        }
    };
    checkReady();

    // ... rest of existing useEffect ...
}, []);
```

### 2. [x] Cập nhật `handleSelectPath` trong `App.tsx`
**File:** [App.tsx](file:///D:/skul9x/dev/MusicYT-main/frontend/src/App.tsx) — Line 51-58

**Before:**
```typescript
const handleSelectPath = async () => {
    try {
        const path = await SelectSavePath();
        if (path) setSaveLocation(path);
    } catch (err) {
        console.error(err);
    }
};
```

**After:**
```typescript
const handleSelectPath = async () => {
    try {
        const path = await SelectSavePath();
        if (path) {
            setSaveLocation(path);
            setStatusMessage('Sẵn sàng tải xuống');
        }
        // path rỗng = user hủy dialog, không cần làm gì
    } catch (err: any) {
        const errMsg = err?.toString() || 'Lỗi không xác định';
        console.error('SelectSavePath error:', errMsg);

        if (errMsg.includes('chưa sẵn sàng')) {
            setStatusMessage('⚠️ Ứng dụng đang khởi tạo, vui lòng thử lại sau giây lát.');
        } else if (errMsg.includes('hộp thoại')) {
            setStatusMessage('⚠️ Không thể mở hộp thoại chọn thư mục. Hãy nhập đường dẫn thủ công.');
        } else {
            setStatusMessage(`⚠️ Lỗi chọn thư mục: ${errMsg}`);
        }
    }
};
```

### 3. [x] Disable nút "Thay đổi" khi app chưa ready
**File:** [App.tsx](file:///D:/skul9x/dev/MusicYT-main/frontend/src/App.tsx) — Line 194-200

```diff
 <button 
     onClick={handleSelectPath}
-    disabled={isDownloading}
+    disabled={isDownloading || !appReady}
     className="text-[11px] font-black text-emerald-400 hover:text-emerald-300 transition-colors uppercase tracking-widest border-b border-emerald-500/30 border-dashed"
 >
     Thay đổi
 </button>
```

### 4. [x] Truyền `appReady` sang `UniversalDownloader`
**File:** [App.tsx](file:///D:/skul9x/dev/MusicYT-main/frontend/src/App.tsx) — Line 285-294

```diff
 <UniversalDownloader
     saveLocation={saveLocation}
     handleSelectPath={handleSelectPath}
     isDownloading={isDownloading}
     setIsDownloading={setIsDownloading}
     progress={progress}
     setProgress={setProgress}
     depStatus={depStatus}
     setStatusMessage={setStatusMessage}
+    appReady={appReady}
 />
```

### 5. [x] Cập nhật `UniversalDownloader.tsx` — Nhận prop `appReady`
**File:** [UniversalDownloader.tsx](file:///D:/skul9x/dev/MusicYT-main/frontend/src/components/UniversalDownloader.tsx)

Cập nhật interface Props:
```diff
 interface Props {
     saveLocation: string;
     handleSelectPath: () => void;
     isDownloading: boolean;
     setIsDownloading: (val: boolean) => void;
     progress: number;
     setProgress: (val: number) => void;
     depStatus: { ok: boolean; msg: string; os: string };
     setStatusMessage: (val: string) => void;
+    appReady: boolean;
 }
```

Nhận prop:
```diff
 export default function UniversalDownloader({
     saveLocation,
     handleSelectPath,
     isDownloading,
     setIsDownloading,
     progress,
     setProgress,
     depStatus,
-    setStatusMessage
+    setStatusMessage,
+    appReady
 }: Props) {
```

Disable nút "Thay đổi" (line 120-126):
```diff
 <button 
     onClick={handleSelectPath}
-    disabled={isDownloading}
+    disabled={isDownloading || !appReady}
     className="text-[11px] font-black text-emerald-400 hover:text-emerald-300 transition-colors uppercase tracking-widest border-b border-emerald-500/30 border-dashed"
 >
     Thay đổi
 </button>
```

### 6. [x] Regenerate Wails Bindings
Sau khi thêm method `IsAppReady` và `domReady` ở backend, cần regenerate bindings:

```powershell
cd D:\skul9x\dev\MusicYT-main
wails generate module
```

Hoặc nếu dùng dev mode, bindings tự generate khi chạy `wails dev`.

## Files to Create/Modify
| File | Action | Purpose |
|------|--------|---------|
| [App.tsx](file:///D:/skul9x/dev/MusicYT-main/frontend/src/App.tsx) | MODIFY | Error handling, appReady state, disable button |
| [UniversalDownloader.tsx](file:///D:/skul9x/dev/MusicYT-main/frontend/src/components/UniversalDownloader.tsx) | MODIFY | Nhận prop appReady, disable button |

## Test Criteria
- [ ] Click "Thay đổi" khi app mới mở (chưa ready) → Nút bị disable, không crash
- [ ] Click "Thay đổi" khi app đã ready → Dialog mở bình thường
- [ ] Nếu backend trả lỗi → Hiện thông báo thân thiện ở status bar
- [ ] Cancel dialog (đóng hộp thoại không chọn) → Không hiện lỗi
- [ ] Cả 2 tab (YouTube Music + Đa Nền Tảng) đều hoạt động đúng
- [ ] Hoạt động trên cả Windows và Linux

## Notes
- Cách tiếp cận này KHÔNG thay đổi UX flow — User vẫn click "Thay đổi" như bình thường
- Chỉ thêm lớp bảo vệ: nút bị disable nếu app chưa ready + error message thân thiện
- Trên Linux, dialog dùng GTK nên rất ít khi gặp lỗi, nhưng error handling vẫn áp dụng để safe

---
Previous Phase: [phase-01-backend.md](file:///D:/skul9x/dev/MusicYT-main/plans/260523-1931-fix-select-folder-crash/phase-01-backend.md)
Next Phase: [phase-03-testing.md](file:///D:/skul9x/dev/MusicYT-main/plans/260523-1931-fix-select-folder-crash/phase-03-testing.md)
