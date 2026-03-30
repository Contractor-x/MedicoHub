import { Request, Response } from 'express';
import Cohort from '../../models/Cohort';

// Create a new Cohort
export const createCohort = async (req: Request, res: Response) => {
    try {
        const { uniqueId, startDate, targetYear, status, name } = req.body;

        const existing = await Cohort.findOne({ uniqueId });
        if (existing) {
            return res.status(400).json({ error: 'Cohort with this ID already exists.' });
        }

        const cohort = new Cohort({
            uniqueId,
            startDate: new Date(startDate),
            targetYear,
            status,
            weeks: [], // Empty schedule initially
            students: 0
        });

        await cohort.save();
        res.status(201).json(cohort);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

// Get all cohorts (Active & Archived)
export const getAllCohorts = async (req: Request, res: Response) => {
    try {
        const cohorts = await Cohort.find().sort({ createdAt: -1 });
        res.json(cohorts);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

// Get single cohort by ID (or uniqueId)
export const getCohortById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        // Allow lookup by _id OR uniqueId
        const query = mongoose.isValidObjectId(id) ? { _id: id } : { uniqueId: id };
        const cohort = await Cohort.findOne(query);

        if (!cohort) return res.status(404).json({ error: 'Cohort not found' });
        res.json(cohort);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

// Update Cohort (Status, Schedule, etc.)
export const updateCohort = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        const query = mongoose.isValidObjectId(id) ? { _id: id } : { uniqueId: id };

        const cohort = await Cohort.findOneAndUpdate(
            query,
            { $set: updates },
            { new: true }
        );

        if (!cohort) return res.status(404).json({ error: 'Cohort not found' });
        res.json(cohort);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

// Delete Cohort
export const deleteCohort = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const query = mongoose.isValidObjectId(id) ? { _id: id } : { uniqueId: id };

        const result = await Cohort.deleteOne(query);

        if (result.deletedCount === 0) return res.status(404).json({ error: 'Cohort not found' });
        res.json({ message: 'Cohort deleted successfully' });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

import mongoose from 'mongoose';
