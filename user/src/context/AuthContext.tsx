import React, { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../services/api';

export interface AuthUser {
    id: string;
    uid: string;
    email?: string;
    name?: string;
    displayName?: string;
    image?: string;
    photoURL?: string;
    role?: 'student' | 'admin';
    emailVerified?: boolean;
    authProvider?: 'email' | 'google';
}

interface AuthContextType {
    user: AuthUser | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<void>;
    signup: (name: string, email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    googleSignIn: () => Promise<void>;
    deleteAccount: () => Promise<void>;
    sendVerificationEmail: () => Promise<void>;
    resetPassword: (email: string) => Promise<void>;
    refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

const normalizeUser = (sessionUser: any): AuthUser | null => {
    if (!sessionUser) return null;
    return {
        id: sessionUser.id || sessionUser.uid,
        uid: sessionUser.uid || sessionUser.id,
        email: sessionUser.email,
        name: sessionUser.name,
        displayName: sessionUser.displayName || sessionUser.name,
        image: sessionUser.image,
        photoURL: sessionUser.photoURL || sessionUser.image,
        role: sessionUser.role,
        emailVerified: !!sessionUser.emailVerified,
        authProvider: sessionUser.authProvider || 'email'
    };
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [loading, setLoading] = useState(true);

    const loadSession = async () => {
        setLoading(true);
        try {
            const session = await api.auth.getSession();
            setUser(normalizeUser(session?.user));
        } catch (error) {
            console.error('Failed to load session:', error);
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadSession();
    }, []);

    const login = async (email: string, password: string) => {
        await api.auth.login(email, password);
        await loadSession();
    };

    const signup = async (name: string, email: string, password: string) => {
        await api.auth.register(name, email, password);
        await login(email, password);
    };

    const logout = async () => {
        await api.auth.signOut();
        setUser(null);
    };

    const googleSignIn = async () => {
        const callbackUrl = `${window.location.origin}/#/dashboard`;
        await api.auth.signInWithGoogle(callbackUrl);
    };

    const deleteAccount = async () => {
        if (!user?.uid) return;
        await api.users.delete(user.uid);
        await logout();
    };

    const sendVerificationEmail = async () => {
        await api.auth.sendVerification();
    };

    const resetPassword = async (email: string) => {
        await api.auth.sendReset(email);
    };

    const refreshUser = async () => {
        await loadSession();
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                loading,
                login,
                signup,
                logout,
                googleSignIn,
                deleteAccount,
                sendVerificationEmail,
                resetPassword,
                refreshUser
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};
