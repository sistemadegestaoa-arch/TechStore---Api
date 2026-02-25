import express from 'express';
import { protect, isAdmin } from '../middleware/auth.js';
import {
  validateCoupon,
  createCoupon,
  getAllCoupons,
  updateCoupon,
  deleteCoupon,
  useCoupon
} from '../controllers/coupon.controller.js';

const router = express.Router();

// Public routes
router.post('/validate', validateCoupon);

// Protected routes
router.post('/:id/use', protect, useCoupon);

// Admin routes
router.post('/', protect, isAdmin, createCoupon);
router.get('/', protect, isAdmin, getAllCoupons);
router.patch('/:id', protect, isAdmin, updateCoupon);
router.delete('/:id', protect, isAdmin, deleteCoupon);

export default router;
