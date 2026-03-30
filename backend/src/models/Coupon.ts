import mongoose, { Schema, Document } from 'mongoose';

export interface ICoupon extends Document {
    code: string;
    type: 'percentage' | 'percent' | 'fixed';
    value: number; // For percentage: 10 means 10%, for fixed: 1000 means ₦1000
    minOrderAmount: number; // Minimum subtotal required to use this coupon
    isActive: boolean;
    expiresAt?: Date;
    usageCount: number;
    maxUses: number;
    createdAt: Date;
}

const CouponSchema: Schema = new Schema({
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    type: { type: String, enum: ['percentage', 'percent', 'fixed'], required: true },
    value: { type: Number, required: true },
    minOrderAmount: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    expiresAt: { type: Date },
    usageCount: { type: Number, default: 0 },
    maxUses: { type: Number, default: 999999 }
}, { timestamps: true });

export const Coupon = mongoose.model<ICoupon>('Coupon', CouponSchema);
