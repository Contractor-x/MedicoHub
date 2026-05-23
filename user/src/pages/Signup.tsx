import * as React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AppRoute } from '../types';
import { Lock } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import { SignUp } from '@clerk/clerk-react';

interface SignupProps {
    onSignup: (data: any) => void;
}

export const Signup: React.FC<SignupProps> = () => {
    const location = useLocation();
    const { allowSignups } = useSettings();

    // Check if user came from "Unlock Everything"
    const isProIntent = location.state?.intent === 'pro';

    return (
        <div className="min-h-screen bg-white pt-24 pb-12 px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center relative overflow-hidden">
            {/* Background blobs */}
            <div className="absolute top-20 -left-20 w-96 h-96 bg-brand-blue/10 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute bottom-20 -right-20 w-96 h-96 bg-brand-yellow/10 rounded-full blur-3xl pointer-events-none"></div>

            <div className="w-full max-w-md space-y-8 relative z-10">
                <div className="text-center">
                    <h2 className="text-4xl font-extrabold text-brand-dark">Create Account</h2>
                    <p className="mt-2 text-gray-500">Join the Medico Hub community today.</p>
                </div>

                {!allowSignups ? (
                    <div className="mt-8 p-6 bg-red-50 border border-red-200 rounded-2xl flex flex-col items-center text-center animate-pop-in">
                        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center text-red-600 mb-4">
                            <Lock size={24} />
                        </div>
                        <h3 className="text-lg font-bold text-red-800 mb-2">Registration Closed</h3>
                        <p className="text-red-600 text-sm">
                            New user signups are currently disabled by the administration.
                            Please try again later or contact support.
                        </p>
                        <Link to={AppRoute.LOGIN} className="mt-6 font-bold text-red-700 hover:text-red-900 underline">
                            Return to Login
                        </Link>
                    </div>
                ) : (
                    <div className="mt-8 flex justify-center">
                        <SignUp
                            fallbackRedirectUrl={isProIntent ? '/#/onboarding' : '/#/dashboard'}
                            forceRedirectUrl={isProIntent ? '/#/onboarding' : '/#/dashboard'}
                            signInUrl="/#/login"
                        />
                    </div>
                )}

                <div className="text-center mt-6">
                    <p className="text-gray-500 text-sm">
                        Don't have an account?{' '}
                        <Link to={AppRoute.LOGIN} className="font-bold text-brand-blue hover:text-blue-600">
                            Sign In
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};
