const request = require('supertest');
const app = require('../index');

async function testCorsAndCookieFlow() {
  console.log('--- Testing CORS & Origin Headers for Frontend Integration ---');

  // Test CORS preflight request with frontend origin
  const preflightRes = await request(app)
    .options('/customers/login')
    .set('Origin', 'http://localhost:5173')
    .set('Access-Control-Request-Method', 'POST');

  console.log('Preflight status:', preflightRes.status);
  console.log('Access-Control-Allow-Origin:', preflightRes.headers['access-control-allow-origin']);
  console.log('Access-Control-Allow-Credentials:', preflightRes.headers['access-control-allow-credentials']);

  const isCorsValid =
    preflightRes.headers['access-control-allow-origin'] === 'http://localhost:5173' &&
    preflightRes.headers['access-control-allow-credentials'] === 'true';

  if (!isCorsValid) {
    throw new Error('CORS configuration failed for http://localhost:5173');
  }

  console.log('✅ CORS headers configured perfectly for Frontend Lab 02!');
  process.exit(0);
}

testCorsAndCookieFlow().catch((err) => {
  console.error('❌ Error:', err);
  process.exit(1);
});
