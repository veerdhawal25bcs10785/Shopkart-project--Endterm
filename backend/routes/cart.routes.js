const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth.middleware');
const {
  addToCart,
  getCart,
  updateCartQuantity,
  removeFromCart,
  clearCart,
} = require('../controllers/cart.controller');

// All Cart routes are protected
router.use(protect);

router.get('/', getCart);
router.delete('/', clearCart);
router.post('/:productId', addToCart);
router.patch('/:productId', updateCartQuantity);
router.delete('/:productId', removeFromCart);

module.exports = router;
