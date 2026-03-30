import { Router } from 'express';
import { UploadController } from './upload.controller';
import { upload } from './upload.middleware';
import { verifyAuth, verifyAdmin } from '../../middleware/auth.middleware';

const router = Router();

/**
 * @swagger
 * /api/v1/upload:
 *   post:
 *     summary: Upload a file
 *     tags: [Upload]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: File uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 url:
 *                   type: string
 */
router.post('/', verifyAdmin, upload.single('file'), UploadController.uploadFile);

export default router;
