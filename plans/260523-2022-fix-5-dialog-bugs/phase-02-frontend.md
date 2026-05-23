# Phase 02: Frontend Resilience — Nâng Cao Trải Nghiệm & Chống Click Spam

Status: ✅ Completed
Dependencies: Phase 01

## Objective
Cập nhật giao diện React/TypeScript để:
1. **BUG 2 (🟡):** Thêm disabled styles trực quan cho nút **"Thay đổi"** (Tailwind opacity & cursor) để thông báo rõ ràng trạng thái vô hiệu hóa.
2. **BUG 3 (🟡):** Thêm cơ chế guard state `isSelectingPath` ở mức Frontend để chống double-click/spam click.
3. **BUG 4 (🟢):** Truyền `saveLocation` hiện tại xuống backend `SelectSavePath(saveLocation)` để dialog mở đúng chỗ.
4. **BUG 5 (🟢):** Render `InstallGuideModal` khi `showGuide` bằng `true`, cho phép người dùng xem hướng dẫn cài đặt bất kỳ lúc nào qua nút `?`.

---

## Chi tiết thay đổi đề xuất

### 1. Thêm `isSelectingPath` state vào `App.tsx`
**File:** [App.tsx](file:///d:/skul9x/dev/MusicYT-main/frontend/src/App.tsx)
Khai báo state mới để kiểm soát tiến trình mở hộp thoại của Frontend.

```typescript
const [isSelectingPath, setIsSelectingPath] = useState(false);
```

### 2. Nâng cấp `handleSelectPath` chặn spam click & gửi saveLocation
**File:** [App.tsx](file:///d:/skul9x/dev/MusicYT-main/frontend/src/App.tsx)

```typescript
const handleSelectPath = async () => {
    if (isSelectingPath) return; // Chặn spam click ở mức Frontend
    setIsSelectingPath(true);
    try {
        // Truyền saveLocation hiện tại vào để mở đúng thư mục
        const path = await SelectSavePath(saveLocation);
        if (path) {
            setSaveLocation(path);
            setStatusMessage('Sẵn sàng tải xuống');
        }
    } catch (err: any) {
        const errMsg = err?.toString() || 'Lỗi không xác định';
        console.error('SelectSavePath error:', errMsg);

        if (errMsg.includes('chưa sẵn sàng')) {
            setStatusMessage('⚠️ Ứng dụng đang khởi tạo, vui lòng thử lại sau giây lát.');
        } else if (errMsg.includes('đang được mở')) {
            setStatusMessage('⚠️ Hộp thoại chọn thư mục đã mở, hãy kiểm tra trên thanh tác vụ.');
        } else if (errMsg.includes('hộp thoại')) {
            setStatusMessage('⚠️ Không thể mở hộp thoại chọn thư mục. Hãy nhập đường dẫn thủ công.');
        } else {
            setStatusMessage(`⚠️ Lỗi chọn thư mục: ${errMsg}`);
        }
    } finally {
        setIsSelectingPath(false); // Reset trạng thái khi hoàn tất
    }
};
```

### 3. Cập nhật disabled condition & disabled CSS cho nút "Thay đổi" ở tab Youtube
**File:** [App.tsx](file:///d:/skul9x/dev/MusicYT-main/frontend/src/App.tsx) (khoảng dòng 226)

```diff
 <button 
     onClick={handleSelectPath}
-    disabled={isDownloading || !appReady}
-    className="text-[11px] font-black text-emerald-400 hover:text-emerald-300 transition-colors uppercase tracking-widest border-b border-emerald-500/30 border-dashed"
+    disabled={isDownloading || !appReady || isSelectingPath}
+    className="text-[11px] font-black text-emerald-400 hover:text-emerald-300 transition-colors uppercase tracking-widest border-b border-emerald-500/30 border-dashed disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:text-emerald-400 disabled:no-underline"
 >
     Thay đổi
 </button>
```

### 4. Truyền prop sang `UniversalDownloader` và cập nhật nút "Thay đổi" ở tab Đa Nền Tảng
**File:** [App.tsx](file:///d:/skul9x/dev/MusicYT-main/frontend/src/App.tsx) (khoảng dòng 317)
Truyền thêm prop `isSelectingPath`:

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
     appReady={appReady}
+    isSelectingPath={isSelectingPath}
 />
```

**File:** [UniversalDownloader.tsx](file:///d:/skul9x/dev/MusicYT-main/frontend/src/components/UniversalDownloader.tsx)
Cập nhật `interface Props`:

```typescript
interface Props {
    saveLocation: string;
    handleSelectPath: () => void;
    isDownloading: boolean;
    setIsDownloading: (val: boolean) => void;
    progress: number;
    setProgress: (val: number) => void;
    depStatus: { ok: boolean; msg: string; os: string };
    setStatusMessage: (val: string) => void;
    appReady: boolean;
    isSelectingPath: boolean; // ← THÊM MỚI
}
```

Cập nhật hàm component nhận prop và nút:

```diff
 export default function UniversalDownloader({
     saveLocation,
     handleSelectPath,
     isDownloading,
     setIsDownloading,
     progress,
     setProgress,
     depStatus,
     setStatusMessage,
-    appReady
+    appReady,
+    isSelectingPath
 }: Props) {
```

```diff
 <button 
     onClick={handleSelectPath}
-    disabled={isDownloading || !appReady}
-    className="text-[11px] font-black text-emerald-400 hover:text-emerald-300 transition-colors uppercase tracking-widest border-b border-emerald-500/30 border-dashed"
+    disabled={isDownloading || !appReady || isSelectingPath}
+    className="text-[11px] font-black text-emerald-400 hover:text-emerald-300 transition-colors uppercase tracking-widest border-b border-emerald-500/30 border-dashed disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:text-emerald-400 disabled:no-underline"
 >
     Thay đổi
 </button>
```

### 5. Render `InstallGuideModal` khi click nút trợ giúp
**File:** [App.tsx](file:///d:/skul9x/dev/MusicYT-main/frontend/src/App.tsx)
Thêm khối render ở cuối JSX chính (trước thẻ đóng `</div>` ngoài cùng):

```typescript
            {showGuide && (
                <InstallGuideModal
                    detectedOs={depStatus.os}
                    isFullyInstalled={depStatus.ok}
                    onClose={() => setShowGuide(false)}
                    onSuccess={async () => {
                        setShowGuide(false);
                        const res = await CheckDependencies() as any;
                        setDepStatus({ ok: res.ok, msg: res.message, os: res.os });
                    }}
                />
            )}
```

### 6. Cập nhật bindings của Wails
Vì hàm `SelectSavePath` có thay đổi signature nhận đối số `currentPath string`, chúng ta cần tái sinh mã Wails bindings:
```powershell
wails generate module
```

---

## Các tệp sẽ sửa đổi
* [App.tsx](file:///d:/skul9x/dev/MusicYT-main/frontend/src/App.tsx)
* [UniversalDownloader.tsx](file:///d:/skul9x/dev/MusicYT-main/frontend/src/components/UniversalDownloader.tsx)

---

## Kế hoạch kiểm thử & Xác minh (Frontend)
1. Kiểm tra type-checking với `npx tsc --noEmit` ở thư mục `frontend`.
2. Kiểm tra xem các nút "Thay đổi" có chuyển sang dạng mờ (opacity-30), không hiển thị con trỏ tay (cursor-not-allowed) và không gạch chân hover khi `appReady` bằng `false` hay không.
3. Click vào nút `?` và xác nhận modal hướng dẫn hiển thị mượt mà.
