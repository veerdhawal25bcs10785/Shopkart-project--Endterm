require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const cors = require('cors');

const customerRoutes = require('./routes/customer.routes');
const productRoutes = require('./routes/product.routes');
const wishlistRoutes = require('./routes/wishlist.routes');
const cartRoutes = require('./routes/cart.routes');
const orderRoutes = require('./routes/order.routes');
const { seedProducts } = require('./scripts/seedProducts');

const app = express();

// Middlewares
app.use(
  cors({
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:3000'],
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

// Base Route / Health Check
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'ShopKart Customer Authentication Service API is running',
  });
});

// API Routes
app.use('/customers', customerRoutes);
app.use('/products', productRoutes);
app.use('/wishlist', wishlistRoutes);
app.use('/cart', cartRoutes);
app.use('/orders', orderRoutes);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found',
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
  });
});

// Database Connection & Server Startup
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/shopkart';

const startServer = async () => {
  let connectionUri = MONGO_URI;

  try {
    // Attempt connecting to the configured MONGO_URI with a 2-second timeout
    await mongoose.connect(connectionUri, { serverSelectionTimeoutMS: 2000 });
    console.log(`[MongoDB] Connected successfully to ${connectionUri}`);
  } catch (error) {
    console.warn(`[MongoDB] Local connection to ${connectionUri} failed: ${error.message}`);
    console.log('[MongoDB] Starting built-in in-memory MongoDB server for development...');

    try {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      const memoryServer = await MongoMemoryServer.create();
      connectionUri = memoryServer.getUri();
      await mongoose.connect(connectionUri);
      console.log(`[MongoDB] In-memory MongoDB connected successfully!`);
    } catch (memError) {
      console.error('[MongoDB] Failed to start in-memory database:', memError.message);
      process.exit(1);
    }
  }

  // Seed sample products if database is empty
  await seedProducts();

  app.listen(PORT, () => {
    console.log(`[Server] ShopKart Authentication Service running on http://localhost:${PORT}`);
  });
};

if (require.main === module) {
  startServer();
}

module.exports = app;
// Server reloaded for fresh database session
