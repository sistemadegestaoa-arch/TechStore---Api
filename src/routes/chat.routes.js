import express from 'express';
import { protect } from '../middleware/auth.js';
import {
  sendMessage,
  getConversations,
  getConversationMessages,
  markAsRead,
  getUnreadCount,
  deleteConversation,
  getWhatsAppLink
} from '../controllers/chat.controller.js';

const router = express.Router();

// Public routes
router.get('/whatsapp/:productId', getWhatsAppLink);

// Protected routes
router.post('/messages', protect, sendMessage);
router.get('/conversations', protect, getConversations);
router.get('/conversations/:id/messages', protect, getConversationMessages);
router.patch('/conversations/:id/read', protect, markAsRead);
router.delete('/conversations/:id', protect, deleteConversation);
router.get('/unread-count', protect, getUnreadCount);

export default router;
