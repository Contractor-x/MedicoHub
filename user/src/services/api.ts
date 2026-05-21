import { ResourceProgress } from '../types';

// Robust URL Handling: Ensure we have the correct base for v1 and v3
const getRootUrl = () => {
    let url = import.meta.env.VITE_API_URL || 'https://medicohubwebsite-production.up.railway.app';
    url = String(url).trim();
    while (url.endsWith('/') || url.endsWith('/api/v1') || url.endsWith('/api/v3') || url.endsWith('/api')) {
        url = url.replace(/\/$/, "").replace(/\/api\/v1$/, "").replace(/\/api\/v3$/, "").replace(/\/api$/, "");
    }
    return url;
};

const ROOT_URL = getRootUrl();
const V1_URL = `${ROOT_URL}/api/v1`;
const V3_URL = `${ROOT_URL}/api/v3`;

if (typeof window !== 'undefined') {
    const originalFetch = window.fetch.bind(window);
    window.fetch = ((input: RequestInfo | URL, init: RequestInit = {}) =>
        originalFetch(input, { credentials: 'include', ...init })) as typeof window.fetch;
}

export const api = {
    auth: {
        getSession: async () => {
            const res = await fetch(`${ROOT_URL}/auth/session`);
            if (!res.ok) {
                return { user: null };
            }
            return res.json();
        },
        register: async (name: string, email: string, password: string) => {
            const res = await fetch(`${V1_URL}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password })
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Failed to register');
            }
            return res.json();
        },
        login: async (email: string, password: string) => {
            const csrfRes = await fetch(`${ROOT_URL}/auth/csrf`);
            const csrfJson = await csrfRes.json().catch(() => ({}));
            const csrfToken = csrfJson.csrfToken || '';
            const body = new URLSearchParams({
                csrfToken,
                email,
                password,
                app: 'user',
                redirect: 'false',
                json: 'true',
                callbackUrl: `${window.location.origin}/#/dashboard`
            });

            const res = await fetch(`${ROOT_URL}/auth/callback/credentials?json=true`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body
            });

            const payload = await res.json().catch(() => ({} as any));
            if (!res.ok || payload?.error) {
                const raw = String(payload?.error || payload?.message || 'Failed to sign in');
                if (raw.toLowerCase().includes('credential')) {
                    throw new Error('Invalid email or password.');
                }
                if (raw.toLowerCase().includes('csrf')) {
                    throw new Error('Sign-in session expired. Please refresh and try again.');
                }
                throw new Error(raw);
            }

            // Auth.js can return a redirect URL with an encoded error query even on 200.
            if (typeof payload?.url === 'string') {
                const lowered = payload.url.toLowerCase();
                if (lowered.includes('error=')) {
                    if (lowered.includes('credentials')) throw new Error('Invalid email or password.');
                    if (lowered.includes('csrf')) throw new Error('Sign-in session expired. Please refresh and try again.');
                    throw new Error('Login failed. Please try again.');
                }
            }

            return payload;
        },
        signOut: async () => {
            const csrfRes = await fetch(`${ROOT_URL}/auth/csrf`);
            const csrfJson = await csrfRes.json().catch(() => ({}));
            const csrfToken = csrfJson.csrfToken || '';

            const body = new URLSearchParams({
                csrfToken,
                callbackUrl: `${window.location.origin}/#/login`,
                json: 'true'
            });

            await fetch(`${ROOT_URL}/auth/signout`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body
            });
        },
        signInWithGoogle: async (callbackUrl: string) => {
            const csrfRes = await fetch(`${ROOT_URL}/auth/csrf`);
            const csrfJson = await csrfRes.json().catch(() => ({}));
            const csrfToken = csrfJson.csrfToken || '';
            if (!csrfToken) throw new Error('Unable to start Google sign-in. Missing CSRF token.');

            // Use a real browser form post for Auth.js OAuth start to avoid fetch redirect/CORS quirks.
            const form = document.createElement('form');
            form.method = 'POST';
            form.action = `${ROOT_URL}/auth/signin/google`;
            form.style.display = 'none';

            const csrfInput = document.createElement('input');
            csrfInput.name = 'csrfToken';
            csrfInput.value = csrfToken;
            form.appendChild(csrfInput);

            const callbackInput = document.createElement('input');
            callbackInput.name = 'callbackUrl';
            callbackInput.value = callbackUrl;
            form.appendChild(callbackInput);

            document.body.appendChild(form);
            form.submit();
        },
        sendVerification: async () => {
            const res = await fetch(`${V1_URL}/auth/send-verification`, {
                method: 'POST'
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Failed to send verification email');
            }
            return res.json();
        },
        sendReset: async (email: string) => {
            const res = await fetch(`${V1_URL}/auth/send-reset`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Failed to send password reset email');
            }
            return res.json();
        },
        verifyEmail: async (token: string) => {
            const res = await fetch(`${V1_URL}/auth/verify-email`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token })
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Failed to verify email');
            }
            return res.json();
        },
        resetPassword: async (token: string, password: string) => {
            const res = await fetch(`${V1_URL}/auth/reset-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, password })
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Failed to reset password');
            }
            return res.json();
        },
        updateProfile: async (data: any) => {
            const res = await fetch(`${V1_URL}/auth/me`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Failed to update profile');
            }
            return res.json();
        },
        updatePassword: async (password: string) => {
            const res = await fetch(`${V1_URL}/auth/me/password`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ password })
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Failed to update password');
            }
            return res.json();
        }
    },
    coupons: {
        verify: async (code: string, subtotal: number) => {
            const res = await fetch(`${V1_URL}/coupons/verify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code, subtotal })
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Invalid coupon');
            }
            return res.json();
        },
        use: async (code: string) => {
            const res = await fetch(`${V1_URL}/coupons/use`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code })
            });
            return res.json();
        }
    },
    delivery: {
        getZones: async () => {
            try {
                const res = await fetch(`${V1_URL}/delivery`);
                if (!res.ok) throw new Error("Failed to fetch delivery zones");
                return res.json();
            } catch (error) {
                console.error("Delivery API failed, using static fallback:", error);
                return [
                    { name: 'Lagos', price: 3000 },
                    { name: 'Abuja', price: 4500 },
                    { name: 'Rivers', price: 5000 },
                    { name: 'Ogun', price: 3500 },
                    { name: 'Other States', price: 6000 }
                ];
            }
        }
    },
    orders: {
        create: async (data: any) => {
            const res = await fetch(`${V1_URL}/orders`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });
            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.error || errData.message || "Order creation failed");
            }
            return res.json();
        }
    },
    resources: {
        getAll: async () => {
            try {
                const res = await fetch(`${V3_URL}/resources`, {
                });
                if (!res.ok) throw new Error("Backend resources fetch failed");
                return await res.json();
            } catch (err) {
                console.error("Resources fetch failed:", err);
                return [];
            }
        }
    },
    products: {
        getAll: async () => {
            try {
                const res = await fetch(`${V3_URL}/products`);
                if (!res.ok) throw new Error("Backend products fetch failed");
                return await res.json();
            } catch (err) {
                console.error("Products fetch failed:", err);
                return [];
            }
        }
    },
    analytics: {
        logSession: async (sessionData: any) => {
            // Log to Backend V3 for aggregation
            try {
                const res = await fetch(`${V1_URL}/analytics/activity`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(sessionData)
                });
                if (!res.ok) console.warn("Log activity to V1 failed");
            } catch (e) {
                console.error("Failed to log activity", e);
            }

            // Also update the User's direct analytics in MongoDB via the API
            if (sessionData.userId && sessionData.durationSeconds) {
                try {
                    const userData = await api.users.get(sessionData.userId);
                    if (userData) {
                        const currentAnalytics = userData.analytics || {
                            totalHours: 0,
                            streakDays: 0,
                            monthlyActivity: []
                        };

                        const addedHours = sessionData.durationSeconds / 3600;
                        const newTotal = (currentAnalytics.totalHours || 0) + addedHours;

                        // We'll let the backend handle the complex aggregation logic 
                        // if we want to be clean, but for now we'll send the incremental update
                        await api.users.update(sessionData.userId, {
                            analytics: {
                                ...currentAnalytics,
                                totalHours: newTotal,
                                lastStudyDate: new Date().toISOString()
                            }
                        });
                    }
                } catch (err) {
                    console.error("Local analytics update failed:", err);
                }
            }
            return { success: true };
        },
        getUserProgress: async (userId: string) => {
            try {
                const userData = await api.users.get(userId);
                if (userData && userData.resourceProgress) {
                    return Object.entries(userData.resourceProgress).map(([id, data]: [string, any]) => ({
                        resourceId: id,
                        ...data
                    })) as ResourceProgress[];
                }
                return [] as ResourceProgress[];
            } catch (e) {
                console.error("Failed to fetch user progress from MongoDB", e);
                return [] as ResourceProgress[];
            }
        },
        updateResourceProgress: async (userId: string, resourceId: string, progressData: Partial<ResourceProgress>) => {
            // Push to MongoDB via general profile update or specific progress endpoint
            try {
                const userData = await api.users.get(userId);
                const progress = userData.resourceProgress || {};
                progress[resourceId] = {
                    ...progress[resourceId],
                    ...progressData,
                    lastUpdated: new Date().toISOString()
                };
                await api.users.update(userId, { resourceProgress: progress });
            } catch (e) {
                console.error("Failed to update resource progress in MongoDB", e);
            }
        },
    }, users: {
        get: async (uid: string) => {
            const res = await fetch(`${V1_URL}/users/${uid}/profile`, {
            });
            if (!res.ok) throw new Error("Failed to fetch user profile from MongoDB");
            const data = await res.json();
            return data.user;
        },
        update: async (uid: string, data: any) => {
            const res = await fetch(`${V1_URL}/users/${uid}/profile`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });
            if (!res.ok) throw new Error("Failed to update user profile in MongoDB");
            return res.json();
        },
        delete: async (uid: string) => {
            const res = await fetch(`${V1_URL}/users/${uid}`, {
                method: 'DELETE',
            });
            if (!res.ok) throw new Error("Failed to delete user profile from MongoDB");
            return res.json();
        }
    },
    notifications: {
        get: async () => {
            const res = await fetch(`${V1_URL}/notifications`, {
            });
            if (!res.ok) throw new Error("Failed to fetch notifications from MongoDB");
            return res.json();
        },
        markAsRead: async (id: string) => {
            const res = await fetch(`${V1_URL}/notifications/${id}/read`, {
                method: 'PATCH'
            });
            if (!res.ok) throw new Error("Failed to mark notification as read in MongoDB");
            return res.json();
        },
        broadcast: async (data: any) => {
            const res = await fetch(`${V1_URL}/notifications/broadcast`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });
            if (!res.ok) throw new Error("Broadcast failed in MongoDB");
            return res.json();
        }
    },
    settings: {
        get: async () => {
            const res = await fetch(`${V1_URL}/settings`);
            if (!res.ok) throw new Error("Failed to fetch settings from MongoDB");
            return res.json();
        }
    },
    curriculum: {
        get: async (year?: string) => {
            const query = year ? `?year=${encodeURIComponent(year)}` : '';
            const res = await fetch(`${V1_URL}/curriculum${query}`);
            if (!res.ok) throw new Error("Failed to fetch curriculum from MongoDB");
            return res.json();
        }
    }
};
