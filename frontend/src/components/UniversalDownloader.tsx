import { useState, useEffect } from 'react';
import { DownloadGenericVideo, OpenOutputFolder, CancelDownload, GetGenericVideoInfo, NotifyDownloadComplete, SelectCookiesFile } from '../../wailsjs/go/main/App';

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
    isSelectingPath: boolean;
    addToast: (title: string, message: string, type?: 'success' | 'error' | 'info', folderPath?: string) => void;
}

export default function UniversalDownloader({
    saveLocation,
    handleSelectPath,
    isDownloading,
    setIsDownloading,
    progress,
    setProgress,
    depStatus,
    setStatusMessage,
    appReady,
    isSelectingPath,
    addToast
}: Props) {
    const [url, setUrl] = useState('');
    const [format, setFormat] = useState('m4a_cover'); // 'best' (video), 'm4a' (audio only), 'm4a_cover' (audio + cover art)
    const [enableCookies, setEnableCookies] = useState<boolean>(
        localStorage.getItem("music_yt_enable_cookies") === "true"
    );
    const [cookiesPath, setCookiesPath] = useState<string>(
        localStorage.getItem("music_yt_cookies_file_path") || ""
    );

    const handleSelectFile = async () => {
        try {
            const path = await SelectCookiesFile();
            if (path) {
                setCookiesPath(path);
                localStorage.setItem("music_yt_cookies_file_path", path);
            }
        } catch (err) {
            console.error("Lỗi chọn file:", err);
        }
    };

    const detectPlatform = (urlStr: string) => {
        const lowerUrl = urlStr.toLowerCase().trim();
        if (!lowerUrl) return null;
        if (lowerUrl.includes('tiktok.com')) return { name: 'TikTok', icon: '🎵', color: 'text-pink-400' };
        if (lowerUrl.includes('douyin.com')) return { name: 'Douyin', icon: '🎵', color: 'text-cyan-400' };
        if (lowerUrl.includes('facebook.com') || lowerUrl.includes('fb.watch') || lowerUrl.includes('fb.com')) return { name: 'Facebook', icon: '📘', color: 'text-blue-400' };
        if (lowerUrl.includes('instagram.com')) return { name: 'Instagram', icon: '📷', color: 'text-purple-400' };
        if (lowerUrl.includes('twitter.com') || lowerUrl.includes('x.com')) return { name: 'Twitter/X', icon: '🐦', color: 'text-sky-400' };
        if (lowerUrl.includes('bilibili.com') || lowerUrl.includes('b23.tv')) return { name: 'Bilibili', icon: '📺', color: 'text-pink-500' };
        return { name: 'Đa Nền Tảng', icon: '🌐', color: 'text-emerald-400' };
    };

    const platform = detectPlatform(url);

    const truncateTitle = (title: string, maxLength: number = 40): string => {
        if (title.length <= maxLength) return title;
        return title.substring(0, maxLength) + '...';
    };

    const handleDownload = async () => {
        if (!url.trim()) {
            setStatusMessage("⚠️ Vui lòng nhập link video!");
            return;
        }
        if (!saveLocation) {
            setStatusMessage("⚠️ Hãy chọn thư mục lưu trước!");
            return;
        }

        setIsDownloading(true);
        setProgress(0);
        setStatusMessage("🚀 Đang phân tích link & kết nối...");

        let videoTitle = "Video";
        const cookieToPass = enableCookies ? cookiesPath : "";
        const titlePromise = GetGenericVideoInfo(url.trim(), cookieToPass)
            .then((jsonStr) => {
                try {
                    const info = JSON.parse(jsonStr);
                    return info.title || "Video";
                } catch {
                    return "Video";
                }
            })
            .catch(() => "Video");

        try {
            await DownloadGenericVideo(url.trim(), saveLocation, format, cookieToPass);
            const resolvedTitle = await titlePromise;
            const truncated = truncateTitle(resolvedTitle);

            let msg = `"${truncated}" đã được lưu vào máy.`;
            if (format === 'm4a_cover') {
                setStatusMessage("🎉 Hoàn tất! Nhạc + Cover Art đã tải về máy anh.");
                msg = `"${truncated}" (Nhạc + Cover Art) đã được lưu vào máy.`;
            } else if (format === 'm4a') {
                setStatusMessage("🎉 Hoàn tất! File nhạc đã tải về máy anh.");
                msg = `"${truncated}" (Nhạc) đã được lưu vào máy.`;
            } else {
                setStatusMessage("🎉 Hoàn tất! Video đã tải về máy anh.");
                msg = `"${truncated}" (Video) đã được lưu vào máy.`;
            }
            setProgress(100);

            addToast("Tải thành công! 🎉", msg, "success", saveLocation);
            NotifyDownloadComplete("MusicYT - Hoàn tất tải", `"${truncated}" đã sẵn sàng tại: ` + saveLocation);
        } catch (err: any) {
            if (err.toString().includes("context canceled") || err.toString().includes("killed")) {
                setStatusMessage("❌ Đã hủy tải video theo yêu cầu.");
                addToast("Đã hủy tải", "Quá trình tải đã dừng theo yêu cầu.", "info");
            } else {
                let errMsg = err.toString();
                // Dịch lỗi thân thiện nếu bật cookies nhưng bị lỗi chặn từ web (do cookies hết hạn/lỗi)
                if (enableCookies && (
                    errMsg.toLowerCase().includes("unexpected response") || 
                    errMsg.toLowerCase().includes("unsupported url") ||
                    errMsg.includes("403") || 
                    errMsg.includes("401")
                )) {
                    errMsg = "Lỗi Cookies đã hết hạn hoặc không hợp lệ. Hãy thử TẮT tùy chọn 'Vượt chặn bảo mật bằng Cookies' (đối với video công khai) hoặc cập nhật tệp cookies.txt mới nhất từ trình duyệt của anh nhé.";
                }
                setStatusMessage(`❌ Lỗi: ${errMsg}`);
                addToast("Lỗi tải xuống", errMsg, "error");
            }
        } finally {
            setIsDownloading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !isDownloading && url && saveLocation) {
            handleDownload();
        }
    };

    return (
        <div className="space-y-8">
            {/* URL Input Group */}
            <div className="space-y-3 relative">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Video Link (TikTok, FB, Douyin...)</label>
                <div className="relative">
                    <input 
                        className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/40 transition-all placeholder:text-slate-700 text-lg" 
                        onChange={(e) => setUrl(e.target.value)} 
                        onKeyDown={handleKeyDown}
                        value={url}
                        disabled={isDownloading}
                        autoComplete="off" 
                        placeholder="Dán link video từ bất kỳ nền tảng nào..."
                        type="text"
                    />
                    {platform && !isDownloading && (
                        <div className={`absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1.5 px-3 py-1 bg-white/5 border border-white/10 rounded-full text-xs font-black uppercase tracking-wider ${platform.color} animate-in fade-in zoom-in-75`}>
                            <span>{platform.icon}</span>
                            <span>{platform.name}</span>
                        </div>
                    )}
                </div>
            </div>

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
                            disabled={isDownloading || !appReady || isSelectingPath}
                            className="text-[11px] font-black text-emerald-400 hover:text-emerald-300 transition-colors uppercase tracking-widest border-b border-emerald-500/30 border-dashed disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:text-emerald-400 disabled:no-underline"
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

            {/* Cookies Bypass Settings */}
            <div className="space-y-4 bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-md">
                <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                        <label className="text-xs font-black text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                            🛡️ Vượt chặn bảo mật bằng Cookies
                        </label>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">
                            Bypass TikTok & YouTube anti-bot
                        </p>
                    </div>
                    <button
                        onClick={() => {
                            const newValue = !enableCookies;
                            setEnableCookies(newValue);
                            localStorage.setItem("music_yt_enable_cookies", newValue ? "true" : "false");
                        }}
                        disabled={isDownloading}
                        className={`w-11 h-6 rounded-full p-1 transition-colors duration-300 focus:outline-none ${
                            enableCookies ? 'bg-emerald-500' : 'bg-slate-800'
                        }`}
                    >
                        <div
                            className={`bg-black w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${
                                enableCookies ? 'translate-x-5' : 'translate-x-0'
                            }`}
                        />
                    </button>
                </div>

                {enableCookies && (
                    <div className="space-y-3 pt-2 border-t border-white/5 animate-in fade-in slide-in-from-top-2 duration-300">
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Tệp cookies.txt</span>
                            <div className="flex items-center gap-3">
                                {cookiesPath && (
                                    <button
                                        onClick={() => {
                                            setCookiesPath("");
                                            localStorage.removeItem("music_yt_cookies_file_path");
                                        }}
                                        disabled={isDownloading}
                                        className="text-[11px] font-black text-rose-400 hover:text-rose-300 transition-colors uppercase tracking-widest border-b border-rose-500/30 border-dashed"
                                    >
                                        ❌ Xóa
                                    </button>
                                )}
                                <button
                                    onClick={handleSelectFile}
                                    disabled={isDownloading}
                                    className="text-[11px] font-black text-emerald-400 hover:text-emerald-300 transition-colors uppercase tracking-widest border-b border-emerald-500/30 border-dashed"
                                >
                                    {cookiesPath ? "Thay đổi" : "Chọn file"}
                                </button>
                            </div>
                        </div>

                        <div className="bg-black/20 rounded-xl px-4 py-3 flex items-center gap-3 border border-white/5">
                            <svg className="w-4 h-4 text-slate-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <span className="text-xs text-slate-400 truncate font-mono select-all">
                                {cookiesPath || "Chưa chọn tệp cookies.txt..."}
                            </span>
                        </div>

                        <p className="text-[10px] text-slate-500 leading-relaxed font-medium">
                            💡 <span className="font-bold text-slate-400">Cách lấy:</span> Cài extension <span className="text-cyan-400 font-bold">"Get cookies.txt LOCALLY"</span> trên Chrome/Firefox/Edge, đăng nhập TikTok, xuất file <span className="font-mono">cookies.txt</span> rồi chọn file đó tại đây.
                        </p>
                    </div>
                )}
            </div>

            {/* Progress or Button */}
            <div className="pt-2">
                {isDownloading ? (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                        <div className="flex justify-between items-end">
                            <span className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em] animate-pulse">Đang tải và xử lý video...</span>
                            <span className="text-2xl font-black text-white">{progress.toFixed(0)}%</span>
                        </div>
                        <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                            <div 
                                className="h-full bg-gradient-to-r from-emerald-500 via-cyan-400 to-emerald-500 bg-[length:200%_100%] animate-gradient transition-all duration-300 shadow-[0_0_20px_rgba(16,185,129,0.3)]" 
                                style={{ width: `${progress}%` }}
                            ></div>
                        </div>
                        <button
                            onClick={async () => {
                                setStatusMessage("⏳ Đang gửi yêu cầu hủy...");
                                try {
                                    await CancelDownload();
                                } catch (err) {
                                    console.error(err);
                                }
                            }}
                            className="w-full mt-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-bold py-2.5 rounded-xl border border-rose-500/20 hover:border-rose-500/40 transition-all flex items-center justify-center gap-2 text-xs uppercase tracking-wider cursor-pointer"
                        >
                            🚫 Hủy tải video
                        </button>
                    </div>
                ) : (
                    <button 
                        className="w-full bg-gradient-to-br from-emerald-500 to-cyan-500 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-30 disabled:grayscale text-black font-black py-4 rounded-2xl shadow-[0_10px_30px_rgba(16,185,129,0.3)] flex items-center justify-center gap-3 transition-all duration-300 text-sm tracking-widest uppercase" 
                        onClick={handleDownload}
                        disabled={!url || !saveLocation || !depStatus.ok}
                    >
                        Bắt đầu tải
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M4 16v1a2 2 0 002 2h14a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                    </button>
                )}
            </div>

            {/* Platform Badges */}
            <div className="border-t border-white/5 pt-6 mt-2">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 text-center">Nền tảng hỗ trợ chính</p>
                <div className="flex flex-wrap justify-center gap-2 opacity-50 hover:opacity-85 transition-opacity duration-300">
                    {['TikTok', 'Douyin', 'Facebook', 'Instagram', 'Twitter/X', 'Bilibili'].map((plat) => (
                        <span key={plat} className="text-[9px] font-black tracking-tight text-slate-400 bg-white/5 border border-white/10 px-2.5 py-1 rounded-full uppercase">
                            {plat}
                        </span>
                    ))}
                    <span className="text-[9px] font-black tracking-tight text-emerald-400 bg-emerald-500/5 border border-emerald-500/10 px-2.5 py-1 rounded-full uppercase">
                        + 1000 nền tảng
                    </span>
                </div>
            </div>
        </div>
    );
}
