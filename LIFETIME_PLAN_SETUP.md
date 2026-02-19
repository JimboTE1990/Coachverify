# Lifetime Plan Setup Guide

## Overview
Lifetime plan pricing: **£149** (standard price)
- **BETA100** code: £49 (limited to 10 uses) - **ACTIVE**
- **LIMITED60** code: £89 (limited to 50 uses) - **READY BUT NOT ACTIVE YET**

---

## Step 1: Create Lifetime Product in Stripe Production

### 1.1 Create Product
1. Go to **Stripe Dashboard → Products → Add Product**
2. Settings:
   - **Name:** CoachDog Lifetime Access
   - **Description:** One-time payment for lifetime platform access - never pay again!
   - **Statement descriptor:** COACHDOG LIFETIME

### 1.2 Create Price
- **Pricing model:** One time
- **Price:** £149.00 GBP
- **Price ID:** Copy this after creation (e.g., `price_1AbC...`)

### 1.3 Add Product Metadata
Add these metadata fields to the product:
```
plan_type: lifetime
features: unlimited_access,priority_support,lifetime_updates
```

---

## Step 2: Create Discount Coupons in Stripe

### 2.1 BETA100 Coupon (Active Now)

1. Go to **Stripe Dashboard → Products → Coupons → Create Coupon**
2. Settings:
   - **ID:** `BETA100_LIFETIME` (must match code in discountCodes.ts)
   - **Type:** Fixed amount
   - **Amount off:** £100.00 GBP
   - **Duration:** Once
   - **Redemption limits:**
     - ✅ Limit number of times: 10
     - ✅ First time transaction only

3. After creating, create a **Promotion Code**:
   - **Code:** `BETA100` (customer-facing code)
   - **Coupon:** Select BETA100_LIFETIME
   - **Active:** YES
   - **Expires:** Leave blank (controlled by max uses)

### 2.2 LIMITED60 Coupon (For Future Campaign)

1. Go to **Stripe Dashboard → Products → Coupons → Create Coupon**
2. Settings:
   - **ID:** `LIMITED60_LIFETIME`
   - **Type:** Fixed amount
   - **Amount off:** £60.00 GBP
   - **Duration:** Once
   - **Redemption limits:**
     - ✅ Limit number of times: 50
     - ✅ First time transaction only

3. Create **Promotion Code**:
   - **Code:** `LIMITED60`
   - **Coupon:** Select LIMITED60_LIFETIME
   - **Active:** NO (enable when you're ready to launch the campaign)
   - **Expires:** 2026-12-31 (update to your campaign end date)

---

## Step 3: Update Code Configuration

### 3.1 Add Lifetime Constants (When Ready to Go Live)

Create/update file: `constants/subscription.ts`

```typescript
export const SUBSCRIPTION_CONSTANTS = {
  // ... existing monthly/annual constants ...

  // Lifetime plan
  LIFETIME_PRICE_GBP: 149,
  LIFETIME_STRIPE_PRICE_ID: 'price_1AbC...', // Add your Stripe price ID here
};
```

### 3.2 Update Discount Code Config

The discount codes are already configured in `config/discountCodes.ts`:

✅ **BETA100** - Active and ready (£100 off → £49 final)
✅ **LIMITED60** - Configured but disabled (£60 off → £89 final)

To enable LIMITED60 when ready:
1. In Stripe: Activate the LIMITED60 promotion code
2. In `config/discountCodes.ts`: Change `enabled: false` to `enabled: true`
3. Update `expiryDate` to your campaign end date

---

## Step 4: Create Lifetime Checkout Page (When Ready to Launch)

When you're ready to add the lifetime plan to the frontend:

1. Copy `pages/checkout/CheckoutAnnual.tsx` to `pages/checkout/CheckoutLifetime.tsx`
2. Update the imports and pricing:
```typescript
import { SUBSCRIPTION_CONSTANTS } from '../../constants/subscription';

const planPrice = SUBSCRIPTION_CONSTANTS.LIFETIME_PRICE_GBP; // 149
const priceId = SUBSCRIPTION_CONSTANTS.LIFETIME_STRIPE_PRICE_ID;
```

3. Add route in `App.tsx`:
```typescript
<Route path="/checkout/lifetime" element={<CheckoutLifetime />} />
```

4. Add lifetime option to pricing page when ready to make it visible

---

## Step 5: Testing in Stripe Test Mode

Before going live, test in Stripe test mode:

1. Create same products/coupons in **Test Mode**
2. Use test card: `4242 4242 4242 4242`
3. Test scenarios:
   - ✅ Lifetime purchase at £149 (no code)
   - ✅ Lifetime with BETA100 → Should charge £49
   - ✅ BETA100 redemption limit (try 11th use, should fail)
   - ✅ Invalid/expired codes

---

## Step 6: Production Deployment Checklist

When ready to launch lifetime plan:

- [ ] Lifetime product created in Stripe production
- [ ] BETA100 coupon created with 10-use limit
- [ ] BETA100 promotion code active in Stripe
- [ ] LIMITED60 coupon created (keep inactive until campaign)
- [ ] Stripe price ID added to constants
- [ ] Lifetime checkout page created
- [ ] Route added to App.tsx
- [ ] Tested with Stripe test mode
- [ ] Ready to add to pricing page UI

---

## Monitoring & Usage Tracking

### Check BETA100 Redemptions

In Stripe Dashboard:
1. Go to **Products → Coupons**
2. Click on **BETA100_LIFETIME**
3. See "Times redeemed" counter
4. When it hits 10, the code automatically becomes unusable

### Manual Override (If Needed)

If you need to extend the BETA100 limit:
1. In Stripe: Edit BETA100_LIFETIME coupon
2. Update "Limit number of times" to new value
3. In `config/discountCodes.ts`: Update `usesRemaining` value
4. Redeploy code

---

## Customer Experience

### With BETA100 Code:
1. Customer visits `/pricing` or `/checkout/lifetime?promo=BETA100`
2. Sees lifetime plan: ~~£149~~ **£49** (£100 off applied)
3. "Beta Tester Exclusive" badge shown
4. 10 total uses available message
5. One-time payment of £49 → lifetime access

### Without Code:
1. Customer sees lifetime plan at £149
2. Can manually enter BETA100 in discount field
3. Discount applies if uses remaining > 0

---

## Important Notes

⚠️ **Lifetime Plan Not Live Yet**: The discount codes are configured but the lifetime plan UI is not yet visible to customers. This allows you to:
- Set up Stripe products/coupons now
- Test everything
- Launch when ready by adding the checkout page and UI

✅ **BETA100 Already Configured**: Code is ready in codebase, just needs Stripe coupon setup
✅ **LIMITED60 Pre-configured**: Ready to activate for future campaign
✅ **Sandbox Tested**: You've already tested the 10-use limit in test mode

---

## FAQ

**Q: Can I change BETA100 to unlimited uses?**
A: Yes, in Stripe edit the coupon and remove the redemption limit. Also update `config/discountCodes.ts` to remove `maxUses` and `usesRemaining`.

**Q: Can I add more discount codes later?**
A: Yes! Just create the Stripe coupon and add it to `config/discountCodes.ts` following the same pattern.

**Q: What happens when BETA100 hits 10 uses?**
A: Stripe automatically rejects the code. Customers will see "This code has been fully redeemed" message.

**Q: How do I activate LIMITED60?**
A:
1. Activate the promotion code in Stripe
2. Change `enabled: false` to `enabled: true` in `config/discountCodes.ts`
3. Deploy updated code
