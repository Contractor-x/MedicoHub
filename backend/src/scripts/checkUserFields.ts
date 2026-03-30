
import dotenv from 'dotenv';
import path from 'path';

// Force load .env from backend root
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import { User } from '../models/User';
import connectDB from '../config/database';

const checkUserFields = async () => {
    try {
        await connectDB();
        console.log("Checking User field structure...");
        const users = await User.find().limit(5);
        if (users.length === 0) {
            console.log("No users found in database.");
        }
        users.forEach(u => {
            const raw = u.toObject();
            console.log(`User: ${raw.email}`);
            console.log(`- uid: ${raw.uid}`);
            console.log(`- status: ${raw.status}`);
            console.log(`- mcamp:`, JSON.stringify(raw.mcamp, null, 2));
        });
        process.exit(0);
    } catch (error) {
        console.error("Error:", error);
        process.exit(1);
    }
};

checkUserFields();
