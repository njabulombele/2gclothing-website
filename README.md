# 2G Clothing — Website & Deployment Guide

**Operate with Style. Est. 2018.**

---

## Project Structure

```
2G Clothing website/
├── index.html              # Homepage
├── shop.html               # Product catalog
├── product.html            # Single product page
├── cart.html               # Shopping cart
├── checkout.html           # Checkout with PayFast
├── order-confirmation.html # Post-payment confirmation
├── server.js               # Express backend (PayFast integration)
├── package.json            # Node.js dependencies
├── .env                    # Your secret keys (never commit this)
├── .env.example            # Safe template to share
├── .gitignore
├── css/
│   ├── style.css
│   └── checkout.css
├── js/
│   ├── main.js
│   └── products.js
└── images/
    └── p1.jpeg ... p32.jpeg
```

---

## Step 1 — Install Node.js

Download and install from: **https://nodejs.org** (choose the LTS version)

Verify it worked by opening PowerShell and running:
```
node --version
npm --version
```
Both should print a version number.

---

## Step 2 — Install dependencies

Open PowerShell, navigate to your project folder, and run:
```
cd "c:\Njabulo projects\2G Clothing website"
npm install
```
This installs Express and all other packages into a `node_modules/` folder.

---

## Step 3 — Run locally (test on your own computer)

```
npm start
```
Then open your browser and go to: **http://localhost:3000**

The site runs fully — including the checkout — using PayFast sandbox (test mode). No real money moves.

To test a payment use these PayFast sandbox card details:
- Card number: `4000 0000 0000 0002`
- Expiry: any future date
- CVV: any 3 digits

---

## Step 4 — Get your PayFast credentials

1. Go to **https://www.payfast.co.za** and create a merchant account (free)
2. Log in → go to **Settings → Integration**
3. Copy your **Merchant ID** and **Merchant Key**
4. Under **Settings → Security**, set a **Passphrase** (write it down)
5. Open your `.env` file and replace the sandbox values:

```
PAYFAST_MERCHANT_ID=your_real_merchant_id
PAYFAST_MERCHANT_KEY=your_real_merchant_key
PAYFAST_PASSPHRASE=your_passphrase
NODE_ENV=production
SITE_URL=https://your-live-domain.com
```

---

## Step 5 — Deploy to Railway (Recommended)

Railway is the easiest way to host a Node.js app. Free tier available.

### 5.1 — Install Git
Download from: **https://git-scm.com/download/win**

### 5.2 — Create a Git repository
Open PowerShell in your project folder:
```
cd "c:\Njabulo projects\2G Clothing website"
git init
git add .
git commit -m "Initial commit — 2G Clothing"
```

### 5.3 — Push to GitHub
1. Go to **https://github.com** and create a free account
2. Click **New repository** → name it `2g-clothing` → create it
3. Copy the commands GitHub shows you under "push an existing repository" and run them in PowerShell. They will look like:
```
git remote add origin https://github.com/YOUR_USERNAME/2g-clothing.git
git branch -M main
git push -u origin main
```

### 5.4 — Deploy on Railway
1. Go to **https://railway.app** and sign up (use your GitHub account)
2. Click **New Project → Deploy from GitHub repo**
3. Select your `2g-clothing` repository
4. Railway detects Node.js automatically and deploys it

### 5.5 — Set environment variables on Railway
1. In your Railway project, click your service → **Variables** tab
2. Add each variable from your `.env` file one by one:

| Variable | Value |
|---|---|
| `NODE_ENV` | `production` |
| `PAYFAST_MERCHANT_ID` | your real merchant ID |
| `PAYFAST_MERCHANT_KEY` | your real merchant key |
| `PAYFAST_PASSPHRASE` | your passphrase |
| `SITE_URL` | your Railway URL (e.g. `https://2g-clothing.up.railway.app`) |

Railway will redeploy automatically after you save the variables.

### 5.6 — Set your PayFast notify URL
Log in to PayFast → **Settings → Integration** → set **Notify URL** to:
```
https://your-railway-url.up.railway.app/api/payfast-notify
```

---

## Step 6 — Add a custom domain (optional)

### Buy a .co.za domain
- **https://www.domains.co.za** — cheapest option (~R150/year)
- **https://www.afrihost.com** — also good

### Connect to Railway
1. Railway project → Settings → **Domains → Custom Domain**
2. Enter your domain (e.g. `www.2gclothing.co.za`)
3. Railway gives you DNS records to add at your domain registrar
4. Go to your registrar → DNS settings → add the records Railway shows
5. Wait 10–30 minutes for DNS to propagate
6. Update `SITE_URL` in Railway variables to your custom domain

---

## Alternative Hosting Options

| Platform | Free tier | Node.js | Best for |
|---|---|---|---|
| **Railway** | Yes (limited) | ✅ Yes | Easiest setup — recommended |
| **Render** | Yes (spins down) | ✅ Yes | Good free alternative |
| **Heroku** | No (paid from $5/mo) | ✅ Yes | Reliable, well known |
| **DigitalOcean App Platform** | No (~R100/mo) | ✅ Yes | More control |
| **Vercel** | Yes | ⚠️ Serverless only | Not ideal for this app |

---

## Payment Flow Summary

```
Customer fills checkout
        ↓
Browser POSTs to /api/create-payment
        ↓
Server calculates totals, builds PayFast signed form
        ↓
Browser submits hidden form → PayFast payment page
        ↓
Customer pays on PayFast (card / EFT / SnapScan / etc.)
        ↓
PayFast POSTs to /api/payfast-notify (server-to-server)
        ↓
Server verifies IP + signature + PayFast validation
        ↓
Order status updated to "paid"
        ↓
PayFast redirects customer to /order-confirmation.html
        ↓
Page polls /api/order/:id and shows confirmed order
```

---

## Going Live Checklist

- [ ] Node.js installed locally
- [ ] `npm install` run successfully
- [ ] Tested locally with PayFast sandbox
- [ ] PayFast merchant account created and verified
- [ ] Real `PAYFAST_MERCHANT_ID`, `PAYFAST_MERCHANT_KEY`, `PAYFAST_PASSPHRASE` in `.env`
- [ ] `NODE_ENV=production` set
- [ ] Deployed to Railway (or chosen host)
- [ ] Environment variables set on Railway
- [ ] `SITE_URL` updated to live domain
- [ ] PayFast notify URL updated to live `/api/payfast-notify`
- [ ] Tested a live payment end to end
- [ ] WhatsApp number updated in cart.html (fallback contact)

---

## Support

- PayFast docs: https://developers.payfast.co.za
- Railway docs: https://docs.railway.app
- Node.js docs: https://nodejs.org/en/docs
