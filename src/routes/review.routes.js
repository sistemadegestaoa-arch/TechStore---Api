import express from 'express';
import { protect, isCustomer } from '../middleware/auth.js';
import {
  createReview,
  getProductReviews,
  updateReview,
  deleteReview,
  getMyReviews
} from '../controllers/review.controller.js';

const router = express.Router();

// Public routes
router.get('/product/:productId', getProductReviews);

// Protected routes (Customer only)
router.post('/', protect, isCustomer, createReview);
router.get('/my-reviews', protect, isCustomer, getMyReviews);
router.put('/:id', protect, isCustomer, updateReview);
router.delete('/:id', protect, isCustomer, deleteReview);

export default router;
