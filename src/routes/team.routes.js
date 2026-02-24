import express from 'express';
import { protect, isAdmin } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
import {
  getTeamMembers,
  getTeamMember,
  createTeamMember,
  updateTeamMember,
  deleteTeamMember
} from '../controllers/team.controller.js';

const router = express.Router();

// Public routes
router.get('/', getTeamMembers);
router.get('/:id', getTeamMember);

// Admin routes
router.post('/', protect, isAdmin, upload.single('avatar'), createTeamMember);
router.put('/:id', protect, isAdmin, upload.single('avatar'), updateTeamMember);
router.delete('/:id', protect, isAdmin, deleteTeamMember);

export default router;
