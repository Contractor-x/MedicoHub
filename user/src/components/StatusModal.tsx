import React from 'react';
import { CheckCircle, AlertCircle, Info, XCircle, ArrowRight } from 'lucide-react';

export type ModalType = 'success' | 'error' | 'info';

interface StatusModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    message: string;
    type?: ModalType;
    actionLabel?: string;
    onAction?: () => void;
}

/**
 * GENERIC STATUS MODAL:
 * A beautiful, reusable popup for success, error, and info messages.
 * This replaces browser alerts with a premium UI.
 */
export const StatusModal: React.FC<StatusModalProps> = ({
    isOpen,
    onClose,
    title,
    message,
    type = 'success',
    actionLabel = 'Continue',
    onAction
}) => {
    if (!isOpen) return null;

    const config = {
        success: {
            icon: CheckCircle,
            iconClass: 'text-green-600',
            bgClass: 'bg-green-100',
            ringClass: 'ring-green-50',
            gradientClass: 'from-green-50',
            btnClass: 'bg-green-600 hover:bg-green-700 shadow-green-200'
        },
        error: {
            icon: XCircle,
            iconClass: 'text-red-600',
            bgClass: 'bg-red-100',
            ringClass: 'ring-red-50',
            gradientClass: 'from-red-50',
            btnClass: 'bg-red-600 hover:bg-red-700 shadow-red-200'
        },
        info: {
            icon: Info,
            iconClass: 'text-brand-blue',
            bgClass: 'bg-blue-100',
            ringClass: 'ring-blue-50',
            gradientClass: 'from-blue-50',
            btnClass: 'bg-brand-blue hover:bg-blue-600 shadow-brand-blue/20'
        }
    }[type];

    const Icon = config.icon;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in"
                onClick={onClose}
            />

            {/* Modal Content */}
            <div className="relative bg-white rounded-[2.5rem] p-10 max-w-md w-full shadow-2xl transform transition-all animate-bounce-in text-center overflow-hidden border border-gray-100">

                {/* Decorative Background Blob */}
                <div className={`absolute top-0 left-0 w-full h-40 bg-gradient-to-b ${config.gradientClass} to-transparent pointer-events-none`} />

                <div className="relative">
                    <div className={`mx-auto w-24 h-24 ${config.bgClass} rounded-full flex items-center justify-center mb-6 shadow-sm ring-8 ${config.ringClass}`}>
                        <Icon className={`${config.iconClass} w-12 h-12 animate-scale-up`} />
                    </div>

                    <h2 className="text-3xl font-extrabold text-brand-dark mb-3">{title}</h2>
                    <p className="text-gray-500 mb-8 leading-relaxed font-medium">
                        {message}
                    </p>

                    <button
                        onClick={onAction || onClose}
                        className={`w-full py-4 text-white rounded-2xl font-bold text-lg transition-all shadow-xl flex items-center justify-center gap-2 group active:scale-95 ${config.btnClass}`}
                    >
                        {actionLabel}
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </button>
                </div>
            </div>
        </div>
    );
};
