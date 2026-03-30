import { Request, Response, NextFunction } from 'express';
import { auth } from '../config/firebase';

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
    const authHeader = req.headers.authorization;

    // Every request from the frontend should have a "Ticket" (Token)
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized: No token provided' });
    }

    const token = authHeader.split(' ')[1];

    try {
        // We ask Firebase: "Is this ticket real and valid?"
        const decodedToken = await auth.verifyIdToken(token);
        req.user = decodedToken; // Save the user info so other parts of the code can use it
        next(); // User is allowed in, move to the next step
    } catch (error) {
        console.error("Auth Error:", error);
        return res.status(403).json({ error: 'Unauthorized: Invalid token' });
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
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Unauthorized: No token provided' });
        }

        const token = authHeader.split(' ')[1];
        try {
            const decodedToken = await auth.verifyIdToken(token);
            req.user = decodedToken;
        } catch (error) {
            console.error("verifyAdmin Auth Error:", error);
            return res.status(403).json({ error: 'Unauthorized: Invalid token' });
        }
    }

    // We check the "Admin" tag that we put on their Firebase account
    if (req.user.admin === true) {
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
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return next();
    }

    const token = authHeader.split(' ')[1];
    try {
        const decodedToken = await auth.verifyIdToken(token);
        req.user = decodedToken;
    } catch (error) {
        // We ignore errors here because authentication is optional
        console.warn("Optional Auth failed, continuing as guest.");
    }
    next();
};

