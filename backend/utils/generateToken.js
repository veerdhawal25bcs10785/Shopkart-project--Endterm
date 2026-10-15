const jwt = require('jsonwebtoken');

/**
 * Generates a JWT and sets it as an HttpOnly cookie on the response object.
 * 
 * @param {import('express').Response} res - Express response object
 * @param {string|mongoose.Types.ObjectId} customerId - Customer database ID
 * @returns {string} The signed JWT
 */
const generateToken = (res, customerId) => {
  const token = jwt.sign(
    { id: customerId },
    process.env.JWT_SECRET || 'shopkart_jwt_secret_key_default',
    { expiresIn: '1d' }
  );

  const cookieOptions = {
    httpOnly: true, // Prevents XSS attacks by blocking JavaScript access
    secure: process.env.NODE_ENV === 'production', // Send only over HTTPS in production
    sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax', // Lax in development ensures seamless cross-port cookie sharing on localhost
    maxAge: 24 * 60 * 60 * 1000, // 1 day in milliseconds
  };

  res.cookie('token', token, cookieOptions);

  return token;
};

module.exports = generateToken;
