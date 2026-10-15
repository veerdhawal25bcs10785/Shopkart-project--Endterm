const mongoose = require('mongoose');
const Product = require('../models/product.model');

/**
 * @desc    Create a new product
 * @route   POST /products
 * @access  Public
 */
const createProduct = async (req, res) => {
  try {
    const { name, description, price, category, image, stock } = req.body;

    // 1. Validation: Missing required fields
    if (
      !name ||
      !description ||
      price === undefined ||
      price === null ||
      !category ||
      !image ||
      stock === undefined ||
      stock === null
    ) {
      return res.status(400).json({
        success: false,
        message: 'All fields (name, description, price, category, image, stock) are required',
      });
    }

    const numPrice = Number(price);
    const numStock = Number(stock);

    // 2. Validation: Price must be greater than 0
    if (isNaN(numPrice) || numPrice <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Price must be a number greater than 0',
      });
    }

    // 3. Validation: Stock cannot be negative
    if (isNaN(numStock) || numStock < 0) {
      return res.status(400).json({
        success: false,
        message: 'Stock cannot be negative',
      });
    }

    const product = await Product.create({
      name: name.trim(),
      description: description.trim(),
      price: numPrice,
      category: category.trim(),
      image: image.trim(),
      stock: numStock,
    });

    return res.status(201).json({
      success: true,
      message: 'Product created successfully',
      product,
    });
  } catch (error) {
    console.error('Error in createProduct:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

/**
 * @desc    Get all products with optional search, category filter, and price sort
 * @route   GET /products
 * @access  Public
 */
const getProducts = async (req, res) => {
  try {
    const { search, category, sort } = req.query;
    const query = {};

    // 1. Search by name (case-insensitive regex)
    if (search && search.trim()) {
      query.name = { $regex: search.trim(), $options: 'i' };
    }

    // 2. Category filtering
    if (category && category.trim() && category.toLowerCase() !== 'all') {
      query.category = { $regex: new RegExp(`^${category.trim()}$`, 'i') };
    }

    // 3. Sorting (Bonus Challenge: price_asc, price_desc)
    let sortOptions = { createdAt: -1 };
    if (sort === 'price_asc') {
      sortOptions = { price: 1 };
    } else if (sort === 'price_desc') {
      sortOptions = { price: -1 };
    }

    const products = await Product.find(query).sort(sortOptions);

    return res.status(200).json({
      success: true,
      count: products.length,
      products,
    });
  } catch (error) {
    console.error('Error in getProducts:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

/**
 * @desc    Get a single product by ID
 * @route   GET /products/:id
 * @access  Public
 */
const getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Validation: Check valid MongoDB ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID format',
      });
    }

    // 2. Find product
    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    return res.status(200).json({
      success: true,
      product,
    });
  } catch (error) {
    console.error('Error in getProductById:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

module.exports = {
  createProduct,
  getProducts,
  getProductById,
};
