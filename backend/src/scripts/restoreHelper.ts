
import dotenv from 'dotenv';
import path from 'path';

// Force load .env from backend root
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import { admin } from '../config/firebase';

const email = process.argv[2] || 'medicohub2024@gmail.com';
const TEMP_PASSWORD = 'MedicoHub2024!'; // Default password for restoration

const restoreAdmin = async () => {
    try {
        console.log(`🔍 Checking for user: ${email}...`);

        let user;
        try {
            user = await admin.auth().getUserByEmail(email);
            console.log(`✅ User found (UID: ${user.uid}).`);
        } catch (error: any) {
            if (error.code === 'auth/user-not-found') {
                console.log(`⚠️ User not found. Creating new admin account...`);
                user = await admin.auth().createUser({
                    email: email,
                    emailVerified: true,
                    password: TEMP_PASSWORD,
                    displayName: 'Admin User',
                    photoURL: 'https://ui-avatars.com/api/?name=Admin+User&background=0D8ABC&color=fff'
                });
                console.log(`🎉 Account created!`);
                console.log(`🔑 Temporary Password: ${TEMP_PASSWORD}`);
            } else {
                throw error;
            }
        }

        if (user) {
            console.log(`🛡️ Setting admin privileges...`);
            await admin.auth().setCustomUserClaims(user.uid, { admin: true, role: 'admin' });
            console.log(`✅ ${email} is now fully restored as an ADMIN.`);
            console.log(`👉 Go to https://admin.medicohub.com.ng/login and sign in.`);
        }

        process.exit(0);
    } catch (error) {
        console.error("❌ Restoration failed:", error);
        process.exit(1);
    }
};

restoreAdmin();
