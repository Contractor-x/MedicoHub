
import { Router } from 'express';
import { ResourceService } from './resource.service';
import { verifyAuth, verifyAdmin } from '../../middleware/auth.middleware';
import { z } from 'zod';

const router = Router();

// Validation Schema for Resource
const ResourceSchema = z.object({
    title: z.string().min(3, "Title must be at least 3 characters"),
    description: z.string().optional(),
    type: z.enum(['Video', 'PDF', 'Article', 'Quiz']),
    subject: z.string().min(2, "Subject is required"),
    year: z.string().optional(),
    tags: z.array(z.string()).optional(),
    isPro: z.boolean().optional(),
    isMcampExclusive: z.boolean().optional(),
    url: z.string().optional(),
    thumbnailUrl: z.string().optional(),
    hasAiAccess: z.boolean().optional(),
    weekNumber: z.number().optional(),
    durationMinutes: z.number().optional(),
    maxAttempts: z.number().optional(),
    quizData: z.any().optional()
});

// GET /api/v3/resources/:id/context
// Authenticated: Fetch resource context (text) for AI
router.get('/:id/context', verifyAuth, async (req, res) => {
    try {
        const context = await ResourceService.getResourceContext(req.params.id);
        if (!context) return res.status(404).json({ error: "Resource not found" });
        res.json(context);
    } catch (error: any) {
        res.status(500).json({ error: error.message || "Failed to fetch context" });
    }
});

// GET /api/v3/resources/admin/all
// Admin: Fetch ALL resources without filtering
router.get('/admin/all', verifyAdmin, async (req, res) => {
    try {
        const results = await ResourceService.getAllResources();
        res.json(results);
    } catch (error: any) {
        res.status(500).json({ error: error.message || "Failed to fetch all resources" });
    }
});

// GET /api/v3/resources
// Fetches resources filtered by the authenticated user's profile tags
router.get('/', verifyAuth, async (req, res) => {
    try {
        const { User } = require('../../models/User');
        if (!req.user) return res.status(401).json({ error: "Unauthorized" });

        let userProfile = await User.findOne({ uid: req.user.uid });

        // Robustness: If profile not found, use a skeleton profile to show general resources
        if (!userProfile) {
            userProfile = {
                uid: req.user.uid,
                academicYear: 'General',
                year: 'General',
                mcamp: { isEnrolled: false }
            };
        }

        const resources = await ResourceService.getResourcesForUser(userProfile);
        res.json(resources);
    } catch (error: any) {
        console.error("Error fetching resources from MongoDB:", error);
        res.status(500).json({ error: error.message || "Internal Server Error" });
    }
});

// POST /api/v3/resources (Admin only)
router.post('/', verifyAdmin, async (req, res) => {
    try {
        // Validation
        const validatedData = ResourceSchema.parse(req.body);

        const result = await ResourceService.createResource(validatedData);
        res.status(201).json(result);
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({
                error: "Validation failed",
                details: error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
            });
        }
        res.status(500).json({ error: error.message || "Failed to create resource" });
    }
});

// PATCH /api/v3/resources/:id (Admin only)
router.patch('/:id', verifyAdmin, async (req, res) => {
    try {
        const validatedData = ResourceSchema.partial().parse(req.body);
        const result = await ResourceService.updateResource(req.params.id, validatedData);
        if (!result) return res.status(404).json({ error: "Resource not found" });
        res.json(result);
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({
                error: "Validation failed",
                details: error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
            });
        }
        res.status(500).json({ error: error.message || "Failed to update resource" });
    }
});

// DELETE /api/v3/resources/:id (Admin only)
router.delete('/:id', verifyAdmin, async (req, res) => {
    try {
        await ResourceService.deleteResource(req.params.id);
        res.json({ success: true, message: "Resource deleted successfully" });
    } catch (error: any) {
        res.status(500).json({ error: error.message || "Failed to delete resource" });
    }
});

export default router;
