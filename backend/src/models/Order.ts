import mongoose, { Schema, Document } from 'mongoose';

/**
 * ORDER MODEL:
 * This is the "Blueprint" for how orders are stored in the database.
 * Every time someone buys a product, a document is created following this structure.
 */
export interface IOrder extends Document {
    orderId: string; // A readable ID like #ORD-123456
    userId?: string; // Links the order to a logged-in user (optional)
    customer: {
        name: string;
        email: string;
        phone: string;
        address: string;
        state: string;
    };
    items: Array<{
        productId: string;
        name: string;
        quantity: number;
        price: number; // The price at the time of purchase
        image?: string;
    }>;
    financials: {
        subtotal: number;
        shippingFee: number;
        discount: number;
        total: number; // The final amount paid
    };
    payment: {
        reference: string; // The Paystack reference code
        status: string; // e.g., 'success'
    };
    status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
    createdAt: Date;
}

const OrderSchema: Schema = new Schema({
    orderId: { type: String, required: true, unique: true },
    userId: { type: String },
    customer: {
        name: { type: String },
        email: { type: String },
        phone: { type: String },
        address: { type: String },
        state: { type: String }
    },
    items: [{
        productId: { type: String },
        name: { type: String },
        quantity: { type: Number },
        price: { type: Number },
        image: String
    }],
    financials: {
        subtotal: { type: Number },
        shippingFee: { type: Number },
        discount: { type: Number, default: 0 },
        total: { type: Number }
    },
    payment: {
        reference: { type: String },
        status: { type: String, default: 'success' }
    },
    status: {
        type: String,
        enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
        default: 'pending'
    }
}, { timestamps: true });

export const Order = mongoose.model<IOrder>('Order', OrderSchema);
