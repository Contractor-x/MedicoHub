import { Request, Response, NextFunction } from 'express';
import { getToken } from '@auth/core/jwt';

// Extend Express Request to include user
declare global {
    namespace Express {
        interface Request {
            user?: any;
        }
    }
}

/**
 * AUTH MIDDLEWARE:
 * These are like "Bouncers" at a club. They check if a user is allowed to access
 * certain parts of the backend (like the Admin panel).
 */

/**
 * Checks if the user is actually logged in.
 */
export const verifyAuth = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const authjsToken = await getToken({
            req: req as any,
            secret: process.env.AUTH_SECRET || process.env.BETTER_AUTH_SECRET || process.env.NEXTAUTH_SECRET || 'medicohub-dev-auth-secret'
        });

        if (authjsToken) {
            req.user = authjsToken;
            return next();
        }
        return res.status(401).json({ error: 'Unauthorized: No active session found' });
    } catch (error) {
        console.error("Auth Error:", error);
        return res.status(403).json({ error: 'Unauthorized: Invalid session' });
    }
};

/**
 * Checks if the user is an ADMIN.
 */
export const verifyAdmin = async (req: Request, res: Response, next: NextFunction) => {
    // A secret backdoor for developers/testing (Moved to ENV for production)
    const adminSecret = process.env.ADMIN_SECRET || 'medico_admin_secret_2025';
    if (req.headers['x-admin-secret'] === adminSecret) {
        return next();
    }

    if (!req.user) {
        try {
            const authjsToken = await getToken({
                req: req as any,
                secret: process.env.AUTH_SECRET || process.env.BETTER_AUTH_SECRET || process.env.NEXTAUTH_SECRET || 'medicohub-dev-auth-secret'
            });

            if (!authjsToken) {
                return res.status(401).json({ error: 'Unauthorized: No active session found' });
            }
            req.user = authjsToken;
        } catch (error) {
            console.error("verifyAdmin Auth Error:", error);
            return res.status(403).json({ error: 'Unauthorized: Invalid session' });
        }
    }

    if (req.user.admin === true || req.user.role === 'admin') {
        next(); // They are an admin, let them through
    } else {
        return res.status(403).json({ error: 'Forbidden: Admin access required' });
    }
};

/**
 * OPTIONAL AUTH:
 * Tries to verify the user but doesn't block the request if they are not logged in.
 * Use this for guest checkouts or public pages that can show personalized info.
 */
export const optionalAuth = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const authjsToken = await getToken({
            req: req as any,
                secret: process.env.AUTH_SECRET || process.env.BETTER_AUTH_SECRET || process.env.NEXTAUTH_SECRET || 'medicohub-dev-auth-secret'
        });

        if (authjsToken) {
            req.user = authjsToken;
        }
    } catch (error) {
        // We ignore errors here because authentication is optional
        console.warn("Optional Auth failed, continuing as guest.");
    }
    next();
};
