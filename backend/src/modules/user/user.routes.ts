import { Router, Request, Response } from 'express';
import { User } from '../../models/User';
import { verifyAuth, verifyAdmin } from '../../middleware/auth.middleware';
import { EmailService } from '../../services/email.service';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User management endpoints
 */

/**
 * @swagger
 * /api/v1/users:
 *   get:
 *     summary: Get all users (Admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of users
 *       403:
 *         description: Forbidden
 */
router.get('/', verifyAuth, verifyAdmin, async (req: Request, res: Response) => {
    try {
        const limitVal = parseInt(req.query.limit as string) || 100;
        const filter = req.query.filter as string; // 'requests'

        let users;
        if (filter === 'requests') {
            // Find users who have a requestedYear set
            users = await User.find({ requestedYear: { $ne: null } })
                .sort({ createdAt: -1 })
                .limit(limitVal);
        } else {
            users = await User.find()
                .sort({ createdAt: -1 })
                .limit(limitVal);
        }

        res.json(users);
    } catch (error) {
        console.error("Error fetching users from MongoDB:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

/**
 * @swagger
 * /api/v1/users/{uid}/ban:
 *   patch:
 *     summary: Ban or Unban a user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: uid
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               ban:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: User status updated
 */
router.patch('/:uid/ban', verifyAuth, verifyAdmin, async (req: Request, res: Response) => {
    const { uid } = req.params;
    const { ban } = req.body;

    try {
        const user = await User.findOneAndUpdate(
            { uid },
            { $set: { status: ban ? 'suspended' : 'active' } },
            { new: true, upsert: true }
        );

        if (user) {
            EmailService.sendSuspensionEmail(user, ban).catch(console.error);
        }

        res.json({ success: true, message: `User ${ban ? 'banned' : 'unbanned'}` });
    } catch (error) {
        console.error("Error banning user:", error);
        res.status(500).json({ error: "Failed to update user status" });
    }
});

/**
 * @swagger
 * /api/v1/users/{uid}/subscription:
 *   patch:
 *     summary: Manually override subscription status
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: uid
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               isPro:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Subscription updated
 */
router.patch('/:uid/subscription', verifyAuth, verifyAdmin, async (req: Request, res: Response) => {
    const { uid } = req.params;
    const { isPro } = req.body;

    try {
        const updatePayload: Record<string, any> = {
            isSubscribed: !!isPro
        };

        if (isPro) {
            updatePayload.subscriptionDate = new Date();
            updatePayload.subscriptionPlan = 'admin_override';
        } else {
            updatePayload.subscriptionDate = null;
            updatePayload.subscriptionPlan = null;
        }

        const user = await User.findOneAndUpdate({ uid }, updatePayload, { new: true });

        if (user) {
            EmailService.sendSubscriptionStatusEmail(user, isPro).catch(console.error);
        }

        res.json({
            success: true,
            message: `User subscription ${isPro ? 'activated' : 'deactivated'}`,
            user
        });
    } catch (error) {
        console.error("Error updating subscription:", error);
        res.status(500).json({ error: "Failed to update subscription" });
    }
});

// DELETE /api/v1/users/:uid
// Permanently delete a user (Auth + MongoDB)
router.delete('/:uid', verifyAuth, async (req: Request, res: Response) => {
    const { uid } = req.params;

    // Security: Only allow user to delete themselves OR an admin
    // Security: Only allow user to delete themselves OR an admin
    // @ts-ignore
    if (req.user.uid !== uid && req.user.admin !== true && req.user.role !== 'admin') {
        return res.status(403).json({ error: "Access denied. You can only delete your own account." });
    }

    try {
        await User.findOneAndDelete({ uid });

        res.json({ success: true, message: "User permanently deleted" });
    } catch (error) {
        console.error("Error deleting user from MongoDB:", error);
        res.status(500).json({ error: "Failed to delete user" });
    }
});

/**
 * @swagger
 * /api/v1/users/{uid}/profile:
 *   get:
 *     summary: Get user profile from MongoDB
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: uid
 *         required: true
 *     responses:
 *       200:
 *         description: User profile
 */
router.get('/:uid/profile', verifyAuth, async (req: Request, res: Response) => {
    const { uid } = req.params;
    try {
        const user = await User.findOne({ uid });
        if (!user) return res.status(404).json({ error: "User not found in MongoDB" });

        // Explicitly map for frontend compatibility
        const userData = user.toObject();
        userData.year = userData.academicYear || userData.year;

        res.json({ success: true, user: userData });
    } catch (error) {
        res.status(500).json({ error: "Internal Server Error" });
    }
});

/**
 * @swagger
 * /api/v1/users/{uid}/profile:
 *   patch:
 *     summary: Update user profile (Photo, Name, Year)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: uid
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               photoURL:
 *                 type: string
 *               name:
 *                 type: string
 *               academicYear:
 *                 type: string
 *     responses:
 *       200:
 *         description: Profile updated
 */
router.patch('/:uid/profile', verifyAuth, async (req: Request, res: Response) => {
    const { uid } = req.params;
    const items = req.body;

    // Security check: Only allow user to edit their own profile OR admin
    // @ts-ignore
    // Security check: Only allow user to edit their own profile OR admin
    // @ts-ignore
    if (req.user.uid !== uid && req.user.admin !== true && req.user.role !== 'admin') {
        return res.status(403).json({ error: "Unauthorized" });
    }

    try {
        const updates: any = {};

        // Map common fields with dot-notation for deep updates
        Object.keys(items).forEach(key => {
            const val = items[key];
            if (val === undefined) return;

            // Skip immutable fields
            if (['_id', 'uid', 'createdAt', 'updatedAt', '__v', 'email'].includes(key)) return;

            // Handle nested objects with dot-notation to prevent overwriting whole structures
            if (key === 'mcamp' && typeof val === 'object' && val !== null) {
                Object.keys(val).forEach(subKey => {
                    updates[`mcamp.${subKey}`] = val[subKey];
                });
            } else if (key === 'analytics' && typeof val === 'object' && val !== null) {
                Object.keys(val).forEach(subKey => {
                    updates[`analytics.${subKey}`] = val[subKey];
                });
            } else if (key === 'resourceProgress' && typeof val === 'object' && val !== null) {
                Object.keys(val).forEach(subKey => {
                    updates[`resourceProgress.${subKey}`] = val[subKey];
                });
            } else if (key === 'year' || key === 'academicYear') {
                // Ensure field mapping preservation and prevent accidental wipes
                if (val && val !== '' && val !== 'General') {
                    updates.academicYear = val;
                } else if (val === 'General') {
                    // Allow set to General if specifically requested (rare), 
                    // but we usually want to block this for onboarded users.
                    updates.academicYear = 'General';
                }
            } else if (key === 'profileImage' || key === 'photoURL') {
                if (val && val !== '') {
                    updates.photoURL = val;
                }
            } else {
                updates[key] = val;
            }
        });

        const oldUser = await User.findOne({ uid });

        // Fix for Admin Updates:
        // If Admin is updating another user, DO NOT upsert. Upserting would use req.user (Admin) email
        // in $setOnInsert, causing E11000 Duplicate Key Error on email field.
        // Upsert is only safe for "Self Updates" where the token belongs to the user being created.
        // @ts-ignore
        const isSelfUpdate = req.user.uid === uid;

        // Construct update operation dynamically to avoid conflicts
        const updateOp: any = { $set: updates };

        // --- HISTORY ARCHIVING ---
        // If enrolling in a DIFFERENT session, archive the old one
        const newUniqueId = updates['mcamp.uniqueId'];
        if (newUniqueId && oldUser?.mcamp?.isEnrolled && oldUser.mcamp.uniqueId && oldUser.mcamp.uniqueId !== newUniqueId) {
            // Archive the old session
            const archivedSession = {
                ...oldUser.mcamp, // Copy old session data
                completionDate: new Date() // Mark completion time
            };

            // Use $push to append to history
            updateOp.$push = { mcampHistory: archivedSession };
        }

        // Only add $setOnInsert for self-updates (signup flow)
        // This prevents "Updating the path 'role' would create a conflict at 'role'" errors
        // when admin updates a user and sends keys that are also in $setOnInsert
        if (isSelfUpdate) {
            updateOp.$setOnInsert = {
                email: req.user.email || '',
                role: 'student',
                name: req.user.name || req.user.displayName || 'Student',
                photoURL: req.user.picture || req.user.photoURL || undefined
            };
        }

        const user = await User.findOneAndUpdate(
            { uid },
            updateOp,
            { new: true, upsert: isSelfUpdate, runValidators: true }
        );

        // --- EMAIL TRIGGERS ---
        if (user) {
            // 1. Welcome Email: Send if name was just set and they didn't have one before
            // Or if it's a completely new user document (oldUser is null)
            if (!oldUser || (!oldUser.name && updates.name)) {
                EmailService.sendWelcomeEmail(user).catch(e => console.error("Welcome email failed", e));
            }

            // 2. MCAMP Welcome: Send if mcamp.isEnrolled transitioned from false/undefined to true
            const wasEnrolled = oldUser?.mcamp?.isEnrolled;
            const isEnrolled = user.mcamp?.isEnrolled;
            if (isEnrolled && !wasEnrolled) {
                EmailService.sendMcampWelcomeEmail(user, user.mcamp?.uniqueId || 'PENDING').catch(e => console.error("MCAMP email failed", e));
            }

            // 3. Subscription Status Change:
            const wasSubscribed = oldUser?.isSubscribed;
            const isSubscribed = user.isSubscribed;

            if (!oldUser) {
                // NEW USER
                if (!isSubscribed) {
                    // Send "Upgrade to Pro" prompt instead of "Subscription Ended"
                    // (Optional: You might want to skip this if they get a Welcome email already, 
                    // but the user explicitly requested this specific email)
                    EmailService.sendUpgradePromptEmail(user).catch(e => console.error("Upgrade prompt email failed", e));
                } else {
                    // New user started as Pro (unlikely but possible via admin)
                    EmailService.sendSubscriptionStatusEmail(user, true).catch(e => console.error("Subscription email failed", e));
                }
            } else {
                // EXISTING USER UPDATE
                if (isSubscribed !== wasSubscribed) {
                    EmailService.sendSubscriptionStatusEmail(user, !!isSubscribed).catch(e => console.error("Subscription email failed", e));
                }
            }
        }

        // Explicitly map for frontend compatibility
        const userData = user ? user.toObject() : null;
        if (userData) {
            userData.year = userData.academicYear || userData.year;
        }

        res.json({ success: true, user: userData });
    } catch (error: any) {
        console.error("Error updating profile in MongoDB:", error);
        // Expose error message to client for debugging
        res.status(500).json({ error: error.message || "Failed to update profile", details: error });
    }
});

export default router;
