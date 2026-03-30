
import React, { createContext, useContext, useEffect, useState } from 'react';
import { type User, onAuthStateChanged, signInWithEmailAndPassword, signOut, sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../firebase';

interface AuthContextType {
    user: User | null;
    loading: boolean;
    isAdmin: boolean;
    login: (email: string, pass: string) => Promise<void>;
    logout: () => Promise<void>;
    resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (u) => {
            setUser(u);
            try {
                if (u) {
                    const tokenResult = await u.getIdTokenResult();
                    setIsAdmin(!!tokenResult.claims.admin);
                } else {
                    setIsAdmin(false);
                }
            } catch (error) {
                console.error("Auth Check Error:", error);
                setIsAdmin(false);
            } finally {
                setLoading(false);
            }
        });
        return unsubscribe;
    }, []);

    const login = async (email: string, pass: string) => {
        const credential = await signInWithEmailAndPassword(auth, email, pass);
        const token = await credential.user.getIdTokenResult();
        if (!token.claims.admin) {
            await signOut(auth);
            throw new Error("Unauthorized: Access restricted to administrators only.");
        }
    };

    const logout = async () => {
        await signOut(auth);
    };

    const resetPassword = async (email: string) => {
        await sendPasswordResetEmail(auth, email);
    };

    return (
        <AuthContext.Provider value={{ user, loading, isAdmin, login, logout, resetPassword }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error("useAuth must be used within AuthProvider");
    return context;
};
