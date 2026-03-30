import mongoose, { Schema, Document } from 'mongoose';

export interface ISystemSettings extends Document {
    maintenanceMode: boolean;
    allowSignups: boolean;
    announcement: string;
    mcampLive: boolean;
    mcampEnrollment: boolean;
    proDiscountEnabled: boolean;
    proDiscountPercentage: number;
    updatedAt: Date;
}

const SystemSettingsSchema: Schema = new Schema({
    id: { type: String, default: 'config', unique: true },
    maintenanceMode: { type: Boolean, default: false },
    allowSignups: { type: Boolean, default: true },
    announcement: { type: String, default: '' },
    mcampLive: { type: Boolean, default: false },
    mcampEnrollment: { type: Boolean, default: true },
    proDiscountEnabled: { type: Boolean, default: true },
    proDiscountPercentage: { type: Number, default: 10 },
    academicYears: { type: [String], default: ['Year 1', 'Year 2', 'Clinical', 'Final Year', 'General'] },
    updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

export default mongoose.model<ISystemSettings>('SystemSettings', SystemSettingsSchema);
