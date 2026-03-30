import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

/**
 * MONGODB CONNECTION:
 * This file tells our server how to talk to our Database (MongoDB).
 * Without this, we can't save products or orders.
 */
const connectDB = async () => {
    try {
        // We look for the "Secret Address" of our database in the .env file
        const uri = process.env.MONGODB_URI;
        if (!uri) {
            throw new Error('MONGODB_URI is not defined in environment variables');
        }

        // Safety check to make sure the user added their password to the link
        if (uri.includes('<PASSWORD>')) {
            console.error("Error: MONGODB_URI still contains <PASSWORD> placeholder.");
            return;
        }

        // Try to open the connection
        await mongoose.connect(uri, {
            serverSelectionTimeoutMS: 10000, // If it doesn't connect in 10 seconds, stop trying
        });
        console.log('[database]: MongoDB Connected successfully');
    } catch (error: any) {
        console.error('[database]: MongoDB connection failed:', error.message);
        // If it fails, the server should probably shut down so we can fix it
        process.exit(1);
    }
};

export default connectDB;
