# Stripe Integration Setup Guide

## Overview
This guide will help you integrate Stripe payments into CoachVerify. The codebase is already set up with mock payments - this guide shows you how to switch to real Stripe payments.

---

## Prerequisites

1. **Stripe Account** - Sign up at https://stripe.com
2. **Test Mode Enabled** - Use test keys for development
3. **Vercel Account** - For deployment (or any other hosting platform)

---

## Step 1: Get Your Stripe API Keys

### 1.1 Access Stripe Dashboard
- Go to https://dashboard.stripe.com
- Make sure you're in **Test Mode** (toggle in top right)

### 1.2 Get API Keys
- Navigate to: **Developers** → **API Keys**
- You'll see two keys:
  - **Publishable key** (starts with `pk_test_...`) - Safe to use in frontend
  - **Secret key** (starts with `sk_test_...`) - NEVER expose in frontend!

---

## Step 2: Create Stripe Products & Prices

### 2.1 Create Monthly Plan
1. Go to: **Products** → **Add Product**
2. Fill in:
   - **Name**: CoachVerify Monthly
   - **Description**: Monthly subscription for verified coach profile
   - **Pricing**: £15.00 GBP
   - **Billing period**: Monthly
   - **Recurring**: Yes
3. Click **Save Product**
4. Copy the **Price ID** (starts with `price_...`) - you'll need this!

### 2.2 Create Annual Plan
1. Go to: **Products** → **Add Product**
2. Fill in:
   - **Name**: CoachVerify Annual
   - **Description**: Annual subscription for verified coach profile (save £30)
   - **Pricing**: £150.00 GBP
   - **Billing period**: Yearly
   - **Recurring**: Yes
3. Click **Save Product**
4. Copy the **Price ID** (starts with `price_...`) - you'll need this!

---

## Step 3: Configure Environment Variables

### 3.1 Local Development
Create a `.env` file in the project root:

```env
# Supabase (you already have these)
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Stripe Frontend Keys (Safe to expose)
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_KEY_HERE

# Stripe Price IDs (from Step 2)
VITE_STRIPE_MONTHLY_PRICE_ID=price_YOUR_MONTHLY_ID
VITE_STRIPE_ANNUAL_PRICE_ID=price_YOUR_ANNUAL_ID

# App URL
VITE_APP_URL=http://localhost:5173
```

### 3.2 Vercel Deployment
In your Vercel project settings:
1. Go to: **Settings** → **Environment Variables**
2. Add these variables for **Production**, **Preview**, and **Development**:

```
VITE_STRIPE_PUBLISHABLE_KEY = pk_test_YOUR_KEY_HERE
VITE_STRIPE_MONTHLY_PRICE_ID = price_YOUR_MONTHLY_ID
VITE_STRIPE_ANNUAL_PRICE_ID = price_YOUR_ANNUAL_ID
VITE_APP_URL = https://your-domain.vercel.app
```

**Important**: Do NOT add secret keys (`sk_test_...`) to Vercel environment variables yet - we'll set those up when we add serverless functions.

---

## Step 4: Update Payment Processing

The current codebase uses **mock payments**. Here's what needs to be changed to use real Stripe:

### Files That Need Updates:

#### 1. `/components/checkout/PaymentForm.tsx`
Currently has a mock Stripe card element. Update to use real `@stripe/react-stripe-js`:

```bash
npm install @stripe/react-stripe-js
```

Then replace the mock card element with:
```tsx
import { CardElement, Elements, useStripe, useElements } from '@stripe/react-stripe-js';
import { getStripe } from '../../lib/stripe';
```

#### 2. `/pages/checkout/CheckoutMonthly.tsx` and `CheckoutAnnual.tsx`
Currently use `processMockPayment()`. Replace with real Stripe checkout:

**Current (Mock)**:
```tsx
const result = await processMockPayment({
  amount: 15,
  billingCycle: 'monthly',
  coachId: currentCoach.id
});
```

**Updated (Real Stripe)**:
```tsx
const stripe = await getStripe();
const { error } = await stripe.redirectToCheckout({
  lineItems: [{ price: STRIPE_PRICES.monthly, quantity: 1 }],
  mode: 'subscription',
  successUrl: `${window.location.origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
  cancelUrl: `${window.location.origin}/checkout/monthly`,
  clientReferenceId: currentCoach.id,
  customerEmail: currentCoach.email
});
```

---

## Step 5: Set Up Webhook Endpoint (For Production)

Webhooks allow Stripe to notify your backend when subscriptions change (payment succeeded, failed, cancelled, etc.).

### 5.1 Create Webhook Handler
Create `/api/webhooks/stripe.ts` (Vercel serverless function):

```typescript
import { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';
import { supabase } from '../../lib/supabase';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia'
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const sig = req.headers['stripe-signature']!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).json({ error: `Webhook Error: ${err.message}` });
  }

  // Handle specific events
  switch (event.type) {
    case 'invoice.payment_succeeded':
      // Update coach subscription to active
      const invoice = event.data.object as Stripe.Invoice;
      console.log('Payment succeeded:', invoice.id);
      // TODO: Update Supabase coach record
      break;

    case 'invoice.payment_failed':
      // Handle failed payment
      console.log('Payment failed');
      break;

    case 'customer.subscription.deleted':
      // Set subscription to expired
      console.log('Subscription cancelled');
      break;

    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  res.status(200).json({ received: true });
}

export const config = {
  api: {
    bodyParser: false, // Stripe needs raw body
  },
};
```

### 5.2 Register Webhook in Stripe
1. Go to: **Developers** → **Webhooks**
2. Click **Add Endpoint**
3. Enter URL: `https://your-domain.vercel.app/api/webhooks/stripe`
4. Select events to listen for:
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
   - `customer.subscription.deleted`
   - `customer.subscription.updated`
5. Copy the **Signing secret** (starts with `whsec_...`)
6. Add to Vercel environment variables:
   ```
   STRIPE_SECRET_KEY = sk_test_YOUR_SECRET_KEY
   STRIPE_WEBHOOK_SECRET = whsec_YOUR_WEBHOOK_SECRET
   ```

---

## Step 6: Testing Stripe Integration

### 6.1 Test Cards (in Test Mode)
Stripe provides test cards for different scenarios:

- **Success**: `4242 4242 4242 4242`
- **Decline**: `4000 0000 0000 0002`
- **3D Secure**: `4000 0027 6000 3184`

Use any:
- **Expiry**: Any future date (e.g., 12/25)
- **CVC**: Any 3 digits (e.g., 123)
- **ZIP**: Any 5 digits (e.g., 12345)

### 6.2 Testing Workflow
1. **Signup** → Creates account with 30-day trial
2. **Select Plan** → Redirected to Stripe Checkout
3. **Enter Test Card** → Use 4242 4242 4242 4242
4. **Payment Succeeds** → Redirected to `/checkout/success`
5. **Verify Subscription** → Check Stripe Dashboard → Subscriptions

### 6.3 Test Webhooks Locally
Use Stripe CLI to forward webhooks to localhost:

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Forward webhooks to local server
stripe listen --forward-to localhost:5173/api/webhooks/stripe

# Trigger test events
stripe trigger invoice.payment_succeeded
```

---

## Step 7: Go Live (Production)

When you're ready to accept real payments:

### 7.1 Switch to Live Mode
1. Toggle Stripe Dashboard to **Live Mode**
2. Get live API keys (start with `pk_live_...` and `sk_live_...`)
3. Create live products/prices (same as test mode)

### 7.2 Update Environment Variables
In Vercel:
- Replace all `pk_test_...` with `pk_live_...`
- Replace all `price_test_...` with `price_live_...`
- Update `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` with live values

### 7.3 Update Webhook Endpoint
- Register webhook with live mode URL
- Update `STRIPE_WEBHOOK_SECRET` in Vercel

---

## Step 8: Monitoring & Maintenance

### 8.1 Stripe Dashboard Monitoring
- **Payments** → View successful/failed transactions
- **Subscriptions** → Track active/cancelled subscriptions
- **Customers** → Manage customer records

### 8.2 Supabase Database Sync
Ensure your database stays in sync with Stripe:
- **Webhook events** → Update `coaches` table
- **Subscription status** → Update `subscriptionStatus`
- **Billing cycle** → Update `billingCycle`
- **Payment dates** → Update `lastPaymentDate`

---

## Troubleshooting

### Issue: "Stripe is not configured"
**Fix**: Check `.env` file has all required variables

### Issue: Webhook not receiving events
**Fix**: Check webhook URL is publicly accessible (use Stripe CLI for local testing)

### Issue: Payment succeeds but subscription not updated
**Fix**: Check webhook handler is processing `invoice.payment_succeeded` event correctly

### Issue: 3D Secure cards fail
**Fix**: Ensure you're handling `requires_action` status in payment flow

---

## Security Checklist

- ✅ Never commit `.env` file to Git (it's in `.gitignore`)
- ✅ Never expose secret keys in frontend code
- ✅ Verify webhook signatures before processing
- ✅ Use HTTPS in production
- ✅ Validate payment amounts on server-side
- ✅ Log all payment events for audit trail

---

## Support Resources

- **Stripe Documentation**: https://stripe.com/docs
- **Stripe React Integration**: https://stripe.com/docs/stripe-js/react
- **Webhook Testing**: https://stripe.com/docs/webhooks/test
- **Stripe CLI**: https://stripe.com/docs/stripe-cli

---

## Current Implementation Status

✅ **Completed:**
- Stripe library installed
- Stripe configuration file (`lib/stripe.ts`)
- Environment variable setup (`.env.example`)
- Mock payment flow (fully functional without Stripe keys)

⏳ **TODO (When Ready):**
- Replace mock `PaymentForm` with real Stripe Elements
- Replace `processMockPayment()` with `stripe.redirectToCheckout()`
- Create webhook handler at `/api/webhooks/stripe`
- Set up Stripe products and get Price IDs
- Add environment variables to Vercel
- Test full payment flow with test cards
- Go live with real Stripe keys

---

**Next Step**: Add your Stripe test keys to `.env` file and follow Step 4 to enable real payments!
