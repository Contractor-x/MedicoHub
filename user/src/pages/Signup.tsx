import * as React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AppRoute } from '../types';
import { ArrowRight, Lock, Mail, User as UserIcon, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';

interface SignupProps {
    onSignup: (data: any) => void;
}

export const Signup: React.FC<SignupProps> = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { signup, googleSignIn } = useAuth();
    const { allowSignups } = useSettings();

    const [formData, setFormData] = React.useState({
        name: '',
        email: '',
        password: ''
    });
    const [isLoading, setIsLoading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);

    // Check if user came from "Unlock Everything"
    const isProIntent = location.state?.intent === 'pro';

    const handleSuccess = () => {
        if (isProIntent) {
            // Go to payment first, passing flag to go to onboarding after
            navigate(AppRoute.SUBSCRIPTION_SETUP, { state: { next: AppRoute.ONBOARDING } });
        }
        // Standard flow handled by App.tsx redirect from /signup -> /onboarding
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            await signup(formData.name, formData.email, formData.password);
            handleSuccess();
        } catch (err: any) {
            console.error(err);
            if (err.code === 'auth/email-already-in-use') {
                setError('Email is already associated with another account.');
            } else if (err.code === 'auth/weak-password') {
                setError('Password should be at least 6 characters.');
            } else {
                setError('Failed to create account. Please try again.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleSignup = async () => {
        setError(null);
        try {
            await googleSignIn();
            handleSuccess();
        } catch (err: any) {
            console.error(err);
            setError('Failed to sign up with Google.');
        }
    };

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
                    <div className="mt-8 space-y-6">
                        <button
                            onClick={handleGoogleSignup}
                            className="w-full flex items-center justify-center gap-3 py-3 px-4 border border-gray-200 rounded-xl shadow-sm bg-white text-sm font-bold text-gray-700 hover:bg-gray-50 transition-all"
                        >
                            <svg className="w-5 h-5" viewBox="0 0 24 24">
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                            </svg>
                            Sign up with Google
                        </button>

                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-200"></div>
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-2 bg-white text-gray-500">Or sign up with email</span>
                            </div>
                        </div>

                        <form className="space-y-6" onSubmit={handleSubmit}>
                            {error && (
                                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm flex items-center gap-2 animate-pulse">
                                    <AlertCircle className="w-4 h-4" />
                                    {error}
                                </div>
                            )}
                            <div className="space-y-4">
                                <div>
                                    <label htmlFor="name" className="block text-sm font-bold text-gray-700 mb-2">Full Name</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <UserIcon className="h-5 w-5 text-gray-500" />
                                        </div>
                                        <input
                                            id="name"
                                            name="name"
                                            type="text"
                                            required
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            className="appearance-none block w-full pl-10 pr-3 py-3 bg-gray-100 border border-transparent rounded-xl focus:outline-none focus:bg-white focus:ring-2 focus:ring-brand-blue focus:border-transparent transition-all"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label htmlFor="email" className="block text-sm font-bold text-gray-700 mb-2">Email Address</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <Mail className="h-5 w-5 text-gray-500" />
                                        </div>
                                        <input
                                            id="email"
                                            name="email"
                                            type="email"
                                            required
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            className="appearance-none block w-full pl-10 pr-3 py-3 bg-gray-100 border border-transparent rounded-xl focus:outline-none focus:bg-white focus:ring-2 focus:ring-brand-blue focus:border-transparent transition-all"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label htmlFor="password" className="block text-sm font-bold text-gray-700 mb-2">Password</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <Lock className="h-5 w-5 text-gray-500" />
                                        </div>
                                        <input
                                            id="password"
                                            name="password"
                                            type="password"
                                            required
                                            value={formData.password}
                                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                            className="appearance-none block w-full pl-10 pr-3 py-3 bg-gray-100 border border-transparent rounded-xl focus:outline-none focus:bg-white focus:ring-2 focus:ring-brand-blue focus:border-transparent transition-all"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="group relative w-full flex justify-center py-3.5 px-4 border border-transparent text-sm font-bold rounded-full text-white bg-brand-dark hover:bg-black focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 disabled:opacity-70"
                                >
                                    {isLoading ? (
                                        <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></span>
                                    ) : (
                                        <>
                                            {isProIntent ? 'Continue to Payment' : 'Continue to Onboarding'}
                                            <ArrowRight className="ml-2 h-4 w-4" />
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
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