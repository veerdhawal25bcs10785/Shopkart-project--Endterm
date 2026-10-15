const mongoose = require('mongoose');
const Customer = require('../models/customer.model');
const Product = require('../models/product.model');

/**
 * Helper to clean and format populated cart
 */
const getPopulatedCart = async (customer) => {
  await customer.populate({
    path: 'cart.product',
    select: 'name price image stock category description',
  });
  return (customer.cart || []).filter((item) => item.product !== null);
};

/**
 * @desc    Add product to cart (or increment quantity if already present)
 * @route   POST /cart/:productId
 * @access  Protected
 */
const addToCart = async (req, res) => {
  try {
    const { productId } = req.params;

    // 1. Validate productId format
    if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID',
      });
    }

    // 2. Validate product existence in Product collection
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    // 3. Stock validation: Check if item is in stock
    if (product.stock <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Product is out of stock',
      });
    }

    // 4. Find authenticated customer
    const customer = await Customer.findById(req.user._id);
    if (!customer) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: User not found',
      });
    }

    if (!customer.cart) {
      customer.cart = [];
    }

    // 5. Check if product already exists in cart
    const existingIndex = customer.cart.findIndex(
      (item) => item.product.toString() === productId.toString()
    );

    if (existingIndex > -1) {
      // Product exists -> increment quantity
      const newQuantity = customer.cart[existingIndex].quantity + 1;

      // Validate stock availability
      if (newQuantity > product.stock) {
        return res.status(400).json({
          success: false,
          message: 'Requested quantity exceeds available stock',
        });
      }

      customer.cart[existingIndex].quantity = newQuantity;
    } else {
      // Product does not exist -> add with quantity = 1
      customer.cart.push({
        product: productId,
        quantity: 1,
      });
    }

    await customer.save();
    const cart = await getPopulatedCart(customer);

    return res.status(200).json({
      success: true,
      message: 'Cart updated',
      cart,
    });
  } catch (error) {
    console.error('Error in addToCart:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

/**
 * @desc    Get current authenticated user's cart with populated product data
 * @route   GET /cart
 * @access  Protected
 */
const getCart = async (req, res) => {
  try {
    const customer = await Customer.findById(req.user._id);
    if (!customer) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: User not found',
      });
    }

    const cart = await getPopulatedCart(customer);

    return res.status(200).json({
      success: true,
      cart,
    });
  } catch (error) {
    console.error('Error in getCart:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

/**
 * @desc    Update product quantity in cart
 * @route   PATCH /cart/:productId
 * @access  Protected
 */
const updateCartQuantity = async (req, res) => {
  try {
    const { productId } = req.params;
    const { quantity } = req.body;

    // 1. Validate quantity parameter
    if (
      typeof quantity !== 'number' ||
      !Number.isInteger(quantity) ||
      quantity < 1
    ) {
      return res.status(400).json({
        success: false,
        message: 'Quantity must be an integer of at least 1',
      });
    }

    // 2. Validate productId format
    if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID',
      });
    }

    // 3. Find product
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    // 4. Find customer and cart item
    const customer = await Customer.findById(req.user._id);
    if (!customer) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: User not found',
      });
    }

    const itemIndex = (customer.cart || []).findIndex(
      (item) => item.product.toString() === productId.toString()
    );

    if (itemIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Product not in cart',
      });
    }

    // 5. Validate stock limit
    if (quantity > product.stock) {
      return res.status(400).json({
        success: false,
        message: 'Requested quantity exceeds available stock',
      });
    }

    // 6. Update quantity and save
    customer.cart[itemIndex].quantity = quantity;
    await customer.save();

    const cart = await getPopulatedCart(customer);

    return res.status(200).json({
      success: true,
      message: 'Quantity updated',
      cart,
    });
  } catch (error) {
    console.error('Error in updateCartQuantity:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

/**
 * @desc    Remove product from cart
 * @route   DELETE /cart/:productId
 * @access  Protected
 */
const removeFromCart = async (req, res) => {
  try {
    const { productId } = req.params;

    // 1. Validate productId format
    if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID',
      });
    }

    // 2. Find customer
    const customer = await Customer.findById(req.user._id);
    if (!customer) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: User not found',
      });
    }

    // 3. Locate item in cart
    const itemIndex = (customer.cart || []).findIndex(
      (item) => item.product.toString() === productId.toString()
    );

    if (itemIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Product not in cart',
      });
    }

    // 4. Remove item and save
    customer.cart.splice(itemIndex, 1);
    await customer.save();

    const cart = await getPopulatedCart(customer);

    return res.status(200).json({
      success: true,
      message: 'Product removed from cart',
      cart,
    });
  } catch (error) {
    console.error('Error in removeFromCart:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

/**
 * @desc    Clear entire cart (e.g. on checkout)
 * @route   DELETE /cart
 * @access  Protected
 */
const clearCart = async (req, res) => {
  try {
    const customer = await Customer.findById(req.user._id);
    if (!customer) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: User not found',
      });
    }

    customer.cart = [];
    await customer.save();

    return res.status(200).json({
      success: true,
      message: 'Cart cleared',
      cart: [],
    });
  } catch (error) {
    console.error('Error in clearCart:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

module.exports = {
  addToCart,
  getCart,
  updateCartQuantity,
  removeFromCart,
  clearCart,
};
