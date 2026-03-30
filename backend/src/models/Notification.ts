import mongoose, { Schema, Document } from 'mongoose';

export interface INotification extends Document {
    target: string; // userId or 'all'
    title: string;
    message: string;
    type: 'info' | 'success' | 'alert' | 'grade';
    icon?: string;
    data?: any;
    read: boolean;
    createdAt: Date;
}

const NotificationSchema: Schema = new Schema({
    target: { type: String, required: true, index: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: { type: String, enum: ['info', 'success', 'alert', 'grade'], default: 'info' },
    icon: { type: String },
    data: { type: Schema.Types.Mixed },
    read: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

export default mongoose.model<INotification>('Notification', NotificationSchema);
