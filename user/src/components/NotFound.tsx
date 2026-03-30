import React from 'react';
import { Link } from 'react-router-dom';
import { Home, AlertCircle } from 'lucide-react';
import { AppRoute } from '../types';

export const NotFound: React.FC = () => {
    return (
        <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 text-center">
            <div className="w-24 h-24 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-8 animate-bounce">
                <AlertCircle size={48} />
            </div>
            <h1 className="text-6xl font-black text-brand-dark mb-4">404</h1>
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Page Not Found</h2>
            <p className="text-gray-500 max-w-md mx-auto mb-10 text-lg">
                The page you are looking for doesn't exist or has been moved.
                Let's get you back on track.
            </p>
            <Link
                to={AppRoute.HOME}
                className="flex items-center gap-2 bg-brand-blue text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-blue-600 transition-all shadow-xl shadow-brand-blue/30 active:scale-95"
            >
                <Home size={20} />
                Back to Home
            </Link>
        </div>
    );
};
