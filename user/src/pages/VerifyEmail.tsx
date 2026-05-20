import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle, XCircle, ArrowRight, Loader2, LogIn } from 'lucide-react';
import { AppRoute } from '../types';
import { api } from '../services/api';

export const VerifyEmail: React.FC = () => {
    const [searchParams] = useSearchParams();

    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState('Verifying your email address...');

    useEffect(() => {
        const token = searchParams.get('token');
        if (token) {
            handleVerification(token);
        } else {
            setStatus('error');
            setMessage('Invalid verification link. Please request a new one.');
        }
    }, [searchParams]);

    const handleVerification = async (token: string) => {
        try {
            await api.auth.verifyEmail(token);
            setStatus('success');
            setMessage('Your email has been successfully verified! You can now access all features.');
        } catch (error: any) {
            console.error('Verification error:', error);
            setStatus('error');
            setMessage(error.message || 'An error occurred during verification. Please try again.');
        }
    };

    return (
        <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-8 border border-gray-100 text-center animate-fade-in-up">
                {status === 'loading' && (
                    <div className="flex flex-col items-center gap-4 py-8">
                        <Loader2 size={48} className="text-brand-yellow animate-spin" />
                        <h2 className="text-2xl font-bold text-brand-dark">Verifying...</h2>
                        <p className="text-gray-500">{message}</p>
                    </div>
                )}

                {status === 'success' && (
                    <div className="flex flex-col items-center gap-6 py-4">
                        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center text-green-600 mb-2">
                            <CheckCircle size={40} strokeWidth={3} />
                        </div>

                        <div>
                            <h2 className="text-2xl font-bold text-brand-dark mb-2">Email Verified!</h2>
                            <p className="text-gray-500">{message}</p>
                        </div>

                        <Link
                            to={AppRoute.LOGIN}
                            className="bg-brand-dark text-white font-bold py-3.5 px-8 rounded-xl hover:bg-black transition-all flex items-center gap-2 w-full justify-center group shadow-lg shadow-brand-dark/20"
                        >
                            <LogIn size={20} />
                            Go to Login
                            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                        </Link>
                    </div>
                )}

                {status === 'error' && (
                    <div className="flex flex-col items-center gap-6 py-4">
                        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center text-red-600 mb-2">
                            <XCircle size={40} strokeWidth={3} />
                        </div>

                        <div>
                            <h2 className="text-2xl font-bold text-brand-dark mb-2">Verification Failed</h2>
                            <p className="text-red-500 font-medium">{message}</p>
                        </div>

                        <Link
                            to={AppRoute.LOGIN}
                            className="bg-gray-100 text-gray-700 font-bold py-3.5 px-8 rounded-xl hover:bg-gray-200 transition-all flex items-center gap-2 w-full justify-center"
                        >
                            Back to Login
                        </Link>
                    </div>
                )}
            </div>

            <div className="mt-8 text-gray-400 text-sm font-medium">
                © {new Date().getFullYear()} Medico Hub
            </div>
        </div>
    );
};
