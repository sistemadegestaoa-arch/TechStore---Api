import express from 'express';
import { protect, isCustomer, isVendor } from '../middleware/auth.js';
import {
  createOrder,
  getCustomerOrders,
  getVendorOrders,
  getOrderById,
  updateOrderStatus,
  getVendorStats
} from '../controllers/order.controller.js';

const router = express.Router();

// Customer routes
router.post('/', protect, isCustomer, createOrder);
router.get('/', protect, getCustomerOrders);

// Vendor routes
router.get('/vendor/all', protect, isVendor, getVendorOrders);
router.get('/vendor/stats', protect, isVendor, getVendorStats);

// Shared routes
router.get('/:id', protect, getOrderById);
router.patch('/:id/status', protect, isVendor, updateOrderStatus);

export default router;
