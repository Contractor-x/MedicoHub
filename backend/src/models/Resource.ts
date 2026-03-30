import mongoose, { Schema, Document } from 'mongoose';

export interface IResource extends Document {
    title: string;
    description: string;
    type: 'Video' | 'PDF' | 'Article' | 'Quiz';
    subject: 'Anatomy' | 'Physiology' | 'Biochemistry' | 'Pathology' | 'Pharmacology' | 'General' | 'Microbiology' | 'Internal Medicine' | 'Surgery' | 'Pediatrics' | 'Obstetrics' | 'Gynecology' | 'Psychiatry';
    tags: string[];

    isPro: boolean;
    isMcampExclusive: boolean;

    url: string;
    thumbnailUrl: string;
    downloadUrl?: string;
    hasAiAccess: boolean;
    extractedText?: string;

    uploadedBy: string;
    year?: string;
    cohortId?: string;
    weekNumber?: number;
    durationMinutes?: number;
    maxAttempts?: number;
    quizData?: any; // For Quiz type resources
    createdAt: Date;
    updatedAt: Date;
}

const ResourceSchema: Schema = new Schema({
    title: { type: String, required: true },
    description: { type: String },
    type: { type: String, required: true, enum: ['Video', 'PDF', 'Article', 'Quiz'] },
    subject: { type: String, required: true },
    year: { type: String },
    cohortId: { type: String },
    weekNumber: { type: Number },
    durationMinutes: { type: Number },
    maxAttempts: { type: Number },
    tags: [String],

    isPro: { type: Boolean, default: false },
    isMcampExclusive: { type: Boolean, default: false },

    url: { type: String },
    thumbnailUrl: { type: String },
    downloadUrl: { type: String },
    hasAiAccess: { type: Boolean, default: false },
    extractedText: { type: String, select: false }, // Hidden by default

    uploadedBy: { type: String },
    quizData: { type: Schema.Types.Mixed }
}, { timestamps: true });

export const Resource = mongoose.model<IResource>('Resource', ResourceSchema);
