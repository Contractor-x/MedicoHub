
import dotenv from 'dotenv';
import path from 'path';

// Force load .env from backend root
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import { admin } from '../config/firebase';

const email = process.argv[2];

if (!email) {
    console.error("Please provide an email address.");
    console.error("Usage: npx ts-node src/scripts/setAdmin.ts <email>");
    process.exit(1);
}

const setAdmin = async () => {
    try {
        console.log(`Looking up user: ${email}...`);
        const user = await admin.auth().getUserByEmail(email);
        console.log(`Found user ${user.uid}. Setting admin claim...`);

        await admin.auth().setCustomUserClaims(user.uid, { admin: true });

        // Notify
        console.log("-----------------------------------------");
        console.log(`✅ Success! ${email} is now an ADMIN.`);
        console.log("-----------------------------------------");
        console.log("You may need to logout and login again in the Admin Panel for the token to refresh.");
        process.exit(0);
    } catch (error) {
        console.error("Error setting admin claim:", error);
        process.exit(1);
    }
};

setAdmin();
