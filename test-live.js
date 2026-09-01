/**
 * 2G CLOTHING — LIVE RAILWAY TEST
 * Tests the live site at https://2gclothing-website.up.railway.app
 * Run with: node test-live.js
 */

const https = require('https');

const BASE = 'https://2gclothing-website.up.railway.app';

function request(method, path, body) {
  return new Promise((resolve, reject) => {
    const data   = body ? JSON.stringify(body) : null;
    const url    = new URL(BASE + path);
    const options = {
      hostname: url.hostname,
      port:     443,
      path:     url.pathname + url.search,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}),
      },
    };
    const req = https.request(options, (res) => {
      let raw = '';
      res.on('data', c => raw += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(raw) }); }
        catch { resolve({ status: res.statusCode, body: raw }); }
      });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

const pass  = (m) => console.log(`  \x1b[32m✓\x1b[0m ${m}`);
const fail  = (m) => console.log(`  \x1b[31m✗\x1b[0m ${m}`);
const title = (m) => console.log(`\n\x1b[1m${m}\x1b[0m`);

async function run() {
  console.log('\n\x1b[1m\x1b[36m══════════════════════════════════════════════════\x1b[0m');
  console.log('\x1b[1m\x1b[36m   2G CLOTHING — LIVE RAILWAY TEST\x1b[0m');
  console.log(`\x1b[1m\x1b[36m   ${BASE}\x1b[0m`);
  console.log('\x1b[1m\x1b[36m══════════════════════════════════════════════════\x1b[0m');

  let passed = 0, failed = 0, orderId = null;

  // 1. Health
  title('1. Health Check');
  try {
    const r = await request('GET', '/api/health');
    if (r.status === 200 && r.body.status === 'ok') {
      pass(`Server online — mode: ${r.body.mode}`);
      pass(`Merchant ID: ${r.body.merchant}`);
      pass(`Timestamp: ${r.body.timestamp}`);
      passed += 3;
    } else { fail('Health check failed: ' + JSON.stringify(r.body)); failed++; }
  } catch(e) { fail('Cannot reach server: ' + e.message); failed++; process.exit(1); }

  // 2. Pages
  title('2. All Pages (HTTPS)');
  const pages = ['/', '/shop.html', '/cart.html', '/checkout.html',
                 '/product.html', '/order-confirmation.html', '/sandbox-test.html'];
  for (const p of pages) {
    try {
      const r = await request('GET', p);
      r.status === 200
        ? (pass(`${p} → 200 OK`), passed++)
        : (fail(`${p} → ${r.status}`), failed++);
    } catch(e) { fail(`${p} → ERROR`); failed++; }
  }

  // 3. Create payment
  title('3. Create Payment API');
  try {
    const r = await request('POST', '/api/create-payment', {
      customer: {
        firstName: 'Njabulo', lastName: 'Mbele',
        email: 'sbtu01@payfast.co.za', phone: '+27831234567',
        address: '1 Style Street', apartment: '',
        city: 'Johannesburg', province: 'Gauteng', postal: '2000',
      },
      cart: [
        { id: 1,  name: '2G Original Two Gee Black', price: 350, qty: 1, size: 'M',  image: 'images/p1.jpeg' },
        { id: 8,  name: 'Coffee First Please White',  price: 400, qty: 1, size: 'L',  image: 'images/p15.jpeg' },
      ],
      shipping: 'standard',
      discount: 0,
    });
    if (r.status === 200 && r.body.orderId) {
      orderId = r.body.orderId;
      pass(`Order created: ${orderId}`);
      pass(`PayFast URL: ${r.body.payfast_url}`);
      pass(`Signature: ${r.body.data.signature}`);
      pass(`Amount: R${r.body.data.amount}`);
      pass(`Return URL: ${r.body.data.return_url}`);
      pass(`Notify URL: ${r.body.data.notify_url}`);
      passed += 6;
    } else { fail('Create payment failed: ' + JSON.stringify(r.body)); failed++; }
  } catch(e) { fail('Create payment error: ' + e.message); failed++; }

  // 4. Order lookup
  if (orderId) {
    title('4. Order Lookup');
    try {
      const r = await request('GET', `/api/order/${orderId}`);
      if (r.status === 200 && r.body.id === orderId) {
        pass(`Order found: ${r.body.id}`);
        pass(`Status: ${r.body.status}`);
        pass(`Customer: ${r.body.customer.name}`);
        pass(`Total: R${r.body.total}`);
        passed += 4;
      } else { fail('Order not found'); failed++; }
    } catch(e) { fail(e.message); failed++; }

    // 5. Manual confirm (simulate PayFast payment)
    title('5. Simulate Payment Confirmation');
    try {
      const r = await request('POST', `/api/sandbox/confirm/${orderId}`);
      if (r.status === 200 && r.body.success) {
        pass(`Order ${orderId} marked as PAID`);
        pass(`Status: ${r.body.order.status}`);
        passed += 2;
      } else { fail('Confirm failed: ' + JSON.stringify(r.body)); failed++; }
    } catch(e) { fail(e.message); failed++; }

    // 6. Verify status
    title('6. Verify Final Status');
    try {
      const r = await request('GET', `/api/order/${orderId}`);
      r.body.status === 'paid'
        ? (pass(`Status confirmed: ${r.body.status} ✓`), passed++)
        : (fail(`Wrong status: ${r.body.status}`), failed++);
    } catch(e) { fail(e.message); failed++; }
  }

  // 7. Sandbox orders
  title('7. Sandbox Orders List');
  try {
    const r = await request('GET', '/api/sandbox/orders');
    r.status === 200
      ? (pass(`Orders endpoint working — ${r.body.count} order(s)`), passed++)
      : (fail('Orders endpoint failed'), failed++);
  } catch(e) { fail(e.message); failed++; }

  // 8. Empty cart rejection
  title('8. Security — Empty Cart Rejection');
  try {
    const r = await request('POST', '/api/create-payment', {
      customer: { firstName:'A', lastName:'B', email:'a@b.com', phone:'123',
                  address:'1', apartment:'', city:'X', province:'Y', postal:'1' },
      cart: [], shipping: 'standard', discount: 0,
    });
    r.status === 400
      ? (pass(`Empty cart correctly rejected (400)`), passed++)
      : (fail(`Should be 400, got ${r.status}`), failed++);
  } catch(e) { fail(e.message); failed++; }

  // Results
  console.log('\n\x1b[1m\x1b[36m══════════════════════════════════════════════════\x1b[0m');
  console.log(`\x1b[1m  RESULTS:  \x1b[32m${passed} passed\x1b[0m\x1b[1m   \x1b[31m${failed} failed\x1b[0m`);
  console.log('\x1b[1m\x1b[36m══════════════════════════════════════════════════\x1b[0m');

  if (failed === 0) {
    console.log('\n\x1b[32m\x1b[1m  ✓ ALL TESTS PASSED — live site is fully working!\x1b[0m\n');
    console.log('  \x1b[1mYour live links:\x1b[0m');
    console.log(`  \x1b[36m${BASE}\x1b[0m`);
    console.log(`  \x1b[36m${BASE}/shop.html\x1b[0m`);
    console.log(`  \x1b[36m${BASE}/cart.html\x1b[0m`);
    console.log(`  \x1b[36m${BASE}/checkout.html\x1b[0m`);
    console.log(`  \x1b[36m${BASE}/sandbox-test.html\x1b[0m`);
    console.log(`  \x1b[36m${BASE}/api/health\x1b[0m\n`);

    if (orderId) {
      console.log('  \x1b[1mTest the full payment flow:\x1b[0m');
      console.log(`  1. Open: \x1b[36m${BASE}/sandbox-test.html\x1b[0m`);
      console.log(`  2. Click "Launch PayFast Sandbox Payment"`);
      console.log(`  3. Use card: \x1b[33m4000 0000 0000 0002\x1b[0m  CVV: \x1b[33m123\x1b[0m  OTP: \x1b[33m111111\x1b[0m`);
      console.log(`  4. Confirm order: \x1b[33m${orderId}\x1b[0m`);
      console.log(`  5. View result: \x1b[36m${BASE}/order-confirmation.html?order=${orderId}\x1b[0m\n`);
    }
  } else {
    console.log(`\n\x1b[31m  ${failed} test(s) failed. See errors above.\x1b[0m\n`);
  }
}

run().catch(console.error);
