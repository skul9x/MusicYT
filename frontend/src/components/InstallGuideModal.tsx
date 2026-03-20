import { useState, useEffect } from 'react';
import { SetupWindowsDependencies, SetupLinuxDependencies, UpdateYtdlp } from '../../wailsjs/go/main/App';
import { EventsOn } from '../../wailsjs/runtime/runtime';

interface Props {
    detectedOs: string;
    isFullyInstalled: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export default function InstallGuideModal({ detectedOs, isFullyInstalled, onClose, onSuccess }: Props) {
    const [isInstalling, setIsInstalling] = useState(false);
    const [installStatus, setInstallStatus] = useState('');
    const [progress, setProgress] = useState(0);
    const [osTab, setOsTab] = useState(detectedOs === 'linux' ? 'linux' : 'win');

    useEffect(() => {
        const unoffProg = EventsOn("install-progress", (data: string) => {
            const num = parseFloat(data);
            if (!isNaN(num)) setProgress(num);
        });
        const unoffStatus = EventsOn("install-status", (data: string) => {
            setInstallStatus(data);
        });

        return () => {
            unoffProg();
            unoffStatus();
        }
    }, []);

    const handleAutoInstall = async () => {
        setIsInstalling(true);
        setProgress(0);
        setInstallStatus('Khởi động quá trình cài đặt...');

        try {
            if (osTab === 'win') {
                await SetupWindowsDependencies();
            } else {
                await SetupLinuxDependencies();
            }
            setInstallStatus('✅ Cài đặt thành công! Hệ thống đã sẵn sàng.');
            setTimeout(() => {
                onSuccess();
            }, 2000);
        } catch (err: any) {
            setInstallStatus(`❌ Lỗi: ${err}`);
            setIsInstalling(false);
        }
    };

    return (
        <div className="pt-4 space-y-4 animate-in fade-in slide-in-from-top-4 duration-500 bg-white/[0.02] -mx-10 px-10 border-y border-white/[0.05] py-8">
            <div className="flex justify-between items-center">
                <h3 className="text-sm font-black text-emerald-400 uppercase tracking-widest flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span>
                    {isFullyInstalled ? "Quản Lý Công Cụ" : "Cài Đặt Công Cụ Thiếu"}
                </h3>
                <button 
                    onClick={onClose} 
                    className="text-slate-500 hover:text-white transition-colors bg-white/5 rounded-full w-6 h-6 flex items-center justify-center font-bold text-xs border border-white/10 hover:bg-rose-500/20 hover:border-rose-500/40 hover:text-rose-400"
                >
                    ✕
                </button>
            </div>
            
            {isFullyInstalled ? (
                <div className="space-y-4">
                    <div className="space-y-1">
                        <p className="text-[11px] font-black text-slate-300 uppercase tracking-tighter">✅ CÔNG CỤ HOẠT ĐỘNG TỐT</p>
                        <p className="text-[10px] text-slate-500 font-medium">Anh đã có đủ đồ chơi để tải nhạc thả ga.</p>
                    </div>
                    <div className="space-y-3 border-t border-white/5 pt-5 mt-2">
                        <p className="text-[11px] font-black text-rose-400 uppercase tracking-tighter flex gap-2">
                            <span>⚠️</span> Lỗi Tải Video Đột Ngột?
                        </p>
                        <p className="text-[10px] text-slate-500 font-medium">Bấm Update bên dưới để app kéo bản <code className="text-white text-[9px] bg-white/10 px-1 rounded">yt-dlp</code> mới nhất về vá lỗi (Youtube đổi thuật toán).</p>
                        
                        <div className="bg-rose-500/5 border border-rose-500/10 p-3 rounded-xl mt-2">
                            <p className="text-[10px] text-rose-400/80 leading-relaxed italic font-medium">
                                💡 {installStatus || "Update có thể cần cấp lại quyền hệ thống (sudo) trên Ubuntu."}
                            </p>
                        </div>

                        <button 
                            onClick={async () => {
                                setIsInstalling(true);
                                setInstallStatus('⏳ Khởi động cập nhật...');
                                try {
                                    await UpdateYtdlp();
                                    setTimeout(() => onSuccess(), 2000);
                                } catch (err) {
                                    setInstallStatus(`❌ ${err}`);
                                } finally {
                                    setIsInstalling(false);
                                }
                            }}
                            disabled={isInstalling || installStatus.includes('✅')}
                            className={`w-full py-3 mt-4 rounded-xl font-black text-[11px] uppercase tracking-widest transition-all ${isInstalling || installStatus.includes('✅') ? 'bg-white/5 text-slate-500 cursor-not-allowed shadow-none' : 'bg-gradient-to-r from-rose-600/20 to-rose-400/20 text-rose-400 hover:from-rose-500/30 hover:to-rose-400/30 border border-rose-500/30 hover:shadow-[0_0_15px_rgba(244,63,94,0.3)]'}`}
                        >
                            {isInstalling ? 'Đang cập nhật...' : '🔄 Fix Lỗi Tải Video'}
                        </button>
                    </div>
                </div>
            ) : (
                <>
                    <div className="flex gap-1 p-1 bg-black/40 rounded-lg border border-white/5 w-fit">
                <button 
                    onClick={() => setOsTab('win')}
                    disabled={isInstalling}
                    className={`px-3 py-1 text-[9px] font-black uppercase tracking-widest rounded-md transition-all ${osTab === 'win' ? 'bg-emerald-500 text-black' : 'text-slate-500 hover:text-slate-300'}`}
                >
                    Windows
                </button>
                <button 
                    onClick={() => setOsTab('linux')}
                    disabled={isInstalling}
                    className={`px-3 py-1 text-[9px] font-black uppercase tracking-widest rounded-md transition-all ${osTab === 'linux' ? 'bg-orange-500 text-black' : 'text-slate-500 hover:text-slate-300'}`}
                >
                    Linux
                </button>
            </div>

            <div className="space-y-5">
                {osTab === 'win' ? (
                    <div className="space-y-4">
                        <div className="space-y-1">
                            <p className="text-[11px] font-black text-slate-300 uppercase tracking-tighter">B1: 🌐 Tải yt-dlp & ffmpeg</p>
                            <p className="text-[10px] text-slate-500 font-medium">Click "Tự Cài Đặt" để app tự động kéo về <code className="bg-white/5 px-1 rounded text-emerald-400">C:\tools\</code>.</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[11px] font-black text-slate-300 uppercase tracking-tighter">B2: 🔧 Cập nhật System PATH</p>
                            <p className="text-[10px] text-slate-500 font-medium">Tự động cấu hình `Environment Variables`, để app chạy mượt mà ngay tắp lự.</p>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="space-y-1">
                            <p className="text-[11px] font-black text-slate-300 uppercase tracking-tighter">Bảo mật trên Linux (pkexec)</p>
                            <p className="text-[10px] text-slate-500 font-medium">Hệ thống sẽ gọi bảng mã hóa an toàn yêu cầu nhập <code className="text-orange-400 bg-white/5 px-1 rounded">Sudo Password</code>.</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[11px] font-black text-slate-300 uppercase tracking-tighter">Lệnh chạy ngầm:</p>
                            <code className="block bg-black/60 border border-white/5 p-3 rounded-lg text-[10px] text-orange-400 font-mono break-all leading-relaxed">
                                sudo curl ... yt-dlp && sudo apt install ffmpeg
                            </code>
                        </div>
                    </div>
                )}

                <div className={`${osTab === 'win' ? 'bg-emerald-500/5 border-emerald-500/10' : 'bg-orange-500/5 border-orange-500/10'} p-3 rounded-xl border`}>
                    <p className={`text-[10px] ${osTab === 'win' ? 'text-emerald-400/80' : 'text-orange-400/80'} leading-relaxed italic font-medium`}>
                        💡 {installStatus || "Sẵn sàng! Hãy bấm nút bên dưới đẻ bắt đầu."}
                    </p>
                </div>

                {/* Progress bar */}
                {isInstalling && osTab === 'win' && progress > 0 && progress < 100 && (
                    <div className="h-1 bg-white/5 rounded-full overflow-hidden w-full">
                        <div 
                            className="h-full bg-emerald-500 transition-all duration-300" 
                            style={{ width: `${progress}%` }}
                        ></div>
                    </div>
                )}

                    {/* Action button */}
                    <button 
                        onClick={handleAutoInstall}
                        disabled={isInstalling || installStatus.includes('✅')}
                        className={`w-full py-4 rounded-xl font-black text-[11px] uppercase tracking-widest transition-all ${
                            isInstalling || installStatus.includes('✅') 
                                ? 'bg-white/5 text-slate-500 cursor-not-allowed shadow-none' 
                                : (osTab === 'win' 
                                    ? 'bg-gradient-to-r from-emerald-600/20 to-emerald-400/20 text-emerald-400 hover:from-emerald-500/30 hover:to-emerald-400/30 border border-emerald-500/30 hover:shadow-[0_0_20px_rgba(16,185,129,0.3)]' 
                                    : 'bg-gradient-to-r from-orange-600/20 to-orange-400/20 text-orange-400 hover:from-orange-500/30 hover:to-orange-400/30 border border-orange-500/30 hover:shadow-[0_0_20px_rgba(249,115,22,0.3)]')
                        }`}
                    >
                        {isInstalling ? 'Đang Thiết Lập...' : '🚀 Bắt Đầu Tự Khởi Tạo'}
                    </button>
                </div>
            </>
            )}
        </div>
    );
}
