
export interface UserDocument {
    uid: string;
    name: string;
    email: string;
    role: 'student' | 'admin';
    academicYear: 'Year 1' | 'Year 2' | 'Clinical' | 'Final Year';
    institution?: string;
    isSubscribed: boolean;

    mcamp?: {
        isEnrolled: boolean;
        cohortId: string;
        uniqueId: string;
        enrollmentDate: string;
    };

    analytics: {
        totalSecondsStudied: number;
        pointsEarned: number;
        streakDays: number;
        lastActive: string;
        // We keep monthly/yearly summaries here for quick dashboard read
        monthlyActivity: { date: string; hours: number }[];
    };
}

export interface ResourceDocument {
    id: string;
    title: string;
    description: string;
    type: 'Video' | 'PDF' | 'Article' | 'Quiz';
    subject: string;
    year?: string; // Add optional year
    tags: string[]; // ["Year 2", "MCAMP_Wk1"]

    isPro: boolean;
    isMcampExclusive: boolean;

    url: string;
    thumbnailUrl: string;
    hasAiAccess: boolean;
    cohortId?: string;

    createdAt: string;
}

export interface ActivitySession {
    userId: string;
    resourceId: string;
    resourceType: string;
    startTime: string;
    endTime: string;
    durationSeconds: number;
    interactions: {
        scrolledToPage?: number;
        videoWatchPercent?: number;
        aiQueriesAsked?: number;
        quizScore?: number;
    };
}

export interface NotificationDocument {
    id: string;
    targetAudience: 'all' | 'year_2' | 'pro_users' | 'mcamp';
    title: string;
    message: string;
    type: 'info' | 'alert' | 'success';
    createdAt: string;
}
