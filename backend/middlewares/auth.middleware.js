const jwt = require('jsonwebtoken');
const Customer = require('../models/customer.model');

/**
 * Authentication middleware to protect routes.
 * Verifies JWT stored in HttpOnly cookie and attaches customer to req.user.
 */
const protect = async (req, res, next) => {
  try {
    let token = req.cookies?.token;

    // Also support Authorization Bearer token header
    if (
      !token &&
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer ')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: No token provided',
      });
    }

    // Verify token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'shopkart_jwt_secret_key_default'
    );

    // Fetch customer excluding password
    const customer = await Customer.findById(decoded.id).select('-password');

    if (!customer) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: Customer not found',
      });
    }

    // Attach customer to req.user
    req.user = customer;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized: Invalid or expired token',
    });
  }
};

module.exports = { protect };
