import express from 'express';
import {
  register,
  registerVendor,
  login,
  verifyEmail,
  forgotPassword,
  resetPassword,
  getMe
} from '../controllers/auth.controller.js';
import { protect } from '../middleware/auth.js';
import {
  registerValidation,
  vendorRegisterValidation,
  loginValidation,
  validate
} from '../middleware/validation.js';

const router = express.Router();

// Public routes
router.post('/register', registerValidation, validate, register);
router.post('/register-vendor', vendorRegisterValidation, validate, registerVendor);
router.post('/login', loginValidation, validate, login);
router.post('/verify-email', verifyEmail);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// Protected routes
router.get('/me', protect, getMe);

export default router;
