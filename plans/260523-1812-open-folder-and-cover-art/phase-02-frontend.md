# Phase 02: Frontend — UI Buttons & Format Option

Status: ✅ Completed
Dependencies: Phase 01 (Backend + Wails bindings phải hoàn tất)

## Objective

Cập nhật giao diện 2 tab:
1. **Tab "YouTube Music"** (`App.tsx`): Thêm nút "📂 Mở thư mục" bên cạnh đường dẫn lưu.
2. **Tab "Đa Nền Tảng"** (`UniversalDownloader.tsx`): Thêm nút "📂 Mở thư mục" + thêm option format "🎵 Âm thanh + Cover Art".

---

## Task 1: Import hàm `OpenOutputFolder` ở frontend

### File: `frontend/src/App.tsx`

Cập nhật dòng import Wails:

```diff
- import { CheckDependencies, SelectSavePath, DownloadVideo, GetDefaultSavePath } from '../wailsjs/go/main/App';
+ import { CheckDependencies, SelectSavePath, DownloadVideo, GetDefaultSavePath, OpenOutputFolder } from '../wailsjs/go/main/App';
```

### File: `frontend/src/components/UniversalDownloader.tsx`

Thêm import:

```diff
- import { DownloadGenericVideo } from '../../wailsjs/go/main/App';
+ import { DownloadGenericVideo, OpenOutputFolder } from '../../wailsjs/go/main/App';
```

---

## Task 2: Thêm nút "Mở thư mục" vào tab YouTube Music

### File: `frontend/src/App.tsx`

**Vị trí:** Ngay sau phần hiển thị đường dẫn lưu (dòng ~196-199), thêm button:

```tsx
{/* Save Location & Action */}
<div className="space-y-6">
    <div className="flex items-center justify-between px-1">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Lưu vào</span>
        <div className="flex items-center gap-3">
            <button 
                onClick={() => saveLocation && OpenOutputFolder(saveLocation).catch(err => setStatusMessage(`❌ ${err}`))}
                disabled={isDownloading || !saveLocation}
                className="text-[11px] font-black text-cyan-400 hover:text-cyan-300 transition-colors uppercase tracking-widest border-b border-cyan-500/30 border-dashed disabled:opacity-30"
            >
                📂 Mở thư mục
            </button>
            <button 
                onClick={handleSelectPath}
                disabled={isDownloading}
                className="text-[11px] font-black text-emerald-400 hover:text-emerald-300 transition-colors uppercase tracking-widest border-b border-emerald-500/30 border-dashed"
            >
                Thay đổi
            </button>
            {/* Giữ nguyên nút ? help */}
            <button 
                onClick={() => setShowGuide(!showGuide)}
                className={`text-[10px] font-black w-6 h-6 rounded-full flex items-center justify-center transition-all ${showGuide ? 'bg-emerald-500 text-black' : 'bg-white/5 text-slate-500 hover:text-emerald-400 border border-white/10'}`}
            >
                ?
            </button>
        </div>
    </div>
    <div className="bg-black/20 rounded-xl px-4 py-3 flex items-center gap-3 border border-white/5">
        <svg className="w-4 h-4 text-slate-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"></path></svg>
        <span className="text-xs text-slate-400 truncate font-mono">{saveLocation || "Chưa chọn..."}</span>
    </div>
</div>
```

### Thiết kế UX

- Nút "📂 Mở thư mục" dùng **màu cyan** để phân biệt với nút "Thay đổi" (emerald).
- `disabled` khi đang downloading hoặc chưa chọn thư mục.
- Click gọi `OpenOutputFolder(saveLocation)` — lỗi sẽ hiện ở status message.
- Sắp xếp: `[Mở thư mục] [Thay đổi] [?]` — từ trái sang phải.

---

## Task 3: Thêm nút "Mở thư mục" vào tab Đa Nền Tảng

### File: `frontend/src/components/UniversalDownloader.tsx`

**Vị trí:** Phần "Save Location" (dòng ~99-114), tương tự như YouTube tab:

```tsx
{/* Save Location & Action */}
<div className="space-y-6">
    <div className="flex items-center justify-between px-1">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Lưu vào</span>
        <div className="flex items-center gap-3">
            <button 
                onClick={() => saveLocation && OpenOutputFolder(saveLocation).catch(err => setStatusMessage(`❌ ${err}`))}
                disabled={isDownloading || !saveLocation}
                className="text-[11px] font-black text-cyan-400 hover:text-cyan-300 transition-colors uppercase tracking-widest border-b border-cyan-500/30 border-dashed disabled:opacity-30"
            >
                📂 Mở thư mục
            </button>
            <button 
                onClick={handleSelectPath}
                disabled={isDownloading}
                className="text-[11px] font-black text-emerald-400 hover:text-emerald-300 transition-colors uppercase tracking-widest border-b border-emerald-500/30 border-dashed"
            >
                Thay đổi
            </button>
        </div>
    </div>
    <div className="bg-black/20 rounded-xl px-4 py-3 flex items-center gap-3 border border-white/5">
        <svg className="w-4 h-4 text-slate-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"></path></svg>
        <span className="text-xs text-slate-400 truncate font-mono">{saveLocation || "Chưa chọn..."}</span>
    </div>
</div>
```

---

## Task 4: Thêm format option "Âm thanh + Cover Art" vào Đa Nền Tảng

### File: `frontend/src/components/UniversalDownloader.tsx`

**Vị trí:** Phần format selection (dòng ~117-141). Thay đổi grid từ 2 thành 3 option:

```tsx
{/* Format Selection Case */}
<div className="space-y-3">
    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Định dạng tải về</label>
    <div className="grid grid-cols-3 gap-2">
        {[
            { id: 'best', label: '🎬 Video', sub: 'MP4 tốt nhất' },
            { id: 'm4a', label: '🎵 Âm thanh', sub: 'Chỉ nhạc m4a' },
            { id: 'm4a_cover', label: '🎵 Nhạc + Cover', sub: 'm4a + ảnh bìa' },
        ].map((opt) => (
            <button
                key={opt.id}
                onClick={() => setFormat(opt.id)}
                disabled={isDownloading}
                className={`flex flex-col items-start p-3 rounded-xl border transition-all ${
                    format === opt.id 
                    ? 'bg-emerald-500/10 border-emerald-500/40 ring-1 ring-emerald-500/30' 
                    : 'bg-black/20 border-white/5 hover:border-white/20'
                }`}
            >
                <span className={`text-[11px] font-black uppercase tracking-tight ${format === opt.id ? 'text-emerald-400' : 'text-slate-300'}`}>
                    {opt.label}
                </span>
                <span className="text-[9px] text-slate-500 font-bold uppercase tracking-tighter mt-1">{opt.sub}</span>
            </button>
        ))}
    </div>
</div>
```

### Thay đổi chi tiết

| Trước | Sau |
|-------|-----|
| `grid-cols-2` | `grid-cols-3` |
| 2 options: `best`, `m4a` | 3 options: `best`, `m4a`, `m4a_cover` |
| `gap-3` | `gap-2` (thu nhỏ để fit 3 columns) |
| `p-4` | `p-3` (thu nhỏ padding) |

### Label & Sub text

| Format ID | Label | Sub | Mô tả backend |
|-----------|-------|-----|----------------|
| `best` | 🎬 Video | MP4 tốt nhất | `-f "bv*+ba/b" --merge-output-format mp4` |
| `m4a` | 🎵 Âm thanh | Chỉ nhạc m4a | `-f "best[vcodec^=h264]/best" -x --audio-format m4a` |
| `m4a_cover` | 🎵 Nhạc + Cover | m4a + ảnh bìa | Như `m4a` nhưng thêm `--embed-thumbnail` |

---

## Task 5: Cập nhật status message sau download thành công

### File: `frontend/src/components/UniversalDownloader.tsx`

Khi tải xong và format là `m4a_cover`, hiện message phù hợp:

```tsx
// Trong handleDownload, phần try:
await DownloadGenericVideo(url.trim(), saveLocation, format);
if (format === 'm4a_cover') {
    setStatusMessage("🎉 Hoàn tất! Nhạc + Cover Art đã tải về máy anh.");
} else if (format === 'm4a') {
    setStatusMessage("🎉 Hoàn tất! File nhạc đã tải về máy anh.");
} else {
    setStatusMessage("🎉 Hoàn tất! Video đã tải về máy anh.");
}
setProgress(100);
```

---

## Task 6: Cập nhật default format state

### File: `frontend/src/components/UniversalDownloader.tsx`

Giữ nguyên default format là `'best'`:

```tsx
const [format, setFormat] = useState('best'); // 'best' (video), 'm4a' (audio only), 'm4a_cover' (audio + cover art)
```

Không thay đổi default — chỉ cập nhật comment cho rõ ràng.

---

## Task 7: Đảm bảo consistency giữa 2 tab

### Checklist

- [x] Cả 2 tab đều có nút "📂 Mở thư mục" cùng style (cyan color, dashed border)
- [x] Cả 2 tab đều có nút "Thay đổi" cùng style (emerald color, dashed border)
- [x] Nút "📂 Mở thư mục" ở cả 2 tab đều disabled khi `isDownloading` hoặc `!saveLocation`
- [x] Tab YouTube Music giữ nguyên 4 format options (best, 1080p, 720p, m4a)
- [x] Tab Đa Nền Tảng có 3 format options (best, m4a, m4a_cover)

---

## Test Criteria
- [x] Nút "📂 Mở thư mục" hiển thị đúng ở tab YouTube Music
- [x] Nút "📂 Mở thư mục" hiển thị đúng ở tab Đa Nền Tảng
- [x] Click "📂 Mở thư mục" mở đúng thư mục trong File Explorer
- [x] 3 format options hiển thị đúng ở tab Đa Nền Tảng
- [x] Chọn "🎵 Nhạc + Cover" → gọi `DownloadGenericVideo` với format `m4a_cover`
- [x] Tải thành công với format `m4a_cover` → file M4A có embedded thumbnail
- [x] Status message hiển thị đúng theo format đã chọn

## Notes
- **Styling consistency**: Nút "Mở thư mục" dùng `text-cyan-400` để phân biệt với "Thay đổi" (`text-emerald-400`), tạo hierarchy rõ ràng.
- **Error handling**: `OpenOutputFolder` trả Promise, `.catch()` sẽ hiện lỗi trong status bar nếu thư mục không tồn tại.
- **Grid 3 columns**: Trên mobile có thể hơi nhỏ, nhưng vì đây là Desktop app (Wails) nên không vấn đề.

---

Previous Phase: [phase-01-backend.md](./phase-01-backend.md)
Next Phase: [phase-03-integration-testing.md](./phase-03-integration-testing.md)
