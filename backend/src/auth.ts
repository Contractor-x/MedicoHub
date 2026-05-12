import { randomUUID } from 'crypto';
import { ExpressAuth } from '@auth/express';
import Credentials from '@auth/core/providers/credentials';
import Google from '@auth/core/providers/google';
import { User } from './models/User';
import { hashPassword, verifyPassword } from './utils/password';

const bootstrapAdminEmail = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
const bootstrapAdminPassword = process.env.ADMIN_PASSWORD || '';
const frontendUrl = process.env.FRONTEND_URL || 'https://medicohub.com.ng';

const normalizeEmail = (value: string) => value.trim().toLowerCase();

const toPublicUser = (user: any) => ({
    id: user.uid,
    uid: user.uid,
    email: user.email,
    name: user.name,
    displayName: user.name,
    image: user.photoURL || undefined,
    photoURL: user.photoURL || undefined,
    role: user.role,
    emailVerified: !!user.emailVerified,
    authProvider: user.authProvider || 'email'
});

const ensureUserForGoogle = async (profile: any) => {
    const email = normalizeEmail(String(profile?.email || ''));
    if (!email) return null;

    let user = await User.findOne({ email });
    const isBootstrapAdmin = bootstrapAdminEmail && email === bootstrapAdminEmail;

    if (!user) {
        user = await User.create({
            uid: randomUUID(),
            name: profile?.name || 'Google User',
            email,
            role: isBootstrapAdmin ? 'admin' : 'student',
            photoURL: profile?.picture || '',
            emailVerified: true,
            authProvider: 'google'
        });
        return user;
    }

    const updates: Record<string, any> = {
        name: user.name || profile?.name || 'Google User',
        photoURL: user.photoURL || profile?.picture || '',
        authProvider: 'google',
        emailVerified: true
    };

    if (isBootstrapAdmin && user.role !== 'admin') {
        updates.role = 'admin';
    }

    user = await User.findOneAndUpdate({ email }, { $set: updates }, { new: true });
    return user;
};

export const authConfig = {
    secret: process.env.BETTER_AUTH_SECRET || process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || 'medicohub-dev-auth-secret',
    trustHost: true,
    session: { strategy: 'jwt' as const },
    pages: {
        signIn: '/login'
    },
    providers: [
        Google({
            clientId: process.env.GOOGLE_CLIENT_ID || '',
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || ''
        }),
        Credentials({
            name: 'Email Password',
            credentials: {
                app: { label: 'App', type: 'text' },
                email: { label: 'Email', type: 'email' },
                password: { label: 'Password', type: 'password' }
            },
            async authorize(credentials: any) {
                const app = String(credentials?.app || 'user');
                const email = normalizeEmail(String(credentials?.email || ''));
                const password = String(credentials?.password || '');

                if (!email || !password) return null;

                let user = await User.findOne({ email });

                if (!user && app === 'admin' && bootstrapAdminEmail && bootstrapAdminPassword && email === bootstrapAdminEmail) {
                    user = await User.create({
                        uid: randomUUID(),
                        name: 'Admin User',
                        email,
                        role: 'admin',
                        photoURL: `https://ui-avatars.com/api/?name=${encodeURIComponent('Admin User')}&background=0D8ABC&color=fff`,
                        passwordHash: hashPassword(bootstrapAdminPassword),
                        emailVerified: true,
                        authProvider: 'email'
                    });
                }

                if (!user?.passwordHash) return null;
                if (app === 'admin' && user.role !== 'admin') return null;
                if (!verifyPassword(password, user.passwordHash)) return null;

                return toPublicUser(user) as any;
            }
        })
    ],
    callbacks: {
        async signIn({ account, profile, user }: any) {
            if (account?.provider === 'google') {
                const dbUser = await ensureUserForGoogle(profile || user);
                return !!dbUser;
            }
            return true;
        },
        async jwt({ token, user, account, profile }: any) {
            const authToken = token as any;

            if (account?.provider === 'google') {
                const dbUser = await ensureUserForGoogle(profile || user);
                if (dbUser) {
                    authToken.uid = dbUser.uid;
                    authToken.role = dbUser.role;
                    authToken.displayName = dbUser.name;
                    authToken.photoURL = dbUser.photoURL;
                    authToken.emailVerified = !!dbUser.emailVerified;
                    authToken.email = dbUser.email;
                    authToken.authProvider = dbUser.authProvider || 'google';
                    return authToken;
                }
            }

            if (user) {
                authToken.uid = (user as any).uid ?? user.id;
                authToken.role = (user as any).role;
                authToken.displayName = (user as any).displayName ?? user.name;
                authToken.photoURL = (user as any).photoURL ?? user.image;
                authToken.emailVerified = !!(user as any).emailVerified;
                authToken.authProvider = (user as any).authProvider || 'email';
            }

            return authToken;
        },
        async session({ session, token }: any) {
            const authToken = token as any;
            const existingUser = session.user || {};
            session.user = {
                ...existingUser,
                id: authToken.uid as string | undefined,
                uid: authToken.uid as string | undefined,
                email: authToken.email || existingUser.email || undefined,
                name: authToken.displayName || authToken.name || existingUser.name || undefined,
                displayName: authToken.displayName || authToken.name || existingUser.name || undefined,
                image: authToken.photoURL || authToken.picture || existingUser.image || undefined,
                photoURL: authToken.photoURL || authToken.picture || existingUser.image || undefined,
                role: authToken.role as string | undefined,
                emailVerified: !!authToken.emailVerified,
                authProvider: authToken.authProvider || existingUser.authProvider || 'email'
            } as any;

            return session;
        }
    }
};

export const authHandler = ExpressAuth(authConfig);
