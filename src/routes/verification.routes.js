import express from 'express';
import { protect, isAdmin } from '../middleware/auth.js';
import {
  submitVerification,
  getMyVerificationStatus,
  getAllVerifications,
  approveVerification,
  rejectVerification,
  deleteVerification
} from '../controllers/verification.controller.js';

const router = express.Router();

// Vendor routes
router.post('/', protect, submitVerification);
router.get('/my-status', protect, getMyVerificationStatus);

// Admin routes
router.get('/', protect, isAdmin, getAllVerifications);
router.patch('/:id/approve', protect, isAdmin, approveVerification);
router.patch('/:id/reject', protect, isAdmin, rejectVerification);
router.delete('/:id', protect, isAdmin, deleteVerification);

export default router;
