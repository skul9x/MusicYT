/// <reference path="../wailsjs/runtime/runtime.d.ts" />
import { useState, useEffect } from 'react';
import { CheckDependencies, SelectSavePath, DownloadVideo, GetDefaultSavePath, OpenOutputFolder, CancelDownload, IsAppReady, GetVideoInfo, NotifyDownloadComplete, SelectCookiesFile } from '../wailsjs/go/main/App';
import { EventsOn } from '../wailsjs/runtime/runtime';
import InstallGuideModal from './components/InstallGuideModal';
import UniversalDownloader from './components/UniversalDownloader';
import { GlassToastContainer, toast } from './components/GlassToast';


function App() {
    const [activeTab, setActiveTab] = useState<'youtube' | 'universal'>('youtube');
    const [url, setUrl] = useState('');
    const [saveLocation, setSaveLocation] = useState('');
    const [progress, setProgress] = useState(0);
    const [isDownloading, setIsDownloading] = useState(false);
    const [statusMessage, setStatusMessage] = useState('Sẵn sàng tải xuống');
    const [depStatus, setDepStatus] = useState({ ok: true, msg: '', os: 'win' });
    const [format, setFormat] = useState('m4a');
    const [showGuide, setShowGuide] = useState(false);
    const [appReady, setAppReady] = useState(false);
    const [isSelectingPath, setIsSelectingPath] = useState(false);
    const [enableCookies, setEnableCookies] = useState<boolean>(
        localStorage.getItem("music_yt_enable_cookies") === "true"
    );
    const [cookiesPath, setCookiesPath] = useState<string>(
        localStorage.getItem("music_yt_cookies_file_path") || ""
    );

    const handleSelectCookiesFile = async () => {
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

    useEffect(() => {
        const checkDeps = async () => {
            const res = await CheckDependencies() as any;
            setDepStatus({ ok: res.ok, msg: res.message, os: res.os });
            if (!res.ok) {
                setStatusMessage(`Lỗi: ${res.message}`);
                setShowGuide(true);
            } else {
                setShowGuide(false);
            }
        };
        checkDeps();

        // Check if app backend is ready
        const checkReady = async () => {
            try {
                const ready = await IsAppReady();
                setAppReady(ready);
                if (ready) {
                    clearInterval(readyInterval);
                }
            } catch {
                setAppReady(false);
            }
        };
        const readyInterval = setInterval(checkReady, 1000);
        checkReady();

        // 2. Get default save path
        GetDefaultSavePath().then((path) => {
            setSaveLocation(path);
        });

        // 3. Listen to progress
        const unoff = EventsOn("download-progress", (data: string) => {
            const num = parseFloat(data);
            if (!isNaN(num)) setProgress(num);
        });

        return () => {
            unoff();
            clearInterval(readyInterval);
        };
    }, []);

    const isValidYT = (url: string) => {
        const regex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/(watch\?v=|embed\/|v\/|shorts\/)?([a-zA-Z0-9_-]{11})/;
        return regex.test(url.trim());
    };

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

    const addToast = (title: string, message: string, type: 'success' | 'error' | 'info' = 'info', folderPath?: string) => {
        toast.show(title, message, type, folderPath);
    };

    const truncateTitle = (title: string, maxLength: number = 40): string => {
        if (title.length <= maxLength) return title;
        return title.substring(0, maxLength) + '...';
    };

    const handleDownload = async () => {
        if (!url || !isValidYT(url)) {
            setStatusMessage("⚠️ Vui lòng nhập link YouTube hợp lệ!");
            return;
        }
        if (!saveLocation) {
            setStatusMessage("⚠️ Hãy chọn thư mục lưu trước!");
            return;
        }

        setIsDownloading(true);
        setProgress(0);
        setStatusMessage("🚀 Đang khởi tạo...");

        let videoTitle = "Nhạc";
        const cookieToPass = enableCookies ? cookiesPath : "";
        const titlePromise = GetVideoInfo(url, cookieToPass)
            .then((jsonStr) => {
                try {
                    const info = JSON.parse(jsonStr);
                    return info.title || "Nhạc";
                } catch {
                    return "Nhạc";
                }
            })
            .catch(() => "Nhạc");

        try {
            await DownloadVideo(url, saveLocation, format, cookieToPass);
            const resolvedTitle = await titlePromise;
            const truncated = truncateTitle(resolvedTitle);

            setStatusMessage("🎉 Hoàn tất! Nhạc đã nằm trong máy anh.");
            setProgress(100);

            addToast("Tải thành công! 🎉", `"${truncated}" đã được lưu vào máy.`, "success", saveLocation);
            NotifyDownloadComplete("MusicYT - Hoàn tất tải", `"${truncated}" đã sẵn sàng tại: ` + saveLocation);
        } catch (err: any) {
            if (err.toString().includes("context canceled") || err.toString().includes("killed")) {
                setStatusMessage("❌ Đã hủy tải nhạc theo yêu cầu.");
                addToast("Đã hủy tải nhạc", "Quá trình tải đã dừng theo yêu cầu.", "info");
            } else {
                setStatusMessage(`❌ Lỗi: ${err}`);
                addToast("Lỗi tải nhạc", err.toString(), "error");
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
        <div className="min-h-screen bg-[#050505] text-slate-100 font-sans selection:bg-emerald-500/30 overflow-hidden relative">
            {/* Ultra Premium Background */}
            <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] bg-emerald-600/20 blur-[120px] rounded-full animate-pulse"></div>
            <div className="absolute bottom-[-10%] left-[-5%] w-[400px] h-[400px] bg-cyan-600/10 blur-[100px] rounded-full"></div>
            
            <div className="max-w-3xl mx-auto px-6 py-12 flex flex-col min-h-screen relative z-10">
                {/* Header */}
                <header className="mb-14 text-center">
                    <div className="inline-block p-1 px-3 mb-4 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-black tracking-widest uppercase">
                        Vibe Coding Edition
                    </div>
                    <h1 className="text-6xl font-black tracking-tighter mb-3">
                        <span className="text-white">Music</span>
                        <span className="text-transparent bg-clip-text bg-gradient-to-tr from-emerald-400 to-cyan-400">YT</span>
                    </h1>
                    <p className="text-slate-500 font-medium tracking-wide">Tải nhạc hoặc video nhanh chóng</p>
                </header>

                {/* Tabs */}
                <div className="flex justify-center mb-10">
                    <div className="flex gap-1.5 p-1.5 bg-white/[0.02] border border-white/[0.06] backdrop-blur-2xl rounded-2xl relative shadow-[0_4px_30px_rgba(0,0,0,0.3)]">
                        <button
                            onClick={() => {
                                if (!isDownloading) {
                                    setActiveTab('youtube');
                                    setStatusMessage('Sẵn sàng tải xuống');
                                }
                            }}
                            disabled={isDownloading}
                            className={`flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-300 ${
                                activeTab === 'youtube'
                                    ? 'bg-gradient-to-br from-emerald-500 to-cyan-500 text-black shadow-lg shadow-emerald-500/20 scale-[1.02]'
                                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                            }`}
                        >
                            <span>🎵</span> YouTube Music
                        </button>
                        <button
                            onClick={() => {
                                if (!isDownloading) {
                                    setActiveTab('universal');
                                    setStatusMessage('Sẵn sàng tải xuống');
                                }
                            }}
                            disabled={isDownloading}
                            className={`flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-300 ${
                                activeTab === 'universal'
                                    ? 'bg-gradient-to-br from-emerald-500 to-cyan-500 text-black shadow-lg shadow-emerald-500/20 scale-[1.02]'
                                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                            }`}
                        >
                            <span>🌐</span> Đa Nền Tảng
                        </button>
                    </div>
                </div>

                <main className="flex-1 max-w-xl mx-auto w-full space-y-8">
                    {/* Glass Card */}
                    <div className="backdrop-blur-2xl bg-white/[0.03] border border-white/[0.08] rounded-[2.5rem] p-10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] space-y-8 relative group overflow-hidden">
                        {/* Subtle internal glow */}
                        <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none"></div>

                        {activeTab === 'youtube' ? (
                            <>
                                {/* URL Input Group */}
                                <div className="space-y-3 relative">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">YouTube URL</label>
                                    <div className="relative">
                                        <input 
                                            className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/40 transition-all placeholder:text-slate-700 text-lg" 
                                            onChange={(e) => setUrl(e.target.value)} 
                                            onKeyDown={handleKeyDown}
                                            value={url}
                                            disabled={isDownloading}
                                            autoComplete="off" 
                                            placeholder="Dán link YouTube tại đây..."
                                            type="text"
                                        />
                                        {url && isValidYT(url) && !isDownloading && (
                                            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-400 animate-in fade-in zoom-in">
                                                ✨
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

                                {/* Format Selection Case */}
                                <div className="space-y-3">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Định dạng & Chất lượng</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {[
                                            { id: 'best', label: 'Tốt nhất', sub: 'Video + Audio' },
                                            { id: '1080p', label: '1080p', sub: 'Full HD' },
                                            { id: '720p', label: '720p', sub: 'HD' },
                                            { id: 'm4a', label: 'Chỉ Âm thanh', sub: 'm4a + cover' },
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
                                                <span className="text-[9px] text-slate-500 font-bold uppercase tracking-tighter">{opt.sub}</span>
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
                                                        onClick={handleSelectCookiesFile}
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
                                                💡 <span className="font-bold text-slate-400">Cách lấy:</span> Cài extension <span className="text-cyan-400 font-bold">"Get cookies.txt LOCALLY"</span> trên Chrome/Firefox/Edge, đăng nhập YouTube, xuất file <span className="font-mono">cookies.txt</span> rồi chọn file đó tại đây.
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {/* Progress or Button */}
                                <div className="pt-2">
                                    {isDownloading ? (
                                        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                                            <div className="flex justify-between items-end">
                                                <span className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em] animate-pulse">Đang nén dữ liệu...</span>
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
                                                🚫 Hủy tải nhạc
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
                            </>
                        ) : (
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
                                                isSelectingPath={isSelectingPath}
                                                addToast={addToast}
                            />
                        )}
                    </div>

                    {/* Footer Feedback */}
                    <div className="text-center px-4">
                        <p className={`text-[11px] font-bold tracking-widest uppercase transition-all duration-500 ${
                            statusMessage.startsWith('❌') || statusMessage.startsWith('⚠️') ? 'text-rose-500' : 
                            isDownloading ? 'text-emerald-400/70' : 'text-slate-600'
                        }`}>
                            {statusMessage}
                        </p>
                    </div>
                </main>

                <footer className="mt-auto pt-12 text-center space-y-4">
                    <div className="flex justify-center gap-6 opacity-30 grayscale hover:opacity-80 transition-opacity duration-500">
                        <span className="text-[10px] font-black tracking-tighter text-white">HI-RES AUDIO</span>
                        <span className="text-[10px] font-black tracking-tighter text-white">YT-DLP ENGINE</span>
                        <span className="text-[10px] font-black tracking-tighter text-white">FFMPEG CORE</span>
                    </div>
                    <p className="text-[10px] font-medium text-slate-700 tracking-widest uppercase">
                        © 2026 Nguyễn Duy Trường • All Rights Reserved
                    </p>
                </footer>
            </div>

            <style>{`
                @keyframes gradient {
                    0% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                    100% { background-position: 0% 50%; }
                }
                .animate-gradient {
                    animation: gradient 3s ease infinite;
                }
            `}</style>
            <GlassToastContainer />
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
        </div>
    )
}

export default App


