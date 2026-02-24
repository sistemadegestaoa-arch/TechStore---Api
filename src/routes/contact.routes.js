import express from 'express';
import { protect, isAdmin } from '../middleware/auth.js';
import {
  createContact,
  getAllContacts,
  updateContactStatus,
  deleteContact
} from '../controllers/contact.controller.js';

const router = express.Router();

// Public routes
router.post('/', createContact);

// Admin routes
router.get('/', protect, isAdmin, getAllContacts);
router.patch('/:id', protect, isAdmin, updateContactStatus);
router.delete('/:id', protect, isAdmin, deleteContact);

export default router;
