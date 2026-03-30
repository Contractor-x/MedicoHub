import React, { createContext, useContext, useEffect, useState } from 'react';
import {
    User,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    GoogleAuthProvider,
    signInWithPopup,
    updateProfile
} from 'firebase/auth';
import { auth } from '../services/firebase';
import { api } from '../services/api';

/**
 * AUTH CONTEXT:
 * This file is the "Manager" for everything related to users logging in and out.
 * It keeps track of who is currently using the website.
 */

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<void>;
    signup: (name: string, email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    googleSignIn: () => Promise<boolean>;
    deleteAccount: () => Promise<void>;
    sendVerificationEmail: () => Promise<void>;
    resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * This is a custom "Hook" that other components use to get user data.
 * Instead of asking Firebase directly, they ask the AuthContext.
 */
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // This listener "watches" the user. If they close the tab and come back, 
        // Firebase tells us who they are automatically.
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            setLoading(false);
        });
        return unsubscribe;
    }, []);

    const signup = async (name: string, email: string, password: string) => {
        // 1. Create the account in Firebase Auth (Email/Password)
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        try {
            // 2. Add their name to their profile
            await updateProfile(userCredential.user, { displayName: name });

            // 3. Force Creation in MongoDB (Sync)
            // This ensures the Admin Panel sees the name immediately, instead of "Anonymous"
            // The previous "auto-create on GET" strategy was causing race conditions.
            await api.users.update(userCredential.user.uid, { name, email, role: 'student' });
        } catch (error) {
            console.error("Error setting up user profile name:", error);
        }
    };

    const login = (email: string, password: string) => {
        return signInWithEmailAndPassword(auth, email, password).then(async () => {
            // You can fetch additional user data here if needed
        });
    };

    const logout = () => {
        return signOut(auth);
    };

    const deleteAccount = async () => {
        if (!auth.currentUser) return;

        try {
            const uid = auth.currentUser.uid;

            // 1. Delete from MongoDB via our API
            try {
                const { api } = await import('../services/api');
                await api.users.delete(uid);
            } catch (fsError) {
                console.warn("MongoDB user document deletion failed:", fsError);
            }

            // 2. Delete Auth User
            await auth.currentUser.delete();
        } catch (error: any) {
            console.error("Error deleting account:", error);
            throw error;
        }
    };

    const sendVerificationEmail = async () => {
        if (auth.currentUser && auth.currentUser.email) {
            // Use our custom backend endpoint to send branded email
            await api.auth.sendVerification(auth.currentUser.email);
        }
    };

    const resetPassword = (email: string) => {
        // Use our custom backend endpoint to send branded email
        return api.auth.sendReset(email);
    };

    const googleSignIn = async () => {
        const provider = new GoogleAuthProvider();
        const result = await signInWithPopup(auth, provider);

        // Force Creation/Sync in MongoDB immediately
        if (result.user) {
            try {
                // Upsert user to MongoDB right away
                await api.users.update(result.user.uid, {
                    name: result.user.displayName || 'Google User',
                    email: result.user.email,
                    photoURL: result.user.photoURL,
                    role: 'student'
                });
            } catch (e) {
                console.error("Failed to sync Google user to MongoDB:", e);
            }
        }
        return result.user !== null;
    };

    const value = {
        user,
        loading,
        login,
        signup,
        logout,
        googleSignIn,
        deleteAccount,
        sendVerificationEmail,
        resetPassword
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};
