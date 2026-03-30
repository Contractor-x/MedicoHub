import express from 'express';
import { OrderController } from './order.controller';
import { verifyAuth, verifyAdmin, optionalAuth } from '../../middleware/auth.middleware';

const router = express.Router();

router.post('/', optionalAuth, OrderController.createOrder);
router.get('/', verifyAdmin, OrderController.getAllOrders);
router.patch('/:id/status', verifyAdmin, OrderController.updateStatus);

export default router;
