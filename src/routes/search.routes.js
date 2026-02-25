import express from 'express';
import {
  advancedSearch,
  getSearchSuggestions,
  getPopularSearches,
  trackSearch
} from '../controllers/search.controller.js';

const router = express.Router();

// Public routes
router.get('/', advancedSearch);
router.get('/suggestions', getSearchSuggestions);
router.get('/popular', getPopularSearches);
router.post('/track', trackSearch);

export default router;
