import { Router, Request, Response } from 'express';
import { AnalyticsService } from './analytics.service';
import { verifyAuth, verifyAdmin } from '../../middleware/auth.middleware';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Analytics
 *   description: Platform statistics
 */

/**
 * @swagger
 * /api/v1/analytics/admin/global:
 *   get:
 *     summary: Get global activity stats (Admin only)
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Array of daily stats
 *       403:
 *         description: Not an admin
 */
router.get('/admin/global', verifyAuth, verifyAdmin, async (req: Request, res: Response) => {
    try {
        const stats = await AnalyticsService.getGlobalStats(30);
        res.json(stats);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to fetch stats" });
    }
});

router.get('/admin/counts', verifyAuth, verifyAdmin, async (req: Request, res: Response) => {
    try {
        const { User } = await import('../../models/User');
        const { Resource } = await import('../../models/Resource');
        const { Product } = await import('../../models/Product');

        const [users, resources, products] = await Promise.all([
            User.countDocuments(),
            Resource.countDocuments(),
            Product.countDocuments()
        ]);

        res.json({ users, resources, products });
    } catch (error) {
        console.error("Error fetching counts:", error);
        res.status(500).json({ error: "Failed to fetch counts from MongoDB" });
    }
});

/**
 * @swagger
 * /api/v1/analytics/activity:
 *   post:
 *     summary: Record an activity (Internal/Test)
 *     tags: [Analytics]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *               type:
 *                 type: string
 *     responses:
 *       200:
 *         description: Recorded
 */
router.post('/activity', async (req: Request, res: Response) => {
    // In production, userId would come from req.user.uid via verifyAuth
    const { userId, type, data } = req.body;
    await AnalyticsService.recordActivity(userId, type, data || {});
    res.json({ success: true });
});

export default router;
