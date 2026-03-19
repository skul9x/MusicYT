/// <reference path="../wailsjs/runtime/runtime.d.ts" />
import { useState, useEffect } from 'react';
import { CheckDependencies, SelectSavePath, DownloadVideo, GetDefaultSavePath } from '../wailsjs/go/main/App';
import { EventsOn } from '../wailsjs/runtime/runtime';

function App() {
    const [url, setUrl] = useState('');
    const [saveLocation, setSaveLocation] = useState('');
    const [progress, setProgress] = useState(0);
    const [isDownloading, setIsDownloading] = useState(false);
    const [statusMessage, setStatusMessage] = useState('Sẵn sàng tải xuống');
    const [depStatus, setDepStatus] = useState({ ok: true, msg: '' });
    const [format, setFormat] = useState('best');
    const [showGuide, setShowGuide] = useState(false);
    const [osTab, setOsTab] = useState('win');

    useEffect(() => {
        // 1. Check dependencies
        CheckDependencies().then((res: any) => {
            setDepStatus({ ok: res.ok, msg: res.message });
            if (!res.ok) {
                setStatusMessage(`Lỗi hệ thống: ${res.message}`);
                setShowGuide(true); // Tự động hiện hướng dẫn nếu lỗi
            }
        });

        // 2. Get default save path
        GetDefaultSavePath().then((path) => {
            setSaveLocation(path);
        });

        // 3. Listen to progress
        const unoff = EventsOn("download-progress", (data: string) => {
            const num = parseFloat(data);
            if (!isNaN(num)) setProgress(num);
        });

        return () => unoff();
    }, []);

    const isValidYT = (url: string) => {
        const regex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/(watch\?v=|embed\/|v\/|shorts\/)?([a-zA-Z0-9_-]{11})/;
        return regex.test(url.trim());
    };

    const handleSelectPath = async () => {
        try {
            const path = await SelectSavePath();
            if (path) setSaveLocation(path);
        } catch (err) {
            console.error(err);
        }
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

        try {
            await DownloadVideo(url, saveLocation, format);
            setStatusMessage("🎉 Hoàn tất! Nhạc đã nằm trong máy anh.");
            setProgress(100);
        } catch (err: any) {
            setStatusMessage(`❌ Lỗi: ${err}`);
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
                    <p className="text-slate-500 font-medium tracking-wide">Tải nhạc chất lượng cao m4a nhanh chóng</p>
                </header>

                <main className="flex-1 max-w-xl mx-auto w-full space-y-8">
                    {/* Glass Card */}
                    <div className="backdrop-blur-2xl bg-white/[0.03] border border-white/[0.08] rounded-[2.5rem] p-10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] space-y-8 relative group overflow-hidden">
                        {/* Subtle internal glow */}
                        <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none"></div>

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
                                    placeholder="Dán link tại đây..."
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
                                <button 
                                    onClick={handleSelectPath}
                                    disabled={isDownloading}
                                    className="text-[11px] font-black text-emerald-400 hover:text-emerald-300 transition-colors uppercase tracking-widest border-b border-emerald-500/30 border-dashed"
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

                        {/* Guide Section */}
                        {showGuide && (
                            <div className="pt-4 space-y-4 animate-in fade-in slide-in-from-top-4 duration-500 bg-white/[0.02] -mx-10 px-10 border-y border-white/[0.05] py-8">
                                <h3 className="text-sm font-black text-emerald-400 uppercase tracking-widest flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span>
                                    Hướng dẫn Cài đặt
                                </h3>
                                
                                {/* OS Tabs */}
                                <div className="flex gap-1 p-1 bg-black/40 rounded-lg border border-white/5 w-fit">
                                    <button 
                                        onClick={() => setOsTab('win')}
                                        className={`px-3 py-1 text-[9px] font-black uppercase tracking-widest rounded-md transition-all ${osTab === 'win' ? 'bg-emerald-500 text-black' : 'text-slate-500 hover:text-slate-300'}`}
                                    >
                                        Windows
                                    </button>
                                    <button 
                                        onClick={() => setOsTab('linux')}
                                        className={`px-3 py-1 text-[9px] font-black uppercase tracking-widest rounded-md transition-all ${osTab === 'linux' ? 'bg-orange-500 text-black' : 'text-slate-500 hover:text-slate-300'}`}
                                    >
                                        Linux
                                    </button>
                                </div>

                                <div className="space-y-5">
                                    {osTab === 'win' ? (
                                        <>
                                            <div className="space-y-2">
                                                <p className="text-[11px] font-black text-slate-300 uppercase tracking-tighter">B1: Tải yt-dlp & ffmpeg</p>
                                                <div className="flex gap-2 text-[10px] font-bold">
                                                    <a href="https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe" target="_blank" className="bg-white/5 border border-white/10 px-3 py-1.5 rounded-lg hover:bg-emerald-500/20 hover:border-emerald-500/30 transition-all text-slate-300">yt-dlp.exe</a>
                                                    <a href="https://www.gyan.dev/ffmpeg/builds/ffmpeg-release-essentials.zip" target="_blank" className="bg-white/5 border border-white/10 px-3 py-1.5 rounded-lg hover:bg-emerald-500/20 hover:border-emerald-500/30 transition-all text-slate-300">ffmpeg.zip</a>
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <p className="text-[11px] font-black text-slate-300 uppercase tracking-tighter">B2: Copy & Set PATH</p>
                                                <p className="text-[10px] text-slate-500 leading-relaxed font-medium">
                                                    Copy vào <code className="bg-white/5 px-1 rounded text-emerald-400 underline decoration-dotted">C:\tools\</code>, sau đó thêm vào 
                                                    <span className="text-slate-300 ml-1 italic font-bold">Environment Variables (PATH)</span>.
                                                </p>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <div className="space-y-2">
                                                <p className="text-[11px] font-black text-slate-300 uppercase tracking-tighter">B1: Cài đặt yt-dlp</p>
                                                <code className="block bg-black/60 border border-white/5 p-3 rounded-lg text-[10px] text-orange-400 font-mono break-all leading-relaxed">
                                                    sudo curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp && sudo chmod a+rx /usr/local/bin/yt-dlp
                                                </code>
                                            </div>
                                            <div className="space-y-2">
                                                <p className="text-[11px] font-black text-slate-300 uppercase tracking-tighter">B2: Cài đặt ffmpeg</p>
                                                <code className="block bg-black/60 border border-white/5 p-3 rounded-lg text-[10px] text-orange-400 font-mono break-all">
                                                    sudo apt update && sudo apt install ffmpeg
                                                </code>
                                            </div>
                                        </>
                                    )}
                                    <div className={`${osTab === 'win' ? 'bg-emerald-500/5 border-emerald-500/10' : 'bg-orange-500/5 border-orange-500/10'} p-3 rounded-xl border`}>
                                        <p className={`text-[10px] ${osTab === 'win' ? 'text-emerald-400/80' : 'text-orange-400/80'} leading-relaxed italic font-medium`}>
                                            💡 "Xong bước này, app của Anh sẽ bốc lửa ngay!"
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

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
                                </div>
                            ) : (
                                <button 
                                    className="w-full bg-gradient-to-br from-emerald-500 to-cyan-500 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-30 disabled:grayscale text-black font-black py-4 rounded-2xl shadow-[0_10px_30px_rgba(16,185,129,0.3)] flex items-center justify-center gap-3 transition-all duration-300 text-sm tracking-widest uppercase" 
                                    onClick={handleDownload}
                                    disabled={!url || !saveLocation || !depStatus.ok}
                                >
                                    Bắt đầu tải
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                                </button>
                            )}
                        </div>
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
        </div>
    )
}

export default App


