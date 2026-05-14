import React, { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../services/api';

type AdminUser = {
    id?: string;
    uid?: string;
    email?: string;
    name?: string;
    displayName?: string;
    photoURL?: string;
    image?: string;
    role?: string;
};

interface AuthContextType {
    user: AdminUser | null;
    loading: boolean;
    isAdmin: boolean;
    login: (email: string, pass: string) => Promise<void>;
    logout: () => Promise<void>;
    resetPassword: (email: string) => Promise<void>;
    refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const getRootUrl = () => {
    let url = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || 'https://medicohubwebsite-production.up.railway.app';
    url = String(url).trim();
    while (url.endsWith('/') || url.endsWith('/api/v1') || url.endsWith('/api/v3') || url.endsWith('/api')) {
        url = url.replace(/\/$/, "")
            .replace(/\/api\/v1$/, "")
            .replace(/\/api\/v3$/, "")
            .replace(/\/api$/, "");
    }
    if (window.location.protocol === 'https:' && url.startsWith('http:')) {
        url = url.replace('http:', 'https:');
    }

    // Keep localhost/127 host family consistent with the current browser host to avoid CSRF cookie mismatches.
    if (window.location.hostname === '127.0.0.1' && url.includes('://localhost')) {
        url = url.replace('://localhost', '://127.0.0.1');
    } else if (window.location.hostname === 'localhost' && url.includes('://127.0.0.1')) {
        url = url.replace('://127.0.0.1', '://localhost');
    }
    return url;
};

const ROOT_URL = getRootUrl();

const getCsrfToken = async () => {
    const response = await fetch(`${ROOT_URL}/auth/csrf`, {
        credentials: 'include'
    });
    const data = await response.json();
    return data?.csrfToken as string | undefined;
};

const signInWithCredentials = async (email: string, password: string) => {
    const csrfToken = await getCsrfToken();
    if (!csrfToken) {
        throw new Error('Unable to start the authentication flow.');
    }

    const body = new URLSearchParams({
        csrfToken,
        app: 'admin',
        email,
        password,
        redirect: 'false',
        callbackUrl: `${window.location.origin}/`,
        json: 'true'
    });

    const response = await fetch(`${ROOT_URL}/auth/callback/credentials?json=true`, {
        method: 'POST',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body
    });

    const data = await response.json().catch(() => null);
    if (!response.ok || data?.error) {
        throw new Error(data?.error || 'Invalid email or password.');
    }
};

const signOutWithAuthJs = async () => {
    const csrfToken = await getCsrfToken();
    if (!csrfToken) return;

    const body = new URLSearchParams({
        csrfToken,
        callbackUrl: `${window.location.origin}/login`,
        json: 'true'
    });

    await fetch(`${ROOT_URL}/auth/signout`, {
        method: 'POST',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body
    });
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<AdminUser | null>(null);
    const [loading, setLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);

    const loadSession = async () => {
        try {
            const sessionUser = await api.auth.getSession();
            setUser(sessionUser);
            setIsAdmin(!!sessionUser && (sessionUser.role === 'admin' || sessionUser.role === 'ADMIN'));
        } catch (error) {
            console.error('Auth session load error:', error);
            setUser(null);
            setIsAdmin(false);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadSession();
    }, []);

    const login = async (email: string, pass: string) => {
        await signInWithCredentials(email, pass);
        await loadSession();
    };

    const logout = async () => {
        await signOutWithAuthJs();
        setUser(null);
        setIsAdmin(false);
    };

    const resetPassword = async (_email: string) => {
        throw new Error('Password resets are handled in the admin settings panel after sign-in.');
    };

    const refreshUser = async () => {
        await loadSession();
    };

    return (
        <AuthContext.Provider value={{ user, loading, isAdmin, login, logout, resetPassword, refreshUser }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within AuthProvider');
    return context;
};
