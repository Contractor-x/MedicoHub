
import dotenv from 'dotenv';
import path from 'path';

// Force load .env from backend root
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import { admin } from '../config/firebase';

const listAdmins = async () => {
    try {
        console.log("Listing users with Admin claims...");
        // List batch of users, 1000 at a time.
        const listUsersResult = await admin.auth().listUsers(100);
        listUsersResult.users.forEach((userRecord) => {
            const isAdmin = userRecord.customClaims && userRecord.customClaims['admin'] === true;
            if (isAdmin) {
                console.log(`[ADMIN] ${userRecord.email} (${userRecord.uid})`);
            } else {
                console.log(`[USER]  ${userRecord.email} (${userRecord.uid})`);
            }
        });
        process.exit(0);
    } catch (error) {
        console.error("Error listing users:", error);
        process.exit(1);
    }
};

listAdmins();
