/**
 * 2G CLOTHING — EXPRESS SERVER
 * Serves static files + handles PayFast payment flow
 */

require('dotenv').config();
const express    = require('express');
const bodyParser = require('body-parser');
const crypto     = require('crypto');
const axios      = require('axios');
const path       = require('path');

const app  = express();
const PORT = process.env.PORT || 3000;

// ─── MIDDLEWARE ───────────────────────────────────────────────
app.use(express.static(path.join(__dirname)));          // serve HTML/CSS/JS/images
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// ─── PAYFAST CONFIG ───────────────────────────────────────────
const PF = {
  merchantId:  process.env.PAYFAST_MERCHANT_ID  || '10000100',   // sandbox default
  merchantKey: process.env.PAYFAST_MERCHANT_KEY || '46f0cd694581a',// sandbox default
  passphrase:  process.env.PAYFAST_PASSPHRASE   || '',
  sandbox:     process.env.NODE_ENV !== 'production',
};

// PayFast URLs
const PF_URL = PF.sandbox
  ? 'https://sandbox.payfast.co.za/eng/process'
  : 'https://www.payfast.co.za/eng/process';

const PF_VALIDATE_URL = PF.sandbox
  ? 'https://sandbox.payfast.co.za/eng/query/validate'
  : 'https://www.payfast.co.za/eng/query/validate';

// Your live domain (set in .env once hosted)
const SITE_URL = process.env.SITE_URL || `http://localhost:${PORT}`;

// ─── HELPER: Build PayFast signature ─────────────────────────
function buildSignature(data, passphrase = '') {
  // Sort keys alphabetically, build query string
  const str = Object.keys(data)
    .sort()
    .filter(k => data[k] !== '' && data[k] !== undefined)
    .map(k => `${k}=${encodeURIComponent(String(data[k])).replace(/%20/g, '+')}`)
    .join('&');

  const finalStr = passphrase ? `${str}&passphrase=${encodeURIComponent(passphrase).replace(/%20/g, '+')}` : str;
  return crypto.createHash('md5').update(finalStr).digest('hex');
}

// ─── HELPER: Validate PayFast IP ─────────────────────────────
function isValidPayFastIP(ip) {
  const validIPs = [
    '197.97.145.144', '197.97.145.145', '197.97.145.146', '197.97.145.147',
    '41.74.179.192',  '41.74.179.193',  '41.74.179.194',  '41.74.179.195',
  ];
  // In sandbox mode, also allow localhost
  if (PF.sandbox) return true;
  return validIPs.includes(ip);
}

// ─── IN-MEMORY ORDER STORE ────────────────────────────────────
// In production you'd replace this with a database (MongoDB, PostgreSQL, etc.)
const orders = new Map();

// ─── ROUTE: POST /api/create-payment ─────────────────────────
// Frontend sends cart + customer info → server builds PayFast form data → returns to browser
app.post('/api/create-payment', (req, res) => {
  try {
    const { customer, cart, shipping, discount } = req.body;

    if (!cart || cart.length === 0) {
      return res.status(400).json({ error: 'Cart is empty' });
    }

    // Calculate totals server-side (never trust client totals for real money)
    const subtotal  = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    const shipCost  = shipping === 'express' ? 180 : subtotal >= 800 ? 0 : 99;
    const discAmt   = Math.max(0, Math.min(discount || 0, subtotal * 0.5)); // max 50% discount
    const total     = Math.max(0, subtotal - discAmt + shipCost);

    // Generate order ID
    const orderId = 'ORD-' + Date.now();

    // Store order details (pending payment confirmation)
    orders.set(orderId, {
      id:        orderId,
      customer,
      cart,
      subtotal,
      shipping:  shipCost,
      discount:  discAmt,
      total,
      status:    'pending',
      createdAt: new Date().toISOString(),
    });

    // Build PayFast payment data
    const pfData = {
      merchant_id:   PF.merchantId,
      merchant_key:  PF.merchantKey,
      return_url:    `${SITE_URL}/order-confirmation.html?order=${orderId}`,
      cancel_url:    `${SITE_URL}/cart.html?cancelled=1`,
      notify_url:    `${SITE_URL}/api/payfast-notify`,

      // Buyer info
      name_first:    customer.firstName,
      name_last:     customer.lastName,
      email_address: customer.email,
      cell_number:   customer.phone || '',

      // Payment details
      m_payment_id:  orderId,
      amount:        total.toFixed(2),
      item_name:     `2G Clothing Order ${orderId}`,
      item_description: cart.map(i => `${i.qty}x ${i.name} (${i.size})`).join(', ').slice(0, 255),

      // Custom fields passed back in notify
      custom_str1:   orderId,
      custom_str2:   customer.email,
    };

    // Add passphrase and sign
    const signature = buildSignature(pfData, PF.passphrase);
    pfData.signature = signature;

    res.json({ payfast_url: PF_URL, data: pfData, orderId });

  } catch (err) {
    console.error('create-payment error:', err);
    res.status(500).json({ error: 'Could not create payment' });
  }
});

// ─── ROUTE: POST /api/payfast-notify ─────────────────────────
// PayFast server calls this to confirm payment (server-to-server, not browser)
app.post('/api/payfast-notify', async (req, res) => {
  try {
    const pfData = req.body;

    // 1. Verify source IP
    const ip = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim();
    if (!isValidPayFastIP(ip)) {
      console.warn('PayFast notify: invalid IP', ip);
      return res.status(403).send('Forbidden');
    }

    // 2. Validate signature
    const receivedSig = pfData.signature;
    const dataForSig  = { ...pfData };
    delete dataForSig.signature;
    const expectedSig = buildSignature(dataForSig, PF.passphrase);

    if (receivedSig !== expectedSig) {
      console.warn('PayFast notify: signature mismatch');
      return res.status(400).send('Invalid signature');
    }

    // 3. Validate with PayFast server (extra security step)
    const validateStr = Object.keys(pfData)
      .filter(k => k !== 'signature')
      .map(k => `${k}=${encodeURIComponent(pfData[k])}`)
      .join('&');

    const validateRes = await axios.post(PF_VALIDATE_URL, validateStr, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });

    if (validateRes.data !== 'VALID') {
      console.warn('PayFast notify: validation failed', validateRes.data);
      return res.status(400).send('Validation failed');
    }

    // 4. Update order status
    const orderId     = pfData.custom_str1 || pfData.m_payment_id;
    const paymentStatus = pfData.payment_status; // COMPLETE, FAILED, etc.

    if (orders.has(orderId)) {
      const order   = orders.get(orderId);
      order.status  = paymentStatus === 'COMPLETE' ? 'paid' : paymentStatus.toLowerCase();
      order.pfPaymentId = pfData.pf_payment_id;
      orders.set(orderId, order);
      console.log(`Order ${orderId} updated to: ${order.status}`);
    }

    res.status(200).send('OK');

  } catch (err) {
    console.error('payfast-notify error:', err);
    res.status(500).send('Server error');
  }
});

// ─── ROUTE: GET /api/order/:id ────────────────────────────────
// Confirmation page polls this to check if payment is confirmed
app.get('/api/order/:id', (req, res) => {
  const order = orders.get(req.params.id);
  if (!order) return res.status(404).json({ error: 'Order not found' });

  // Return safe subset (no internal keys)
  res.json({
    id:       order.id,
    status:   order.status,
    total:    order.total,
    subtotal: order.subtotal,
    shipping: order.shipping,
    discount: order.discount,
    cart:     order.cart,
    customer: {
      name:    `${order.customer.firstName} ${order.customer.lastName}`,
      email:   order.customer.email,
      address: `${order.customer.address}, ${order.customer.city}, ${order.customer.province}`,
    },
    createdAt: order.createdAt,
  });
});

// ─── ROUTE: GET /api/health ───────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    status:    'ok',
    mode:      PF.sandbox ? 'sandbox' : 'production',
    timestamp: new Date().toISOString(),
    siteUrl:   SITE_URL,
    merchant:  PF.merchantId,
  });
});

// ─── ROUTE: GET /api/sandbox/orders ──────────────────────────
// DEV ONLY — lists all in-memory orders so you can inspect them during testing
app.get('/api/sandbox/orders', (req, res) => {
  if (!PF.sandbox) return res.status(403).json({ error: 'Only available in sandbox mode' });
  const list = Array.from(orders.values()).map(o => ({
    id:        o.id,
    status:    o.status,
    total:     o.total,
    items:     o.cart?.length || 0,
    customer:  `${o.customer?.firstName} ${o.customer?.lastName}`,
    createdAt: o.createdAt,
  }));
  res.json({ count: list.length, orders: list });
});

// ─── ROUTE: POST /api/sandbox/confirm/:id ────────────────────
// DEV ONLY — manually marks an order as paid so you can test the confirmation page
// without needing PayFast to call back to localhost
app.post('/api/sandbox/confirm/:id', (req, res) => {
  if (!PF.sandbox) return res.status(403).json({ error: 'Only available in sandbox mode' });
  const order = orders.get(req.params.id);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  order.status       = 'paid';
  order.pfPaymentId  = 'SANDBOX-' + Date.now();
  orders.set(order.id, order);
  console.log(`[SANDBOX] Order ${order.id} manually confirmed as paid`);
  res.json({ success: true, order: { id: order.id, status: order.status, total: order.total } });
});

// ─── ROUTE: POST /api/sandbox/reset ──────────────────────────
// DEV ONLY — clears all in-memory orders (fresh start for testing)
app.post('/api/sandbox/reset', (req, res) => {
  if (!PF.sandbox) return res.status(403).json({ error: 'Only available in sandbox mode' });
  orders.clear();
  console.log('[SANDBOX] All orders cleared');
  res.json({ success: true, message: 'All orders cleared' });
});

// ─── FALLBACK: serve index.html for unknown routes ────────────
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// ─── START ────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n  2G Clothing server running`);
  console.log(`  Local:   http://localhost:${PORT}`);
  console.log(`  Mode:    ${PF.sandbox ? 'PayFast SANDBOX' : 'PayFast LIVE'}\n`);
});
