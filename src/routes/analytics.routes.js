import express from 'express';
import { protect, isAdmin } from '../middleware/auth.js';
import {
  getDashboardAnalytics,
  getVendorAnalytics,
  getProductAnalytics,
  getCustomerAnalytics,
  exportAnalytics
} from '../controllers/analytics.controller.js';

const router = express.Router();

// Admin routes
router.get('/dashboard', protect, isAdmin, getDashboardAnalytics);
router.get('/customers', protect, isAdmin, getCustomerAnalytics);
router.get('/export', protect, isAdmin, exportAnalytics);

// Vendor routes
router.get('/vendor', protect, getVendorAnalytics);

// Product analytics (vendor or admin)
router.get('/products/:id', protect, getProductAnalytics);

export default router;
