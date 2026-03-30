import mongoose, { Schema, Document } from 'mongoose';

export interface IGlobalStats extends Document {
    date: string; // YYYY-MM-DD
    activeUsers: number;
    totalQuizzes: number;
    totalActivity: number;
    revenue: number;
}

const GlobalStatsSchema: Schema = new Schema({
    date: { type: String, required: true, unique: true },
    activeUsers: { type: Number, default: 0 },
    totalQuizzes: { type: Number, default: 0 },
    totalActivity: { type: Number, default: 0 },
    revenue: { type: Number, default: 0 }
});

export const GlobalStats = mongoose.model<IGlobalStats>('GlobalStats', GlobalStatsSchema);
