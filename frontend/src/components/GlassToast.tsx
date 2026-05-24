import React, { useState, useEffect } from 'react';
import { OpenOutputFolder } from '../../wailsjs/go/main/App';

// Base64-encoded short, elegant chime audio file (0.4s A5 chime with exponential decay)
const CHIME_BASE64 = 'UklGRqQMAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YYAMAAB/0PzurlgUASh3yfnxtWAZASNvwvb0u2gfAh9ou/P2wm8kAxtgtO/3yHcqBRdZrOv4zX8xBxRSpeb404c3CRFLneH4144+DA9Fltz43JZFDw0/jtb24J1MEws5htD146RTFws0f8rz5qpbHAoveMTx6bFiIAoqcL3u67dpJQsmabfr7b1xKwwiYrDn7sJ4MQ0eXKnj78h/Ng8bVaLf782GPRIZT5va79GNQxQXSZTV79WUSRcVQ43Q7tmbUBsUPobL7NyhVh8TOX/F69+nXSMTNHi/6OGtZCcTMHG55uOzaywTLGuz4+W4cjEUKWSs4Oa+eDYWJV6m3OfCfzwXI1ig2OfHhkEZIFKZ1OfLjEccHk2Sz+fPkk0fHUiMyubSmVMiHEOFxeXVn1kmGz5/wOPYpGApGzp5uuHaqmYuGzZytd7cr2wyGzJsr9zetHM3HC9mqdnfuXk7HSxho9Xfvn9BHylbndHgwoVGISdWl83gxotLIyVRkcnfyZFRJiRMi8XezJdWKSNHhcDdz5xcLCJDf7vc0qJiMCI/ebba1KdoMyI7c7HX1axuOCI4bqzV17BzPCM1aKbS2LV5QCQyY6HP2bl/RSYvXpvL2b2FSigtWZXI2cCKTyosVJDE2MSQVCwqT4rA2MeVWS8pS4W71smaXzIpR3+31cyfZDUpQ3qy086kaTkpQHSt0c+pbz0pPW+oz9CtdEEqOmqjzNGxekUrN2WeydK1f0ksNWCZxtK4hE4uM1uUw9K8iVIwMlePv9K/jlcyMVOJu9HCk1w1ME+Et9DEmGE4L0t/s8/GnWY7L0h6rs3IoWs+L0R1qsvJpnBBL0JwpcnLqnVFMD9rocbLrXpJMT1nnMTMsX9NMjtil8HMtIRRNDlekr7Mt4lWNjdajbrMuo1aODZWibfLvZJfOjVShLPKv5ZjPTVPf6/JwZtoQDVMeqvHw59sQzVJdqfGxKNxRjVGcaPExaZ2STZEbZ7Bxqp6TTdBaJq/xq1/UTg/ZJW8x7CEVTk+YJG5x7OIWTs9XYy2xraMXT07WYizxriRYT87VoOvxbqVZUI6Un+sxLyZaUQ6T3uowr6dbkc6TXakwb+gcko6SnKgv8Ckdk07SG6cvcGne1E8RmqYusGqf1Q9RGaUuMKtg1g+Q2OQtcGwh1tAQV+LssGyi19CQFyHr8G0j2NEQFmDrMC2k2dGP1Z/qL+4l2tIP1N7pb25mm9LP1B3oby6nnNOP05znrq7oXdRQExvmri8pHtUQUpslra9p39XQkhokrS9qoNbQ0dljrG9rIdeREZhi668ropiRkVeh6u8sI5lSERbg6i7spJpSkRZf6W6tJVsTERWe6K5tZhwT0RUeJ+3tpx0UURRdJu2t594VERQcJi0uKF7V0VObZSyuKR/WkZMapGwuKaDXUdLZ42tuKmGYElKZIqruKuKZEpJYYaot62NZ0xIXoOlt66Qak5IW3+jtrCUblBIWXygtbGXcVJIV3ids7KZdVVIVXWZsrOceFdJU3GWsLSffFpJUW6TrrShf11KUGuQrLSkgmBLT2iMqrSmhmNNTmWJqLSoiWZOTWOGpbOpjGlQTGCCo7Orj2xRTF5/oLKskm9TTFx8nbGtlXJWTFp5mrCumHVYTFh1l66vmnlaTVZylK2wnXxdTVVwkauwn39fTlNtjqmwoYJiT1Jqi6ewo4VlUFFniKWwpYhnUlFlhaOwpotqU1BjgqCvqI5tVVBgf56uqZFwV1BefJutqpNzWVBceZisq5Z2W1BbdparrJh5XVBZc5OprJp8X1FYcZCorZ1/YVJWbo2mrZ+CZFNVa4qkraCFZ1RVaYiirKKIaVVUZ4WgrKSKbFZTZYKeq6WNb1hTY3+bq6aPcVlTYXyZqqeSdFtTX3mXqaiUd11TXXeUqKiWel9UXHSRpqmYfGFUW3KPpamaf2RVWW+Mo6mcgmZWWG2KoamehGhXWGuHoKmfh2tYV2mEnqmhiW1ZV2aCnKiijHBbVmV/maijjnJcVmN8l6ekkHVeVmF6laalk3dgVmB3k6WllXpiV151kKOml3xkV11zjqKmmH9mWFxwi6GmmoFoWVtuiZ+mnIRqWltshp2mnYZsW1pqhJumnolyXFlogZmloItxXVlnf5eloY1zX1llfZWkoY92YFljepOjopF4YllieJGio5N6ZFphdo+ho5V9ZlpgdI2fo5d/Z1tfcYqepJiBaVteb4ido5qEa1xdbYabo5uGbl1dbISZo5yIcF5caoGYo52KcmBcaH+Wop6MdGFcZ32UoZ+OdmJcZXuSoKCQeGRcZHiQn6CSe2ZcY3aOnqGTfWddYnSMnaGVf2ldYXKKnKGWgWteYHGHmqGYg21fYG+FmaGZhW9gX22Dl6Cah3FhX2uBlqCbiXNiXmp/lJ+ci3VjXml9kp+djXdlXmd7kJ6dj3lmX2Z5j52ekHtnX2V3jZyekn1pX2R1i5uek39rYGNziZqelYFsYGJyh5ieloNuYWJwhZeel4VwYmFug5aemIdyY2FtgZSemYl0ZGFrf5Odmop2ZWFqfZGcmox3ZmFpe4+cm455aGFoeY2bnI97aWFneIyanJB9a2JmdoqZnJJ/bGJldIiYnJOBbmNlc4aXnJSDb2NkcYSVnJWEcWRkcIOUnJaGc2VjboGTm5eIdGZjbX+Rm5iJdmdjbH2QmpmLeGhja3uOmpmMemljanqMmZmOfGtjaXiLmJqPfWxkaHeJl5qQf25kZ3WHlpqSgW9lZnOGlZqTgnFlZnKElJqUhHJmZnGCkpqVhnRnZW+BkZmVh3VoZW5/kJmWiXdpZW19jpiXinlqZWx8jZiXjHprZWt6i5eYjXxsZWp5ipaYjn1tZml3iJWYj39vZml2h5SYkIFwZ2h0hZOYkYJyZ2hzhJKYkoRzaGdygpGYk4V0aWdwgZCXlId2aWdvf4+XlIh3amdufY2XlYl5a2dtfIyWlYt6bGdse4uVlox8bmdseYmVlo1+b2dreIiUlo5/cGhqdoaTlo+AcWhqdYWSlpCCc2lpdIORlpGDdGppc4KQlpKFdWppcoCPlpKGd2tpcX+NlZOHeGxpcH6MlZOJeW1pb3yLlJSKe25pbnuKlJSLfG9pbXqIk5SMfnBpbHiHkpWNf3FqbHeGkZWOgHJqa3aEkZWPgnNqa3WDkJSQg3Vra3SCj5SQhHZsanOAjpSRhndsanJ/jJSRh3ltanF+i5OSiHpuanB8ipOSiXtvam97iZKTinxwam56iJKTi35xa255hpGTjH9ya214hZCTjYBza212hI+TjoJ0bGx1g46TjoN1bWx0gY2Tj4R3bWxzgIyTkIV4bmxzf4uSkIZ5b2xyfoqSkYd6b2xxfYmRkYh7cGxwe4iRkYl9cWxweoeQkYp+cmxveYaQkot/c21veIWPkoyAdG1ud4SOko2BdW1udoKNkY2Cdm5tdYGMkY6Ed25tdICLkY6FeG9tc3+LkY+GeXBtc36KkI+He3Btcn2JkJCIfHFtcXyIkJCIfXJtcXuHj5CJfnNucHqFjpCKf3RucHmEjpCLgHVub3iDjZCMgXZvb3eCjJCMgndvb3aBi5CNg3hwb3WAi5CNhHlwbnR/ipCOhXpxbnR+iY+OhntybnN9iI+Oh3xybnJ8h46PiH1zb3J7ho6PiX50b3F6hY2PiX91b3F5hI2PioB2b3B4g4yPi4F2cHB3gouPi4J3cHB3gYuPjIN4cXB2gIqPjIR5cXB1f4mOjYV6cnB0foiOjYZ7c3B0fYeOjYZ8c3BzfIaNjod9dHBze4WNjoh+dXByeoWMjol/dXByeYSMjomAdnFyeYOLjoqBd3FxeIKKjoqCeHFxd4GKjouDeXJxdoCJjYuDenJxdn+IjYyEe3NxdX6HjYyFe3NxdX2HjYyGfHRxdHyGjIyHfXVxdHuFjI2HfnVxc3uEi42If3Zxc3qDi42IgHdycnmCio2JgXhycniCio2KgnhycniBiY2KgnlzcneAiIyKg3pzcnZ/iIyLhHt0cnZ+h4yLhXx0cnV9hoyLhX11cnV9hYuLhn11cnR8hYuMh352cnR7hIqMh393cnR6g4qMiIB3c3N6gomMiIF4c3N5gYmMiYF5c3N4gYiMiYJ6dHN4gIiLioN6dHN3f4eLioR7dXN3foaLioR8dXN2fYaLioV9dnN2fYWKi4Z9dnN1fISKi4Z+d3N1e4OKi4d/d3N1e4OJi4eAeHN0eoKJi4iAeXR0eYGIi4iBeXR0eYCIi4iCenR0eICHi4mDe3V0eA==';

// Play the notification audio chime safely with a gentle volume (30%)
export function playNotificationSound() {
    try {
        const audio = new Audio(`data:audio/wav;base64,${CHIME_BASE64}`);
        audio.volume = 0.3;
        audio.play().catch(err => {
            console.warn('Audio play prevented or failed:', err);
        });
    } catch (err) {
        console.error('Failed to play notification audio chime:', err);
    }
}

export type ToastType = 'success' | 'error' | 'info';

export interface Toast {
    id: string;
    title: string;
    message: string;
    type: ToastType;
    folderPath?: string;
}

// Custom event name for triggering a toast notification globally
const SHOW_TOAST_EVENT = 'music-yt-show-glass-toast';

// Global toast trigger utility helper
export const toast = {
    show: (title: string, message: string, type: ToastType = 'info', folderPath?: string) => {
        const event = new CustomEvent(SHOW_TOAST_EVENT, {
            detail: { title, message, type, folderPath }
        });
        window.dispatchEvent(event);
    },
    success: (title: string, message: string, folderPath?: string) => {
        toast.show(title, message, 'success', folderPath);
    },
    error: (title: string, message: string) => {
        toast.show(title, message, 'error');
    },
    info: (title: string, message: string, folderPath?: string) => {
        toast.show(title, message, 'info', folderPath);
    }
};

interface GlassToastItemProps {
    toast: Toast;
    onClose: () => void;
}

export const GlassToastItem: React.FC<GlassToastItemProps> = ({ toast, onClose }) => {
    const [isExiting, setIsExiting] = useState(false);

    useEffect(() => {
        // Play notification chime on mount
        playNotificationSound();

        // Auto close after 6 seconds (6000ms)
        const timer = setTimeout(() => {
            handleClose();
        }, 6000);

        return () => clearTimeout(timer);
    }, []);

    const handleClose = () => {
        setIsExiting(true);
        // Wait for slide-out animation to complete (300ms) before triggering onClose
        setTimeout(() => {
            onClose();
        }, 300);
    };

    const handleOpenFolder = async () => {
        if (!toast.folderPath) return;
        try {
            await OpenOutputFolder(toast.folderPath);
        } catch (err) {
            console.error('Error calling OpenOutputFolder:', err);
        }
    };

    // Styling configuration based on toast type
    const styles = {
        success: {
            border: 'border-emerald-500/20',
            shadow: 'shadow-[0_10px_40px_rgba(16,185,129,0.12)]',
            icon: '✨',
            iconBg: 'bg-emerald-500/10 text-emerald-400',
            progressBar: 'bg-gradient-to-r from-emerald-500 to-teal-400',
            accent: 'text-emerald-400'
        },
        error: {
            border: 'border-rose-500/20',
            shadow: 'shadow-[0_10px_40px_rgba(244,63,94,0.12)]',
            icon: '❌',
            iconBg: 'bg-rose-500/10 text-rose-400',
            progressBar: 'bg-gradient-to-r from-rose-500 to-red-400',
            accent: 'text-rose-400'
        },
        info: {
            border: 'border-cyan-500/20',
            shadow: 'shadow-[0_10px_40px_rgba(6,182,212,0.12)]',
            icon: '🔔',
            iconBg: 'bg-cyan-500/10 text-cyan-400',
            progressBar: 'bg-gradient-to-r from-cyan-500 to-blue-400',
            accent: 'text-cyan-400'
        }
    };

    const config = styles[toast.type] || styles.info;

    return (
        <div 
            className={`pointer-events-auto w-full backdrop-blur-md bg-black/70 border ${config.border} ${config.shadow} rounded-2xl overflow-hidden relative transition-all duration-300 ${isExiting ? 'animate-slide-out' : 'animate-slide-in'}`}
            style={{ contentVisibility: 'auto' }}
        >
            <div className="p-4 flex gap-3.5 items-start">
                {/* Visual Status Indicator Icon */}
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 shadow-inner ${config.iconBg}`}>
                    {config.icon}
                </div>

                {/* Text Content */}
                <div className="flex-1 min-w-0 pr-2">
                    <h4 className="text-sm font-black tracking-tight text-white mb-0.5 truncate">
                        {toast.title}
                    </h4>
                    <p className="text-xs text-slate-400 leading-relaxed font-medium line-clamp-2">
                        {toast.message}
                    </p>

                    {/* Open folder quick action button */}
                    {toast.type === 'success' && toast.folderPath && (
                        <button
                            onClick={handleOpenFolder}
                            className="mt-3 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/5 hover:border-white/10 text-[10px] font-black uppercase tracking-wider text-slate-300 hover:text-white transition-all cursor-pointer"
                        >
                            <span>📂</span> Mở thư mục
                        </button>
                    )}
                </div>

                {/* Dismiss X button */}
                <button
                    onClick={handleClose}
                    className="w-5 h-5 rounded-full flex items-center justify-center text-slate-500 hover:text-white hover:bg-white/5 transition-all text-xs shrink-0 cursor-pointer"
                >
                    ✕
                </button>
            </div>

            {/* Bottom visual progress countdown bar */}
            <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-white/[0.05]">
                <div className={`h-full animate-progress-shrink ${config.progressBar}`} />
            </div>
        </div>
    );
};

export const GlassToastContainer: React.FC = () => {
    const [toasts, setToasts] = useState<Toast[]>([]);

    useEffect(() => {
        const handleShowToast = (event: Event) => {
            const customEvent = event as CustomEvent<Omit<Toast, 'id'>>;
            const { title, message, type, folderPath } = customEvent.detail;
            const newToast: Toast = {
                id: Math.random().toString(36).substring(2, 9),
                title,
                message,
                type,
                folderPath
            };
            setToasts((prev) => [...prev, newToast]);
        };

        window.addEventListener(SHOW_TOAST_EVENT, handleShowToast);
        return () => {
            window.removeEventListener(SHOW_TOAST_EVENT, handleShowToast);
        };
    }, []);

    const removeToast = (id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    };

    return (
        <div className="fixed top-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none w-full max-w-[340px]">
            {toasts.map((t) => (
                <GlassToastItem key={t.id} toast={t} onClose={() => removeToast(t.id)} />
            ))}
        </div>
    );
};
