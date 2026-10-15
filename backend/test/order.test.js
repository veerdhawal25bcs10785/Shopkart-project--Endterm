const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../index');
const Customer = require('../models/customer.model');
const Product = require('../models/product.model');
const Order = require('../models/order.model');
const { generateTestSignature } = require('../config/razorpay');

let mongoServer;

async function runOrderTests() {
  console.log('====================================================');
  console.log('  ShopKart Checkout & Orders (Lab 06) — Test Suite');
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
      fullName: 'Emma Watson',
      email: 'emma@example.com',
      password: 'password123',
      phone: '9876543201',
    };
    const user2Data = {
      fullName: 'Ron Weasley',
      email: 'ron@example.com',
      password: 'password123',
      phone: '9876543202',
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

    // Seed test products
    const product1 = await Product.create({
      name: 'Wireless Mechanical Keyboard',
      description: 'Tactile mechanical keyboard with RGB backlighting',
      price: 2999,
      category: 'Electronics',
      image: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=500',
      stock: 5,
    });

    const product2 = await Product.create({
      name: 'Ergonomic Mouse',
      description: 'Vertical mouse with customizable buttons',
      price: 1499,
      category: 'Electronics',
      image: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=500',
      stock: 2,
    });

    const outOfStockProduct = await Product.create({
      name: 'Sold Out Desk Mat',
      description: 'Extended large desk mat',
      price: 799,
      category: 'Accessories',
      image: 'https://images.unsplash.com/photo-1616440347437-b1c73416efc2?w=500',
      stock: 0,
    });

    const validAddress = {
      fullName: 'Emma Watson',
      addressLine: '42 Baker Street, Apt 3B',
      city: 'London',
      state: 'Greater London',
      postalCode: 'NW1 6XE',
      phone: '9876543201',
    };

    console.log('--- Task 1: Order Model Schema & Validation ---');
    const schemaPaths = Order.schema.paths;
    const itemsPath = Order.schema.path('items');
    const hasItemSnapshots = !!(itemsPath && itemsPath.schema && itemsPath.schema.paths.name && itemsPath.schema.paths.price);
    const addressPath = Order.schema.path('shippingAddress');
    const hasAddress = !!(schemaPaths['shippingAddress.city'] || (addressPath && addressPath.schema && addressPath.schema.paths.city));

    assertTest('Order schema contains customer ref', schemaPaths.customer && schemaPaths.customer.options.ref === 'Customer');
    assertTest('Order schema contains items array with required snapshots', hasItemSnapshots);
    assertTest('Order schema contains shippingAddress', hasAddress);
    assertTest('Order schema defaults paymentStatus to PENDING', schemaPaths.paymentStatus.defaultValue === 'PENDING');
    assertTest('Order schema defaults orderStatus to PLACED', schemaPaths.orderStatus.defaultValue === 'PLACED');

    console.log('\n--- Task 2: Create Payment Order API ---');
    // 2.1 Unauthenticated request
    const unauthCreate = await request(app)
      .post('/orders/create-payment-order')
      .send({ shippingAddress: validAddress });
    assertTest('Unauthenticated POST /orders/create-payment-order returns 401', unauthCreate.status === 401);

    // 2.2 Missing shipping address
    const missingAddress = await request(app)
      .post('/orders/create-payment-order')
      .set('Cookie', user1Cookie)
      .send({});
    assertTest('Missing shipping address returns 400', missingAddress.status === 400);

    // 2.3 Incomplete shipping address
    const incompleteAddress = await request(app)
      .post('/orders/create-payment-order')
      .set('Cookie', user1Cookie)
      .send({ shippingAddress: { fullName: 'Emma' } });
    assertTest('Incomplete address fields return 400', incompleteAddress.status === 400);

    // 2.4 Checkout with empty cart
    const emptyCartCheckout = await request(app)
      .post('/orders/create-payment-order')
      .set('Cookie', user1Cookie)
      .send({ shippingAddress: validAddress });
    assertTest('Checkout with empty cart returns 400', emptyCartCheckout.status === 400);

    // Populate user1 cart: 2 keyboards (2999 each) + 1 mouse (1499)
    await request(app)
      .post(`/cart/${product1._id}`)
      .set('Cookie', user1Cookie);
    await request(app)
      .post(`/cart/${product1._id}`)
      .set('Cookie', user1Cookie);
    await request(app)
      .post(`/cart/${product2._id}`)
      .set('Cookie', user1Cookie);

    // 2.5 Valid payment order creation
    const validCreateRes = await request(app)
      .post('/orders/create-payment-order')
      .set('Cookie', user1Cookie)
      .send({ shippingAddress: validAddress });

    assertTest('Valid checkout order returns status 201 with success: true', validCreateRes.status === 201 && validCreateRes.body.success === true);
    assertTest('Response includes razorpayOrderId, amount in paise, and keyId', !!validCreateRes.body.razorpayOrderId && validCreateRes.body.amount > 0 && !!validCreateRes.body.keyId);

    // Verify calculated amount: (2999 * 2) + (1499 * 1) = 5998 + 1499 = 7497
    const expectedTotal = 7497;
    assertTest('Order total calculated strictly on server matches item subtotal sum', validCreateRes.body.order.totalAmount === expectedTotal);
    assertTest('Razorpay amount is in paise (100x)', validCreateRes.body.amount === expectedTotal * 100);

    const createdOrderId = validCreateRes.body.orderId;
    const rzpOrderId = validCreateRes.body.razorpayOrderId;

    // Verify cart is NOT cleared before payment is verified
    const cartCheck = await request(app).get('/cart').set('Cookie', user1Cookie);
    assertTest('Cart is NOT cleared upon order initiation (remains intact until payment)', cartCheck.body.cart.length === 2);

    console.log('\n--- Task 3: Payment Verification API ---');
    // 3.1 Unauthenticated verify
    const unauthVerify = await request(app)
      .post('/orders/verify-payment')
      .send({ orderId: createdOrderId });
    assertTest('Unauthenticated POST /orders/verify-payment returns 401', unauthVerify.status === 401);

    // 3.2 Missing parameters
    const missingParamsVerify = await request(app)
      .post('/orders/verify-payment')
      .set('Cookie', user1Cookie)
      .send({ orderId: createdOrderId });
    assertTest('Missing payment parameters returns 400', missingParamsVerify.status === 400);

    // 3.3 Invalid signature verification
    const invalidSigRes = await request(app)
      .post('/orders/verify-payment')
      .set('Cookie', user1Cookie)
      .send({
        orderId: createdOrderId,
        razorpay_order_id: rzpOrderId,
        razorpay_payment_id: 'pay_test_12345',
        razorpay_signature: 'invalid_forged_signature_hash',
      });
    assertTest('Forged/invalid signature returns 400', invalidSigRes.status === 400);

    const failedOrderCheck = await Order.findById(createdOrderId);
    assertTest('Failed payment verification updates status to FAILED', failedOrderCheck.paymentStatus === 'FAILED');

    // 3.4 User 2 cannot verify User 1's order
    const validTestPaymentId = `pay_${Date.now()}`;
    const validSig = generateTestSignature(rzpOrderId, validTestPaymentId);

    const unauthorizedVerify = await request(app)
      .post('/orders/verify-payment')
      .set('Cookie', user2Cookie)
      .send({
        orderId: createdOrderId,
        razorpay_order_id: rzpOrderId,
        razorpay_payment_id: validTestPaymentId,
        razorpay_signature: validSig,
      });
    assertTest('User 2 attempting to verify User 1 order returns 403 or 404', [403, 404].includes(unauthorizedVerify.status));

    // Record product stock before successful verification
    const p1Before = await Product.findById(product1._id);
    const p2Before = await Product.findById(product2._id);

    // 3.5 Valid payment verification
    const validVerifyRes = await request(app)
      .post('/orders/verify-payment')
      .set('Cookie', user1Cookie)
      .send({
        orderId: createdOrderId,
        razorpay_order_id: rzpOrderId,
        razorpay_payment_id: validTestPaymentId,
        razorpay_signature: validSig,
      });

    assertTest('Valid payment verification returns 200 with success: true', validVerifyRes.status === 200 && validVerifyRes.body.success === true);
    assertTest('Order paymentStatus updated to PAID and orderStatus to CONFIRMED', validVerifyRes.body.order.paymentStatus === 'PAID' && validVerifyRes.body.order.orderStatus === 'CONFIRMED');

    // 3.6 Stock deduction
    const p1After = await Product.findById(product1._id);
    const p2After = await Product.findById(product2._id);
    assertTest('Product inventory stock is properly deducted after payment confirmation', p1After.stock === p1Before.stock - 2 && p2After.stock === p2Before.stock - 1);

    // 3.7 Cart cleared
    const cartAfterPayment = await request(app).get('/cart').set('Cookie', user1Cookie);
    assertTest('Customer cart is cleared after verified payment', cartAfterPayment.body.cart.length === 0);

    console.log('\n--- Task 4: Get Order History (GET /orders) ---');
    const myOrdersRes = await request(app).get('/orders').set('Cookie', user1Cookie);
    assertTest('GET /orders returns 200 with orders array', myOrdersRes.status === 200 && Array.isArray(myOrdersRes.body.orders));
    assertTest('GET /orders returns at least 1 order for user 1', myOrdersRes.body.orders.length >= 1);

    const user2OrdersRes = await request(app).get('/orders').set('Cookie', user2Cookie);
    assertTest('User 2 orders list is empty (proper user isolation)', user2OrdersRes.body.orders.length === 0);

    console.log('\n--- Task 5: Get Single Order Details (GET /orders/:id) ---');
    // 5.1 Invalid ID format
    const invalidIdRes = await request(app).get('/orders/123invalid').set('Cookie', user1Cookie);
    assertTest('Invalid order ID returns 400', invalidIdRes.status === 400);

    // 5.2 Non-existent ID
    const fakeId = new mongoose.Types.ObjectId();
    const notFoundRes = await request(app).get(`/orders/${fakeId}`).set('Cookie', user1Cookie);
    assertTest('Non-existent order returns 404', notFoundRes.status === 404);

    // 5.3 User 2 cannot access User 1 order
    const user2AccessRes = await request(app).get(`/orders/${createdOrderId}`).set('Cookie', user2Cookie);
    assertTest('User 2 cannot access User 1 order (returns 404)', user2AccessRes.status === 404);

    // 5.4 Valid retrieval
    const validOrderGet = await request(app).get(`/orders/${createdOrderId}`).set('Cookie', user1Cookie);
    assertTest('Owner can retrieve their order details with status 200', validOrderGet.status === 200 && validOrderGet.body.order._id === createdOrderId);

    console.log('\n--- Bonus Challenge: Update Order Status ---');
    const updateStatusRes = await request(app)
      .patch(`/orders/${createdOrderId}/status`)
      .set('Cookie', user1Cookie)
      .send({ orderStatus: 'SHIPPED' });
    assertTest('PATCH /orders/:id/status updates status to SHIPPED with 200', updateStatusRes.status === 200 && updateStatusRes.body.order.orderStatus === 'SHIPPED');

    const invalidStatusRes = await request(app)
      .patch(`/orders/${createdOrderId}/status`)
      .set('Cookie', user1Cookie)
      .send({ orderStatus: 'FLYING_TO_SPACE' });
    assertTest('Invalid status transition returns 400', invalidStatusRes.status === 400);

    console.log('\n====================================================');
    console.log(`  🎉 ALL CHECKOUT & ORDER TESTS PASSED! (${passedTests}/${totalTests})`);
    console.log('  ShopKart Lab 06 Backend 100% Complete & Verified!');
    console.log('====================================================\n');
  } catch (error) {
    console.error('Test Suite Failed:', error);
    process.exit(1);
  } finally {
    if (mongoServer) {
      await mongoose.disconnect();
      await mongoServer.stop();
    }
  }
}

if (require.main === module) {
  runOrderTests();
}

module.exports = { runOrderTests };
