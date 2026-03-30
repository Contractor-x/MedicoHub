import React from 'react';
import { CheckCircle, ArrowRight, ShoppingBag } from 'lucide-react';

interface OrderSuccessModalProps {
    isOpen: boolean;
    onClose: () => void;
    orderId?: string; // Optional if we want to show it
}

export const OrderSuccessModal: React.FC<OrderSuccessModalProps> = ({ isOpen, onClose, orderId }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in"
                onClick={onClose}
            />

            {/* Modal Content */}
            <div className="relative bg-white rounded-[2rem] p-8 max-w-md w-full shadow-2xl transform transition-all animate-bounce-in text-center overflow-hidden">

                {/* Decorative Background Blob */}
                <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-green-50 to-transparent pointer-events-none" />

                <div className="relative">
                    <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6 shadow-sm">
                        <CheckCircle className="text-green-600 w-10 h-10 animate-scale-up" />
                    </div>

                    <h2 className="text-3xl font-bold text-gray-800 mb-2">Order Placed!</h2>
                    <p className="text-gray-500 mb-8 leading-relaxed">
                        Thank you for your purchase. Your order has been securely processed and is on its way to you!
                    </p>

                    <button
                        onClick={onClose}
                        className="w-full py-4 bg-brand-dark text-white rounded-xl font-bold text-lg hover:bg-gray-800 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 group"
                    >
                        Continue Shopping
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </button>
                </div>
            </div>
        </div>
    );
};
