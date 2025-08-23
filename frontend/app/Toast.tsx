"use client";
import { useEffect, useState } from 'react';

interface ToastProps {
    message: string;
    type?: 'success' | 'error' | 'info';
    onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, type = 'info', onClose }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, 3000);

        return () => clearTimeout(timer);
    }, [onClose]);

    const bgColor = type === 'error' ? 'bg-red-500' : type === 'success' ? 'bg-green-500' : 'bg-blue-500';
    const icon = type === 'error' ? '✕' : type === 'success' ? '✓' : 'ℹ';

    return (
        <div className="fixed top-4 right-4 z-50">
            <div className={`${bgColor} text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 max-w-sm animate-in slide-in-from-right-full duration-300`}>
                <span className="text-lg">{icon}</span>
                <span className="text-sm">{message}</span>
                <button 
                    onClick={onClose}
                    className="text-white/80 hover:text-white text-lg ml-2"
                >
                    ×
                </button>
            </div>
        </div>
    );
};

export const useToast = () => {
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

    const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
        setToast({ message, type });
    };

    const hideToast = () => {
        setToast(null);
    };

    return { 
        showToast, 
        toast,
        hideToast
    };
};
