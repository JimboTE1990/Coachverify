# Deploy Supabase Edge Function for Lifetime Checkout

## What Changed

The `create-checkout-session` edge function has been updated to support **lifetime (one-time payment)** checkouts in addition to recurring subscriptions.

**Key changes:**
- Detects `billingCycle === 'lifetime'` and uses Stripe `mode: 'payment'` instead of `mode: 'subscription'`
- Only adds `subscription_data` for recurring plans (monthly/annual)
- Added support for lifetime discount codes: `BETA100` and `LIMITED60`

## Deployment Options

### Option 1: Deploy via Supabase Dashboard (Recommended - Easiest)

1. **Open Supabase Dashboard**: https://supabase.com/dashboard
2. Select your project: **whhwvuugrzbyvobwfmce**
3. Click **Edge Functions** in the left sidebar
4. Find the **create-checkout-session** function
5. Click **"..."** menu → **"Redeploy"**
6. The function will automatically redeploy with the latest code from your linked GitHub repo

**If not connected to GitHub:**
1. Click **"Edit"** on the function
2. Copy the entire contents of `supabase/functions/create-checkout-session/index.ts` from this repo
3. Paste into the Supabase code editor
4. Click **"Deploy"**

### Option 2: Deploy via Supabase CLI

#### Install Supabase CLI (one-time setup)

**macOS/Linux:**
```bash
# Download and install
curl -o- https://raw.githubusercontent.com/supabase/cli/main/scripts/install.sh | bash

# Or if you have Homebrew:
brew install supabase/tap/supabase
```

**Windows:**
```powershell
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

#### Deploy the Function

```bash
# Navigate to project directory
cd "/Users/jamiefletcher/Documents/Claude Projects/CoachDog/Coachverify"

# Login to Supabase (first time only)
supabase login

# Link to your project (first time only)
supabase link --project-ref whhwvuugrzbyvobwfmce

# Deploy the edge function
supabase functions deploy create-checkout-session
```

This will deploy the updated edge function to production.

## Verify Deployment

After deploying, test the lifetime checkout:

1. Visit your production app
2. Go to pricing page → Click "Lifetime Access"
3. Click "Secure Lifetime Access Now"
4. Should redirect to Stripe checkout successfully

**Expected logs in browser console:**
```
[CheckoutLifetime] Initiating Stripe Checkout for coach: <coach-id>
[CheckoutLifetime] STRIPE_PRICES.lifetime: price_1T2AhWDbNBAbZyHwbetn9Vsk
[CheckoutLifetime] Creating checkout session with params: {...}
[StripeService] Creating checkout session: {...}
```

**No errors expected!**

## What Gets Fixed

**Before (Error):**
```
Error: You must provide at least one recurring price in `subscription` mode when using prices.
```

**After (Success):**
- Lifetime checkout uses `mode: 'payment'` ✓
- Redirects to Stripe checkout page ✓
- User can complete purchase with test card ✓

## Test Cards for Development

Use these Stripe test cards:

**Successful payment:**
- Card: `4242 4242 4242 4242`
- Expiry: Any future date (e.g., `12/34`)
- CVC: Any 3 digits (e.g., `123`)
- ZIP: Any 5 digits (e.g., `12345`)

**Declined payment:**
- Card: `4000 0000 0000 0002`

**Requires 3D Secure:**
- Card: `4000 0025 0000 3155`

## Environment Variables Required

Make sure these are set in Supabase Edge Function secrets:

```bash
STRIPE_SECRET_KEY=sk_test_51SdDs8DbNBAbZyHw... (your test key)
APP_URL=https://coachverify.vercel.app (or your production URL)
```

To set these via CLI:
```bash
supabase secrets set STRIPE_SECRET_KEY=sk_test_...
supabase secrets set APP_URL=https://coachverify.vercel.app
```

Or via Dashboard:
1. Edge Functions → create-checkout-session → Settings → Secrets
2. Add/update the secrets above

---

**Updated**: 2026-02-20
**Function**: `create-checkout-session`
**Changes**: Added lifetime payment mode support
