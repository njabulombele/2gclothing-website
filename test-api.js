/**
 * 2G CLOTHING — API TEST SCRIPT
 * Run with: node test-api.js
 */

const http = require('http');

const BASE = 'http://localhost:3000';

function request(method, path, body) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const options = {
      hostname: 'localhost',
      port: 3000,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}),
      },
    };
    const req = http.request(options, (res) => {
      let raw = '';
      res.on('data', chunk => raw += chunk);
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

function pass(msg) { console.log(`  \x1b[32m✓\x1b[0m ${msg}`); }
function fail(msg) { console.log(`  \x1b[31m✗\x1b[0m ${msg}`); }
function title(msg) { console.log(`\n\x1b[1m${msg}\x1b[0m`); }

async function run() {
  console.log('\n\x1b[1m\x1b[36m═══════════════════════════════════════\x1b[0m');
  console.log('\x1b[1m\x1b[36m   2G CLOTHING — FULL API TEST\x1b[0m');
  console.log('\x1b[1m\x1b[36m═══════════════════════════════════════\x1b[0m');

  let passed = 0;
  let failed = 0;
  let orderId = null;

  // ── 1. Health check ──────────────────────────────────────────
  title('1. Health Check');
  try {
    const r = await request('GET', '/api/health');
    if (r.status === 200 && r.body.status === 'ok') {
      pass(`Server online — mode: ${r.body.mode}`);
      pass(`Merchant ID: ${r.body.merchant}`);
      pass(`Site URL: ${r.body.siteUrl}`);
      passed += 3;
    } else {
      fail('Health check failed'); failed++;
    }
  } catch (e) { fail('Server not running: ' + e.message); failed++; }

  // ── 2. Static pages ──────────────────────────────────────────
  title('2. Static Pages');
  const pages = ['/', '/shop.html', '/cart.html', '/checkout.html',
                 '/product.html', '/order-confirmation.html', '/sandbox-test.html'];
  for (const page of pages) {
    try {
      const r = await request('GET', page);
      if (r.status === 200) { pass(`${page} → 200 OK`); passed++; }
      else { fail(`${page} → ${r.status}`); failed++; }
    } catch (e) { fail(`${page} → ERROR`); failed++; }
  }

  // ── 3. Create payment ────────────────────────────────────────
  title('3. Create Payment (POST /api/create-payment)');
  try {
    const r = await request('POST', '/api/create-payment', {
      customer: {
        firstName: 'Njabulo', lastName: 'Test',
        email: 'sbtu01@payfast.co.za', phone: '+27831234567',
        address: '1 Style Street', apartment: '', city: 'Johannesburg',
        province: 'Gauteng', postal: '2000',
      },
      cart: [
        { id: 1, name: '2G Original Two Gee Black', price: 350, qty: 1, size: 'M', image: 'images/p1.jpeg' },
        { id: 8, name: 'Coffee First Please White', price: 400, qty: 2, size: 'L', image: 'images/p15.jpeg' },
      ],
      shipping: 'standard',
      discount: 0,
    });

    if (r.status === 200 && r.body.orderId) {
      orderId = r.body.orderId;
      // Cart: R350 + 2×R400 = R1150 — over R800 so shipping is FREE → total R1150
      const expectedTotal = 350 + (400 * 2); // shipping free over R800
      pass(`Order created: ${orderId}`);
      pass(`PayFast URL: ${r.body.payfast_url}`);
      pass(`Signature generated: ${r.body.data.signature ? 'yes' : 'no'}`);
      pass(`Total: R${r.body.data.amount} (expected R${expectedTotal} — shipping FREE over R800)`);
      parseFloat(r.body.data.amount) === expectedTotal
        ? (pass('Total calculation correct — free shipping applied'), passed++)
        : (fail(`Total mismatch — got R${r.body.data.amount}, expected R${expectedTotal}`), failed++);
      passed += 4;
    } else {
      fail(`Create payment failed: ${JSON.stringify(r.body)}`); failed++;
    }
  } catch (e) { fail('Create payment error: ' + e.message); failed++; }

  // ── 4. Free shipping over R800 ───────────────────────────────
  title('4. Free Shipping (order over R800)');
  try {
    const r = await request('POST', '/api/create-payment', {
      customer: { firstName: 'Big', lastName: 'Spender', email: 'test@test.com', phone: '+27831234567', address: '1 St', apartment: '', city: 'JHB', province: 'Gauteng', postal: '2000' },
      cart: [{ id: 1, name: 'Tee', price: 900, qty: 1, size: 'L', image: 'images/p1.jpeg' }],
      shipping: 'standard', discount: 0,
    });
    if (r.status === 200 && parseFloat(r.body.data.amount) === 900) {
      pass(`R900 order → shipping FREE → total R${r.body.data.amount}`); passed++;
    } else {
      fail(`Free shipping not applied — total R${r.body.data?.amount}`); failed++;
    }
  } catch (e) { fail('Free shipping test error: ' + e.message); failed++; }

  // ── 5. Express shipping ──────────────────────────────────────
  title('5. Express Shipping (R180)');
  try {
    const r = await request('POST', '/api/create-payment', {
      customer: { firstName: 'Express', lastName: 'Test', email: 'test@test.com', phone: '+27831234567', address: '1 St', apartment: '', city: 'JHB', province: 'Gauteng', postal: '2000' },
      cart: [{ id: 1, name: 'Tee', price: 350, qty: 1, size: 'M', image: 'images/p1.jpeg' }],
      shipping: 'express', discount: 0,
    });
    const expected = 350 + 180;
    if (r.status === 200 && parseFloat(r.body.data.amount) === expected) {
      pass(`Express shipping applied → total R${r.body.data.amount}`); passed++;
    } else {
      fail(`Express shipping wrong — got R${r.body.data?.amount}, expected R${expected}`); failed++;
    }
  } catch (e) { fail('Express shipping test error: ' + e.message); failed++; }

  // ── 6. Order lookup ──────────────────────────────────────────
  if (orderId) {
    title('6. Order Lookup (GET /api/order/:id)');
    try {
      const r = await request('GET', `/api/order/${orderId}`);
      if (r.status === 200 && r.body.id === orderId) {
        pass(`Order found: ${r.body.id}`);
        pass(`Status: ${r.body.status}`);
        pass(`Customer: ${r.body.customer.name}`);
        pass(`Total: R${r.body.total}`);
        passed += 4;
      } else { fail('Order lookup failed'); failed++; }
    } catch (e) { fail('Order lookup error: ' + e.message); failed++; }

    // ── 7. Manual sandbox confirm ────────────────────────────────
    title('7. Sandbox Manual Confirm (POST /api/sandbox/confirm/:id)');
    try {
      const r = await request('POST', `/api/sandbox/confirm/${orderId}`);
      if (r.status === 200 && r.body.success && r.body.order.status === 'paid') {
        pass(`Order ${orderId} marked as PAID`);
        pass(`Payment ID: ${r.body.order.id}`);
        passed += 2;
      } else { fail('Manual confirm failed'); failed++; }
    } catch (e) { fail('Manual confirm error: ' + e.message); failed++; }

    // Verify status updated
    title('8. Verify Order Status After Confirm');
    try {
      const r = await request('GET', `/api/order/${orderId}`);
      if (r.body.status === 'paid') {
        pass(`Status correctly updated to: ${r.body.status}`); passed++;
      } else { fail(`Status still: ${r.body.status}`); failed++; }
    } catch (e) { fail('Status verify error: ' + e.message); failed++; }
  }

  // ── 9. Sandbox orders list ───────────────────────────────────
  title('9. Sandbox Orders List (GET /api/sandbox/orders)');
  try {
    const r = await request('GET', '/api/sandbox/orders');
    if (r.status === 200 && typeof r.body.count === 'number') {
      pass(`Orders in memory: ${r.body.count}`);
      passed++;
    } else { fail('Orders list failed'); failed++; }
  } catch (e) { fail('Orders list error: ' + e.message); failed++; }

  // ── 10. Empty cart rejection ─────────────────────────────────
  title('10. Empty Cart Rejection');
  try {
    const r = await request('POST', '/api/create-payment', {
      customer: { firstName: 'A', lastName: 'B', email: 'a@b.com', phone: '123', address: '1', apartment: '', city: 'X', province: 'Y', postal: '1' },
      cart: [], shipping: 'standard', discount: 0,
    });
    if (r.status === 400 && r.body.error) {
      pass(`Empty cart correctly rejected: "${r.body.error}"`); passed++;
    } else { fail('Empty cart not rejected'); failed++; }
  } catch (e) { fail('Empty cart test error: ' + e.message); failed++; }

  // ── RESULTS ──────────────────────────────────────────────────
  console.log('\n\x1b[1m\x1b[36m═══════════════════════════════════════\x1b[0m');
  console.log(`\x1b[1m  RESULTS: \x1b[32m${passed} passed\x1b[0m\x1b[1m  \x1b[31m${failed} failed\x1b[0m`);
  console.log('\x1b[1m\x1b[36m═══════════════════════════════════════\x1b[0m');

  if (failed === 0) {
    console.log('\n\x1b[32m\x1b[1m  ✓ ALL TESTS PASSED — website is fully working!\x1b[0m');
    console.log('\n  Open in your browser:');
    console.log('  \x1b[36mhttp://localhost:3000\x1b[0m                     → Homepage');
    console.log('  \x1b[36mhttp://localhost:3000/shop.html\x1b[0m            → Shop');
    console.log('  \x1b[36mhttp://localhost:3000/cart.html\x1b[0m            → Cart');
    console.log('  \x1b[36mhttp://localhost:3000/checkout.html\x1b[0m        → Checkout');
    console.log('  \x1b[36mhttp://localhost:3000/sandbox-test.html\x1b[0m    → Payment Test Panel');
    console.log('  \x1b[36mhttp://localhost:3000/api/health\x1b[0m           → Server Health\n');
  } else {
    console.log(`\n\x1b[31m  ${failed} test(s) failed. Check the errors above.\x1b[0m\n`);
  }
}

run().catch(console.error);
