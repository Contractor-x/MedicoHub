import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import { randomUUID } from 'crypto';
import { User } from '../models/User';
import connectDB from '../config/database';
import { hashPassword } from '../utils/password';

const [emailArg, passwordArg, nameArg] = process.argv.slice(2);

if (!emailArg || !passwordArg) {
    console.error('Usage: npx ts-node src/scripts/seedAdminAuth.ts <email> <password> [name]');
    process.exit(1);
}

const email = emailArg.trim().toLowerCase();
const password = passwordArg.trim();
const name = (nameArg || 'Admin User').trim();

const run = async () => {
    await connectDB();

    const passwordHash = hashPassword(password);
    const photoURL = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0D8ABC&color=fff`;

    const existing = await User.findOne({ email });
    const user = await User.findOneAndUpdate(
        { email },
        {
            $set: {
                uid: existing?.uid || randomUUID(),
                name,
                email,
                role: 'admin',
                photoURL,
                passwordHash
            }
        },
        { new: true, upsert: true }
    );

    console.log(`Admin auth record ready for ${user?.email || email}`);
    process.exit(0);
};

run().catch((error) => {
    console.error('Failed to seed admin auth:', error);
    process.exit(1);
});
