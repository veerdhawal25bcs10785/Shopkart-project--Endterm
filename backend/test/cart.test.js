const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../index');
const Customer = require('../models/customer.model');
const Product = require('../models/product.model');

let mongoServer;

async function runCartTests() {
  console.log('====================================================');
  console.log('  ShopKart Shopping Cart (Lab 05) — Test Suite');
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

    // Seed test users
    const user1Data = {
      fullName: 'Charlie Davis',
      email: 'charlie@example.com',
      password: 'password123',
      phone: '9876543220',
    };
    const user2Data = {
      fullName: 'Dana Scully',
      email: 'dana@example.com',
      password: 'password123',
      phone: '9876543221',
    };

    await request(app).post('/customers/register').send(user1Data);
    await request(app).post('/customers/register').send(user2Data);

    const user1Login = await request(app)
      .post('/customers/login')
      .send({ email: user1Data.email, password: user1Data.password });
    const user1Cookie = user1Login.headers['set-cookie'].find((c) =>
      c.startsWith('token=')
    );

    const user2Login = await request(app)
      .post('/customers/login')
      .send({ email: user2Data.email, password: user2Data.password });
    const user2Cookie = user2Login.headers['set-cookie'].find((c) =>
      c.startsWith('token=')
    );

    // Create test products
    const inStockProduct = await Product.create({
      name: 'Ergonomic Desk Chair',
      description: 'Comfortable mesh office chair with lumbar support.',
      price: 8999,
      category: 'Furniture',
      image: 'https://example.com/chair.jpg',
      stock: 5,
    });

    const lowStockProduct = await Product.create({
      name: 'Wireless Ergonomic Mouse',
      description: 'Vertical mouse designed for neutral wrist posture.',
      price: 1999,
      category: 'Electronics',
      image: 'https://example.com/mouse.jpg',
      stock: 2,
    });

    const outOfStockProduct = await Product.create({
      name: 'Sold Out Smartwatch',
      description: 'Smart fitness tracker currently out of stock.',
      price: 4999,
      category: 'Electronics',
      image: 'https://example.com/watch.jpg',
      stock: 0,
    });

    // ----------------------------------------------------
    // TASK 1: Extend User Schema with Cart
    // ----------------------------------------------------
    console.log('--- Task 1: Extend User Schema with Cart ---');

    const freshUser = await Customer.findOne({ email: user1Data.email });
    assertTest(
      'User schema contains cart array defaulting to empty array',
      Array.isArray(freshUser.cart) && freshUser.cart.length === 0
    );

    const cartSchemaPath = Customer.schema.path('cart');
    assertTest(
      'Cart schema contains product ref and quantity field',
      cartSchemaPath &&
        cartSchemaPath.schema &&
        cartSchemaPath.schema.path('product') &&
        cartSchemaPath.schema.path('product').options.ref === 'Product' &&
        cartSchemaPath.schema.path('quantity')
    );

    // ----------------------------------------------------
    // TASK 2: Add Product to Cart API (POST /cart/:productId)
    // ----------------------------------------------------
    console.log('\n--- Task 2: Add Product to Cart API ---');

    // 2.1 Unauthenticated returns 401
    const unauthAdd = await request(app).post(`/cart/${inStockProduct._id}`);
    assertTest(
      'Unauthenticated POST /cart/:productId returns status 401',
      unauthAdd.status === 401 && unauthAdd.body.success === false
    );

    // 2.2 Invalid product ID format returns 400
    const invalidIdAdd = await request(app)
      .post('/cart/invalid-id-xyz')
      .set('Cookie', [user1Cookie]);
    assertTest(
      'Invalid product ID returns status 400',
      invalidIdAdd.status === 400
    );

    // 2.3 Non-existent product ID returns 404
    const notFoundAdd = await request(app)
      .post(`/cart/${new mongoose.Types.ObjectId()}`)
      .set('Cookie', [user1Cookie]);
    assertTest(
      'Non-existent product ID returns status 404',
      notFoundAdd.status === 404
    );

    // 2.4 Out of stock product returns 400
    const outOfStockAdd = await request(app)
      .post(`/cart/${outOfStockProduct._id}`)
      .set('Cookie', [user1Cookie]);
    assertTest(
      'Adding out of stock product returns status 400',
      outOfStockAdd.status === 400 &&
        outOfStockAdd.body.message === 'Product is out of stock'
    );

    // 2.5 Valid add first time sets quantity = 1
    const firstAddRes = await request(app)
      .post(`/cart/${inStockProduct._id}`)
      .set('Cookie', [user1Cookie]);
    assertTest(
      'Adding product for first time sets quantity to 1',
      firstAddRes.status === 200 &&
        firstAddRes.body.success === true &&
        firstAddRes.body.cart.length === 1 &&
        firstAddRes.body.cart[0].product._id.toString() ===
          inStockProduct._id.toString() &&
        firstAddRes.body.cart[0].quantity === 1
    );

    // 2.6 Adding same product again increments quantity to 2
    const secondAddRes = await request(app)
      .post(`/cart/${inStockProduct._id}`)
      .set('Cookie', [user1Cookie]);
    assertTest(
      'Adding same product again increments quantity to 2 without duplicate row',
      secondAddRes.status === 200 &&
        secondAddRes.body.cart.length === 1 &&
        secondAddRes.body.cart[0].quantity === 2
    );

    // Add lowStockProduct (stock: 2) -> qty = 1
    await request(app)
      .post(`/cart/${lowStockProduct._id}`)
      .set('Cookie', [user1Cookie]);
    // Add lowStockProduct again -> qty = 2
    await request(app)
      .post(`/cart/${lowStockProduct._id}`)
      .set('Cookie', [user1Cookie]);

    // 2.7 Adding lowStockProduct a third time exceeds stock (2) -> 400
    const exceedStockAdd = await request(app)
      .post(`/cart/${lowStockProduct._id}`)
      .set('Cookie', [user1Cookie]);
    assertTest(
      'Adding product beyond available stock returns status 400',
      exceedStockAdd.status === 400 &&
        exceedStockAdd.body.message.includes('stock')
    );

    // ----------------------------------------------------
    // TASK 3: Get Current User Cart (GET /cart)
    // ----------------------------------------------------
    console.log('\n--- Task 3: Get Current User Cart ---');

    // 3.1 Unauthenticated returns 401
    const unauthGet = await request(app).get('/cart');
    assertTest(
      'Unauthenticated GET /cart returns status 401',
      unauthGet.status === 401
    );

    // 3.2 Authenticated returns populated cart
    const user1CartRes = await request(app)
      .get('/cart')
      .set('Cookie', [user1Cookie]);
    assertTest(
      'GET /cart returns status 200 with populated product details',
      user1CartRes.status === 200 &&
        user1CartRes.body.success === true &&
        user1CartRes.body.cart.length === 2 &&
        user1CartRes.body.cart[0].product.name &&
        user1CartRes.body.cart[0].product.price &&
        user1CartRes.body.cart[0].product.stock
    );

    // 3.3 User isolation: User 2's cart is empty
    const user2CartRes = await request(app)
      .get('/cart')
      .set('Cookie', [user2Cookie]);
    assertTest(
      "User 2 cannot see User 1's cart (proper user isolation)",
      user2CartRes.status === 200 && user2CartRes.body.cart.length === 0
    );

    // ----------------------------------------------------
    // TASK 4: Update Product Quantity (PATCH /cart/:productId)
    // ----------------------------------------------------
    console.log('\n--- Task 4: Update Product Quantity ---');

    // 4.1 Unauthenticated returns 401
    const unauthPatch = await request(app)
      .patch(`/cart/${inStockProduct._id}`)
      .send({ quantity: 3 });
    assertTest(
      'Unauthenticated PATCH /cart/:productId returns status 401',
      unauthPatch.status === 401
    );

    // 4.2 Invalid quantity (< 1 or non-integer) returns 400
    const zeroQtyPatch = await request(app)
      .patch(`/cart/${inStockProduct._id}`)
      .set('Cookie', [user1Cookie])
      .send({ quantity: 0 });
    assertTest(
      'Quantity < 1 returns status 400',
      zeroQtyPatch.status === 400
    );

    const nonNumberQtyPatch = await request(app)
      .patch(`/cart/${inStockProduct._id}`)
      .set('Cookie', [user1Cookie])
      .send({ quantity: 'three' });
    assertTest(
      'Non-integer quantity returns status 400',
      nonNumberQtyPatch.status === 400
    );

    // 4.3 Quantity exceeding stock returns 400
    const exceedStockPatch = await request(app)
      .patch(`/cart/${lowStockProduct._id}`)
      .set('Cookie', [user1Cookie])
      .send({ quantity: 10 });
    assertTest(
      'Quantity exceeding product stock returns status 400',
      exceedStockPatch.status === 400 &&
        exceedStockPatch.body.message.includes('stock')
    );

    // 4.4 Product not in cart returns 404
    const notInCartPatch = await request(app)
      .patch(`/cart/${outOfStockProduct._id}`)
      .set('Cookie', [user1Cookie])
      .send({ quantity: 1 });
    assertTest(
      'Updating product not in cart returns status 404',
      notInCartPatch.status === 404
    );

    // 4.5 Valid quantity update returns 200
    const validPatch = await request(app)
      .patch(`/cart/${inStockProduct._id}`)
      .set('Cookie', [user1Cookie])
      .send({ quantity: 4 });
    assertTest(
      'Valid quantity update returns status 200 and updated cart',
      validPatch.status === 200 &&
        validPatch.body.success === true &&
        validPatch.body.cart.find(
          (i) => i.product._id.toString() === inStockProduct._id.toString()
        ).quantity === 4
    );

    // ----------------------------------------------------
    // TASK 5: Remove Product from Cart (DELETE /cart/:productId)
    // ----------------------------------------------------
    console.log('\n--- Task 5: Remove Product from Cart ---');

    // 5.1 Unauthenticated returns 401
    const unauthDelete = await request(app).delete(
      `/cart/${inStockProduct._id}`
    );
    assertTest(
      'Unauthenticated DELETE /cart/:productId returns status 401',
      unauthDelete.status === 401
    );

    // 5.2 Invalid product ID returns 400
    const invalidIdDelete = await request(app)
      .delete('/cart/invalid-id')
      .set('Cookie', [user1Cookie]);
    assertTest(
      'Invalid product ID on DELETE returns status 400',
      invalidIdDelete.status === 400
    );

    // 5.3 Product not in cart returns 404
    const notInCartDelete = await request(app)
      .delete(`/cart/${outOfStockProduct._id}`)
      .set('Cookie', [user1Cookie]);
    assertTest(
      'Removing product not in cart returns status 404',
      notInCartDelete.status === 404
    );

    // 5.4 Valid removal returns 200 and updated cart without product
    const validDelete = await request(app)
      .delete(`/cart/${inStockProduct._id}`)
      .set('Cookie', [user1Cookie]);
    assertTest(
      'Valid removal returns status 200 with updated cart',
      validDelete.status === 200 &&
        validDelete.body.success === true &&
        validDelete.body.cart.length === 1 &&
        validDelete.body.cart[0].product._id.toString() ===
          lowStockProduct._id.toString()
    );

    // 5.5 Removing second time returns 404
    const deleteAgain = await request(app)
      .delete(`/cart/${inStockProduct._id}`)
      .set('Cookie', [user1Cookie]);
    assertTest(
      'Removing already removed product returns status 404',
      deleteAgain.status === 404
    );

    // 5.6 Clear cart returns 200 and empty cart
    const clearRes = await request(app)
      .delete('/cart')
      .set('Cookie', [user1Cookie]);
    assertTest(
      'Clearing cart returns status 200 and empty cart array',
      clearRes.status === 200 &&
        clearRes.body.success === true &&
        clearRes.body.cart.length === 0
    );

    console.log('\n====================================================');
    console.log(`  🎉 ALL CART TESTS PASSED! (${passedTests}/${totalTests})`);
    console.log('  ShopKart Shopping Cart APIs & Validation 100% Verified!');
    console.log('====================================================\n');
  } catch (err) {
    console.error('\n❌ Test Suite Aborted due to error:', err);
    process.exitCode = 1;
  } finally {
    if (mongoServer) {
      await mongoose.disconnect();
      await mongoServer.stop();
    }
  }
}

if (require.main === module) {
  runCartTests();
}

module.exports = runCartTests;
