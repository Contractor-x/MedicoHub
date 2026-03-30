import mongoose, { Schema, Document } from 'mongoose';

export interface IDeliveryZone extends Document {
    name: string;
    price: number;
    isActive: boolean;
}

const DeliveryZoneSchema: Schema = new Schema({
    name: { type: String, required: true, unique: true },
    price: { type: Number, required: true },
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

export const DeliveryZone = mongoose.model<IDeliveryZone>('DeliveryZone', DeliveryZoneSchema);
