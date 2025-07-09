import React, {useEffect, useRef, useState} from 'react';
import {CheckCircleIcon, InfoIcon, WarningCircleIcon, XIcon} from '@phosphor-icons/react';

interface ToastProps {
    id?: string;
    type?: 'error' | 'success' | 'info' | 'warning';
    title?: string;
    description?: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    duration?: number; // ms
}

const typeStyles: Record<string, string> = {
    error: 'bg-red-100 border-red-400 text-red-800',
    success: 'bg-green-100 border-green-400 text-green-800',
    info: 'bg-blue-100 border-blue-400 text-blue-800',
    warning: 'bg-yellow-100 border-yellow-400 text-yellow-800',
};

const typeIcons: Record<string, React.ReactNode> = {
    error: <WarningCircleIcon size={22} className="text-red-500"/>,
    success: <CheckCircleIcon size={22} className="text-green-500"/>,
    info: <InfoIcon size={22} className="text-blue-500"/>,
    warning: <WarningCircleIcon size={22} className="text-yellow-500"/>,
};

export const Toast: React.FC<ToastProps> = ({
    id,
    type = 'info',
    title,
    description,
    open,
    onOpenChange,
    duration = 3500,
}) => {
    const [visible, setVisible] = useState(open);
    const timerRef = useRef<number | null>(null);

    useEffect(() => {
        setVisible(open);
        if (open) {
            if (timerRef.current) window.clearTimeout(timerRef.current);
            timerRef.current = window.setTimeout(() => {
                setVisible(false);
                onOpenChange(false);
            }, duration);
        }
        return () => {
            if (timerRef.current) window.clearTimeout(timerRef.current);
        };
    }, [open, duration, onOpenChange]);

    // Animation classes
    const baseClass = `fixed z-50 bottom-6 right-6 max-w-xs w-full border-l-4 shadow-lg px-4 py-3 rounded transition-all duration-300 ease-in-out ${typeStyles[type]}`;
    const animClass = visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none';

    if (!open && !visible) return null;

    return (
        <div
            id={id}
            className={`${baseClass} ${animClass}`}
            role="alert"
            aria-live="assertive"
        >
            <div className="flex justify-between items-start gap-2">
                <div className="flex gap-2 items-start">
                    {typeIcons[type]}
                    <div>
                        {title && <strong className="block mb-1">{title}</strong>}
                        {description && <span className="block text-sm">{description}</span>}
                    </div>
                </div>
                <button
                    className="ml-2 text-xl text-gray-400 hover:text-gray-600 focus:outline-none"
                    onClick={() => {
                        setVisible(false);
                        onOpenChange(false);
                    }}
                    aria-label="Fechar"
                >
                    <XIcon size={20}/>
                </button>
            </div>
        </div>
    );
};
