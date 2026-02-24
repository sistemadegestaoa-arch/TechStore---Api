import express from 'express';
import { authorize } from '../middleware/authorize.js';
import {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory
} from '../controllers/category.controller.js';

const router = express.Router();

// Public routes
router.get('/', getCategories);
router.get('/:id', getCategoryById);

// Admin routes
router.post('/',  authorize('ADMIN'), createCategory);
router.put('/:id',  authorize('ADMIN'), updateCategory);
router.delete('/:id',  authorize('ADMIN'), deleteCategory);

export default router;
