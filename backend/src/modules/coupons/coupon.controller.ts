import { Request, Response } from 'express';
import { Coupon } from '../../models/Coupon';

export const CouponController = {
    // Admin: Create Coupon
    createCoupon: async (req: Request, res: Response) => {
        try {
            const { code, type, value, expiresAt, minOrderAmount, maxUses } = req.body;

            // Basic validation
            if (!code || !type || !value) {
                return res.status(400).json({ error: 'Missing required fields' });
            }

            const existing = await Coupon.findOne({ code: code.toUpperCase() });
            if (existing) {
                return res.status(400).json({ error: 'Coupon code already exists' });
            }

            const coupon = new Coupon({
                code: code.toUpperCase(),
                type,
                value,
                minOrderAmount: Number(minOrderAmount) || 0,
                maxUses: Number(maxUses) || 999999,
                expiresAt: expiresAt ? new Date(expiresAt) : undefined
            });

            await coupon.save();
            res.status(201).json(coupon);
        } catch (error) {
            console.error('Create coupon error:', error);
            res.status(500).json({ error: 'Failed to create coupon' });
        }
    },

    // Admin: Get All Coupons
    getAllCoupons: async (req: Request, res: Response) => {
        try {
            const coupons = await Coupon.find().sort({ createdAt: -1 }).lean();
            res.json(coupons);
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch coupons' });
        }
    },

    // Admin: Delete Coupon
    deleteCoupon: async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            await Coupon.findByIdAndDelete(id);
            res.json({ message: 'Coupon deleted successfully' });
        } catch (error) {
            res.status(500).json({ error: 'Failed to delete coupon' });
        }
    },

    // Admin: Toggle Status
    toggleCouponStatus: async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const coupon = await Coupon.findById(id);
            if (!coupon) return res.status(404).json({ error: 'Coupon not found' });

            coupon.isActive = !coupon.isActive;
            await coupon.save();
            res.json(coupon);
        } catch (error) {
            res.status(500).json({ error: 'Failed to update coupon' });
        }
    },

    // Public: Verify Coupon
    verifyCoupon: async (req: Request, res: Response) => {
        try {
            const { code, subtotal } = req.body;
            if (!code) return res.status(400).json({ error: 'Code is required' });

            const coupon = await Coupon.findOne({
                code: code.toUpperCase(),
                isActive: true
            });

            if (!coupon) {
                return res.status(404).json({ error: 'Invalid coupon code' });
            }

            // Check Expiry
            if (coupon.expiresAt && new Date() > coupon.expiresAt) {
                return res.status(400).json({ error: 'Coupon has expired' });
            }

            // Check Minimum Amount
            if (coupon.minOrderAmount > 0 && subtotal < coupon.minOrderAmount) {
                return res.status(400).json({
                    error: `This coupon requires a minimum spend of ₦${coupon.minOrderAmount.toLocaleString()}`
                });
            }

            // Check Max Uses
            if (coupon.usageCount >= coupon.maxUses) {
                return res.status(400).json({ error: 'This coupon has reached its maximum usage limit' });
            }

            res.json({
                id: coupon._id.toString(),
                code: coupon.code,
                type: coupon.type,
                value: coupon.value,
                usageCount: coupon.usageCount,
                maxUses: coupon.maxUses
            });
        } catch (error) {
            console.error('Verify coupon error:', error);
            res.status(500).json({ error: 'Failed to verify coupon' });
        }
    },

    // Public: Record Usage (for non-order transactions like MCAMP)
    useCoupon: async (req: Request, res: Response) => {
        try {
            const { code } = req.body;
            if (!code) return res.status(400).json({ error: 'Code is required' });

            const coupon = await Coupon.findOne({ code: code.toUpperCase(), isActive: true });
            if (!coupon) return res.status(404).json({ error: 'Coupon not found' });

            if (coupon.usageCount >= coupon.maxUses) {
                return res.status(400).json({ error: 'Coupon usage limit reached' });
            }

            coupon.usageCount += 1;
            await coupon.save();

            res.json({ success: true, usageCount: coupon.usageCount });
        } catch (error) {
            res.status(500).json({ error: 'Failed to record coupon usage' });
        }
    }
};
