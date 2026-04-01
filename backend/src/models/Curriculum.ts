import mongoose, { Schema, Document } from 'mongoose';

export interface ICurriculum extends Document {
    id: string; // 'curriculum'
    weeks: any[];
    targetYear?: string;
    activeCohortId?: string;
    activeCohortObjId?: string;
    updatedAt: Date;
}

const CurriculumSchema: Schema = new Schema({
    id: { type: String, required: true, unique: true, default: 'curriculum' },
    weeks: { type: Schema.Types.Mixed, default: [] },
    targetYear: { type: String },
    activeCohortId: { type: String },
    activeCohortObjId: { type: String },
    updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

export default mongoose.model<ICurriculum>('Curriculum', CurriculumSchema);
