# Discount Code System - Quick Start Guide

## What Was Built

A complete discount code system that allows you to create unique promotional codes for partners, campaigns, and special offers.

---

## How It Works

### For Users

1. **Promotional Link**: Users click `https://coachdog.com/pricing?promo=PARTNER2026`
2. **Auto-Apply**: Code is automatically detected and applied
3. **Session Persistence**: Code stays active throughout checkout
4. **Stripe Integration**: Discount applied at payment

### For You

1. Create discount code in Stripe Dashboard
2. Add code to [`config/discountCodes.ts`](config/discountCodes.ts)
3. Share promotional link
4. Track usage

---

## Creating Your First Discount Code

### Step 1: Create in Stripe

1. Go to [Stripe Dashboard → Coupons](https://dashboard.stripe.com/coupons)
2. Click "New"
3. Configure (e.g., 30% off, 3 months duration)
4. Set ID as `partner_30_off`
5. Save

### Step 2: Add to Config

Edit [`config/discountCodes.ts`](config/discountCodes.ts):

```typescript
export const DISCOUNT_CODES: Record<string, DiscountCode> = {
  'PARTNER2026': {
    code: 'PARTNER2026',
    type: 'percentage',
    value: 30,
    enabled: true,
    planRestrictions: ['monthly', 'annual'],
    maxUses: 100,
    usesRemaining: 100,
    expiryDate: '2026-12-31',
    source: 'partner_referral',
    displayName: 'Partner Exclusive',
    description: '30% off for 3 months',
    stripeCouponId: 'partner_30_off', // ← From Stripe
  },
};
```

### Step 3: Share Link

```
https://coachdog.com/pricing?promo=PARTNER2026
```

---

## What Happens in the User Flow

### 1. Pricing Page (`/pricing?promo=PARTNER2026`)
- Code detected from URL
- Validated automatically
- Stored in sessionStorage
- Discount inputs appear
- Both plans show discounted prices

**Visual Changes:**
- Monthly: £15 → £10.50 (strikethrough + green price)
- Annual: £150 → £105 (strikethrough + green price)
- "Save £X" badge appears

### 2. Checkout Page (`/checkout/monthly`)
- Code retrieved from sessionStorage
- Applied to payment summary
- Shows discount breakdown

**Payment Summary:**
```
Plan: Monthly
Base Price: £15/month (strikethrough)
Discount (PARTNER2026): -£4.50
─────────────────────
Final Price: £10.50/month
```

### 3. Stripe Checkout
- Discount code passed to backend
- Stripe coupon applied via `stripeCouponId`
- User pays discounted amount

---

## Discount Types Supported

### 1. Percentage Off
```typescript
type: 'percentage',
value: 30, // 30% off
```

### 2. Fixed Amount Off
```typescript
type: 'fixed',
value: 5, // £5 off
```

### 3. Free Months
```typescript
type: 'months_free',
value: 3, // First 3 months free
```

### 4. Trial Extension
```typescript
type: 'trial_extension',
value: 14, // Extra 14 days of trial
```

---

## Files Modified/Created

### Created Files:
1. **[config/discountCodes.ts](config/discountCodes.ts)** - Core discount code configuration and logic
2. **[components/subscription/DiscountCodeInput.tsx](components/subscription/DiscountCodeInput.tsx)** - Discount input component
3. **[DISCOUNT_CODE_GUIDE.md](DISCOUNT_CODE_GUIDE.md)** - Comprehensive documentation
4. **[DISCOUNT_CODE_QUICK_START.md](DISCOUNT_CODE_QUICK_START.md)** - This file

### Modified Files:
1. **[pages/Pricing.tsx](pages/Pricing.tsx)** - Added discount code UI and auto-apply logic
2. **[pages/checkout/CheckoutMonthly.tsx](pages/checkout/CheckoutMonthly.tsx)** - Added discount display and Stripe integration
3. **[pages/checkout/CheckoutAnnual.tsx](pages/checkout/CheckoutAnnual.tsx)** - Added discount display and Stripe integration
4. **[services/stripeService.ts](services/stripeService.ts)** - Added `discountCode` parameter to checkout session creation

---

## Example Discount Codes (Already Configured)

### PARTNER2026
- **Type:** 30% off for 3 months
- **Plans:** Monthly & Annual
- **Usage:** 100 uses
- **Expires:** 2026-12-31
- **Link:** `https://coachdog.com/pricing?promo=PARTNER2026`

### FLASH50
- **Type:** 50% off annual plan
- **Plans:** Annual only
- **Usage:** 50 uses
- **Expires:** 2026-02-01
- **Status:** Currently disabled (set `enabled: true` to activate)

### EXTRATRIAL
- **Type:** 14 extra trial days
- **Plans:** All
- **Link:** `https://coachdog.com/pricing?promo=EXTRATRIAL`

### WELCOME3
- **Type:** 3 months free
- **Plans:** Annual only
- **Status:** Currently disabled

---

## Testing the System

### 1. Test Auto-Apply from URL

1. Navigate to: `http://localhost:5173/pricing?promo=PARTNER2026`
2. Verify "Discount Code" section appears
3. Check both plans show discounted prices
4. Click "Select Monthly"
5. Verify discount shows in payment summary on checkout page

### 2. Test Manual Entry

1. Go to `/pricing` (no URL parameter)
2. Click "Have a discount code?"
3. Enter `PARTNER2026`
4. Click "Apply"
5. Verify discount appears

### 3. Test Invalid Code

1. Enter `INVALID_CODE`
2. Should show error: "Invalid code"

### 4. Test Expired Code

1. Set `expiryDate: '2020-01-01'` for a test code
2. Try to apply it
3. Should show error: "This code has expired"

---

## Common Tasks

### Enable/Disable a Code

```typescript
'FLASH50': {
  enabled: false, // ← Change to true to enable
  // ...
}
```

### Change Discount Amount

```typescript
'PARTNER2026': {
  value: 50, // ← Was 30, now 50% off
  // ...
}
```

### Extend Expiry Date

```typescript
'PARTNER2026': {
  expiryDate: '2027-12-31', // ← Extended by 1 year
  // ...
}
```

### Add More Uses

```typescript
'PARTNER2026': {
  maxUses: 200,        // ← Was 100
  usesRemaining: 200,  // ← Was 100
  // ...
}
```

---

## Backend Integration (Required)

You need to update your Stripe checkout creation to apply the coupon:

**File:** `/supabase/functions/create-checkout-session/index.ts`

```typescript
// Extract discount code from request
const { priceId, coachId, coachEmail, discountCode } = await req.json();

// Validate discount code (import from config/discountCodes.ts)
const validation = validateDiscountCode(discountCode);

// Create Stripe session with coupon
const session = await stripe.checkout.sessions.create({
  mode: 'subscription',
  line_items: [{ price: priceId, quantity: 1 }],
  customer_email: coachEmail,

  // Apply discount if valid
  discounts: validation.valid && validation.discount?.stripeCouponId ? [{
    coupon: validation.discount.stripeCouponId,
  }] : undefined,

  // ... rest of config
});
```

**Important:** Always validate discount codes server-side, not just client-side.

---

## Promotional Link Format

### Basic Link
```
https://coachdog.com/pricing?promo=PARTNER2026
```

### Alternative Parameter Names
```
https://coachdog.com/pricing?code=PARTNER2026
```

Both `?promo=` and `?code=` work.

### Generate Links Programmatically

```typescript
import { generatePromoLink } from './config/discountCodes';

const link = generatePromoLink('PARTNER2026');
// Returns: https://yoursite.com/pricing?promo=PARTNER2026
```

---

## Troubleshooting

### Code Not Applying?

1. Check `enabled: true`
2. Check expiry date is in future
3. Check `usesRemaining > 0`
4. Hard refresh browser (Cmd+Shift+R)
5. Check browser console for errors

### Discount Shows in App But Not at Stripe?

1. Verify `stripeCouponId` is set
2. Check coupon exists in Stripe Dashboard
3. Ensure backend applies coupon to session
4. Check Stripe logs for errors

### Code Shows as Invalid?

1. Check spelling matches exactly
2. Verify code exists in `DISCOUNT_CODES`
3. Check code is enabled
4. Verify not expired

---

## Next Steps

1. **Create Your First Code**
   - Follow Step 1 and Step 2 above
   - Test with `?promo=YOUR_CODE`

2. **Update Backend**
   - Modify Stripe session creation to apply coupons
   - Test in Stripe test mode first

3. **Share with Partners**
   - Generate promotional links
   - Track which codes are most effective

4. **Monitor Usage**
   - Check `usesRemaining` in config
   - In future: Build analytics dashboard

---

## Full Documentation

For complete details, see [DISCOUNT_CODE_GUIDE.md](DISCOUNT_CODE_GUIDE.md):
- All discount types
- Complete API reference
- Example use cases
- Troubleshooting guide
- Best practices

---

**Ready to use!** The frontend is fully integrated. You just need to:
1. Create discount codes in Stripe
2. Add them to config file
3. Update backend to apply coupons
4. Share promotional links

**Last Updated:** 2026-01-15
