const request = require('supertest');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../index');
const Customer = require('../models/customer.model');

let mongoServer;

const sampleCustomer = {
  fullName: 'John Doe',
  email: 'john@gmail.com',
  password: 'john123',
  phone: '9876543210',
};

async function runTests() {
  console.log('====================================================');
  console.log('  ShopKart Authentication Service — Test Suite');
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
    // TASK 1: Registration Tests
    // ----------------------------------------------------
    console.log('--- Task 1: Customer Registration ---');

    // Test 1.1: Missing Fields -> 400
    const missingRes = await request(app)
      .post('/customers/register')
      .send({ email: 'incomplete@gmail.com', password: 'password123' });
    assertTest(
      'Missing fields return status 400',
      missingRes.status === 400 && missingRes.body.success === false
    );

    // Test 1.2: Password too short -> 400
    const shortPassRes = await request(app)
      .post('/customers/register')
      .send({ ...sampleCustomer, password: '123' });
    assertTest(
      'Password shorter than 6 chars returns status 400',
      shortPassRes.status === 400 && shortPassRes.body.success === false
    );

    // Test 1.3: Successful Registration -> 201
    const regRes = await request(app)
      .post('/customers/register')
      .send(sampleCustomer);
    assertTest(
      'Valid registration returns status 201 with success: true',
      regRes.status === 201 && regRes.body.success === true
    );
    assertTest(
      'Registration response returns customer object without password',
      regRes.body.customer &&
        regRes.body.customer.email === sampleCustomer.email &&
        regRes.body.customer.password === undefined
    );

    // Test 1.4: Verify bcrypt hash stored in DB
    const dbCustomer = await Customer.findOne({ email: sampleCustomer.email });
    assertTest(
      'Password is stored as bcrypt hash in MongoDB (not plain text)',
      dbCustomer &&
        dbCustomer.password !== sampleCustomer.password &&
        bcrypt.compareSync(sampleCustomer.password, dbCustomer.password)
    );

    // Test 1.5: Duplicate Email -> 409
    const dupRes = await request(app)
      .post('/customers/register')
      .send(sampleCustomer);
    assertTest(
      'Duplicate email registration returns status 409 Conflict',
      dupRes.status === 409 && dupRes.body.success === false
    );

    // ----------------------------------------------------
    // TASK 2: Login Tests
    // ----------------------------------------------------
    console.log('\n--- Task 2: Customer Login & Cookie Handling ---');

    // Test 2.1: Invalid Email -> 401
    const invalidEmailRes = await request(app)
      .post('/customers/login')
      .send({ email: 'nonexistent@gmail.com', password: sampleCustomer.password });
    assertTest(
      'Invalid email returns status 401 with generic "Invalid credentials"',
      invalidEmailRes.status === 401 &&
        invalidEmailRes.body.message === 'Invalid credentials'
    );

    // Test 2.2: Invalid Password -> 401
    const invalidPassRes = await request(app)
      .post('/customers/login')
      .send({ email: sampleCustomer.email, password: 'wrongpassword' });
    assertTest(
      'Invalid password returns status 401 with generic "Invalid credentials"',
      invalidPassRes.status === 401 &&
        invalidPassRes.body.message === 'Invalid credentials'
    );

    // Test 2.3: Successful Login -> 200 + HttpOnly Cookie
    const loginRes = await request(app)
      .post('/customers/login')
      .send({ email: sampleCustomer.email, password: sampleCustomer.password });
    assertTest(
      'Valid login returns status 200 and success: true',
      loginRes.status === 200 && loginRes.body.success === true
    );

    const cookies = loginRes.headers['set-cookie'];
    assertTest(
      'Login sets HttpOnly cookie "token"',
      cookies &&
        cookies.some(
          (cookie) => cookie.includes('token=') && cookie.includes('HttpOnly')
        )
    );

    // Extract auth cookie for subsequent tests
    const authCookie = cookies.find((c) => c.startsWith('token='));

    // ----------------------------------------------------
    // TASK 3: My Profile Tests
    // ----------------------------------------------------
    console.log('\n--- Task 3: Protected Profile Route ---');

    // Test 3.1: Profile access without cookie -> 401
    const unauthProfileRes = await request(app).get('/customers/me');
    assertTest(
      'Accessing /customers/me without cookie returns status 401',
      unauthProfileRes.status === 401
    );

    // Test 3.2: Profile access with invalid cookie -> 401
    const invalidCookieProfileRes = await request(app)
      .get('/customers/me')
      .set('Cookie', 'token=invalid_tampered_token');
    assertTest(
      'Accessing /customers/me with invalid token returns status 401',
      invalidCookieProfileRes.status === 401
    );

    // Test 3.3: Profile access with valid cookie -> 200
    const profileRes = await request(app)
      .get('/customers/me')
      .set('Cookie', authCookie);
    assertTest(
      'Accessing /customers/me with valid cookie returns status 200',
      profileRes.status === 200
    );
    assertTest(
      'Profile response contains user details and never exposes password',
      profileRes.body._id &&
        profileRes.body.email === sampleCustomer.email &&
        profileRes.body.fullName === sampleCustomer.fullName &&
        profileRes.body.password === undefined
    );

    // ----------------------------------------------------
    // BONUS CHALLENGE: Change Password
    // ----------------------------------------------------
    console.log('\n--- Bonus Challenge: Change Password Route ---');

    // Test Bonus 1: Change password without auth -> 401
    const unauthChangeRes = await request(app)
      .patch('/customers/change-password')
      .send({ oldPassword: sampleCustomer.password, newPassword: 'newSecretPass123' });
    assertTest(
      'Unauthenticated change-password returns status 401',
      unauthChangeRes.status === 401
    );

    // Test Bonus 2: Incorrect old password -> 400
    const wrongOldPassRes = await request(app)
      .patch('/customers/change-password')
      .set('Cookie', authCookie)
      .send({ oldPassword: 'wrongOldPassword', newPassword: 'newSecretPass123' });
    assertTest(
      'Incorrect old password returns status 400',
      wrongOldPassRes.status === 400
    );

    // Test Bonus 3: Successful password change -> 200
    const changePassRes = await request(app)
      .patch('/customers/change-password')
      .set('Cookie', authCookie)
      .send({ oldPassword: sampleCustomer.password, newPassword: 'newSecretPass123' });
    assertTest(
      'Valid password change returns status 200 with success: true',
      changePassRes.status === 200 && changePassRes.body.success === true
    );

    // Test Bonus 4: Old password no longer works
    const oldLoginRes = await request(app)
      .post('/customers/login')
      .send({ email: sampleCustomer.email, password: sampleCustomer.password });
    assertTest(
      'Old password no longer logs in (returns 401)',
      oldLoginRes.status === 401
    );

    // Test Bonus 5: New password successfully logs in
    const newLoginRes = await request(app)
      .post('/customers/login')
      .send({ email: sampleCustomer.email, password: 'newSecretPass123' });
    assertTest(
      'New password successfully logs in (returns 200)',
      newLoginRes.status === 200 && newLoginRes.body.success === true
    );
    const updatedCookie = newLoginRes.headers['set-cookie'].find((c) =>
      c.startsWith('token=')
    );

    // ----------------------------------------------------
    // TASK 4: Logout Tests
    // ----------------------------------------------------
    console.log('\n--- Task 4: Customer Logout ---');

    const logoutRes = await request(app)
      .post('/customers/logout')
      .set('Cookie', updatedCookie);
    assertTest(
      'Logout returns status 200 with success message',
      logoutRes.status === 200 && logoutRes.body.success === true
    );

    const clearedCookies = logoutRes.headers['set-cookie'];
    assertTest(
      'Logout clears the "token" cookie',
      clearedCookies &&
        clearedCookies.some((c) => c.includes('token=;') || c.includes('Expires='))
    );

    // Final Summary
    console.log('\n====================================================');
    console.log(`  🎉 ALL TESTS PASSED! (${passedTests}/${totalTests})`);
    console.log('  ShopKart Customer Authentication Service is 100% Ready!');
    console.log('====================================================\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Test Suite Aborted due to error:', error.message);
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

runTests();
