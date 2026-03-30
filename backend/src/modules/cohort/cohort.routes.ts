import express from 'express';
import { verifyAuth as protect, verifyAdmin as adminOnly } from '../../middleware/auth.middleware';
import { createCohort, deleteCohort, getAllCohorts, getCohortById, updateCohort } from './cohort.controller';

const router = express.Router();

// Public read (optional, or protected?) - Let's keep it protected for now, or public if needed for signups.
// Ideally, list/get might need to be public for dropdowns on signup page?
// For now, let's make GET protected (User needs to be logged in to see dashboard).
router.get('/', protect, getAllCohorts);
router.get('/:id', protect, getCohortById);

// Admin only mutations
router.post('/', protect, adminOnly, createCohort);
router.patch('/:id', protect, adminOnly, updateCohort);
router.delete('/:id', protect, adminOnly, deleteCohort);

export default router;
