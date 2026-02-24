import express from 'express';
import { protect } from '../middleware/auth.js';
import { isVendor } from '../middleware/authorize.js';
import { uploadAvatar, uploadLogo } from '../middleware/cloudinaryUpload.js';
import {
  getProfile,
  updateProfile,
  updateVendorProfile,
  changePassword,
  deleteAccount
} from '../controllers/user.controller.js';

const router = express.Router();

// All routes are protected
router.use(protect);

// User profile routes
router.get('/profile', getProfile);
router.put('/profile', uploadAvatar, updateProfile);
router.put('/vendor-profile', isVendor, uploadLogo, updateVendorProfile);
router.put('/password', changePassword);
router.delete('/account', deleteAccount);

export default router;
