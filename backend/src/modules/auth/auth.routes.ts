import express from 'express';
import { randomUUID } from 'crypto';
import { EmailService } from '../../services/email.service';
import { User } from '../../models/User';
import { optionalAuth, verifyAuth } from '../../middleware/auth.middleware';
import { hashPassword, verifyPassword } from '../../utils/password';
import { signToken, verifyToken } from '../../utils/signed-token';

const router = express.Router();

const frontendUrl = process.env.FRONTEND_URL || 'https://medicohub.com.ng';

const toSessionUser = (user: any) => {
    if (!user) return null;

    const row = user.toObject ? user.toObject() : user;
    return {
        id: row.uid,
        uid: row.uid,
        email: row.email,
        name: row.name,
        displayName: row.name,
        image: row.photoURL || undefined,
        photoURL: row.photoURL || undefined,
        role: row.role,
        emailVerified: !!row.emailVerified,
        authProvider: row.authProvider || 'email'
    };
};

const sendVerificationLink = async (user: any) => {
    const token = signToken({ purpose: 'verify-email', email: user.email, uid: user.uid }, 60 * 60 * 24);
    const link = `${frontendUrl}/#/verify-email?token=${encodeURIComponent(token)}`;
    await EmailService.sendVerificationEmail(user.email, link);
};

const sendResetLink = async (email: string) => {
    const token = signToken({ purpose: 'reset-password', email }, 60 * 30);
    const link = `${frontendUrl}/#/reset-password?token=${encodeURIComponent(token)}`;
    await EmailService.sendPasswordResetEmail(email, link);
};

router.get('/session', optionalAuth, async (req, res) => {
    try {
        const uid = req.user?.uid || req.user?.sub;
        if (!uid) {
            return res.json({ user: null });
        }

        const user = await User.findOne({ uid });
        return res.json({ user: toSessionUser(user) });
    } catch (error: any) {
        console.error('Error fetching auth session:', error);
        return res.status(500).json({ error: error.message || 'Failed to load session' });
    }
});

router.get('/me', verifyAuth, async (req, res) => {
    try {
        const uid = req.user?.uid || req.user?.sub;
        const user = await User.findOne({ uid });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        return res.json({ user: toSessionUser(user) });
    } catch (error: any) {
        console.error('Error loading profile:', error);
        return res.status(500).json({ error: error.message || 'Failed to load profile' });
    }
});

router.post('/register', async (req, res) => {
    try {
        const { name, email, password } = req.body || {};
        const normalizedEmail = String(email || '').trim().toLowerCase();
        const cleanName = String(name || '').trim();
        const cleanPassword = String(password || '');

        if (!normalizedEmail || !cleanName || cleanPassword.length < 8) {
            return res.status(400).json({ error: 'Name, email and an 8 character password are required' });
        }

        const existing = await User.findOne({ email: normalizedEmail });
        if (existing && existing.passwordHash) {
            return res.status(409).json({ error: 'Email is already associated with another account.' });
        }

        const user = existing || new User({
            uid: randomUUID(),
            email: normalizedEmail,
            role: 'student'
        });

        user.name = cleanName;
        user.passwordHash = hashPassword(cleanPassword);
        user.authProvider = 'email';
        user.emailVerified = false;
        if (!user.photoURL) {
            user.photoURL = `https://ui-avatars.com/api/?name=${encodeURIComponent(cleanName)}&background=0D8ABC&color=fff`;
        }

        await user.save();
        await sendVerificationLink(user);

        return res.status(201).json({
            success: true,
            user: toSessionUser(user),
            message: 'Registration successful. Please check your email to verify your account.'
        });
    } catch (error: any) {
        console.error('Error registering user:', error);
        return res.status(500).json({ error: error.message || 'Failed to register user' });
    }
});

router.post('/send-verification', verifyAuth, async (req, res) => {
    try {
        const uid = req.user?.uid || req.user?.sub;
        if (!uid) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const user = await User.findOne({ uid });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        await sendVerificationLink(user);
        return res.status(200).json({ message: 'Verification email sent successfully' });
    } catch (error: any) {
        console.error('Error sending verification email:', error);
        return res.status(500).json({ error: error.message || 'Failed to send verification email' });
    }
});

router.post('/verify-email', async (req, res) => {
    try {
        const { token } = req.body || {};
        const payload = verifyToken<{ email?: string; uid?: string }>(String(token || ''), 'verify-email');
        if (!payload?.email) {
            return res.status(400).json({ error: 'Invalid or expired verification link' });
        }

        const user = await User.findOneAndUpdate(
            { email: String(payload.email).trim().toLowerCase() },
            { $set: { emailVerified: true } },
            { new: true }
        );

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        return res.json({ success: true, user: toSessionUser(user) });
    } catch (error: any) {
        console.error('Error verifying email:', error);
        return res.status(500).json({ error: error.message || 'Failed to verify email' });
    }
});

router.post('/send-reset', async (req, res) => {
    try {
        const { email } = req.body || {};
        const normalizedEmail = String(email || '').trim().toLowerCase();

        if (!normalizedEmail) {
            return res.status(400).json({ error: 'Email is required' });
        }

        const user = await User.findOne({ email: normalizedEmail });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        await sendResetLink(normalizedEmail);
        return res.status(200).json({ message: 'Password reset email sent successfully' });
    } catch (error: any) {
        console.error('Error sending password reset email:', error);
        return res.status(500).json({ error: error.message || 'Failed to send password reset email' });
    }
});

router.post('/reset-password', async (req, res) => {
    try {
        const { token, password } = req.body || {};
        const cleanPassword = String(password || '');
        const payload = verifyToken<{ email?: string }>(String(token || ''), 'reset-password');

        if (!payload?.email) {
            return res.status(400).json({ error: 'Invalid or expired reset link' });
        }

        if (cleanPassword.length < 8) {
            return res.status(400).json({ error: 'Password must be at least 8 characters' });
        }

        const user = await User.findOne({ email: String(payload.email).trim().toLowerCase() });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        user.passwordHash = hashPassword(cleanPassword);
        user.authProvider = user.authProvider || 'email';
        await user.save();

        return res.json({ success: true, message: 'Password updated successfully' });
    } catch (error: any) {
        console.error('Error resetting password:', error);
        return res.status(500).json({ error: error.message || 'Failed to reset password' });
    }
});

router.patch('/me', verifyAuth, async (req, res) => {
    try {
        const uid = req.user?.uid || req.user?.sub;
        const { displayName, photoURL } = req.body || {};
        if (!uid) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const updates: Record<string, any> = {};
        if (typeof displayName === 'string' && displayName.trim()) {
            updates.name = displayName.trim();
        }
        if (typeof photoURL === 'string') {
            updates.photoURL = photoURL.trim();
        }

        const user = await User.findOneAndUpdate({ uid }, { $set: updates }, { new: true });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        return res.json({ user: toSessionUser(user) });
    } catch (error: any) {
        console.error('Error updating profile:', error);
        return res.status(500).json({ error: error.message || 'Failed to update profile' });
    }
});

router.patch('/me/password', verifyAuth, async (req, res) => {
    try {
        const uid = req.user?.uid || req.user?.sub;
        const { password } = req.body || {};
        if (!uid) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        if (String(password || '').length < 8) {
            return res.status(400).json({ error: 'Password must be at least 8 characters' });
        }

        const user = await User.findOne({ uid });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        user.passwordHash = hashPassword(String(password));
        user.authProvider = user.authProvider || 'email';
        await user.save();

        return res.json({ message: 'Password updated successfully' });
    } catch (error: any) {
        console.error('Error updating password:', error);
        return res.status(500).json({ error: error.message || 'Failed to update password' });
    }
});

router.post('/google/callback-redirect', async (req, res) => {
    const callbackUrl = String(req.body?.callbackUrl || frontendUrl);
    return res.json({ callbackUrl });
});

export default router;
