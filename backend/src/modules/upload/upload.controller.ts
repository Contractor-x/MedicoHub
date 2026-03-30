import { Request, Response } from 'express';
import imagekit from '../../utils/imagekit';
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import PDFDocument from 'pdf-lib';

export class UploadController {
    static async uploadFile(req: Request, res: Response) {
        let filesToCleanup: string[] = [];
        try {
            const file = (req as any).file;
            if (!file) {
                return res.status(400).json({ error: 'No file uploaded' });
            }

            filesToCleanup.push(file.path);
            let finalFilePath = file.path;
            const originalSize = file.size;
            const LIMIT_MB = parseInt(process.env.MAX_UPLOAD_SIZE_MB || '25');
            const LIMIT_BYTES = LIMIT_MB * 1024 * 1024;

            // COMPRESSION LOGIC
            // 1. Images: Always optimize
            if (file.mimetype.startsWith('image/')) {
                const optimizedPath = path.join(path.dirname(file.path), 'opt-' + file.filename + '.jpg');
                await sharp(file.path)
                    .resize(1920, 1920, { fit: 'inside', withoutEnlargement: true }) // HD max
                    .jpeg({ quality: 80, mozjpeg: true })
                    .toFile(optimizedPath);

                finalFilePath = optimizedPath;
                filesToCleanup.push(optimizedPath);
            }
            // 2. PDFs: Check limit
            else if (file.mimetype === 'application/pdf' && file.size > LIMIT_BYTES) {
                throw new Error(`PDF is too large (${(file.size / 1024 / 1024).toFixed(2)}MB). Maximum allowed is ${LIMIT_MB}MB.`);
            }
            // 3. Videos: Check limit
            else if (file.mimetype.startsWith('video/') && file.size > LIMIT_BYTES) {
                throw new Error(`Video is too large (${(file.size / 1024 / 1024).toFixed(2)}MB). ImageKit limit is 25MB. Please compress it locally to under 25MB.`);
            }

            // Upload using ImageKit
            const result = await imagekit.upload({
                file: fs.createReadStream(finalFilePath),
                fileName: file.originalname, // Keep original name
                folder: 'medico_resources'
            });

            // Cleanup
            filesToCleanup.forEach(f => { if (fs.existsSync(f)) fs.unlinkSync(f); });

            return res.status(200).json({
                success: true,
                message: 'File uploaded successfully',
                url: result.url,
                thumbnailUrl: result.thumbnailUrl || result.url,
                filename: result.name,
                mimetype: file.mimetype,
                size: result.size
            });

        } catch (error: any) {
            console.error('Upload error:', error);
            filesToCleanup.forEach(f => { if (fs.existsSync(f)) fs.unlinkSync(f); });

            // Return clean error
            return res.status(500).json({ error: error.message || 'Failed to upload file' });
        }
    }
}
