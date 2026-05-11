import React, { useEffect } from 'react';
import { CheckCircle, XCircle, X, AlertTriangle, Info } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastProps {
    message: string;
    type: ToastType;
    onClose: () => void;
}

const CONFIG: Record<ToastType, {
    bg: string; border: string; text: string; icon: string; Icon: React.FC<{ size: number }>;
}> = {
    success: {
        bg: 'bg-green-50', border: 'border-green-500', text: 'text-green-800',
        icon: 'text-green-500', Icon: ({ size }) => <CheckCircle size={size} />,
    },
    error: {
        bg: 'bg-red-50', border: 'border-red-500', text: 'text-red-800',
        icon: 'text-red-500', Icon: ({ size }) => <XCircle size={size} />,
    },
    warning: {
        bg: 'bg-yellow-50', border: 'border-yellow-500', text: 'text-yellow-800',
        icon: 'text-yellow-500', Icon: ({ size }) => <AlertTriangle size={size} />,
    },
    info: {
        bg: 'bg-blue-50', border: 'border-blue-500', text: 'text-blue-800',
        icon: 'text-blue-500', Icon: ({ size }) => <Info size={size} />,
    },
};

/**
 * Toast notification — Muncul dan akan hilang otomatis setelah 5 detik.
 * User juga bisa menekan ✕ untuk menutup secara manual.
 */
const Toast: React.FC<ToastProps> = ({ message, type, onClose }) => {
    const c = CONFIG[type] ?? CONFIG.error;
    const { Icon } = c;

    // Tambahkan useEffect untuk auto-close setelah 5 detik (5000ms)
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, 5000);

        // Cleanup function untuk menghapus timer jika komponen di-unmount
        // (misal user klik silang manual sebelum 5 detik)
        return () => clearTimeout(timer);
    }, [onClose]);

    return (
        <div className="fixed top-4 right-4 z-50 animate-slide-in-right">
            <div className={`${c.bg} ${c.border} border-l-4 rounded-lg shadow-xl p-4 flex items-start gap-3 min-w-[320px] max-w-sm`}>
                <div className={`${c.icon} mt-0.5 flex-shrink-0`}>
                    <Icon size={22} />
                </div>
                <p className={`${c.text} flex-1 font-medium text-sm leading-relaxed`}>{message}</p>
                <button
                    onClick={onClose}
                    className={`${c.text} hover:opacity-60 transition-opacity flex-shrink-0 mt-0.5`}
                    aria-label="Tutup notifikasi"
                    title="Tutup"
                >
                    <X size={18} />
                </button>
            </div>
        </div>
    );
};

export default Toast;