import express from 'express';
import { getAuth } from 'firebase-admin/auth';
import { EmailService } from '../../services/email.service';

const router = express.Router();

// Helper to generate a link settings object (optional, for handling web vs mobile redirects)
const actionCodeSettings = {
    url: 'https://medicohub.com.ng/dashboard', // Redirect here after verification/reset is handled
    handleCodeInApp: false, // The link opens a webpage, not the app directly
};

/**
 * POST /api/v1/auth/send-verification
 * Generates a Firebase Email Verification Link and sends it via Resend.
 */
router.post('/send-verification', async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
        }

        // 1. Generate the link using Firebase Admin SDK
        const firebaseLink = await getAuth().generateEmailVerificationLink(email, actionCodeSettings);

        // 2. Extract oobCode and construct Custom Frontend Link
        // We parse the generated firebase link to get the 'oobCode'
        const urlObj = new URL(firebaseLink);
        const oobCode = urlObj.searchParams.get('oobCode');
        const mode = urlObj.searchParams.get('mode') || 'verifyEmail';

        // Construct the branded link pointing to our React App
        // Frontend uses HashRouter, so we use /#/verify-email
        const link = `https://medicohub.com.ng/#/verify-email?mode=${mode}&oobCode=${oobCode}`;

        // 2. Send the branded email using Resend
        await EmailService.sendVerificationEmail(email, link);

        res.status(200).json({ message: 'Verification email sent successfully' });
    } catch (error: any) {
        console.error('Error sending verification email:', error);
        res.status(500).json({ error: error.message || 'Failed to send verification email' });
    }
});

/**
 * POST /api/v1/auth/send-reset
 * Generates a Firebase Password Reset Link and sends it via Resend.
 */
router.post('/send-reset', async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
        }

        // 1. Generate the link using Firebase Admin SDK
        const firebaseLink = await getAuth().generatePasswordResetLink(email, actionCodeSettings);

        // 2. Extract oobCode and construct Custom Frontend Link
        const urlObj = new URL(firebaseLink);
        const oobCode = urlObj.searchParams.get('oobCode');
        const mode = urlObj.searchParams.get('mode') || 'resetPassword';

        // Construct the branded link pointing to our React App Reset Page
        const link = `https://medicohub.com.ng/#/reset-password?mode=${mode}&oobCode=${oobCode}`;

        // 2. Send the branded email using Resend
        await EmailService.sendPasswordResetEmail(email, link);

        res.status(200).json({ message: 'Password reset email sent successfully' });
    } catch (error: any) {
        console.error('Error sending password reset email:', error);

        // Handle case where user not found
        if (error.code === 'auth/user-not-found') {
            // For security, we usually don't want to tell the user the email doesn't exist, 
            // but for now, we'll return a generic success to prevent enumeration or specific error if preferred.
            // However, to be helpful to the UI, let's return the error for now or log it.
            return res.status(404).json({ error: 'User not found' });
        }

        res.status(500).json({ error: error.message || 'Failed to send password reset email' });
    }
});

export default router;
