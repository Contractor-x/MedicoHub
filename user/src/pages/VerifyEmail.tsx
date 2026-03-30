import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { applyActionCode, getAuth } from 'firebase/auth';
import { CheckCircle, XCircle, ArrowRight, Loader2, LogIn } from 'lucide-react';
import { AppRoute } from '../types';

export const VerifyEmail: React.FC = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const auth = getAuth(); // Or use useAuth context if exposed

    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState('Verifying your email address...');

    useEffect(() => {
        const mode = searchParams.get('mode');
        const oobCode = searchParams.get('oobCode');

        if (mode === 'verifyEmail' && oobCode) {
            handleVerification(oobCode);
        } else {
            setStatus('error');
            setMessage('Invalid verification link. Please request a new one.');
        }
    }, [searchParams]);

    const handleVerification = async (oobCode: string) => {
        try {
            await applyActionCode(auth, oobCode);
            setStatus('success');
            setMessage('Your email has been successfully verified! You can now access all features.');
        } catch (error: any) {
            console.error('Verification error:', error);
            setStatus('error');
            setMessage(getErrorText(error.code));
        }
    };

    const getErrorText = (errorCode: string) => {
        switch (errorCode) {
            case 'auth/expired-action-code':
                return 'This verification link has expired. Please request a new one.';
            case 'auth/invalid-action-code':
                return 'This verification link is invalid. It may have already been used.';
            case 'auth/user-disabled':
                return 'This user account has been disabled.';
            case 'auth/user-not-found':
                return 'User not found.';
            default:
                return 'An error occurred during verification. Please try again.';
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

            {/* Simple Footer/Branding */}
            <div className="mt-8 text-gray-400 text-sm font-medium">
                © {new Date().getFullYear()} Medico Hub
            </div>
        </div>
    );
};
