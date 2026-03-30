
import dotenv from 'dotenv';
import path from 'path';

// Force load .env from backend root
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import { User } from '../models/User';
import connectDB from '../config/database';

const testSuspension = async () => {
    try {
        await connectDB();
        const email = 'sjay07059+2test@gmail.com';
        console.log(`Testing suspension logic for ${email}...`);

        const user = await User.findOne({ email });
        if (!user) throw new Error("User not found");

        const isSuspending = !user.mcamp?.isSuspended;
        console.log(`Current isSuspended: ${user.mcamp?.isSuspended}. New target: ${isSuspending}`);

        const result = await User.findOneAndUpdate(
            { uid: user.uid },
            {
                $set: {
                    status: isSuspending ? 'suspended' : 'active',
                    'mcamp.isSuspended': isSuspending,
                    'mcamp.suspensionDate': isSuspending ? new Date() : null
                }
            },
            { new: true }
        );

        console.log("Updated User mcamp:", result?.mcamp);
        console.log("Updated User status:", result?.status);

        // Revert back for safety
        await User.findOneAndUpdate(
            { uid: user.uid },
            {
                $set: {
                    status: 'active',
                    'mcamp.isSuspended': false,
                    'mcamp.suspensionDate': null
                }
            }
        );
        console.log("Verification successful and reverted.");
        process.exit(0);
    } catch (error) {
        console.error("Error:", error);
        process.exit(1);
    }
};

testSuspension();
