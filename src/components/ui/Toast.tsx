import React, { useEffect } from 'react';
import { CheckCircle, XCircle, X } from 'lucide-react';

export type ToastType = 'success' | 'error';

interface ToastProps {
    message: string;
    type: ToastType;
    onClose: () => void;
    duration?: number;
}

const Toast: React.FC<ToastProps> = ({ message, type, onClose, duration = 3000 }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, duration);

        return () => clearTimeout(timer);
    }, [duration, onClose]);

    const bgColor = type === 'success' ? 'bg-green-50' : 'bg-red-50';
    const borderColor = type === 'success' ? 'border-green-500' : 'border-red-500';
    const textColor = type === 'success' ? 'text-green-800' : 'text-red-800';
    const iconColor = type === 'success' ? 'text-green-500' : 'text-red-500';

    return (
        <div className={`fixed top-4 right-4 z-50 animate-slide-in-right`}>
            <div className={`${bgColor} ${borderColor} border-l-4 rounded-lg shadow-lg p-4 flex items-center gap-3 min-w-[320px] max-w-md`}>
                <div className={iconColor}>
                    {type === 'success' ? (
                        <CheckCircle size={24} />
                    ) : (
                        <XCircle size={24} />
                    )}
                </div>
                <p className={`${textColor} flex-1 font-medium`}>{message}</p>
                <button
                    onClick={onClose}
                    className={`${textColor} hover:opacity-70 transition-opacity`}
                    aria-label="Close notification"
                >
                    <X size={18} />
                </button>
            </div>
        </div>
    );
};

export default Toast;
