const express = require('express');
const { protect } = require('../middlewares/auth.middleware');
const {
  createPaymentOrder,
  verifyPayment,
  getMyOrders,
  getOrderById,
  updateOrderStatus,
} = require('../controllers/order.controller');

const router = express.Router();

// All order routes are protected
router.post('/create-payment-order', protect, createPaymentOrder);
router.post('/verify-payment', protect, verifyPayment);
router.get('/', protect, getMyOrders);
router.get('/:id', protect, getOrderById);
router.patch('/:id/status', protect, updateOrderStatus);

module.exports = router;
