import React, { useState } from 'react';
import { AlertTriangle, Send, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const EmailVerificationBanner: React.FC = () => {
    const { user, sendVerificationEmail } = useAuth();
    const [sent, setSent] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Initialize dismissed state from sessionStorage
    const [dismissed, setDismissed] = useState(() => {
        if (!user) return false;
        return sessionStorage.getItem(`verification_email_sent_${user.uid}`) === 'true';
    });

    // Check if user has 'password' provider (email/password registration)
    const isEmailUser = user?.providerData.some(p => p.providerId === 'password');

    // If no user, already verified, dismissed, or not an email user, don't show
    if (!user || user.emailVerified || dismissed || !isEmailUser) return null;

    const handleSend = async () => {
        try {
            await sendVerificationEmail();
            setSent(true);
            setError(null);

            // Persist dismissal for this session and hide banner
            if (user) {
                sessionStorage.setItem(`verification_email_sent_${user.uid}`, 'true');
                setDismissed(true);
            }
        } catch (err) {
            console.error(err);
            setError("Failed to send email. Try again later.");
        }
    };

    return (
        <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-3">
            <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-sm">
                <div className="flex items-center gap-2 text-yellow-800">
                    <AlertTriangle size={16} />
                    <span>Please verify your email address to access all features.</span>
                </div>

                {sent ? (
                    <div className="flex items-center gap-2 text-green-700 font-bold animate-fade-in">
                        <Check size={16} />
                        <span>Verification email sent! Check your inbox.</span>
                    </div>
                ) : (
                    <button
                        onClick={handleSend}
                        className="flex items-center gap-2 bg-yellow-100 hover:bg-yellow-200 text-yellow-800 px-3 py-1.5 rounded-lg font-medium transition-colors"
                    >
                        <Send size={14} />
                        Send Verification Email
                    </button>
                )}

                {error && <span className="text-red-500 font-bold">{error}</span>}
            </div>
        </div>
    );
};
