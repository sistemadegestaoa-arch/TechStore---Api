import express from 'express';
import { protect, isAdmin } from '../middleware/auth.js';
import {
  subscribe,
  unsubscribe,
  getSubscribers,
  sendNewsletter
} from '../controllers/newsletter.controller.js';

const router = express.Router();

// Public routes
router.post('/subscribe', subscribe);
router.post('/unsubscribe', unsubscribe);

// Admin routes
router.get('/subscribers', protect, isAdmin, getSubscribers);
router.post('/send', protect, isAdmin, sendNewsletter);

export default router;
