const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../index');
const Product = require('../models/product.model');
const { sampleProducts } = require('../scripts/seedProducts');

let mongoServer;

async function runProductTests() {
  console.log('====================================================');
  console.log('  ShopKart Product Catalog & Discovery — Test Suite');
  console.log('====================================================\n');

  try {
    // 1. Setup in-memory MongoDB
    console.log('[Setup] Initializing in-memory MongoDB server...');
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
    console.log('[Setup] Connected to in-memory MongoDB.\n');

    let passedTests = 0;
    let totalTests = 0;

    function assertTest(name, condition, details = '') {
      totalTests++;
      if (condition) {
        passedTests++;
        console.log(`  ✅ PASS: ${name}`);
      } else {
        console.error(`  ❌ FAIL: ${name} ${details ? '- ' + details : ''}`);
        throw new Error(`Test failed: ${name}`);
      }
    }

    // ----------------------------------------------------
    // TASK 1 & 2: Create Product API (POST /products)
    // ----------------------------------------------------
    console.log('--- Tasks 1 & 2: Product Model & Creation ---');

    // Test 1: Missing required fields -> 400
    const missingRes = await request(app)
      .post('/products')
      .send({ name: 'Incomplete Item', price: 999 });
    assertTest(
      'Missing required fields returns status 400',
      missingRes.status === 400 && missingRes.body.success === false
    );

    // Test 2: Invalid price (<= 0) -> 400
    const zeroPriceRes = await request(app)
      .post('/products')
      .send({
        name: 'Zero Price Item',
        description: 'Testing zero price',
        price: 0,
        category: 'Electronics',
        image: 'https://example.com/item.jpg',
        stock: 10,
      });
    assertTest(
      'Price <= 0 returns status 400',
      zeroPriceRes.status === 400 && zeroPriceRes.body.success === false
    );

    // Test 3: Negative stock -> 400
    const negStockRes = await request(app)
      .post('/products')
      .send({
        name: 'Negative Stock Item',
        description: 'Testing negative stock',
        price: 499,
        category: 'Home',
        image: 'https://example.com/item.jpg',
        stock: -5,
      });
    assertTest(
      'Negative stock returns status 400',
      negStockRes.status === 400 && negStockRes.body.success === false
    );

    // Test 4: Valid Product Creation -> 201
    const validProduct = {
      name: 'Mechanical Keyboard',
      description: 'RGB mechanical keyboard with blue switches.',
      price: 2999,
      category: 'Electronics',
      image: 'https://example.com/keyboard.jpg',
      stock: 10,
    };
    const createRes = await request(app)
      .post('/products')
      .send(validProduct);
    assertTest(
      'Valid product creation returns status 201 with created product',
      createRes.status === 201 &&
        createRes.body.success === true &&
        createRes.body.product.name === validProduct.name &&
        createRes.body.product.price === 2999 &&
        createRes.body.product.stock === 10
    );

    const createdProductId = createRes.body.product._id;

    // Seed remaining sample products for query testing
    await Product.insertMany(
      sampleProducts.filter((p) => p.name !== 'Mechanical Keyboard')
    );

    // ----------------------------------------------------
    // TASK 3: Get All Products API (GET /products)
    // ----------------------------------------------------
    console.log('\n--- Task 3: Get All Products ---');

    const getAllRes = await request(app).get('/products');
    assertTest(
      'GET /products returns status 200 with success: true and products array',
      getAllRes.status === 200 &&
        getAllRes.body.success === true &&
        Array.isArray(getAllRes.body.products) &&
        getAllRes.body.count === getAllRes.body.products.length &&
        getAllRes.body.count >= 10
    );

    // ----------------------------------------------------
    // TASK 4: Get Single Product API (GET /products/:id)
    // ----------------------------------------------------
    console.log('\n--- Task 4: Get Single Product ---');

    // Test: Invalid ObjectId -> 400
    const invalidIdRes = await request(app).get('/products/invalid-id-12345');
    assertTest(
      'Invalid product ID format returns status 400',
      invalidIdRes.status === 400 && invalidIdRes.body.success === false
    );

    // Test: Non-existent ObjectId -> 404
    const nonExistentId = new mongoose.Types.ObjectId();
    const notFoundRes = await request(app).get(`/products/${nonExistentId}`);
    assertTest(
      'Non-existent product ID returns status 404',
      notFoundRes.status === 404 && notFoundRes.body.success === false
    );

    // Test: Valid Product ID -> 200
    const singleRes = await request(app).get(`/products/${createdProductId}`);
    assertTest(
      'Valid product ID returns status 200 with product details',
      singleRes.status === 200 &&
        singleRes.body.success === true &&
        singleRes.body.product._id === createdProductId &&
        singleRes.body.product.name === validProduct.name
    );

    // ----------------------------------------------------
    // TASK 5: Search & Category Filtering
    // ----------------------------------------------------
    console.log('\n--- Task 5: Search & Category Filtering ---');

    // Test: Case-insensitive search on name
    const searchRes = await request(app).get('/products?search=keyboard');
    assertTest(
      'Search query parameter filters by product name case-insensitively',
      searchRes.status === 200 &&
        searchRes.body.products.length > 0 &&
        searchRes.body.products.every((p) =>
          p.name.toLowerCase().includes('keyboard')
        )
    );

    // Test: Category filtering
    const categoryRes = await request(app).get('/products?category=Fashion');
    assertTest(
      'Category query parameter filters products by category',
      categoryRes.status === 200 &&
        categoryRes.body.products.length > 0 &&
        categoryRes.body.products.every(
          (p) => p.category.toLowerCase() === 'fashion'
        )
    );

    // Test: Combined Search and Category filtering
    const combinedRes = await request(app).get(
      '/products?search=shoes&category=Fashion'
    );
    assertTest(
      'Combined search & category filter returns only matching products in category',
      combinedRes.status === 200 &&
        combinedRes.body.products.length > 0 &&
        combinedRes.body.products.every(
          (p) =>
            p.category.toLowerCase() === 'fashion' &&
            p.name.toLowerCase().includes('shoes')
        )
    );

    // ----------------------------------------------------
    // BONUS CHALLENGE: Price Sorting (GET /products?sort=...)
    // ----------------------------------------------------
    console.log('\n--- Bonus Challenge: Price Sorting ---');

    // Test: Sort price ascending
    const ascRes = await request(app).get('/products?sort=price_asc');
    const ascPrices = ascRes.body.products.map((p) => p.price);
    const isAscSorted = ascPrices.every(
      (val, i, arr) => i === 0 || arr[i - 1] <= val
    );
    assertTest(
      'GET /products?sort=price_asc sorts products in ascending price order',
      ascRes.status === 200 && isAscSorted
    );

    // Test: Sort price descending
    const descRes = await request(app).get('/products?sort=price_desc');
    const descPrices = descRes.body.products.map((p) => p.price);
    const isDescSorted = descPrices.every(
      (val, i, arr) => i === 0 || arr[i - 1] >= val
    );
    assertTest(
      'GET /products?sort=price_desc sorts products in descending price order',
      descRes.status === 200 && isDescSorted
    );

    console.log('\n====================================================');
    console.log(`  🎉 ALL PRODUCT TESTS PASSED! (${passedTests}/${totalTests})`);
    console.log('  ShopKart Product APIs & Model 100% Verified!');
    console.log('====================================================\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Product Test Suite Aborted due to error:', error.message);
    if (error.stack) console.error(error.stack);
    process.exit(1);
  } finally {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    if (mongoServer) {
      await mongoServer.stop();
    }
  }
}

runProductTests();
