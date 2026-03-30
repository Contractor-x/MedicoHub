import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
    uid: string; // Firebase UID
    name: string;
    email: string;
    role: 'student' | 'admin';
    academicYear: 'Year 1' | 'Year 2' | 'Clinical' | 'Final Year' | 'General';
    requestedYear?: string;
    institution?: string;
    schoolName?: string;
    firstName?: string;
    surname?: string;
    photoURL?: string;
    year?: string; // Virtual field for frontend compatibility (mirrors academicYear)

    isSubscribed: boolean;
    subscriptions: {
        planId: string;
        startDate: Date;
        endDate: Date;
    }[];

    weakness: string[];
    currentCourses: string[];

    mcamp?: {
        isEnrolled: boolean;
        cohortId: string;
        uniqueId: string;
        enrollmentDate: Date;
        medicalSchool?: string;
        level?: string;
        phoneNumber?: string;
        isSuspended?: boolean;
        suspensionDate?: string | Date | null;
        cohortYear?: string;
    };

    mcampHistory?: {
        uniqueId?: string;
        cohortId?: string;
        enrollmentDate?: Date;
        completionDate?: Date;
        level?: string;
    }[];
    status?: 'active' | 'suspended';

    quizAttempts?: Map<string, any>;
    resourceProgress?: Map<string, any>;

    analytics?: {
        totalSecondsStudied: number;
        totalHours?: number;
        pointsEarned: number;
        streakDays: number;
        currentStreak?: number;
        lastActive: Date;
        lastStudyDate?: string;
        monthlyActivity?: number[];
        yearlyActivity?: Map<string, number>;
    };

    createdAt: Date;
    updatedAt: Date;
}

const UserSchema: Schema = new Schema({
    uid: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    role: { type: String, enum: ['student', 'admin'], default: 'student' },
    academicYear: { type: String, default: 'General' },
    requestedYear: { type: String },
    institution: { type: String },
    schoolName: { type: String },
    firstName: { type: String },
    surname: { type: String },
    status: { type: String, enum: ['active', 'suspended'], default: 'active' },

    weakness: { type: [String], default: [] },
    currentCourses: { type: [String], default: [] },

    photoURL: { type: String },
    isSubscribed: { type: Boolean, default: false },
    subscriptions: [{
        planId: String,
        startDate: Date,
        endDate: Date
    }],

    mcamp: {
        isEnrolled: { type: Boolean, default: false },
        enrollmentDate: { type: Date },
        startDate: { type: Date },
        uniqueId: { type: String },
        cohortId: { type: Schema.Types.ObjectId, ref: 'Cohort' },
        medicalSchool: String,
        level: String,
        phoneNumber: String,
        isSuspended: { type: Boolean, default: false },
        suspensionDate: Date,
        cohortYear: String
    },

    mcampHistory: [{
        uniqueId: { type: String },
        cohortId: { type: Schema.Types.ObjectId, ref: 'Cohort' },
        enrollmentDate: { type: Date },
        completionDate: { type: Date },
        level: { type: String }
    }],

    quizAttempts: {
        type: Map,
        of: Schema.Types.Mixed,
        default: {}
    },

    resourceProgress: {
        type: Map,
        of: Schema.Types.Mixed,
        default: {}
    },

    analytics: {
        totalSecondsStudied: { type: Number, default: 0 },
        totalHours: { type: Number, default: 0 },
        pointsEarned: { type: Number, default: 0 },
        streakDays: { type: Number, default: 0 },
        currentStreak: { type: Number, default: 0 },
        lastActive: Date,
        lastStudyDate: String,
        monthlyActivity: [Number],
        yearlyActivity: { type: Map, of: Number }
    }
}, {
    timestamps: true,
    toJSON: {
        virtuals: true,
        transform: function (doc: any, ret: any) {
            if (ret.academicYear) ret.year = ret.academicYear;
            return ret;
        }
    },
    toObject: {
        virtuals: true,
        transform: function (doc: any, ret: any) {
            if (ret.academicYear) ret.year = ret.academicYear;
            return ret;
        }
    }
});

UserSchema.virtual('year').get(function () {
    return this.academicYear;
});

UserSchema.virtual('year').set(function (v: string) {
    this.academicYear = v;
});

export const User = mongoose.model<IUser>('User', UserSchema);
