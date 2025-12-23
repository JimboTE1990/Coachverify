# Real Stripe Integration Setup Guide

## ✅ What We've Built

You now have a **real Stripe integration** with:
- Vercel serverless function (`/api/create-checkout-session.ts`) for secure payment processing
- Frontend service that calls the API (`services/stripeService.ts`)
- Proper CORS handling
- Trial period billing support

## 🔑 Step 1: Add Your Stripe Secret Key

1. **Go to Stripe Dashboard** → [API Keys](https://dashboard.stripe.com/test/apikeys)

2. **Copy your Secret Key** (starts with `sk_test_...`)
   - ⚠️ **DO NOT share this key publicly!**

3. **Add to your `.env` file:**
   ```env
   STRIPE_SECRET_KEY=sk_test_YOUR_SECRET_KEY_HERE
   ```

4. **Replace** `YOUR_STRIPE_SECRET_KEY_HERE` with your actual secret key

## 🧪 Step 2: Test Locally

1. **Restart your dev server:**
   ```bash
   npm run dev
   ```

2. **Test the checkout flow:**
   - Navigate to `/pricing`
   - Click "Upgrade to Annual" or "Upgrade to Monthly"
   - Click "Continue to Secure Payment"
   - You should be redirected to **Stripe's hosted checkout page**

3. **Use Stripe test card:**
   - Card number: `4242 4242 4242 4242`
   - Expiry: Any future date (e.g., `12/34`)
   - CVC: Any 3 digits (e.g., `123`)
   - ZIP: Any 5 digits (e.g., `12345`)

4. **Complete the payment** → You'll be redirected to `/checkout/success`

## 🚀 Step 3: Deploy to Vercel

### Add Environment Variables to Vercel

1. **Go to Vercel Dashboard** → Your Project → Settings → Environment Variables

2. **Add these variables:**

   | Name | Value | Environment |
   |------|-------|-------------|
   | `STRIPE_SECRET_KEY` | `sk_test_...` (your secret key) | Production, Preview, Development |
   | `VITE_APP_URL` | `https://your-app.vercel.app` | Production |
   | `VITE_APP_URL` | `https://your-app-git-*.vercel.app` | Preview |
   | `VITE_APP_URL` | `http://localhost:5173` | Development |

3. **Redeploy your app** to pick up the new environment variables

### Update Stripe Redirect URLs

1. **Go to Stripe Dashboard** → [Checkout Settings](https://dashboard.stripe.com/settings/checkout)

2. **Add your Vercel URLs to allowed domains:**
   ```
   https://your-app.vercel.app
   https://*.vercel.app
   ```

## 🔐 Step 4: Switch to Production Keys (When Ready)

When you're ready to go live:

1. **Activate your Stripe account** (Stripe Dashboard → Activate Account)

2. **Get your production keys:**
   - Go to Stripe Dashboard → **Switch to Live Mode** (toggle in top left)
   - Copy your **Live Publishable Key** (`pk_live_...`)
   - Copy your **Live Secret Key** (`sk_live_...`)

3. **Update `.env` for production:**
   ```env
   VITE_STRIPE_PUBLISHABLE_KEY=pk_live_YOUR_LIVE_KEY
   STRIPE_SECRET_KEY=sk_live_YOUR_LIVE_SECRET_KEY
   ```

4. **Update Vercel Environment Variables** with live keys

5. **Create production price IDs:**
   - Go to Stripe Dashboard → Products
   - Create new prices in Live Mode
   - Update `VITE_STRIPE_MONTHLY_PRICE_ID` and `VITE_STRIPE_ANNUAL_PRICE_ID`

## 📝 How It Works

### Frontend Flow:
1. User clicks "Upgrade" button on pricing page
2. `handleCheckout()` calls `createCheckoutSession()`
3. `createCheckoutSession()` sends POST request to `/api/create-checkout-session`
4. Frontend receives Stripe checkout URL
5. User is redirected to Stripe's hosted checkout page

### Backend Flow (Vercel Serverless Function):
1. Receives POST request with `priceId`, `coachId`, `coachEmail`, etc.
2. Creates Stripe Checkout Session using Stripe SDK
3. Returns `session.url` to frontend
4. Frontend redirects user to Stripe

### After Payment:
1. Stripe processes payment
2. User is redirected to `/checkout/success?session_id=...`
3. **TODO:** Set up Stripe webhook to update database

## 🎯 Next Steps: Webhooks

To automatically update your database when payments succeed, you need to set up Stripe webhooks.

### Create Webhook Endpoint

1. **Create new file:** `/api/stripe-webhook.ts`

2. **Add to Vercel** and get the URL: `https://your-app.vercel.app/api/stripe-webhook`

3. **Add webhook in Stripe Dashboard:**
   - Go to [Webhooks](https://dashboard.stripe.com/test/webhooks)
   - Click "Add endpoint"
   - Endpoint URL: `https://your-app.vercel.app/api/stripe-webhook`
   - Select events:
     - `checkout.session.completed`
     - `invoice.payment_succeeded`
     - `invoice.payment_failed`
     - `customer.subscription.deleted`
     - `customer.subscription.updated`

4. **Get webhook signing secret** (`whsec_...`) and add to environment variables

## 🐛 Troubleshooting

### Error: "Missing required fields"
- Check that your `.env` file has `STRIPE_SECRET_KEY` set
- Restart your dev server after adding the key

### Error: "No such price: price_..."
- Verify your price IDs in Stripe Dashboard → Products
- Make sure you're using Price IDs, not Product IDs
- Ensure you're in Test Mode if using test keys

### CORS Error
- Check that `VITE_APP_URL` matches your frontend URL
- Vercel serverless functions have CORS enabled in the code

### Redirect not working
- Check browser console for errors
- Verify `VITE_APP_URL` is set correctly
- Ensure Stripe success/cancel URLs match your domain

## 📚 Resources

- [Stripe Checkout Docs](https://stripe.com/docs/checkout/quickstart)
- [Vercel Serverless Functions](https://vercel.com/docs/functions/serverless-functions)
- [Stripe Test Cards](https://stripe.com/docs/testing)
- [Stripe Webhooks Guide](https://stripe.com/docs/webhooks)

---

**Status:** ✅ Real Stripe Integration Complete - Ready for Testing

**Last Updated:** December 23, 2024
