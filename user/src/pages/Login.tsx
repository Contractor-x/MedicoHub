import * as React from 'react';
import { Link } from 'react-router-dom';
import { AppRoute } from '../types';
import { SignIn } from '@clerk/clerk-react';

interface LoginProps {
    onLogin: (data: any) => void; // Deprecated, kept for compatibility if needed temporarily
}

export const Login: React.FC<LoginProps> = () => {
    return (
        <div className="min-h-screen bg-white pt-24 pb-12 px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center relative overflow-hidden">
            {/* Background blobs */}
            <div className="absolute top-20 -left-20 w-96 h-96 bg-brand-blue/10 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute bottom-20 -right-20 w-96 h-96 bg-brand-yellow/10 rounded-full blur-3xl pointer-events-none"></div>

            <div className="w-full max-w-md space-y-8 relative z-10">
                <div className="text-center">
                    <h2 className="text-4xl font-extrabold text-brand-dark">Welcome back!</h2>
                    <p className="mt-2 text-gray-500">Ready to crush another study session?</p>
                </div>

                <div className="mt-8 flex justify-center">
                    <SignIn
                        fallbackRedirectUrl="/#/dashboard"
                        forceRedirectUrl="/#/dashboard"
                        signUpUrl="/#/signup"
                    />
                </div>

                <div className="text-center mt-6">
                    <p className="text-gray-500 text-sm">
                        Don't have an account?{' '}
                        <Link to={AppRoute.SIGNUP} className="font-bold text-brand-blue hover:text-blue-600">
                            Create one now
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};
