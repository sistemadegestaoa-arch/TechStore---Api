import express from 'express';
import { protect, isVendor } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getVendorProducts,
  updateProductStatus
} from '../controllers/product.controller.js';

const router = express.Router();

// Public routes
router.get('/', getProducts);
router.get('/:id', getProductById);

// Vendor routes
router.get('/vendor/my-products', protect, isVendor, getVendorProducts);
router.post('/', protect, isVendor, upload.array('images', 10), createProduct);
router.put('/:id', protect, isVendor, upload.array('images', 10), updateProduct);
router.patch('/:id/status', protect, isVendor, updateProductStatus);
router.delete('/:id', protect, isVendor, deleteProduct);

export default router;
