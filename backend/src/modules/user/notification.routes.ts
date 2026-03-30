import { Router } from 'express';
import { verifyAuth, verifyAdmin } from '../../middleware/auth.middleware';
import Notification from '../../models/Notification';

const router = Router();

// GET /api/v1/notifications
// Fetch notifications for the authenticated user
router.get('/', verifyAuth, async (req, res) => {
    try {
        const notifications = await Notification.find({
            $or: [
                { target: req.user.uid },
                { target: 'all' }
            ]
        }).sort({ createdAt: -1 }).limit(50);

        res.json(notifications);
    } catch (error: any) {
        res.status(500).json({ error: "Failed to fetch notifications" });
    }
});

// PATCH /api/v1/notifications/:id/read
router.patch('/:id/read', verifyAuth, async (req, res) => {
    try {
        await Notification.findOneAndUpdate(
            { _id: req.params.id, target: req.user.uid },
            { read: true }
        );
        res.json({ success: true });
    } catch (error: any) {
        res.status(500).json({ error: "Failed to mark notification as read" });
    }
});

// POST /api/v1/notifications/broadcast (Admin only)
router.post('/broadcast', verifyAdmin, async (req, res) => {
    try {
        const { target, title, message, type, icon, data } = req.body;
        const notification = new Notification({
            target: target || 'all',
            title,
            message,
            type,
            icon,
            data
        });
        await notification.save();
        res.status(201).json(notification);
    } catch (error: any) {
        res.status(500).json({ error: "Failed to send notification" });
    }
});

export default router;
