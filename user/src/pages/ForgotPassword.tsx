import * as React from 'react';
import { Link } from 'react-router-dom';
import { AppRoute } from '../types';
import { ArrowLeft, Mail, CheckCircle } from 'lucide-react';

import { useAuth } from '../context/AuthContext';

export const ForgotPassword: React.FC = () => {
    const { resetPassword } = useAuth();
    const [email, setEmail] = React.useState('');
    const [isSubmitted, setIsSubmitted] = React.useState(false);
    const [isLoading, setIsLoading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        try {
            await resetPassword(email);
            setIsSubmitted(true);
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Failed to send reset link. Please check your email.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-white pt-24 pb-12 px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center relative overflow-hidden">
            {/* Background blobs */}
            <div className="absolute top-20 -left-20 w-96 h-96 bg-brand-blue/10 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute bottom-20 -right-20 w-96 h-96 bg-brand-yellow/10 rounded-full blur-3xl pointer-events-none"></div>

            <div className="w-full max-w-md space-y-8 relative z-10">
                <div className="text-center">
                    <h2 className="text-3xl font-extrabold text-brand-dark">Reset Password</h2>
                    <p className="mt-2 text-gray-500">Don't worry, it happens to the best of us.</p>
                </div>

                {isSubmitted ? (
                    <div className="bg-green-50 rounded-2xl p-6 text-center border border-green-100 animate-pop-in">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 text-green-600">
                            <CheckCircle size={32} />
                        </div>
                        <h3 className="text-xl font-bold text-green-800 mb-2">Check your email</h3>
                        <p className="text-green-700 mb-6">We've sent password reset instructions to <strong>{email}</strong>.</p>
                        <Link to={AppRoute.LOGIN} className="block w-full bg-white border border-green-200 text-green-700 font-bold py-3 rounded-xl hover:bg-green-50 transition-colors">
                            Back to Login
                        </Link>
                    </div>
                ) : (
                    <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
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
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="appearance-none block w-full pl-10 pr-3 py-3 bg-gray-100 border-transparent rounded-xl placeholder-gray-600 focus:outline-none focus:bg-white focus:ring-2 focus:ring-brand-blue focus:border-transparent transition-all"
                                    placeholder="Enter your email"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full flex justify-center py-3.5 px-4 border border-transparent text-sm font-bold rounded-full text-white bg-brand-dark hover:bg-black focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 disabled:opacity-70"
                        >
                            {isLoading ? 'Sending...' : 'Send Reset Link'}
                        </button>

                        <div className="text-center mt-4">
                            <Link to={AppRoute.LOGIN} className="inline-flex items-center text-sm font-bold text-gray-500 hover:text-brand-dark transition-colors">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back to Login
                            </Link>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};