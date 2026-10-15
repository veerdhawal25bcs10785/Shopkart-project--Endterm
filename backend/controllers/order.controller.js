const mongoose = require('mongoose');
const Order = require('../models/order.model');
const Customer = require('../models/customer.model');
const Product = require('../models/product.model');
const {
  KEY_ID,
  createRazorpayOrder,
  verifyRazorpaySignature,
} = require('../config/razorpay');

/**
 * @desc    Initiate checkout: Validate cart, check stock, calculate total, create pending Order & Razorpay order
 * @route   POST /orders/create-payment-order
 * @access  Protected
 */
const createPaymentOrder = async (req, res) => {
  try {
    const { shippingAddress } = req.body;

    // 1. Validate shipping address fields
    if (!shippingAddress) {
      return res.status(400).json({
        success: false,
        message: 'Shipping address is required',
      });
    }

    const fullName = shippingAddress.fullName?.trim();
    const addressLine = (
      shippingAddress.addressLine ||
      shippingAddress.street ||
      shippingAddress.address
    )?.trim();
    const city = shippingAddress.city?.trim();
    const state = shippingAddress.state?.trim();
    const postalCode = (
      shippingAddress.postalCode ||
      shippingAddress.pincode
    )?.trim();
    const phone = shippingAddress.phone?.trim();

    if (!fullName || !addressLine || !city || !state || !postalCode || !phone) {
      return res.status(400).json({
        success: false,
        message:
          'All shipping address fields are required (fullName, addressLine, city, state, postalCode, phone)',
      });
    }

    // Basic phone validation (at least 10 digits/characters)
    if (phone.replace(/\D/g, '').length < 10) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid 10-digit phone number',
      });
    }

    // 2. Fetch authenticated customer and populate cart products
    const customer = await Customer.findById(req.user._id).populate({
      path: 'cart.product',
      select: 'name price image stock category',
    });

    if (!customer) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: User not found',
      });
    }

    const activeCart = (customer.cart || []).filter((item) => item.product !== null);

    if (activeCart.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Cart is empty. Cannot initiate checkout.',
      });
    }

    // 3. Server-side stock verification & pricing calculation
    let totalAmount = 0;
    const orderItems = [];

    for (const item of activeCart) {
      const product = item.product;

      // Ensure product is still valid
      if (!product) {
        return res.status(400).json({
          success: false,
          message: 'One or more products in your cart are no longer available',
        });
      }

      // Check out of stock
      if (product.stock <= 0) {
        return res.status(400).json({
          success: false,
          message: `Product "${product.name}" is out of stock`,
        });
      }

      // Check available stock against requested quantity
      if (item.quantity > product.stock) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for "${product.name}". Available: ${product.stock}, requested: ${item.quantity}`,
        });
      }

      // Snapshot product info to isolate order from future price or name changes
      const itemSubtotal = product.price * item.quantity;
      totalAmount += itemSubtotal;

      orderItems.push({
        product: product._id,
        name: product.name,
        price: product.price,
        quantity: item.quantity,
        image: product.image,
      });
    }

    // Round to 2 decimal places to prevent floating point inaccuracies
    totalAmount = Math.round(totalAmount * 100) / 100;
    const amountInPaise = Math.round(totalAmount * 100);

    // 4. Create Razorpay order (amount in paise)
    const rzpOrder = await createRazorpayOrder({
      amount: amountInPaise,
      currency: 'INR',
      receipt: `rcpt_${Date.now()}`,
      notes: {
        customerId: customer._id.toString(),
        customerEmail: customer.email,
      },
    });

    // 5. Create persistent ShopKart Order with status PENDING
    const order = await Order.create({
      customer: customer._id,
      items: orderItems,
      shippingAddress: {
        fullName,
        addressLine,
        city,
        state,
        postalCode,
        phone,
      },
      totalAmount,
      paymentStatus: 'PENDING',
      orderStatus: 'PLACED',
      razorpayOrderId: rzpOrder.id,
    });

    const isMockKey =
      KEY_ID === 'rzp_test_shopkart12345' || !process.env.RAZORPAY_KEY_ID;

    return res.status(201).json({
      success: true,
      message: 'Payment order created successfully',
      shopKartOrderId: order._id,
      orderId: order._id,
      razorpayOrderId: rzpOrder.id,
      amount: rzpOrder.amount, // in paise
      currency: rzpOrder.currency || 'INR',
      key: KEY_ID,
      keyId: KEY_ID,
      isMockKey,
      order,
    });
  } catch (error) {
    console.error('Error in createPaymentOrder:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to initiate checkout order',
      error: error.message,
    });
  }
};

/**
 * @desc    Verify Razorpay payment signature, mark order PAID, deduct stock, and clear cart
 * @route   POST /orders/verify-payment
 * @access  Protected
 */
const verifyPayment = async (req, res) => {
  try {
    const {
      shopKartOrderId,
      orderId,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body;

    const targetOrderId = shopKartOrderId || orderId;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: 'Missing required payment verification details',
      });
    }

    // Find the order by orderId or razorpayOrderId
    let query = { razorpayOrderId: razorpay_order_id };
    if (targetOrderId && mongoose.Types.ObjectId.isValid(targetOrderId)) {
      query = { _id: targetOrderId };
    }

    const order = await Order.findOne(query);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    // Verify ownership
    const ownerId = (order.customer || order.user)?.toString();
    if (ownerId !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You do not own this order',
      });
    }

    // Check if order is already paid
    if (order.paymentStatus === 'PAID') {
      return res.status(200).json({
        success: true,
        message: 'Payment already verified',
        order,
      });
    }

    // 1. Verify Razorpay cryptographic signature (HMAC-SHA256)
    const isValidSignature = verifyRazorpaySignature({
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    });

    if (!isValidSignature) {
      order.paymentStatus = 'FAILED';
      await order.save();

      return res.status(400).json({
        success: false,
        message: 'Payment verification failed: Invalid signature',
      });
    }

    // 2. Mark order as PAID, CONFIRMED, and PLACED
    order.paymentStatus = 'PAID';
    order.orderStatus = 'CONFIRMED';
    order.status = 'PLACED';
    order.razorpayPaymentId = razorpay_payment_id;
    order.razorpaySignature = razorpay_signature;
    await order.save();

    // 3. Deduct stock from Product inventory
    for (const item of order.items) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: -item.quantity },
      });
    }

    // 4. Clear user's cart ONLY after payment is successfully verified
    const customer = await Customer.findById(req.user._id);
    if (customer) {
      customer.cart = [];
      await customer.save();
    }

    return res.status(200).json({
      success: true,
      message: 'Payment verified and order placed successfully!',
      order,
    });
  } catch (error) {
    console.error('Error in verifyPayment:', error);
    return res.status(500).json({
      success: false,
      message: 'Payment verification failed due to internal error',
      error: error.message,
    });
  }
};

/**
 * @desc    Get order history for current authenticated user
 * @route   GET /orders
 * @access  Protected
 */
const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({
      $or: [{ customer: req.user._id }, { user: req.user._id }],
    }).sort({
      createdAt: -1,
    });

    return res.status(200).json({
      success: true,
      count: orders.length,
      orders,
    });
  } catch (error) {
    console.error('Error in getMyOrders:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve orders',
    });
  }
};

/**
 * @desc    Get single order details by ID
 * @route   GET /orders/:id
 * @access  Protected
 */
const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid order ID format',
      });
    }

    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    // Strict resource isolation: user can only view their own orders
    const ownerId = (order.customer || order.user)?.toString();
    if (ownerId !== req.user._id.toString()) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    return res.status(200).json({
      success: true,
      order,
    });
  } catch (error) {
    console.error('Error in getOrderById:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve order details',
    });
  }
};

/**
 * @desc    Bonus challenge: Update order status (PLACED -> CONFIRMED -> SHIPPED -> DELIVERED)
 * @route   PATCH /orders/:id/status
 * @access  Protected
 */
const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const statusValue = req.body.status || req.body.orderStatus;

    const validStatuses = [
      'PENDING_PAYMENT',
      'PLACED',
      'CONFIRMED',
      'SHIPPED',
      'DELIVERED',
      'CANCELLED',
    ];

    if (!statusValue || !validStatuses.includes(statusValue)) {
      return res.status(400).json({
        success: false,
        message: `Invalid order status. Allowed values: ${validStatuses.join(', ')}`,
      });
    }

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid order ID',
      });
    }

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    order.orderStatus = statusValue;
    order.status = statusValue;
    await order.save();

    return res.status(200).json({
      success: true,
      message: 'Order status updated successfully',
      order,
    });
  } catch (error) {
    console.error('Error in updateOrderStatus:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update order status',
    });
  }
};

module.exports = {
  createPaymentOrder,
  verifyPayment,
  getMyOrders,
  getOrderById,
  updateOrderStatus,
};
