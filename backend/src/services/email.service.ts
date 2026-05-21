import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const FROM_EMAIL = process.env.EMAIL_FROM || 'Medico Hub <notifications@medicohub.com.ng>';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'medicohub2024@gmail.com';

// --- MODERN DESIGN TOKENS ---
const COLORS = {
    bg: '#eff6ff', // Slate 50/Blue 50 mix
    card: '#ffffff',
    primary: '#0052cc', // Stronger Blue
    headerBg: '#0f172a', // Deep Navy
    text: '#334155', // Slate 700
    textLight: '#64748B', // Slate 500
    border: '#e2e8f0',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444'
};

const STYLES = {
    container: `
        max-width: 600px; 
        margin: 0 auto; 
        background: #ffffff; 
        font-family: 'Plus Jakarta Sans', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `,
    header: `
        background-color: ${COLORS.headerBg};
        padding: 40px 0;
        text-align: center;
        background-image: linear-gradient(135deg, ${COLORS.headerBg} 0%, #1e293b 100%);
    `,
    body: `
        padding: 40px 20px;
        background-color: #ffffff;
    `,
    h1: `
        color: #1e293b;
        margin: 0 0 20px 0;
        font-size: 24px;
        font-weight: 800;
        letter-spacing: -0.5px;
        line-height: 1.3;
        text-align: center;
    `,
    p: `
        color: ${COLORS.text};
        font-size: 16px;
        line-height: 1.6;
        margin: 0 0 24px 0;
    `,
    button: `
        display: inline-block;
        background-color: ${COLORS.primary};
        color: white;
        padding: 16px 36px;
        text-decoration: none;
        border-radius: 12px;
        font-weight: 700;
        font-size: 16px;
        text-align: center;
        box-shadow: 0 4px 12px rgba(0, 82, 204, 0.25);
        transition: all 0.2s ease;
    `,
    highlightBox: `
        background-color: #f8fafc;
        border: 1px solid ${COLORS.border};
        border-radius: 16px;
        padding: 24px;
        margin: 24px 0;
    `,
    footer: `
        background-color: #f8fafc;
        padding: 30px;
        text-align: center;
        border-top: 1px solid ${COLORS.border};
    `,
    footerLink: `
        color: ${COLORS.textLight};
        text-decoration: none;
        font-size: 12px;
        margin: 0 10px;
        font-weight: 600;
    `
};

const wrapEmail = (title: string, contentHtml: string) => `
<!DOCTYPE html>
<html>
<head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap" rel="stylesheet">
    <style>
        body { margin: 0; padding: 0; background-color: #ffffff; -webkit-font-smoothing: antialiased; }
        a:hover { opacity: 0.9; }
    </style>
</head>
<body style="background-color: #ffffff; padding: 0;">
    <div style="${STYLES.container}">
        <!-- Brand Header -->
        <div style="${STYLES.header}">
            <table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation">
                <tr>
                    <td style="padding-right: 12px;">
                        <img src="https://medicohub.com.ng/favicon.png" alt="Logo" width="32" height="32" style="display: block; border-radius: 8px;" />
                    </td>
                    <td style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 26px; font-weight: 600; letter-spacing: -0.5px; line-height: 1;">
                        <span style="color: #ffffff">Medico</span><span style="color: #3b82f6">Hub</span>
                    </td>
                </tr>
            </table>
        </div>
        
        <!-- Main Content -->
        <div style="${STYLES.body}">
            ${contentHtml}
        </div>

        <!-- Footer -->
        <div style="${STYLES.footer}">
             <div style="margin-bottom: 20px;">
                <a href="https://medicohub.com.ng" style="${STYLES.footerLink}">Home</a>
                <a href="https://medicohub.com.ng/store" style="${STYLES.footerLink}">Store</a>
                <a href="https://medicohub.com.ng/login" style="${STYLES.footerLink}">Login</a>
            </div>
            <p style="color: ${COLORS.textLight}; font-size: 12px; line-height: 1.5; margin: 0;">
                © ${new Date().getFullYear()} Medico Hub. All rights reserved.<br/>
                Empowering Medical Excellence.
            </p>
        </div>
    </div>
</body>
</html>
`;

export const EmailService = {

    // --- WELCOME ---
    sendWelcomeEmail: async (user: any) => {
        if (!resend || !process.env.RESEND_API_KEY) return;
        try {
            const firstName = user.name ? user.name.split(' ')[0] : 'Future Doctor';
            const content = `
                <h1 style="${STYLES.h1}">Welcome to the Future of Medicine, ${firstName}.</h1>
                <p style="${STYLES.p}">
                    You've taken the first step towards academic mastery. <strong>Medico Hub</strong> isn't just a platform; it's your unfair advantage in medical school.
                </p>

                <div style="${STYLES.highlightBox}">
                    <h3 style="margin: 0 0 12px 0; color: ${COLORS.headerBg}; font-size: 16px;">🚀 What you now have access to:</h3>
                    <ul style="margin: 0; padding-left: 20px; color: ${COLORS.text}; font-size: 15px; line-height: 1.6;">
                        <li style="margin-bottom: 8px;"><strong>Curated Study Notes</strong> - High yield, low stress.</li>
                        <li style="margin-bottom: 8px;"><strong>MCAMP Community</strong> - Connect with the best minds.</li>
                        <li style="margin-bottom: 0;"><strong>Premium Tools</strong> - Gear up for success.</li>
                    </ul>
                </div>

                <div style="text-align: center; margin-top: 32px;">
                    <a href="https://medicohub.com.ng/login" style="${STYLES.button}">Launch Dashboard</a>
                </div>
            `;
            await resend.emails.send({
                from: FROM_EMAIL,
                to: user.email,
                subject: 'Welcome to the Inner Circle 🩺',
                html: wrapEmail('Welcome', content)
            });
        } catch (e) { console.error(e); }
    },

    // --- MCAMP WELCOME ---
    sendMcampWelcomeEmail: async (user: any, uniqueId: string) => {
        if (!resend || !process.env.RESEND_API_KEY) return;
        try {
            const content = `
                <div style="text-align: center; margin-bottom: 24px;">
                    <span style="background: #FFFBEB; color: #B45309; padding: 6px 12px; border-radius: 20px; font-size: 11px; font-weight: 700; text-transform: uppercase; border: 1px solid #FEF3C7;">Official Acceptance</span>
                </div>
                <h1 style="${STYLES.h1}">You're In. Welcome to MCAMP. 🌟</h1>
                <p style="${STYLES.p}">
                    Your dedication has paid off. You are now a member of the Medico Hub Mentorship Cohort.
                </p>

                <div style="background: linear-gradient(135deg, #0f172a 0%, #334155 100%); color: white; padding: 32px; border-radius: 16px; margin: 32px 0; text-align: center; position: relative; overflow: hidden; box-shadow: 0 10px 30px -10px rgba(15, 23, 42, 0.4);">
                    <p style="margin: 0; font-size: 11px; text-transform: uppercase; letter-spacing: 2px; color: #94A3B8; font-weight: 700;">Official Member ID</p>
                    <h2 style="margin: 16px 0; font-size: 36px; font-family: 'Courier New', monospace; letter-spacing: 2px; color: #fbbf24; font-weight: 700;">${uniqueId}</h2>
                    <p style="margin: 0; font-size: 13px; color: #CBD5E1;">Keep this ID safe. You'll need it.</p>
                </div>

                <div style="text-align: center;">
                    <a href="https://medicohub.com.ng/login" style="${STYLES.button}">Enter the Cohort</a>
                </div>
            `;
            await resend.emails.send({
                from: FROM_EMAIL,
                to: user.email,
                subject: 'Admission Confirmed: Welcome to MCAMP',
                html: wrapEmail('MCAMP Welcome', content)
            });
        } catch (e) { console.error(e); }
    },

    // --- PRO SUBSCRIPTION ---
    sendUpgradePromptEmail: async (user: any) => {
        if (!resend || !process.env.RESEND_API_KEY) return;
        try {
            const content = `
                <h1 style="${STYLES.h1}">Unlock Your Full Potential 🚀</h1>
                <p style="${STYLES.p}">
                    You're currently on the <strong>Free Tier</strong>. While you have access to basic resources, the real power of Medico Hub lies in our Pro plan.
                </p>
                <div style="${STYLES.highlightBox}; background: linear-gradient(to right, #fdfbf7, #fff);">
                    <h3 style="margin: 0 0 16px 0; color: #b45309;">🏆 Why Go Pro?</h3>
                    <div style="display: flex; margin-bottom: 12px; align-items: start;">
                        <span style="color: ${COLORS.success}; margin-right: 12px; font-weight: bold;">✓</span>
                        <span><strong>Unlimited Access</strong> to all study notes & PDFs</span>
                    </div>
                     <div style="display: flex; margin-bottom: 12px; align-items: start;">
                        <span style="color: ${COLORS.success}; margin-right: 12px; font-weight: bold;">✓</span>
                        <span><strong>Ad-Free</strong> Experience</span>
                    </div>
                     <div style="display: flex; align-items: start;">
                        <span style="color: ${COLORS.success}; margin-right: 12px; font-weight: bold;">✓</span>
                        <span><strong>Priority</strong> Support & MCAMP Placement</span>
                    </div>
                </div>
                 <div style="text-align: center; margin-top: 32px;">
                    <a href="https://medicohub.com.ng/pricing" style="${STYLES.button}">Upgrade to Pro</a>
                    <p style="margin-top: 16px; font-size: 12px; color: ${COLORS.textLight};">Invest in your medical career today.</p>
                </div>
            `;
            await resend.emails.send({
                from: FROM_EMAIL,
                to: user.email,
                subject: 'Unlock Unlimited Access with Pro 🌟',
                html: wrapEmail('Upgrade to Pro', content)
            });
        } catch (e) { console.error(e); }
    },

    sendSubscriptionStatusEmail: async (user: any, isPro: boolean) => {
        if (!resend || !process.env.RESEND_API_KEY) return;
        try {
            const headline = isPro ? 'Upgrade Complete' : 'Manage Subscription';
            const content = isPro ? `
                <h1 style="${STYLES.h1}">Unlimited Access Unlocked 🔓</h1>
                <p style="${STYLES.p}">
                    You are now a <strong>PRO Member</strong>. The restrictions are gone.
                </p>
                <div style="${STYLES.highlightBox}">
                    <h3 style="margin: 0 0 16px 0;">✨ Your New Powers:</h3>
                    <div style="display: flex; margin-bottom: 12px; align-items: start;">
                        <span style="color: ${COLORS.success}; margin-right: 12px;">✓</span>
                        <span>Access to <strong>unlimited</strong> study resources</span>
                    </div>
                    <div style="display: flex; margin-bottom: 12px; align-items: start;">
                        <span style="color: ${COLORS.success}; margin-right: 12px;">✓</span>
                        <span>Priority MCAMP placement</span>
                    </div>
                    <div style="display: flex; align-items: start;">
                        <span style="color: ${COLORS.success}; margin-right: 12px;">✓</span>
                        <span>Exclusive tools & discounts</span>
                    </div>
                </div>
                <div style="text-align: center; margin-top: 32px;">
                    <a href="https://medicohub.com.ng/learning" style="${STYLES.button}">Start Learning</a>
                </div>
            ` : `
                <h1 style="${STYLES.h1}">Subscription Ended</h1>
                <p style="${STYLES.p}">
                    Your Pro subscription has ended. We hope you found value in our premium tools. You can still access all free resources.
                </p>
                <div style="text-align: center; margin-top: 32px;">
                    <a href="https://medicohub.com.ng/pricing" style="${STYLES.button}">Renew Access</a>
                </div>
            `;

            await resend.emails.send({
                from: FROM_EMAIL,
                to: user.email,
                subject: isPro ? 'You are now a PRO Member! 🚀' : 'Pro Subscription Update',
                html: wrapEmail(headline, content)
            });
        } catch (e) { console.error(e); }
    },

    // --- ORDER CONFIRMATION ---
    sendOrderConfirmation: async (order: any) => {
        if (!resend || !process.env.RESEND_API_KEY) return;
        try {
            const itemsList = order.items.map((item: any) => `
                <div style="display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #f1f5f9;">
                    <span style="color: ${COLORS.text}; font-weight: 500;">
                        ${item.name} <span style="font-size: 12px; color: ${COLORS.textLight};">x${item.quantity}</span>
                    </span>
                    <span style="font-weight: 600;">₦${item.price.toLocaleString()}</span>
                </div>
            `).join('');

            const content = `
                <div style="text-align: center;">
                    <div style="width: 60px; height: 60px; background: #ecfdf5; border-radius: 50%; color: #10b981; font-size: 30px; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 20px;">✓</div>
                </div>
                <h1 style="${STYLES.h1}">Order Confirmed!</h1>
                <p style="${STYLES.p}">
                    Thank you for your order, <strong>${order.customer.name}</strong>. We're getting it ready now.
                </p>

                <div style="${STYLES.highlightBox}">
                    <div style="display: flex; justify-content: space-between; font-size: 14px; margin-bottom: 16px; color: ${COLORS.textLight};">
                        <span>Order #${order.orderId}</span>
                        <span>${new Date(order.createdAt).toLocaleDateString()}</span>
                    </div>
                    ${itemsList}
                    <div style="display: flex; justify-content: space-between; padding-top: 16px; margin-top: 8px; font-weight: 800; font-size: 18px; color: ${COLORS.headerBg};">
                        <span>Total Paid</span>
                        <span>₦${order.financials.total.toLocaleString()}</span>
                    </div>
                </div>

                <p style="${STYLES.p}; font-size: 14px; text-align: center; color: ${COLORS.textLight};">
                    You'll receive another email when your order ships.
                </p>
            `;
            await resend.emails.send({
                from: FROM_EMAIL,
                to: order.customer.email,
                subject: `Order #${order.orderId} Confirmed`,
                html: wrapEmail('Order Confirmed', content)
            });
        } catch (e) { console.error(e); }
    },

    // --- ORDER STATUS (Shipped/Delivered/Cancelled) ---
    sendOrderStatusUpdate: async (order: any) => {
        if (!resend || !process.env.RESEND_API_KEY) return;
        try {
            let config = { title: '', msg: '', icon: '', btn: 'Track Order', color: COLORS.primary };

            if (order.status === 'shipped') {
                config = { title: 'On The Way 🚚', msg: 'Your order has been shipped and is heading your way!', icon: '🚚', btn: 'Track Order', color: COLORS.primary };
            } else if (order.status === 'delivered') {
                config = { title: 'Delivered! 📦', msg: 'Your package has arrived safely. Enjoy!', icon: '📦', btn: 'View Order', color: COLORS.success };
            } else if (order.status === 'cancelled') {
                config = { title: 'Order Cancelled', msg: 'Your order has been cancelled and refunded.', icon: '✕', btn: 'Contact Support', color: COLORS.error };
            } else return;

            const content = `
                <h1 style="${STYLES.h1}">${config.title}</h1>
                <p style="${STYLES.p}">${config.msg}</p>
                <div style="text-align: center; margin-top: 32px;">
                    <a href="https://medicohub.com.ng/login" style="${STYLES.button}">${config.btn}</a>
                </div>
            `;

            await resend.emails.send({
                from: FROM_EMAIL,
                to: order.customer.email,
                subject: `Order Update: ${config.title}`,
                html: wrapEmail('Order Update', content)
            });
        } catch (e) { console.error(e); }
    },

    // --- SUSPENSION ---
    sendSuspensionEmail: async (user: any, isSuspended: boolean) => {
        if (!resend || !process.env.RESEND_API_KEY) return;
        try {
            const title = isSuspended ? 'Account Action' : 'Account Restored';
            const content = isSuspended ? `
                <h1 style="${STYLES.h1}; color: ${COLORS.error};">Account Suspended</h1>
                <p style="${STYLES.p}">Your access has been temporarily restricted due to policy violations.</p>
                <div style="${STYLES.highlightBox}; border-color: ${COLORS.error}; background-color: #fef2f2;">
                    Please contact support to resolve this issue.
                </div>
            ` : `
                <h1 style="${STYLES.h1}; color: ${COLORS.success};">Access Restored</h1>
                <p style="${STYLES.p}">We've reactivated your account. You can now log in.</p>
                <div style="text-align: center; margin-top: 32px;">
                    <a href="https://medicohub.com.ng/login" style="${STYLES.button}">Login</a>
                </div>
            `;

            await resend.emails.send({
                from: FROM_EMAIL,
                to: user.email,
                subject: title,
                html: wrapEmail(title, content)
            });
        } catch (e) { console.error(e); }
    },

    // --- AUTH (Verify/Reset) ---
    sendVerificationEmail: async (email: string, link: string) => {
        if (!resend || !process.env.RESEND_API_KEY) {
            throw new Error('Resend is not configured. Missing RESEND_API_KEY.');
        }
        try {
            const content = `
                <h1 style="${STYLES.h1}">Verify Your Email</h1>
                <p style="${STYLES.p}">Please confirm your email address to secure your account.</p>
                <div style="text-align: center; margin: 32px 0;">
                    <a href="${link}" style="${STYLES.button}">Verify Now</a>
                </div>
            `;
            await resend.emails.send({ from: FROM_EMAIL, to: email, subject: 'Verify your email', html: wrapEmail('Verify', content) });
        } catch (e: any) {
            console.error('sendVerificationEmail failed:', e);
            throw new Error(e?.message || 'Failed to send verification email');
        }
    },

    sendPasswordResetEmail: async (email: string, link: string) => {
        if (!resend || !process.env.RESEND_API_KEY) {
            throw new Error('Resend is not configured. Missing RESEND_API_KEY.');
        }
        try {
            const content = `
                <h1 style="${STYLES.h1}">Reset Password</h1>
                <p style="${STYLES.p}">We received a request to change your password. Click below to proceed.</p>
                <div style="text-align: center; margin: 32px 0;">
                    <a href="${link}" style="${STYLES.button}">Reset Password</a>
                </div>
            `;
            await resend.emails.send({ from: FROM_EMAIL, to: email, subject: 'Reset Password', html: wrapEmail('Reset', content) });
        } catch (e: any) {
            console.error('sendPasswordResetEmail failed:', e);
            throw new Error(e?.message || 'Failed to send password reset email');
        }
    },

    // --- ADMIN ALERT ---
    sendAdminOrderAlert: async (order: any) => {
        if (!resend || !process.env.RESEND_API_KEY) return;
        try {
            const content = `
                <h1 style="${STYLES.h1}">💰 New Order: ₦${order.financials.total.toLocaleString()}</h1>
                <p style="${STYLES.p}">Customer: ${order.customer.name}</p>
                <div style="text-align: center; margin-top: 32px;">
                    <a href="https://admin.medicohub.com.ng/store" style="${STYLES.button}">View Order</a>
                </div>
            `;
            await resend.emails.send({ from: FROM_EMAIL, to: ADMIN_EMAIL, subject: 'New Order Alert', html: wrapEmail('Admin', content) });
        } catch (e) { console.error(e); }
    }
};
