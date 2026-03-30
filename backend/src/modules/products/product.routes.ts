
import { Router } from 'express';
import { ProductService } from './product.service';
import { verifyAuth, verifyAdmin } from '../../middleware/auth.middleware';
import { z } from 'zod';

const ProductSchema = z.object({
    title: z.string().min(2, "Title is required"),
    description: z.string().optional(),
    price: z.number().min(0, "Price must be positive"),
    imageUrl: z.string().optional(),
    category: z.string().min(1, "Category is required"),
    stockCount: z.number().int().optional().default(100),
    inStock: z.boolean().optional().default(true),
    isFeatured: z.boolean().optional().default(false),
    condition: z.object({
        label: z.string().optional().default('Brand New'),
        color: z.string().optional().default('green')
    }).optional()
});

const router = Router();

// Anybody can GET the list of products (to see them in the store)
router.get('/', async (req, res) => {
    try {
        const results = await ProductService.getAllProducts();
        res.json(results);
    } catch (error: any) {
        res.status(500).json({ error: error.message || "Failed to fetch products" });
    }
});

// Adding or Deleting products is restricted!
router.post('/', verifyAdmin, async (req, res) => {
    try {
        const validatedData = ProductSchema.parse(req.body);
        const result = await ProductService.createProduct(validatedData);
        res.json(result);
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({
                error: "Validation failed",
                details: error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
            });
        }
        res.status(500).json({ error: error.message || "Failed to create product" });
    }
});

router.patch('/:id', verifyAdmin, async (req, res) => {
    try {
        const validatedData = ProductSchema.partial().parse(req.body);
        const result = await ProductService.updateProduct(req.params.id, validatedData);
        if (!result) return res.status(404).json({ error: "Product not found" });
        res.json(result);
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({
                error: "Validation failed",
                details: error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
            });
        }
        res.status(500).json({ error: error.message || "Failed to update product" });
    }
});

router.delete('/:id', verifyAdmin, async (req, res) => {
    try {
        await ProductService.deleteProduct(req.params.id);
        res.json({ success: true, message: "Product deleted" });
    } catch (error: any) {
        res.status(500).json({ error: error.message || "Failed to delete product" });
    }
});

export default router;
