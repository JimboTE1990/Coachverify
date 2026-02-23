# Stripe Webhook Setup Guide

## Critical Issue
Currently, when users pay for lifetime access (or any subscription), their subscription status is NOT automatically updated in the database. This causes:

1. Payment confirmation page showing wrong billing cycle
2. Profile dropdown showing "No Active Plan"
3. Dashboard showing "expired" status
4. Profile hidden and features locked despite payment

## Root Cause
Missing Stripe webhook handler to process `checkout.session.completed` events.

## Solution
Deploy the `stripe-webhook` edge function and configure Stripe to send webhook events.

---

## Step 1: Deploy the Webhook Edge Function

```bash
cd /Users/jamiefletcher/Documents/Claude\ Projects/CoachDog/Coachverify

# Deploy to Supabase
supabase functions deploy stripe-webhook

# If you don't have Supabase CLI installed:
npm install -g supabase
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase functions deploy stripe-webhook
```

---

## Step 2: Set Environment Variables in Supabase

Go to Supabase Dashboard → Edge Functions → stripe-webhook → Settings

Add these secrets:

```
STRIPE_WEBHOOK_SECRET=whsec_... (get from Stripe dashboard after Step 3)
STRIPE_SECRET_KEY=sk_live_... or sk_test_...
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ... (from Supabase project settings)
```

---

## Step 3: Configure Webhook in Stripe

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/webhooks)
2. Click "Add Endpoint"
3. Enter webhook URL:
   ```
   https://YOUR_PROJECT_REF.supabase.co/functions/v1/stripe-webhook
   ```
4. Select events to listen to:
   - ✅ `checkout.session.completed`
   - ✅ `customer.subscription.updated`
   - ✅ `customer.subscription.deleted`
5. Click "Add Endpoint"
6. Copy the **Webhook Signing Secret** (starts with `whsec_`)
7. Add it to Supabase environment variables (see Step 2)

---

## Step 4: Fix Existing Affected Users

### Immediate Fix for user 682f29b1-0385-4929-9b5a-4d2b9931031c

Run this SQL in Supabase SQL Editor:

```sql
UPDATE coaches
SET
  subscription_status = 'lifetime',
  billing_cycle = 'lifetime',
  subscription_ends_at = NULL,
  trial_used = true,
  trial_ends_at = NULL
WHERE user_id = '682f29b1-0385-4929-9b5a-4d2b9931031c'::uuid;
```

### Find All Affected Users

```sql
-- Find users who paid but have wrong subscription_status
-- Check Stripe dashboard for successful payments, then update these users

SELECT
  id,
  user_id,
  name,
  email,
  subscription_status,
  billing_cycle,
  stripe_customer_id,
  created_at
FROM coaches
WHERE subscription_status != 'lifetime'
  AND stripe_customer_id IS NOT NULL  -- Has paid
ORDER BY created_at DESC;
```

---

## Step 5: Test the Webhook

1. Go to Stripe Dashboard → Webhooks → Your webhook
2. Click "Send test webhook"
3. Select event type: `checkout.session.completed`
4. Send event
5. Check Supabase Edge Function logs for success

---

## Step 6: Verify Fix

1. Create a test subscription with Stripe test mode
2. Check that `coaches` table is updated automatically
3. Verify payment confirmation page shows correct plan
4. Verify dashboard shows active status
5. Verify profile is visible and features unlocked

---

## Technical Details

### What the webhook does:

**On `checkout.session.completed`:**
- Reads `coachId` from session metadata
- Reads `billingCycle` from session metadata
- Updates `coaches` table:
  - `subscription_status` = 'lifetime' (for one-time) or 'active' (for recurring)
  - `billing_cycle` = 'monthly', 'annual', or 'lifetime'
  - `stripe_customer_id` = Stripe customer ID
  - `stripe_subscription_id` = Stripe subscription ID (null for lifetime)
  - `trial_used` = true
  - `trial_ends_at` = null

**On `customer.subscription.updated`:**
- Updates subscription status based on Stripe status
- Updates `subscription_ends_at` with current period end

**On `customer.subscription.deleted`:**
- Sets `subscription_status` = 'expired'
- Sets `subscription_ends_at` to now

---

## Rollback Plan

If webhook causes issues, you can disable it:

1. Go to Stripe Dashboard → Webhooks
2. Click on the webhook
3. Click "Disable endpoint"

Users will still be able to pay, but you'll need to manually update their subscription status.

---

## Monitoring

Check webhook delivery status in Stripe Dashboard:
- Go to Webhooks → Click webhook → View events
- Failed events will show error details
- Check Supabase Edge Function logs for debugging
