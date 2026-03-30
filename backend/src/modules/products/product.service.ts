import { Product } from '../../models/Product';

export class ProductService {
    static async getAllProducts() {
        const results = await Product.find().sort({ createdAt: -1 }).lean();
        return results.map(p => ({
            ...p,
            id: (p as any)._id.toString()
        }));
    }

    static async createProduct(data: any) {
        const product = new Product(data);
        const result = await product.save();
        return {
            ...result.toObject(),
            id: result._id.toString()
        };
    }

    static async deleteProduct(id: string) {
        await Product.findByIdAndDelete(id);
        return { success: true };
    }

    static async updateProduct(id: string, data: any) {
        const result = await Product.findByIdAndUpdate(id, data, { new: true }).lean();
        if (!result) return null;
        return {
            ...result,
            id: (result as any)._id.toString()
        };
    }
}
