import { Request, Response } from 'express';
import { DeliveryZone } from '../../models/DeliveryZone';

export const DeliveryZoneController = {
    // Public: Get all active zones
    getAllZones: async (req: Request, res: Response) => {
        try {
            let zones = await DeliveryZone.find({ isActive: true }).sort({ name: 1 });

            // Auto-seed if empty
            if (zones.length === 0) {
                await DeliveryZoneController.initDefaults();
                zones = await DeliveryZone.find({ isActive: true }).sort({ name: 1 });
            }

            res.json(zones);
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch zones' });
        }
    },

    // Admin: Get all (including inactive)
    getAdminZones: async (req: Request, res: Response) => {
        try {
            const zones = await DeliveryZone.find().sort({ name: 1 });
            res.json(zones);
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch zones' });
        }
    },

    createZone: async (req: Request, res: Response) => {
        try {
            const { name, price } = req.body;
            const zone = new DeliveryZone({ name, price });
            await zone.save();
            res.status(201).json(zone);
        } catch (error) {
            res.status(500).json({ error: 'Failed to create zone' });
        }
    },

    updateZone: async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const zone = await DeliveryZone.findByIdAndUpdate(id, req.body, { new: true });
            res.json(zone);
        } catch (error) {
            res.status(500).json({ error: 'Failed to update zone' });
        }
    },

    deleteZone: async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            await DeliveryZone.findByIdAndDelete(id);
            res.json({ message: 'Deleted' });
        } catch (error) {
            res.status(500).json({ error: 'Failed to delete' });
        }
    },

    initDefaults: async () => {
        // Helper to seed defaults if empty
        const count = await DeliveryZone.countDocuments();
        if (count === 0) {
            const defaults = [
                { name: 'Lagos', price: 3000 },
                { name: 'Abuja', price: 4500 },
                { name: 'Rivers', price: 5000 },
                { name: 'Ogun', price: 3500 },
                { name: 'Other States', price: 6000 }
            ];
            await DeliveryZone.insertMany(defaults);
            console.log("Seeded default delivery zones");
        }
    }
};

// Auto-seed on load? Maybe call it from app.ts or just once.
// For now, I'll export it and let routes handle requests.
