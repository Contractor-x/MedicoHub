import * as admin from 'firebase-admin';
import dotenv from 'dotenv';

dotenv.config();

// Check if credentials are provided in env
if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
    console.warn("WARNING: FIREBASE_SERVICE_ACCOUNT not found in environment. Backend will fail to connect to Firestore.");
}

try {
    if (admin.apps.length === 0) {
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || '{}');
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
        console.log("[firebase]: Firebase Admin Initialized");
    }
} catch (error) {
    console.error("[firebase]: Failed to initialize Firebase Admin", error);
}

// Export the raw admin auth and firestore instances
// We use a getter to ensure they are accessed after initializeApp
export const getSafeDb = () => admin.firestore();
export const getSafeAuth = () => admin.auth();

// Keep compatibility with existing code using 'db' and 'auth' names
export const db = admin.firestore();
export const auth = admin.auth();

export { admin };
