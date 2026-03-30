import { User } from '../../models/User';
import { ActivityLog } from '../../models/ActivityLog';

export class ActivityService {
    /**
     * Log a user study session and update their aggregate stats (The Dashboard Graphs).
     */
    static async logSession(uid: string, sessionData: any) {
        const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

        // 1. Create ActivityLog in MongoDB
        await ActivityLog.create({
            userId: uid,
            resourceId: sessionData.resourceId,
            resourceType: sessionData.resourceType, // Ensure this exists in sessionData
            startTime: sessionData.startTime || new Date(),
            endTime: new Date(),
            durationSeconds: sessionData.durationSeconds || 0,
            interactions: sessionData.interactions || {}
        });

        // 2. Update User Aggregates
        // We'll calculate the hours to add
        const hoursToAdd = (sessionData.durationSeconds || 0) / 3600;

        // Determine if streak should update
        // (Simple logic: if lastStudyDate != today, increment streak. If lastStudyDate < yesterday, reset streak)
        // This requires a read-before-write or a clever pipeline update. 
        // For now, simpler implementation:

        const user = await User.findOne({ uid });
        if (user) {
            const currentAnalytics = user.analytics || {
                totalSecondsStudied: 0,
                totalHours: 0,
                pointsEarned: 0,
                streakDays: 0,
                currentStreak: 0,
                lastActive: new Date(),
                lastStudyDate: '',
                monthlyActivity: [],
                yearlyActivity: new Map()
            };

            // Update Totals
            currentAnalytics.totalSecondsStudied = (currentAnalytics.totalSecondsStudied || 0) + (sessionData.durationSeconds || 0);
            currentAnalytics.totalHours = (currentAnalytics.totalHours || 0) + hoursToAdd;
            currentAnalytics.lastActive = new Date();

            // Streak Logic
            if (currentAnalytics.lastStudyDate !== today) {
                const yesterday = new Date();
                yesterday.setDate(yesterday.getDate() - 1);
                const yesterdayStr = yesterday.toISOString().split('T')[0];

                if (currentAnalytics.lastStudyDate === yesterdayStr) {
                    // Contiguous day
                    currentAnalytics.currentStreak = (currentAnalytics.currentStreak || 0) + 1;
                } else {
                    // Broken streak (or first day)
                    currentAnalytics.currentStreak = 1;
                }
                currentAnalytics.lastStudyDate = today;
            }

            // Save
            user.analytics = currentAnalytics;
            await user.save();
        }

        return { success: true };
    }
}
