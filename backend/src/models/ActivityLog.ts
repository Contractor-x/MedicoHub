import mongoose, { Schema, Document } from 'mongoose';

export interface IActivityLog extends Document {
    userId: string; // Links to User.uid (not User._id) for easy queries
    resourceId: string; // Links to Resource._id
    resourceType: string;

    startTime: Date;
    endTime: Date;
    durationSeconds: number;

    interactions: {
        scrolledToPage?: number;
        videoWatchPercent?: number;
        aiQueriesAsked?: number;
        quizScore?: number;
    };

    createdAt: Date;
}

const ActivityLogSchema: Schema = new Schema({
    userId: { type: String, required: true, index: true },
    resourceId: { type: String, required: true },
    resourceType: { type: String },

    startTime: { type: Date, required: true },
    endTime: { type: Date },
    durationSeconds: { type: Number, default: 0 },

    interactions: {
        scrolledToPage: Number,
        videoWatchPercent: Number,
        aiQueriesAsked: Number,
        quizScore: Number
    }
}, { timestamps: true });

export const ActivityLog = mongoose.model<IActivityLog>('ActivityLog', ActivityLogSchema);
