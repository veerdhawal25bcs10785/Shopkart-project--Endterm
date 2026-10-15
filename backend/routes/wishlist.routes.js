const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth.middleware');
const {
  addToWishlist,
  getWishlist,
  removeFromWishlist,
  toggleWishlist,
  getWishlistCount,
} = require('../controllers/wishlist.controller');

// All Wishlist API endpoints require authentication
router.use(protect);

// Routes
router.get('/', getWishlist);
router.get('/count', getWishlistCount);
router.post('/:productId', addToWishlist);
router.delete('/:productId', removeFromWishlist);
router.patch('/:productId/toggle', toggleWishlist);

module.exports = router;
