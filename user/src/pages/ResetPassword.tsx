import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { verifyPasswordResetCode, confirmPasswordReset, getAuth } from 'firebase/auth';
import { KeyRound, CheckCircle, XCircle, ArrowRight, Loader2, Eye, EyeOff, Lock } from 'lucide-react';
import { AppRoute } from '../types';

export const ResetPassword: React.FC = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const auth = getAuth();

    const [status, setStatus] = useState<'verifying' | 'valid' | 'success' | 'error'>('verifying');
    const [message, setMessage] = useState('Verifying reset link...');
    const [email, setEmail] = useState(''); // Email associated with the reset code

    // Form State
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const oobCode = searchParams.get('oobCode');

    useEffect(() => {
        const mode = searchParams.get('mode');

        if (mode === 'resetPassword' && oobCode) {
            handleVerifyCode(oobCode);
        } else {
            setStatus('error');
            setMessage('Invalid password reset link. Please request a new one.');
        }
    }, [searchParams]);

    const handleVerifyCode = async (code: string) => {
        try {
            const emailAddress = await verifyPasswordResetCode(auth, code);
            setEmail(emailAddress);
            setStatus('valid');
        } catch (error: any) {
            console.error('Code verification error:', error);
            setStatus('error');
            setMessage(getErrorText(error.code));
        }
    };

    const handleResetSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!oobCode) return;

        if (newPassword !== confirmPassword) {
            setMessage("Passwords do not match.");
            return;
        }

        if (newPassword.length < 6) {
            setMessage("Password must be at least 6 characters.");
            return;
        }

        setIsSubmitting(true);
        try {
            await confirmPasswordReset(auth, oobCode, newPassword);
            setStatus('success');
            setMessage('Your password has been reset successfully. You can now login with your new password.');
        } catch (error: any) {
            console.error('Reset error:', error);
            // If the code is invalid now (maybe expired during form fill), show error
            setStatus('error');
            setMessage(getErrorText(error.code));
        } finally {
            setIsSubmitting(false);
        }
    };

    const getErrorText = (errorCode: string) => {
        switch (errorCode) {
            case 'auth/expired-action-code':
                return 'This reset link has expired. Please request a new one.';
            case 'auth/invalid-action-code':
                return 'This reset link is invalid. It may have already been used.';
            case 'auth/user-disabled':
                return 'This user account has been disabled.';
            case 'auth/user-not-found':
                return 'User not found.';
            case 'auth/weak-password':
                return 'Password is too weak. Please choose a stronger password.';
            default:
                return 'An error occurred. Please try again.';
        }
    };

    return (
        <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-md bg-white rounded-[2rem] shadow-2xl p-8 border border-gray-100 relative overflow-hidden animate-fade-in-up">

                {/* Decorative Background Blob */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-brand-blue/5 rounded-bl-[4rem] -z-0 pointer-events-none"></div>

                {status === 'verifying' && (
                    <div className="flex flex-col items-center gap-6 py-8 relative z-10">
                        <Loader2 size={48} className="text-brand-blue animate-spin" />
                        <h2 className="text-2xl font-bold text-gray-800">Verifying Link...</h2>
                        <p className="text-gray-500 text-center">{message}</p>
                    </div>
                )}

                {status === 'valid' && (
                    <div className="relative z-10">
                        <div className="text-center mb-8">
                            <div className="w-16 h-16 bg-blue-50 text-brand-blue rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/10">
                                <KeyRound size={32} />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900">Reset Password</h2>
                            <p className="text-sm text-gray-500 mt-2">for <span className="font-semibold text-gray-700">{email}</span></p>
                        </div>

                        <form onSubmit={handleResetSubmit} className="space-y-6">
                            {message && status !== 'valid' && (
                                <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-2">
                                    <XCircle size={16} /> {message}
                                </div>
                            )}

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1.5 ml-1">New Password</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                            <Lock size={18} />
                                        </div>
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            required
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            className="w-full pl-10 pr-10 py-3 bg-gray-50 border border-transparent rounded-xl focus:bg-white focus:border-brand-blue focus:ring-4 focus:ring-brand-blue/10 transition-all font-medium"
                                            placeholder="••••••••"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                        >
                                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1.5 ml-1">Confirm Password</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                            <Lock size={18} />
                                        </div>
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            required
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            className="w-full pl-10 pr-10 py-3 bg-gray-50 border border-transparent rounded-xl focus:bg-white focus:border-brand-blue focus:ring-4 focus:ring-brand-blue/10 transition-all font-medium"
                                            placeholder="••••••••"
                                        />
                                    </div>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full bg-brand-dark text-white font-bold py-3.5 px-6 rounded-xl hover:bg-black transition-all shadow-lg shadow-gray-900/20 active:scale-95 disabled:opacity-70 flex items-center justify-center gap-2"
                            >
                                {isSubmitting ? <Loader2 size={20} className="animate-spin" /> : 'Reset Password'}
                            </button>
                        </form>
                    </div>
                )}

                {status === 'success' && (
                    <div className="flex flex-col items-center gap-6 py-4 relative z-10 text-center animate-pop-in">
                        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center text-green-600 mb-2 shadow-lg shadow-green-500/10">
                            <CheckCircle size={40} strokeWidth={3} />
                        </div>

                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">Password Reset!</h2>
                            <p className="text-gray-500">{message}</p>
                        </div>

                        <Link
                            to={AppRoute.LOGIN}
                            className="bg-brand-blue text-white font-bold py-3.5 px-8 rounded-xl hover:bg-blue-600 transition-all flex items-center gap-2 w-full justify-center group shadow-lg shadow-brand-blue/30 mt-4"
                        >
                            Login Now
                            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                        </Link>
                    </div>
                )}

                {status === 'error' && (
                    <div className="flex flex-col items-center gap-6 py-4 relative z-10 text-center">
                        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center text-red-600 mb-2">
                            <XCircle size={40} strokeWidth={3} />
                        </div>

                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">Link Invalid</h2>
                            <p className="text-red-500 font-medium">{message}</p>
                        </div>

                        <Link
                            to={AppRoute.FORGOT_PASSWORD}
                            className="bg-gray-100 text-gray-700 font-bold py-3.5 px-8 rounded-xl hover:bg-gray-200 transition-all flex items-center gap-2 w-full justify-center mt-4"
                        >
                            Request New Link
                        </Link>
                    </div>
                )}

            </div>

            {/* Footer */}
            <div className="mt-8 text-gray-400 text-sm font-medium">
                © {new Date().getFullYear()} Medico Hub
            </div>
        </div>
    );
};
