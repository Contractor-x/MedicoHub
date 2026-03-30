import { Request, Response } from 'express';
import { Order } from '../../models/Order';
import { Coupon } from '../../models/Coupon';
import { Product } from '../../models/Product';
import { EmailService } from '../../services/email.service';
import axios from 'axios';

export const OrderController = {
    createOrder: async (req: Request, res: Response) => {
        try {
            // Get order details from the browser request
            const {
                customer, items, payment, couponCode, financials
            } = req.body;

            if (!payment?.reference) {
                return res.status(400).json({ error: 'Payment reference is required' });
            }

            // 1. SECURITY: Double-check Prices
            // We fetch the latest prices from the database so a user cannot manually change the price to 0 in their browser.
            let calculatedSubtotal = 0;
            const validatedItems = [];

            for (const item of items) {
                const product = await Product.findById(item.productId);
                if (!product) throw new Error(`Product ${item.productId} not found.`);

                calculatedSubtotal += product.price * item.quantity;
                validatedItems.push({
                    productId: item.productId,
                    name: product.title,
                    quantity: item.quantity,
                    price: product.price,
                    image: item.image
                });
            }

            // 2. Coupon Check
            // If the user used a discount code, we check if it's still alive and valid.
            let calculatedDiscount = 0;
            if (couponCode) {
                const coupon = await Coupon.findOne({
                    code: couponCode.toUpperCase(),
                    isActive: true
                });

                if (coupon) {
                    // Check expiry
                    if (!coupon.expiresAt || new Date(coupon.expiresAt) > new Date()) {
                        if (coupon.type === 'percentage' || coupon.type === 'percent') {
                            calculatedDiscount = (calculatedSubtotal * coupon.value) / 100;
                        } else {
                            calculatedDiscount = coupon.value;
                        }
                    }
                }
            }

            // 3. Final Total Calculation
            const shippingFee = Number(financials.shippingFee) || 0;
            const expectedTotal = Math.max(0, calculatedSubtotal + shippingFee - calculatedDiscount);

            // Paystack expects amount in Kobo (NGN * 100)
            const paystackAmountKobo = Math.round(expectedTotal * 100);

            // 4. Paystack Proof of Payment
            // We ask Paystack's official system: "Did this person actually pay us the correct amount?"
            const secretKey = process.env.PAYSTACK_SECRET_KEY;

            // Only perform verification if you have added your real Paystack key to the .env file and the amount is > 0.
            if (paystackAmountKobo > 0 && secretKey && !secretKey.includes('PLACEHOLDER')) {
                try {
                    const paystackRes = await axios.get(`https://api.paystack.co/transaction/verify/${payment.reference}`, {
                        headers: { Authorization: `Bearer ${secretKey}` }
                    });

                    const data = paystackRes.data.data;

                    if (data.status !== 'success') {
                        return res.status(400).json({ error: 'Payment has not been completed successfully in Paystack.' });
                    }

                    // Strict amount check (prevent N1 payments for N1000 items)
                    // We allow a small difference (5 kobo) for floating point issues
                    if (Math.abs(data.amount - paystackAmountKobo) > 5) {
                        return res.status(400).json({ error: 'Payment amount mismatch. Order rejected.' });
                    }
                } catch (err: any) {
                    console.error("Paystack Verification Error:", err.response?.data || err.message);
                    return res.status(400).json({ error: 'Could not verify payment with Paystack.' });
                }
            } else {
                console.warn("[SECURITY WARNING]: PAYSTACK_SECRET_KEY is missing/placeholder. Skipping REAL verification.");
            }

            // 5. Generate ID and Save
            const orderId = `ORD-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 100)}`;

            const newOrder = new Order({
                orderId,
                userId: req.user?.uid, // Track the logged-in user if available
                customer,
                items: validatedItems,
                financials: {
                    subtotal: calculatedSubtotal,
                    shippingFee,
                    discount: calculatedDiscount,
                    total: expectedTotal
                },
                payment: {
                    reference: payment.reference,
                    status: 'success'
                },
                status: 'pending'
            });

            await newOrder.save();

            // 5.5 Update Global Stats for Revenue tracking
            const today = new Date().toISOString().split('T')[0];
            const { GlobalStats } = require('../../models/GlobalStats');
            await GlobalStats.findOneAndUpdate(
                { date: today },
                { $inc: { revenue: expectedTotal, totalActivity: 1 } },
                { upsert: true }
            );
            // 6. Send Emails (Non-blocking)
            EmailService.sendOrderConfirmation(newOrder).catch(console.error);
            EmailService.sendAdminOrderAlert(newOrder).catch(console.error);

            // 7. Update Coupon Usage only after successful save
            if (couponCode) {
                await Coupon.updateOne({ code: couponCode.toUpperCase() }, { $inc: { usageCount: 1 } });
            }

            res.status(201).json(newOrder);
        } catch (error: any) {
            console.error("Order creation failed:", error);
            res.status(500).json({ error: error.message || 'Failed to create order' });
        }
    },

    getAllOrders: async (req: Request, res: Response) => {
        try {
            const orders = await Order.find().sort({ createdAt: -1 });
            res.json(orders);
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch orders' });
        }
    },

    updateStatus: async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const { status } = req.body;
            const order = await Order.findByIdAndUpdate(id, { status }, { new: true });

            if (order) {
                // If the status is now 'shipped' or 'delivered', send an update email to the customer automatically.
                EmailService.sendOrderStatusUpdate(order).catch(console.error);
            }

            res.json(order);
        } catch (error) {
            res.status(500).json({ error: 'Update failed' });
        }
    }
};
