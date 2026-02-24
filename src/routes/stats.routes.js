import express from 'express';
import { getPublicStats } from '../controllers/stats.controller.js';

const router = express.Router();

// Public routes
router.get('/public', getPublicStats);

export default router;
