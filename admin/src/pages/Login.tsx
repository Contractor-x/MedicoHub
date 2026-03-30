import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, ShieldCheck, AlertCircle, CheckCircle } from 'lucide-react';

export const Login = () => {
    const { login, user, resetPassword } = useAuth();
    const navigate = useNavigate();
    // Prefill credentials
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isResetting, setIsResetting] = useState(false);

    useEffect(() => {
        if (user) {
            navigate('/');
        }
    }, [user, navigate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setIsSubmitting(true);
        try {
            await login(email, password);
        } catch (err: any) {
            console.error("Login failed:", err);
            setError("Authentication failed. Please check your credentials.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleResetPassword = async () => {
        if (!email) {
            setError("Please enter your email address first.");
            return;
        }
        setError('');
        setSuccess('');
        setIsResetting(true);
        try {
            await resetPassword(email);
            setSuccess("Password reset link sent to your email!");
        } catch (err: any) {
            setError("Failed to send reset link. " + (err.message || ""));
        } finally {
            setIsResetting(false);
        }
    };

    return (
        <div className="min-h-screen bg-brand-light flex items-center justify-center p-4">
            <div className="bg-white p-8 rounded-[2rem] shadow-xl max-w-md w-full border border-gray-100">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-brand-dark/5 rounded-2xl flex items-center justify-center mx-auto mb-4 text-brand-dark">
                        <ShieldCheck size={32} />
                    </div>
                    <h1 className="text-2xl font-extrabold text-brand-dark">Admin Portal</h1>
                    <p className="text-gray-500 text-sm">Sign in to manage Medico Hub</p>
                </div>

                {error && (
                    <div className="bg-red-50 text-red-600 p-3 rounded-xl flex items-center gap-2 text-sm font-bold mb-6">
                        <AlertCircle size={16} />
                        {error}
                    </div>
                )}

                {success && (
                    <div className="bg-green-50 text-green-600 p-3 rounded-xl flex items-center gap-2 text-sm font-bold mb-6">
                        <CheckCircle size={16} />
                        {success}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Email</label>
                        <div className="relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-brand-blue font-medium"
                                placeholder="admin@medicohub.com"
                            />
                        </div>
                    </div>

                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider">Password</label>
                            <button
                                type="button"
                                onClick={handleResetPassword}
                                disabled={isResetting}
                                className="text-xs font-bold text-brand-blue hover:underline disabled:opacity-50"
                            >
                                {isResetting ? 'Sending...' : 'Forgot Password?'}
                            </button>
                        </div>
                        <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-brand-blue font-medium"
                                placeholder="Enter your password"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full bg-brand-dark text-white py-4 rounded-xl font-bold hover:bg-black transition-all shadow-lg shadow-brand-dark/20 mt-4 disabled:opacity-70"
                    >
                        {isSubmitting ? 'Authenticating...' : 'Sign In'}
                    </button>

                </form>
            </div>
        </div>
    );
};
