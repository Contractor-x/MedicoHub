import express from 'express';
import { CouponController } from './coupon.controller';
import { verifyAuth, verifyAdmin } from '../../middleware/auth.middleware';
import { z } from 'zod';

const CouponSchema = z.object({
    code: z.string().min(3, "Code must be at least 3 characters").toUpperCase(),
    type: z.enum(['percentage', 'fixed']),
    value: z.number().min(0, "Value must be positive"),
    maxUses: z.number().optional().default(100),
    expiresAt: z.string().optional(),
    isActive: z.boolean().optional().default(true)
});

const router = express.Router();

// Admin Routes
router.post('/', verifyAdmin, async (req, res, next) => {
    try {
        req.body = CouponSchema.parse(req.body);
        next();
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({
                error: "Validation failed",
                details: error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
            });
        }
        next(error);
    }
}, CouponController.createCoupon);

router.get('/', verifyAdmin, CouponController.getAllCoupons);
router.delete('/:id', verifyAdmin, CouponController.deleteCoupon);
router.patch('/:id/toggle', verifyAdmin, CouponController.toggleCouponStatus);

// Public Routes
router.post('/verify', CouponController.verifyCoupon);
router.post('/use', CouponController.useCoupon);

export default router;
