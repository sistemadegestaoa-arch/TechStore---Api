import express from 'express';
import { protect, isAdmin } from '../middleware/auth.js';
import {
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  createNotification,
  broadcastNotification
} from '../controllers/notification.controller.js';

const router = express.Router();

// Protected routes
router.get('/', protect, getUserNotifications);
router.patch('/:id/read', protect, markAsRead);
router.patch('/read-all', protect, markAllAsRead);
router.delete('/:id', protect, deleteNotification);

// Admin routes
router.post('/', protect, isAdmin, createNotification);
router.post('/broadcast', protect, isAdmin, broadcastNotification);

export default router;
