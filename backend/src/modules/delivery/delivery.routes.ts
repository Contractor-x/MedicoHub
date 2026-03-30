import express from 'express';
import { DeliveryZoneController } from './delivery.controller';
import { verifyAuth, verifyAdmin } from '../../middleware/auth.middleware';
import { z } from 'zod';

const DeliveryZoneSchema = z.object({
    name: z.string().min(2, "Zone name is required"),
    price: z.number().min(0, "Price must be positive"),
    isActive: z.boolean().optional().default(true)
});

const router = express.Router();

router.get('/', DeliveryZoneController.getAllZones);
router.get('/admin', verifyAdmin, DeliveryZoneController.getAdminZones);

router.post('/', verifyAdmin, async (req, res, next) => {
    try {
        req.body = DeliveryZoneSchema.parse(req.body);
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
}, DeliveryZoneController.createZone);

router.patch('/:id', verifyAdmin, DeliveryZoneController.updateZone);
router.delete('/:id', verifyAdmin, DeliveryZoneController.deleteZone);

export default router;
