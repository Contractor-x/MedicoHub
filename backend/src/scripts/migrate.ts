
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import connectDB from '../config/database';
import { db } from '../config/firebase'; // Firestore
import { User } from '../models/User';
import { Resource } from '../models/Resource';
import { Product } from '../models/Product';
import { ActivityLog } from '../models/ActivityLog';
import { GlobalStats } from '../models/GlobalStats';
import imagekit from '../utils/imagekit';
import fs from 'fs';
import path from 'path';

dotenv.config();

const UPLOADS_DIR = path.join(process.cwd(), 'public/uploads');

// Map to track old ID -> New ID for resources to update references
const resourceIdMap: Record<string, string> = {};

const migrateUsers = async () => {
    console.log('Migrating Users...');
    const snapshot = await db.collection('users').get();
    let count = 0;

    for (const doc of snapshot.docs) {
        const data = doc.data();
        const uid = doc.id; // Firestore Doc ID is the UID

        // Check if user exists to avoid duplicates
        const existing = await User.findOne({ uid });
        if (existing) continue;

        await User.create({
            uid,
            name: data.name || 'Unknown',
            email: data.email,
            role: data.role || 'student',
            academicYear: data.academicYear || 'General',
            institution: data.institution,
            isSubscribed: data.isSubscribed || false,
            subscriptions: data.subscriptions || [],
            mcamp: data.mcamp,
            analytics: {
                totalSecondsStudied: data.analytics?.totalSecondsStudied || 0,
                totalHours: data.analytics?.totalHours || 0,
                pointsEarned: data.analytics?.pointsEarned || 0,
                streakDays: data.analytics?.streakDays || 0,
                currentStreak: data.analytics?.currentStreak || 0,
                lastActive: data.analytics?.lastActive ? new Date(data.analytics.lastActive) : new Date(),
                lastStudyDate: data.analytics?.lastStudyDate || '',
                // Fix: Extract just the numbers for monthlyActivity if it exists as objects
                monthlyActivity: Array.isArray(data.analytics?.monthlyActivity)
                    ? data.analytics.monthlyActivity.map((m: any) => typeof m === 'object' ? m.hours : m)
                    : [],
                // Fix: Convert Array to Map for yearlyActivity
                yearlyActivity: Array.isArray(data.analytics?.yearlyActivity)
                    ? data.analytics.yearlyActivity.reduce((acc: any, curr: any) => {
                        if (curr.month && curr.hours !== undefined) {
                            acc[curr.month] = curr.hours;
                        }
                        return acc;
                    }, {})
                    : {}
            }
        });
        count++;
    }
    console.log(`Migrated ${count} Users.`);
};

const uploadFileToImageKit = async (localFilename: string): Promise<string | null> => {
    const filePath = path.join(UPLOADS_DIR, localFilename);
    if (fs.existsSync(filePath)) {
        try {
            console.log(`Uploading ${localFilename} to ImageKit...`);
            const result = await imagekit.upload({
                file: fs.createReadStream(filePath),
                fileName: localFilename,
                folder: 'final_migration'
            });
            return result.url;
        } catch (e) {
            console.error(`Failed to upload ${localFilename}:`, e);
        }
    } else {
        console.warn(`File not found locally: ${filePath}`);
    }
    return null;
};

const resolveUrl = async (url: string): Promise<string> => {
    if (!url) return url;

    // Check if it's a local upload URL
    // e.g. http://localhost:5000/uploads/file-123.pdf or just /uploads/file-123.pdf
    if (url.includes('/uploads/')) {
        const parts = url.split('/uploads/');
        const filename = parts[1];
        if (filename) {
            const newUrl = await uploadFileToImageKit(filename);
            if (newUrl) return newUrl;
        }
    }
    return url; // Return original if not local or upload failed
};

const migrateResources = async () => {
    console.log('Migrating Resources...');
    const snapshot = await db.collection('resources').get();
    let count = 0;

    for (const doc of snapshot.docs) {
        const data = doc.data();
        const oldId = doc.id;

        // Process File & Thumbnail
        const newUrl = await resolveUrl(data.url);
        const newThumbnail = await resolveUrl(data.thumbnailUrl);

        if (!data.title || !newUrl) {
            console.warn(`Skipping Resource ${oldId}: Missing title or url`, data);
            continue;
        }

        const newResource = await Resource.create({
            title: data.title,
            description: data.description || '',
            type: data.type || 'Article',
            subject: data.subject || 'General',
            tags: data.tags || [],
            isPro: data.isPro || false,
            isMcampExclusive: data.isMcampExclusive || false,
            url: newUrl,
            thumbnailUrl: newThumbnail || '',
            downloadUrl: data.downloadUrl || '',
            hasAiAccess: data.hasAiAccess || false,
            uploadedBy: data.uploadedBy || 'system'
        });

        resourceIdMap[oldId] = newResource._id.toString();
        count++;
    }
    console.log(`Migrated ${count} Resources.`);
};

const migrateActivityLogs = async () => {
    console.log('Migrating Activity Logs...');
    // We assume logs are in users/{uid}/activity_sessions or similar subcollections.
    // Based on previous schema, it might be granular.
    // I check 'users' -> 'activities' based on AnalyticsService.

    // Also check global stats
    const usersSnap = await db.collection('users').get();
    let count = 0;

    for (const userDoc of usersSnap.docs) {
        const uid = userDoc.id;
        const activitiesSnap = await userDoc.ref.collection('activities').get();

        for (const actDoc of activitiesSnap.docs) {
            const act = actDoc.data();

            // Map resource ID if present
            let mappedResourceId = act.resourceId;
            if (resourceIdMap[act.resourceId]) {
                mappedResourceId = resourceIdMap[act.resourceId];
            }

            await ActivityLog.create({
                userId: uid,
                resourceId: mappedResourceId || 'unknown',
                resourceType: act.type, // 'QUIZ_COMPLETE' etc or the resource type
                startTime: act.timestamp ? new Date(act.timestamp) : new Date(),
                interactions: act // dump raw data
            });
            count++;
        }
    }
    console.log(`Migrated ${count} Activity Logs.`);
};

const migrateGlobalStats = async () => {
    console.log('Migrating Global Stats...');
    const snapshot = await db.collection('stats_daily').get();
    let count = 0;

    for (const doc of snapshot.docs) {
        const data = doc.data();
        await GlobalStats.create({
            date: data.date, // YYYY-MM-DD
            activeUsers: data.activeUsers || 0,
            totalQuizzes: data.totalQuizzes || 0,
            totalActivity: data.totalActivity || 0
        });
        count++;
    }
    console.log(`Migrated ${count} logs.`);
};

const run = async () => {
    await connectDB();
    console.log("Connected. Starting Migration...");

    try {
        await migrateUsers();
        await migrateResources(); // Fills resourceIdMap
        await migrateActivityLogs();
        await migrateGlobalStats();

        console.log("Migration Complete!");
        process.exit(0);
    } catch (e) {
        console.error("Migration Failed", e);
        process.exit(1);
    }
};

run();
