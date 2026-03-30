import { Router } from 'express';
import { verifyAuth, verifyAdmin } from '../../middleware/auth.middleware';
import SystemSettings from '../../models/SystemSettings';

const router = Router();

// GET /api/v1/settings
router.get('/', async (req, res) => {
    try {
        let settings = await SystemSettings.findOne({ id: 'config' });
        if (!settings) {
            // Return default settings if none exist
            return res.json({
                maintenanceMode: false,
                allowSignups: true,
                announcement: '',
                mcampLive: false,
                mcampEnrollment: true,
                proDiscountEnabled: true,
                proDiscountPercentage: 10
            });
        }
        res.json(settings);
    } catch (error: any) {
        res.status(500).json({ error: "Failed to fetch system settings" });
    }
});

// PATCH /api/v1/settings (Admin only)
router.patch('/', verifyAdmin, async (req, res) => {
    try {
        const updates = req.body;
        const result = await SystemSettings.findOneAndUpdate(
            { id: 'config' },
            { ...updates, updatedAt: new Date() },
            { upsert: true, new: true }
        );
        res.json(result);
    } catch (error: any) {
        res.status(500).json({ error: "Failed to update system settings" });
    }
});

export default router;
