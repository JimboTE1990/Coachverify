# Development Setup Guide

## Running the Application Locally

The CoachDog application requires **two servers** running simultaneously during development:

### 1. Frontend (Vite Dev Server)
Serves the React application with hot module replacement.

```bash
npm run dev
```

- Runs on: `http://localhost:3000`
- Auto-reloads when you make code changes

### 2. Backend API (Express Dev Server)
Handles Stripe payment API routes securely with your secret key.

```bash
npm run dev:api
```

- Runs on: `http://localhost:3001`
- Provides the `/api/create-checkout-session` endpoint
- Uses your `STRIPE_SECRET_KEY` from `.env`

## Quick Start

### Option 1: Two Terminal Windows

**Terminal 1:**
```bash
npm run dev
```

**Terminal 2:**
```bash
npm run dev:api
```

### Option 2: Single Command (using `&` to background)

```bash
npm run dev:api & npm run dev
```

## How It Works

### Development Flow

1. **Frontend** (port 3000) renders the React app
2. When user clicks "Continue to Secure Payment":
   - Frontend calls `http://localhost:3001/api/create-checkout-session`
   - Backend creates Stripe Checkout Session using secret key
   - Backend returns Stripe checkout URL
   - Frontend redirects user to Stripe hosted checkout page

### Production Flow (Vercel)

1. Frontend and API routes deploy to Vercel
2. API routes run as serverless functions
3. Same flow, but API calls use relative URLs (`/api/create-checkout-session`)

## Troubleshooting

### "Failed to load resource: net::ERR_CONNECTION_REFUSED"

**Problem:** The API server isn't running.

**Solution:** Make sure you've started both servers:
```bash
npm run dev:api  # Start this first
npm run dev      # Then start this
```

### "No such price: price_..."

**Problem:** Your Stripe Price IDs are incorrect or you're in the wrong mode (test vs live).

**Solution:**
1. Go to [Stripe Dashboard → Products](https://dashboard.stripe.com/test/products)
2. Make sure you're in **Test Mode** (toggle in top-right)
3. Copy the **Price ID** (starts with `price_test_...`)
4. Update in `.env`:
   ```env
   VITE_STRIPE_MONTHLY_PRICE_ID=price_1SeztGDbNBAbZyHw2hVMLfUD
   VITE_STRIPE_ANNUAL_PRICE_ID=price_1SezuuDbNBAbZyHwiYl8pzLV
   ```

### "Missing required fields: priceId, coachId..."

**Problem:** Frontend isn't sending correct data to API.

**Solution:** Check browser console for errors. The coach profile might not be loading correctly.

## Testing Stripe Checkout

### Test Cards (Stripe Test Mode)

Use these cards for testing:

| Scenario | Card Number | CVC | Expiry | ZIP |
|----------|-------------|-----|--------|-----|
| Success | `4242 4242 4242 4242` | Any 3 digits | Any future date | Any 5 digits |
| Decline | `4000 0000 0000 0002` | Any | Any future | Any |
| 3D Secure | `4000 0025 0000 3155` | Any | Any future | Any |

### Testing the Flow

1. Navigate to `http://localhost:3000/pricing`
2. Click "Upgrade to Annual" or "Upgrade to Monthly"
3. Fill in payment details with test card
4. Complete checkout
5. You'll be redirected to `/checkout/success`

**Note:** In test mode, no real charges are made!

## Environment Variables

Make sure your `.env` file has:

```env
# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Stripe (Frontend)
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...

# Stripe (Backend)
STRIPE_SECRET_KEY=sk_test_...

# Stripe Price IDs
VITE_STRIPE_MONTHLY_PRICE_ID=price_...
VITE_STRIPE_ANNUAL_PRICE_ID=price_...

# App URL
VITE_APP_URL=http://localhost:3000
```

## Deploying to Production

### Step 1: Deploy to Vercel

```bash
vercel --prod
```

### Step 2: Add Environment Variables to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Go to **Settings → Environment Variables**
4. Add all variables from your `.env` file
5. Make sure to add them to **Production**, **Preview**, and **Development**

### Step 3: Update Stripe Webhook (Optional)

If you set up webhooks:

1. Go to [Stripe Dashboard → Webhooks](https://dashboard.stripe.com/test/webhooks)
2. Add endpoint: `https://your-app.vercel.app/api/stripe-webhook`
3. Select events: `checkout.session.completed`, `invoice.payment_succeeded`, etc.
4. Copy signing secret and add to Vercel as `STRIPE_WEBHOOK_SECRET`

## File Structure

```
/
├── api/                        # Vercel serverless functions (production)
│   └── create-checkout-session.ts
├── dev-server.js               # Local development API server
├── services/
│   └── stripeService.ts        # Frontend Stripe integration
├── pages/
│   └── checkout/
│       ├── CheckoutAnnual.tsx
│       └── CheckoutMonthly.tsx
└── .env                        # Environment variables (local only)
```

## Need Help?

- **Stripe Docs:** https://stripe.com/docs/checkout/quickstart
- **Vercel Docs:** https://vercel.com/docs/functions/serverless-functions
- **Supabase Docs:** https://supabase.com/docs

## Common Commands

```bash
# Install dependencies
npm install

# Start frontend dev server
npm run dev

# Start backend API server
npm run dev:api

# Build for production
npm run build

# Preview production build
npm run preview

# Deploy to Vercel
vercel --prod
```
