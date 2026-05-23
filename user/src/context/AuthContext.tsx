import React, { createContext, useContext, useEffect, useState } from 'react';
import { useClerk, useUser } from '@clerk/clerk-react';
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
    authProvider?: 'email' | 'google' | 'clerk';
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
        authProvider: sessionUser.authProvider || 'clerk'
    };
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const clerk = useClerk();
    const { user: clerkUser, isLoaded } = useUser();
    const [user, setUser] = useState<AuthUser | null>(null);
    const [loading, setLoading] = useState(!isLoaded);

    const mapClerkUser = (u: typeof clerkUser): AuthUser | null => {
        if (!u) return null;
        const email = u.primaryEmailAddress?.emailAddress || u.emailAddresses?.[0]?.emailAddress;
        const fullName = `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.username || email || 'Student';
        return normalizeUser({
            id: u.id,
            uid: u.id,
            email,
            name: fullName,
            displayName: fullName,
            image: u.imageUrl,
            photoURL: u.imageUrl,
            role: (u.publicMetadata?.role as 'student' | 'admin' | undefined) || 'student',
            emailVerified: !!u.primaryEmailAddress?.verification?.status && u.primaryEmailAddress?.verification?.status === 'verified',
            authProvider: 'clerk'
        });
    };

    useEffect(() => {
        if (!isLoaded) {
            setLoading(true);
            return;
        }
        setUser(mapClerkUser(clerkUser));
        setLoading(false);
    }, [isLoaded, clerkUser]);

    const login = async (email: string, password: string) => {
        await clerk.openSignIn({
            identifier: email,
            afterSignInUrl: `${window.location.origin}${window.location.pathname}#/dashboard`,
            afterSignUpUrl: `${window.location.origin}${window.location.pathname}#/dashboard`
        } as any);
    };

    const signup = async (name: string, email: string, password: string) => {
        await clerk.openSignUp({
            unsafeMetadata: { fullName: name },
            emailAddress: email,
            afterSignInUrl: `${window.location.origin}${window.location.pathname}#/dashboard`,
            afterSignUpUrl: `${window.location.origin}${window.location.pathname}#/dashboard`
        } as any);
    };

    const logout = async () => {
        await clerk.signOut({ redirectUrl: `${window.location.origin}${window.location.pathname}#/login` });
        setUser(null);
    };

    const googleSignIn = async () => {
        await clerk.openSignIn({
            afterSignInUrl: `${window.location.origin}${window.location.pathname}#/dashboard`,
            afterSignUpUrl: `${window.location.origin}${window.location.pathname}#/dashboard`
        } as any);
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
        setUser(mapClerkUser(clerkUser));
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
