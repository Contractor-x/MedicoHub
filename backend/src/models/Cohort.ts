import mongoose, { Schema, Document } from 'mongoose';

export interface ICohort extends Document {
    uniqueId: string; // e.g. "MC-2026-JAN-Y2" (Primary Display Name)
    startDate: Date;
    status: 'active' | 'archived' | 'pending';
    targetYear: string; // e.g. "Year 2"
    weeks: any[]; // Isolated schedule/curriculum
    students: number; // Cached student count
    createdAt: Date;
    updatedAt: Date;
}

const CohortSchema: Schema = new Schema({
    uniqueId: { type: String, required: true, unique: true, index: true },
    startDate: { type: Date, required: true },
    status: { type: String, enum: ['active', 'archived', 'pending'], default: 'active' },
    targetYear: { type: String, required: true },
    weeks: { type: Schema.Types.Mixed, default: [] }, // Stores the full schedule for this cohort
    students: { type: Number, default: 0 },
}, { timestamps: true });

export default mongoose.model<ICohort>('Cohort', CohortSchema);
