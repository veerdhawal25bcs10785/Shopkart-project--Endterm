const mongoose = require('mongoose');
const Customer = require('../models/customer.model');
const Product = require('../models/product.model');

/**
 * @desc    Add a product to the authenticated user's wishlist
 * @route   POST /wishlist/:productId
 * @access  Protected
 */
const addToWishlist = async (req, res) => {
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

    // 3. Find current user
    const customer = await Customer.findById(req.user._id);
    if (!customer) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: User not found',
      });
    }

    // Ensure wishlist array exists
    if (!customer.wishlist) {
      customer.wishlist = [];
    }

    // 4. Duplicate prevention: Check if product already saved in wishlist
    const alreadySaved = customer.wishlist.some(
      (id) => id.toString() === productId.toString()
    );

    if (alreadySaved) {
      return res.status(409).json({
        success: false,
        message: 'Product already in wishlist',
      });
    }

    // 5. Store reference (ObjectId only, keeping Product as source of truth)
    customer.wishlist.push(productId);
    await customer.save();

    return res.status(200).json({
      success: true,
      message: 'Product added to wishlist',
    });
  } catch (error) {
    console.error('Error in addToWishlist:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

/**
 * @desc    Get the current authenticated user's wishlist with populated product details
 * @route   GET /wishlist
 * @access  Protected
 */
const getWishlist = async (req, res) => {
  try {
    // Populate product references from the Product collection
    const customer = await Customer.findById(req.user._id).populate({
      path: 'wishlist',
      select: 'name description price category image stock createdAt',
    });

    if (!customer) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: User not found',
      });
    }

    // Filter out any populated entries that may be null (if a product was removed from database)
    const wishlist = (customer.wishlist || []).filter((item) => item !== null);

    return res.status(200).json({
      success: true,
      count: wishlist.length,
      wishlist,
    });
  } catch (error) {
    console.error('Error in getWishlist:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

/**
 * @desc    Remove a product from the authenticated user's wishlist
 * @route   DELETE /wishlist/:productId
 * @access  Protected
 */
const removeFromWishlist = async (req, res) => {
  try {
    const { productId } = req.params;

    // 1. Validate productId format
    if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID',
      });
    }

    // 2. Find current user
    const customer = await Customer.findById(req.user._id);
    if (!customer) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: User not found',
      });
    }

    // 3. Check if product is currently in wishlist
    const itemIndex = (customer.wishlist || []).findIndex(
      (id) => id.toString() === productId.toString()
    );

    if (itemIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Product not in wishlist',
      });
    }

    // 4. Remove reference and save
    customer.wishlist.splice(itemIndex, 1);
    await customer.save();

    return res.status(200).json({
      success: true,
      message: 'Product removed from wishlist',
    });
  } catch (error) {
    console.error('Error in removeFromWishlist:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

/**
 * @desc    Bonus Task: Toggle product in wishlist (Add if absent, Remove if present)
 * @route   PATCH /wishlist/:productId/toggle
 * @access  Protected
 */
const toggleWishlist = async (req, res) => {
  try {
    const { productId } = req.params;

    // Validate productId format
    if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID',
      });
    }

    // Find current user
    const customer = await Customer.findById(req.user._id);
    if (!customer) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: User not found',
      });
    }

    if (!customer.wishlist) {
      customer.wishlist = [];
    }

    const itemIndex = customer.wishlist.findIndex(
      (id) => id.toString() === productId.toString()
    );

    if (itemIndex > -1) {
      // Product is saved -> Remove it
      customer.wishlist.splice(itemIndex, 1);
      await customer.save();
      return res.status(200).json({
        success: true,
        saved: false,
        message: 'Product removed from wishlist',
      });
    } else {
      // Product is not saved -> Check existence & Add
      const product = await Product.findById(productId);
      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Product not found',
        });
      }

      customer.wishlist.push(productId);
      await customer.save();
      return res.status(200).json({
        success: true,
        saved: true,
        message: 'Product added to wishlist',
      });
    }
  } catch (error) {
    console.error('Error in toggleWishlist:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

/**
 * @desc    Bonus Task: Get wishlist items count
 * @route   GET /wishlist/count
 * @access  Protected
 */
const getWishlistCount = async (req, res) => {
  try {
    const customer = await Customer.findById(req.user._id);
    if (!customer) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: User not found',
      });
    }

    const count = customer.wishlist ? customer.wishlist.length : 0;
    return res.status(200).json({
      success: true,
      count,
    });
  } catch (error) {
    console.error('Error in getWishlistCount:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

module.exports = {
  addToWishlist,
  getWishlist,
  removeFromWishlist,
  toggleWishlist,
  getWishlistCount,
};
