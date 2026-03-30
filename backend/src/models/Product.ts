import mongoose, { Schema, Document } from 'mongoose';

export interface IProduct extends Document {
    title: string;
    description: string;
    price: number;
    imageUrl: string;
    category: string;
    condition: {
        label: string;
        color: string;
    };
    stockCount: number;
    inStock: boolean;
    isFeatured: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const ProductSchema: Schema = new Schema({
    title: { type: String, required: true },
    description: { type: String },
    price: { type: Number, required: true },
    imageUrl: { type: String },
    category: { type: String, required: true },
    condition: {
        label: { type: String, default: 'Brand New' },
        color: { type: String, default: 'green' }
    },
    stockCount: { type: Number, default: 0 },
    inStock: { type: Boolean, default: true },
    isFeatured: { type: Boolean, default: false }
}, { timestamps: true });

export const Product = mongoose.model<IProduct>('Product', ProductSchema);
