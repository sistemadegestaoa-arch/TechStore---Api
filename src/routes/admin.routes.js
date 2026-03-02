import express from 'express';
import { protect, isAdmin } from '../middleware/auth.js';
import {
  // Dashboard
  getDashboardStats,
  
  // User Management
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  
  // Product Management
  getAllProducts,
  updateProductStatus,
  deleteProduct,
  
  // Order Management
  getAllOrders,
  updateOrderStatusAdmin,
  
  // Category Management
  createCategory,
  updateCategory,
  deleteCategory,
  
  // Reviews Management
  getAllReviews,
  approveReview,
  deleteReview,
  
  // Newsletter Management
  getAllSubscribers,
  toggleSubscriberStatus,
  deleteSubscriber,
  getNewsletterStats,
  
  // Team Management
  getAllTeamMembers,
  createTeamMemberAdmin,
  updateTeamMemberAdmin,
  deleteTeamMemberAdmin,
  toggleTeamMemberStatus,
  getTeamStats,
  
  // Reports
  getSalesReport,
  
  // Vendor Approval
  getPendingVendors,
  approveVendor,
  rejectVendor,
  reactivateVendor,
  getVendorApprovalStats
} from '../controllers/admin.controller.js';

const router = express.Router();

// All routes require admin authentication
router.use(protect, isAdmin);

// Dashboard
router.get('/dashboard', getDashboardStats);

// User Management
router.get('/users', getAllUsers);
router.get('/users/:id', getUserById);
router.put('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);

// Product Management
router.get('/products', getAllProducts);
router.patch('/products/:id/status', updateProductStatus);
router.delete('/products/:id', deleteProduct);

// Order Management
router.get('/orders', getAllOrders);
router.patch('/orders/:id/status', updateOrderStatusAdmin);

// Category Management
router.post('/categories', createCategory);
router.put('/categories/:id', updateCategory);
router.delete('/categories/:id', deleteCategory);

// Reviews Management
router.get('/reviews', getAllReviews);
router.patch('/reviews/:id/approve', approveReview);
router.delete('/reviews/:id', deleteReview);

// Newsletter Management
router.get('/newsletter', getAllSubscribers);
router.get('/newsletter/stats', getNewsletterStats);
router.patch('/newsletter/:id/toggle', toggleSubscriberStatus);
router.delete('/newsletter/:id', deleteSubscriber);

// Team Management
router.get('/team', getAllTeamMembers);
router.get('/team/stats', getTeamStats);
router.post('/team', createTeamMemberAdmin);
router.put('/team/:id', updateTeamMemberAdmin);
router.patch('/team/:id/toggle', toggleTeamMemberStatus);
router.delete('/team/:id', deleteTeamMemberAdmin);

// Reports
router.get('/reports/sales', getSalesReport);

// Vendor Approval Management
router.get('/vendors/pending', getPendingVendors);
router.get('/vendors/stats', getVendorApprovalStats);
router.patch('/vendors/:id/approve', approveVendor);
router.patch('/vendors/:id/reject', rejectVendor);
router.patch('/vendors/:id/reactivate', reactivateVendor);

export default router;
