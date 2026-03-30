
import { Router, Request, Response } from 'express';
import { ActivityService } from './activity.service';
import { verifyAuth } from '../../middleware/auth.middleware';
import { ActivitySession } from '../../types/firestore-v3';

const router = Router();

// POST /api/v3/analytics/session
// Receives a completed activity session log from the frontend
router.post('/session', verifyAuth, async (req: Request, res: Response) => {
    try {
        const sessionData: ActivitySession = req.body;

        // Security check: Ensure the log belongs to the authenticated user
        if (!req.user || req.user.uid !== sessionData.userId) {
            return res.status(403).json({ error: "Forbidden: User ID mismatch" });
        }

        await ActivityService.logSession(req.user.uid, sessionData);
        res.json({ success: true });
    } catch (error) {
        console.error("Analytics Error:", error);
        res.status(500).json({ error: "Failed to log session" });
    }
});

export default router;
