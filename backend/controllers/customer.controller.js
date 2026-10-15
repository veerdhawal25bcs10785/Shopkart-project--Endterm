const bcrypt = require('bcryptjs');
const Customer = require('../models/customer.model');
const generateToken = require('../utils/generateToken');

/**
 * @desc    Register a new customer
 * @route   POST /customers/register
 * @access  Public
 */
const registerCustomer = async (req, res) => {
  try {
    const { fullName, email, password, phone } = req.body;

    // 1. Validation: Check missing fields
    if (!fullName || !email || !password || !phone) {
      return res.status(400).json({
        success: false,
        message: 'All fields (fullName, email, password, phone) are required',
      });
    }

    // 2. Validation: Check password length
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must contain at least 6 characters',
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // 3. Validation: Check if email already exists
    const existingCustomer = await Customer.findOne({ email: normalizedEmail });
    if (existingCustomer) {
      return res.status(409).json({
        success: false,
        message: 'Email already exists',
      });
    }

    // 4. Hash password with bcrypt (salt rounds: 10)
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 5. Store customer with hashed password
    const customer = await Customer.create({
      fullName: fullName.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      phone: phone.trim(),
    });

    // 6. Return success response (never return password)
    return res.status(201).json({
      success: true,
      message: 'Customer registered successfully',
      customer: {
        _id: customer._id,
        fullName: customer.fullName,
        email: customer.email,
        phone: customer.phone,
      },
    });
  } catch (error) {
    console.error('Error in registerCustomer:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

/**
 * @desc    Authenticate customer & get token in HttpOnly cookie
 * @route   POST /customers/login
 * @access  Public
 */
const loginCustomer = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation: Check missing credentials
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required',
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Find customer by email
    const customer = await Customer.findOne({ email: normalizedEmail });
    if (!customer) {
      // Do not reveal whether email or password was incorrect
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    // Compare password using bcrypt
    const isPasswordMatch = await bcrypt.compare(password, customer.password);
    if (!isPasswordMatch) {
      // Do not reveal whether email or password was incorrect
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    // Generate JWT and store in HttpOnly cookie
    generateToken(res, customer._id);

    return res.status(200).json({
      success: true,
      message: 'Login successful',
    });
  } catch (error) {
    console.error('Error in loginCustomer:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

/**
 * @desc    Get currently authenticated customer profile
 * @route   GET /customers/me
 * @access  Protected
 */
const getProfile = async (req, res) => {
  try {
    // req.user is attached by auth middleware
    return res.status(200).json({
      _id: req.user._id,
      fullName: req.user.fullName,
      email: req.user.email,
      phone: req.user.phone,
      wishlist: req.user.wishlist || [],
      cart: req.user.cart || [],
    });
  } catch (error) {
    console.error('Error in getProfile:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

/**
 * @desc    Logout customer by clearing authentication cookie
 * @route   POST /customers/logout
 * @access  Protected
 */
const logoutCustomer = async (req, res) => {
  try {
    res.clearCookie('token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
    });

    return res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    console.error('Error in logoutCustomer:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

/**
 * @desc    Change password (Bonus Challenge)
 * @route   PATCH /customers/change-password
 * @access  Protected
 */
const changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Both oldPassword and newPassword are required',
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must contain at least 6 characters',
      });
    }

    // Retrieve customer including password hash
    const customer = await Customer.findById(req.user._id);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found',
      });
    }

    // Verify old password
    const isMatch = await bcrypt.compare(oldPassword, customer.password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Incorrect current password',
      });
    }

    // Hash new password and save
    const salt = await bcrypt.genSalt(10);
    customer.password = await bcrypt.hash(newPassword, salt);
    await customer.save();

    return res.status(200).json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error) {
    console.error('Error in changePassword:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

module.exports = {
  registerCustomer,
  loginCustomer,
  getProfile,
  logoutCustomer,
  changePassword,
};
