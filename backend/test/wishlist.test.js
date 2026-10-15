const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../index');
const Customer = require('../models/customer.model');
const Product = require('../models/product.model');

let mongoServer;

async function runWishlistTests() {
  console.log('====================================================');
  console.log('  ShopKart Wishlist (Lab 04) — Test Suite');
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

    // Seed test users & products
    const user1Data = {
      fullName: 'Alice Walker',
      email: 'alice@example.com',
      password: 'password123',
      phone: '9876543210',
    };
    const user2Data = {
      fullName: 'Bob Smith',
      email: 'bob@example.com',
      password: 'password123',
      phone: '9876543211',
    };

    const user1Reg = await request(app).post('/customers/register').send(user1Data);
    const user2Reg = await request(app).post('/customers/register').send(user2Data);

    // Login user 1
    const user1Login = await request(app)
      .post('/customers/login')
      .send({ email: user1Data.email, password: user1Data.password });
    const user1Cookie = user1Login.headers['set-cookie'].find((c) =>
      c.startsWith('token=')
    );

    // Login user 2
    const user2Login = await request(app)
      .post('/customers/login')
      .send({ email: user2Data.email, password: user2Data.password });
    const user2Cookie = user2Login.headers['set-cookie'].find((c) =>
      c.startsWith('token=')
    );

    // Create 2 test products
    const product1 = await Product.create({
      name: 'Wireless Noise Cancelling Headphones',
      description: 'Over-ear headphones with active noise cancellation.',
      price: 4999,
      category: 'Electronics',
      image: 'https://example.com/headphones.jpg',
      stock: 12,
    });

    const product2 = await Product.create({
      name: 'Mechanical Gaming Keyboard',
      description: 'Tenkeyless mechanical keyboard with RGB backlighting.',
      price: 2999,
      category: 'Electronics',
      image: 'https://example.com/keyboard.jpg',
      stock: 8,
    });

    // ----------------------------------------------------
    // TASK 1: User Schema Wishlist Field
    // ----------------------------------------------------
    console.log('--- Task 1: Extend User Schema ---');

    const freshUser = await Customer.findOne({ email: user1Data.email });
    assertTest(
      'User schema contains wishlist field defaulting to an array',
      Array.isArray(freshUser.wishlist) && freshUser.wishlist.length === 0
    );

    const wishlistSchemaPath = Customer.schema.path('wishlist');
    assertTest(
      'Wishlist field references Product model',
      wishlistSchemaPath &&
        wishlistSchemaPath.caster &&
        wishlistSchemaPath.caster.options &&
        wishlistSchemaPath.caster.options.ref === 'Product'
    );

    // ----------------------------------------------------
    // TASK 2: Add Product to Wishlist API (POST /wishlist/:productId)
    // ----------------------------------------------------
    console.log('\n--- Task 2: Add Product to Wishlist API ---');

    // 2.1 Unauthenticated request returns 401
    const unauthAdd = await request(app).post(`/wishlist/${product1._id}`);
    assertTest(
      'Unauthenticated POST /wishlist/:productId returns status 401',
      unauthAdd.status === 401 && unauthAdd.body.success === false
    );

    // 2.2 Invalid product ID returns 400
    const invalidIdAdd = await request(app)
      .post('/wishlist/invalid-id-xyz')
      .set('Cookie', [user1Cookie]);
    assertTest(
      'Invalid product ID format returns status 400',
      invalidIdAdd.status === 400 && invalidIdAdd.body.success === false
    );

    // 2.3 Non-existent product ID returns 404
    const nonExistentId = new mongoose.Types.ObjectId();
    const notFoundAdd = await request(app)
      .post(`/wishlist/${nonExistentId}`)
      .set('Cookie', [user1Cookie]);
    assertTest(
      'Non-existent product ID returns status 404',
      notFoundAdd.status === 404 && notFoundAdd.body.success === false
    );

    // 2.4 Valid add returns 200/201 and success message
    const validAdd = await request(app)
      .post(`/wishlist/${product1._id}`)
      .set('Cookie', [user1Cookie]);
    assertTest(
      'Valid add returns status 200/201 with success: true and message',
      (validAdd.status === 200 || validAdd.status === 201) &&
        validAdd.body.success === true &&
        validAdd.body.message === 'Product added to wishlist'
    );

    // Check DB stores ObjectId only
    const userDocAfterAdd = await Customer.findOne({ email: user1Data.email });
    assertTest(
      'Database stores Product ObjectId reference in wishlist array',
      userDocAfterAdd.wishlist.length === 1 &&
        userDocAfterAdd.wishlist[0].toString() === product1._id.toString()
    );

    // 2.5 Duplicate prevention returns 409 Conflict
    const duplicateAdd = await request(app)
      .post(`/wishlist/${product1._id}`)
      .set('Cookie', [user1Cookie]);
    assertTest(
      'Adding duplicate product returns status 409 Conflict',
      duplicateAdd.status === 409 &&
        duplicateAdd.body.success === false &&
        duplicateAdd.body.message === 'Product already in wishlist'
    );

    // Add second product to user1
    await request(app)
      .post(`/wishlist/${product2._id}`)
      .set('Cookie', [user1Cookie]);

    // ----------------------------------------------------
    // TASK 3: Get Current User Wishlist (GET /wishlist)
    // ----------------------------------------------------
    console.log('\n--- Task 3: Get Current User Wishlist ---');

    // 3.1 Unauthenticated returns 401
    const unauthGet = await request(app).get('/wishlist');
    assertTest(
      'Unauthenticated GET /wishlist returns status 401',
      unauthGet.status === 401
    );

    // 3.2 Authenticated GET returns populated products
    const user1WishlistRes = await request(app)
      .get('/wishlist')
      .set('Cookie', [user1Cookie]);
    assertTest(
      'GET /wishlist returns status 200 with populated product details and count',
      user1WishlistRes.status === 200 &&
        user1WishlistRes.body.success === true &&
        user1WishlistRes.body.count === 2 &&
        user1WishlistRes.body.wishlist[0].name === product1.name &&
        user1WishlistRes.body.wishlist[0].price === product1.price &&
        user1WishlistRes.body.wishlist[0].category === product1.category &&
        user1WishlistRes.body.wishlist[0].stock === product1.stock
    );

    // 3.3 Security & Isolation: User 2's wishlist is empty
    const user2WishlistRes = await request(app)
      .get('/wishlist')
      .set('Cookie', [user2Cookie]);
    assertTest(
      "User 2 cannot see User 1's wishlist (proper resource isolation)",
      user2WishlistRes.status === 200 &&
        user2WishlistRes.body.count === 0 &&
        user2WishlistRes.body.wishlist.length === 0
    );

    // ----------------------------------------------------
    // TASK 4: Remove Product from Wishlist (DELETE /wishlist/:productId)
    // ----------------------------------------------------
    console.log('\n--- Task 4: Remove Product from Wishlist ---');

    // 4.1 Unauthenticated returns 401
    const unauthDelete = await request(app).delete(`/wishlist/${product1._id}`);
    assertTest(
      'Unauthenticated DELETE /wishlist/:productId returns status 401',
      unauthDelete.status === 401
    );

    // 4.2 Invalid product ID returns 400
    const invalidIdDelete = await request(app)
      .delete('/wishlist/invalid-product-id')
      .set('Cookie', [user1Cookie]);
    assertTest(
      'Invalid product ID format on DELETE returns status 400',
      invalidIdDelete.status === 400
    );

    // 4.3 Product not in wishlist returns 404
    const notInWishlistDelete = await request(app)
      .delete(`/wishlist/${product1._id}`)
      .set('Cookie', [user2Cookie]); // user2 has empty wishlist
    assertTest(
      'Deleting product not in wishlist returns status 404',
      notInWishlistDelete.status === 404 &&
        notInWishlistDelete.body.message === 'Product not in wishlist'
    );

    // 4.4 Valid removal returns 200
    const validDelete = await request(app)
      .delete(`/wishlist/${product1._id}`)
      .set('Cookie', [user1Cookie]);
    assertTest(
      'Valid removal returns status 200 with success message',
      validDelete.status === 200 &&
        validDelete.body.success === true &&
        validDelete.body.message === 'Product removed from wishlist'
    );

    // Verify User 1 now has only product2
    const user1AfterDelete = await request(app)
      .get('/wishlist')
      .set('Cookie', [user1Cookie]);
    assertTest(
      'User wishlist count and items updated in database after removal',
      user1AfterDelete.body.count === 1 &&
        user1AfterDelete.body.wishlist[0]._id.toString() === product2._id.toString()
    );

    // ----------------------------------------------------
    // BONUS CHALLENGES: Wishlist Toggle & Count
    // ----------------------------------------------------
    console.log('\n--- Bonus Challenges: Toggle & Count APIs ---');

    // Bonus Toggle: Remove product2 (currently saved)
    const toggleOff = await request(app)
      .patch(`/wishlist/${product2._id}/toggle`)
      .set('Cookie', [user1Cookie]);
    assertTest(
      'PATCH /wishlist/:productId/toggle removes product when already saved (saved: false)',
      toggleOff.status === 200 &&
        toggleOff.body.success === true &&
        toggleOff.body.saved === false
    );

    // Bonus Toggle: Add product2 back (currently absent)
    const toggleOn = await request(app)
      .patch(`/wishlist/${product2._id}/toggle`)
      .set('Cookie', [user1Cookie]);
    assertTest(
      'PATCH /wishlist/:productId/toggle adds product when absent (saved: true)',
      toggleOn.status === 200 &&
        toggleOn.body.success === true &&
        toggleOn.body.saved === true
    );

    // Bonus Count: GET /wishlist/count
    const countRes = await request(app)
      .get('/wishlist/count')
      .set('Cookie', [user1Cookie]);
    assertTest(
      'GET /wishlist/count returns correct item count (1)',
      countRes.status === 200 &&
        countRes.body.success === true &&
        countRes.body.count === 1
    );

    console.log('\n====================================================');
    console.log(`  🎉 ALL WISHLIST TESTS PASSED! (${passedTests}/${totalTests})`);
    console.log('  ShopKart Wishlist APIs & Architecture 100% Verified!');
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
  runWishlistTests();
}

module.exports = runWishlistTests;
