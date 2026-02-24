import express from 'express';
import { protect, isCustomer } from '../middleware/auth.js';

const router = express.Router();

// TODO: Implement review routes
// GET /api/reviews/product/:productId - Get product reviews
// POST /api/reviews - Create review (customer only)
// PUT /api/reviews/:id - Update review (customer only)
// DELETE /api/reviews/:id - Delete review (customer only)

export default router;
