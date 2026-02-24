import express from 'express';
import { protect } from '../middleware/auth.js';
import {
  addFavorite,
  removeFavorite,
  getFavorites,
  checkFavorite,
  toggleFavorite,
  getFavoritesCount
} from '../controllers/favorite.controller.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Get all favorites
router.get('/', getFavorites);

// Get favorites count
router.get('/count', getFavoritesCount);

// Check if product is favorited
router.get('/check/:productId', checkFavorite);

// Toggle favorite (add or remove)
router.post('/toggle/:productId', toggleFavorite);

// Add to favorites
router.post('/:productId', addFavorite);

// Remove from favorites
router.delete('/:productId', removeFavorite);

export default router;
