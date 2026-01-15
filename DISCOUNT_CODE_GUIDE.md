# Discount Code System Guide

## Overview

The discount code system allows you to create unique promotional codes for partners, special campaigns, and targeted marketing. Codes can be applied via URL parameters or manually entered at checkout.

**Last Updated:** 2026-01-15
**Version:** 1.0.0

---

## Table of Contents

1. [How It Works](#how-it-works)
2. [Configuration File](#configuration-file)
3. [Discount Types](#discount-types)
4. [Creating Discount Codes](#creating-discount-codes)
5. [Usage Flow](#usage-flow)
6. [Promotional Links](#promotional-links)
7. [Stripe Integration](#stripe-integration)
8. [Best Practices](#best-practices)
9. [Example Use Cases](#example-use-cases)
10. [API Reference](#api-reference)
11. [Troubleshooting](#troubleshooting)

---

## How It Works

The discount code system operates in three ways:

### 1. Promotional Links (Auto-Apply)
Users click a link like `https://coachdog.com/pricing?promo=PARTNER2026` and the code is automatically:
- Detected from URL parameters
- Validated
- Stored in sessionStorage
- Applied to both plans on pricing page
- Carried through to checkout

### 2. Manual Entry on Pricing Page
Users can click "Have a discount code?" and manually enter a code to see discounts for both monthly and annual plans.

### 3. Checkout Persistence
Once applied, the discount code:
- Persists in sessionStorage throughout the session
- Survives page navigation
- Applies at Stripe checkout
- Is passed to Stripe with the `stripeCouponId`

---

## Configuration File

All discount codes are managed in: [`config/discountCodes.ts`](config/discountCodes.ts)

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
    stripeCouponId: 'partner_30_off',
  },
};
```

---

## Discount Types

### 1. Percentage Discount
```typescript
{
  type: 'percentage',
  value: 30, // 30% off
  // Results in: £15/month → £10.50/month
}
```

### 2. Fixed Amount Discount
```typescript
{
  type: 'fixed',
  value: 5, // £5 off
  // Results in: £15/month → £10/month
}
```

### 3. Months Free
```typescript
{
  type: 'months_free',
  value: 3, // 3 months free
  // Results in: First 3 months free, then regular price
}
```

### 4. Trial Extension
```typescript
{
  type: 'trial_extension',
  value: 14, // 14 extra days
  // Results in: 30-day trial → 44-day trial
}
```

---

## Creating Discount Codes

### Step 1: Create in Stripe Dashboard

1. Go to [Stripe Dashboard → Products → Coupons](https://dashboard.stripe.com/coupons)
2. Click "New" to create a coupon
3. Configure:
   - **Type:** Percentage / Fixed amount
   - **Duration:** Once / Forever / Repeating
   - **ID:** Use a memorable name (e.g., `partner_30_off`)
4. Save and copy the Coupon ID

### Step 2: Add to config/discountCodes.ts

```typescript
export const DISCOUNT_CODES: Record<string, DiscountCode> = {
  'YOUR_CODE_HERE': {
    code: 'YOUR_CODE_HERE',           // The code users will enter
    type: 'percentage',                // Type of discount
    value: 30,                         // Amount (30% or £30)
    enabled: true,                     // Set to false to disable

    // Optional restrictions
    planRestrictions: ['monthly', 'annual'], // Which plans it applies to
    maxUses: 100,                      // Total uses allowed
    usesRemaining: 100,                // Current uses remaining
    expiryDate: '2026-12-31',         // ISO date

    // Tracking
    source: 'partner_referral',        // Campaign source
    partnerId: 'partner_123',          // Partner identifier

    // Display
    displayName: 'Partner Exclusive',  // Friendly name
    description: '30% off for 3 months',

    // Stripe integration
    stripeCouponId: 'partner_30_off',  // Your Stripe Coupon ID
  },
};
```

### Step 3: Test the Code

1. Navigate to `/pricing?promo=YOUR_CODE_HERE`
2. Verify the code is automatically applied
3. Check that discount calculations are correct
4. Test checkout flow (use Stripe test mode)

---

## Usage Flow

### User Journey

```
1. User receives promotional link
   https://coachdog.com/pricing?promo=PARTNER2026

2. Landing on pricing page
   ↓
   - URL parameter detected: ?promo=PARTNER2026
   - Code validated: ✓ Valid
   - Stored in sessionStorage
   - Discount inputs shown and populated
   - Price calculations displayed

3. User views discounted prices
   Monthly: £15 → £10.50 (30% off)
   Annual: £150 → £105 (30% off)

4. User clicks "Select Monthly"
   ↓
   - Navigates to /checkout/monthly
   - Discount retrieved from sessionStorage
   - Applied to payment summary

5. User proceeds to Stripe checkout
   ↓
   - Discount code passed to Stripe
   - Stripe applies coupon via stripeCouponId
   - Payment completed with discount
```

### Session Persistence

The system uses `sessionStorage` to maintain discount codes:

```typescript
// When code is applied (from URL or manual entry)
sessionStorage.setItem('active_promo_code', 'PARTNER2026');

// Retrieved on pricing page, checkout pages
const code = sessionStorage.getItem('active_promo_code');

// Cleared when user removes code or session ends
sessionStorage.removeItem('active_promo_code');
```

---

## Promotional Links

### Generating Links

```typescript
import { generatePromoLink } from './config/discountCodes';

const link = generatePromoLink('PARTNER2026');
// Returns: https://yoursite.com/pricing?promo=PARTNER2026
```

### Sharing with Partners

Send partners unique URLs:
- Email: "Get 30% off with this exclusive link"
- Social media posts
- QR codes for events
- Newsletter campaigns

### Tracking Performance

Each code includes tracking fields:

```typescript
{
  source: 'partner_referral',  // Campaign type
  partnerId: 'partner_123',    // Specific partner
}
```

You can query usage by:
```typescript
const partnerCodes = getPartnerCodes('partner_123');
// Returns all codes for this partner
```

---

## Stripe Integration

### Backend Integration Required

The discount code is passed to your Stripe checkout creation endpoint. You need to update your backend to apply the coupon:

#### Supabase Edge Function (example)

Update `/supabase/functions/create-checkout-session/index.ts`:

```typescript
// Receive discount code from frontend
const { priceId, coachId, coachEmail, discountCode } = await req.json();

// Validate discount code
const validation = validateDiscountCode(discountCode);
if (!validation.valid) {
  return new Response(
    JSON.stringify({ error: validation.error }),
    { status: 400 }
  );
}

// Create Stripe session with coupon
const session = await stripe.checkout.sessions.create({
  mode: 'subscription',
  line_items: [{
    price: priceId,
    quantity: 1,
  }],
  customer_email: coachEmail,

  // Apply discount coupon
  discounts: validation.discount?.stripeCouponId ? [{
    coupon: validation.discount.stripeCouponId,
  }] : undefined,

  // ... rest of config
});
```

#### Important Notes

1. **Always validate server-side** - Never trust client-provided discount codes
2. **Use Stripe Coupon IDs** - Link your discount codes to actual Stripe coupons
3. **Track usage** - Decrement `usesRemaining` when code is successfully applied
4. **Handle expiry** - Check expiry dates on both client and server

---

## Best Practices

### 1. Code Naming Convention

Use clear, memorable codes:
- ✅ `PARTNER2026` - Clear partner code
- ✅ `FLASH50` - Obvious flash sale
- ✅ `WELCOME3` - Welcome offer
- ❌ `XYZ123` - Confusing
- ❌ `DISCOUNT` - Too generic

### 2. Set Expiry Dates

Always set expiry dates to avoid outdated offers:
```typescript
expiryDate: '2026-12-31', // ISO date format
```

### 3. Limit Uses

Prevent abuse with usage limits:
```typescript
maxUses: 100,
usesRemaining: 100,
```

### 4. Plan Restrictions

Target specific plans:
```typescript
planRestrictions: ['annual'], // Only for annual plan
```

### 5. Track Sources

Organize codes by campaign:
```typescript
source: 'partner_referral', // or 'flash_sale', 'email_campaign', etc.
```

### 6. Clear Descriptions

Help users understand the offer:
```typescript
displayName: 'Partner Exclusive',
description: '30% off your first 3 months',
```

---

## Example Use Cases

### Use Case 1: Partner Referral Program

**Scenario:** You partner with fitness influencers to promote your coaching platform.

**Setup:**
```typescript
'FITNESS_PARTNER': {
  code: 'FITNESS_PARTNER',
  type: 'percentage',
  value: 25,
  enabled: true,
  planRestrictions: ['monthly', 'annual'],
  maxUses: 500,
  usesRemaining: 500,
  expiryDate: '2026-12-31',
  source: 'partner_referral',
  partnerId: 'fitness_influencer_01',
  displayName: 'Fitness Partner Exclusive',
  description: '25% off for the first 3 months',
  stripeCouponId: 'fitness_partner_25',
}
```

**Promotional Link:**
```
https://coachdog.com/pricing?promo=FITNESS_PARTNER
```

**Partner receives:**
- Unique link to share
- Dashboard to track conversions (future enhancement)
- Commission based on signups (if applicable)

---

### Use Case 2: Flash Sale Campaign

**Scenario:** Run a 48-hour flash sale to drive quick signups.

**Setup:**
```typescript
'FLASH48': {
  code: 'FLASH48',
  type: 'percentage',
  value: 50,
  enabled: true,
  planRestrictions: ['annual'],
  maxUses: 50,
  usesRemaining: 50,
  expiryDate: '2026-02-01', // 48 hours from now
  source: 'flash_sale',
  displayName: '48-Hour Flash Sale',
  description: '50% off annual plan',
  stripeCouponId: 'flash_50_annual',
}
```

**Promotion:**
- Email blast to newsletter
- Social media countdown
- Homepage banner with countdown timer
- Urgency messaging: "Only 50 spots available!"

---

### Use Case 3: Welcome Offer for New Users

**Scenario:** Give new signups a trial extension.

**Setup:**
```typescript
'WELCOME14': {
  code: 'WELCOME14',
  type: 'trial_extension',
  value: 14, // 14 extra days
  enabled: true,
  source: 'welcome_campaign',
  displayName: 'Welcome Bonus',
  description: 'Extra 14 days to try premium',
}
```

**Usage:**
- Include in welcome email
- Show on first login
- Encourage feature exploration

---

### Use Case 4: Seasonal Promotion

**Scenario:** New Year's resolution campaign.

**Setup:**
```typescript
'NEWYEAR2026': {
  code: 'NEWYEAR2026',
  type: 'months_free',
  value: 2,
  enabled: true,
  planRestrictions: ['annual'],
  expiryDate: '2026-02-01',
  source: 'seasonal_campaign',
  displayName: 'New Year Special',
  description: 'First 2 months free on annual plan',
  stripeCouponId: 'newyear_2mo_free',
}
```

---

## API Reference

### Functions

#### `validateDiscountCode(code: string)`

Validates a discount code and checks eligibility.

```typescript
const result = validateDiscountCode('PARTNER2026');

// Returns:
{
  valid: boolean;
  discount?: DiscountCode;
  error?: string;
}

// Example success:
{
  valid: true,
  discount: { /* DiscountCode object */ }
}

// Example error:
{
  valid: false,
  error: 'This code has expired'
}
```

---

#### `calculateDiscount(discount, planPrice, planId)`

Calculates the discount amount for a specific plan.

```typescript
const calc = calculateDiscount(discountCode, 15, 'monthly');

// Returns:
{
  discountAmount: 4.5,      // £4.50 off
  finalPrice: 10.5,         // £10.50 final price
  description: '30% off'    // Display text
}
```

---

#### `getActivePromoCode()`

Retrieves the current promo code from URL or sessionStorage.

```typescript
const code = getActivePromoCode();
// Returns: 'PARTNER2026' or null
```

---

#### `clearActivePromoCode()`

Removes the active promo code from sessionStorage.

```typescript
clearActivePromoCode();
```

---

#### `generatePromoLink(code, baseUrl?)`

Generates a promotional link with the code.

```typescript
const link = generatePromoLink('PARTNER2026');
// Returns: 'https://yoursite.com/pricing?promo=PARTNER2026'

const customLink = generatePromoLink('PARTNER2026', 'https://custom.com');
// Returns: 'https://custom.com/pricing?promo=PARTNER2026'
```

---

#### `getPartnerCodes(partnerId?)`

Gets all active partner codes.

```typescript
const codes = getPartnerCodes('partner_123');
// Returns: DiscountCode[]
```

---

#### `markCodeAsUsed(code)`

Decrements the usage counter for a code.

```typescript
markCodeAsUsed('PARTNER2026');
// Decrements usesRemaining by 1
// In production, this would call an API
```

---

## Troubleshooting

### Issue: Code Not Auto-Applying from URL

**Symptoms:**
- User clicks `?promo=CODE` link
- Discount doesn't show on pricing page

**Solutions:**
1. Check browser console for errors
2. Verify code is enabled: `enabled: true`
3. Check expiry date hasn't passed
4. Verify `usesRemaining > 0` if set
5. Hard refresh page (Cmd+Shift+R)

---

### Issue: Discount Shows on Pricing but Not at Checkout

**Symptoms:**
- Discount appears on pricing page
- Missing from checkout summary

**Solutions:**
1. Check sessionStorage: `sessionStorage.getItem('active_promo_code')`
2. Verify checkout page imports discount functions
3. Check browser console for errors in CheckoutMonthly/CheckoutAnnual
4. Ensure discount code is passed to `createCheckoutSession()`

---

### Issue: Stripe Not Applying Discount

**Symptoms:**
- Discount shows in app
- Stripe checkout shows full price

**Solutions:**
1. Verify `stripeCouponId` is set in discount code
2. Check coupon exists in Stripe Dashboard
3. Ensure backend passes coupon to Stripe session creation
4. Check Stripe webhook logs for errors
5. Test in Stripe test mode first

---

### Issue: Code Shows as Invalid

**Error Messages:**
- "Invalid code"
- "This code is no longer active"
- "This code has expired"
- "This code has been fully redeemed"

**Solutions:**

**"Invalid code":**
- Check code spelling matches exactly (case-insensitive)
- Verify code exists in `DISCOUNT_CODES`

**"This code is no longer active":**
- Set `enabled: true` in config

**"This code has expired":**
- Update `expiryDate` to future date or remove field

**"This code has been fully redeemed":**
- Increase `maxUses` and `usesRemaining`

---

### Issue: Wrong Discount Amount Calculated

**Symptoms:**
- Expected 30% off but getting different amount
- Discount not applying to correct plan

**Solutions:**
1. Check `planRestrictions` - code may not apply to selected plan
2. Verify `value` field matches intended discount (30 = 30%, not £30)
3. Check `type` field matches discount type
4. Review calculation logic in `calculateDiscount()` function

---

### Debugging Tips

#### Enable Console Logging

```typescript
// Check what code is being applied
console.log('Active promo code:', getActivePromoCode());

// Check validation result
const validation = validateDiscountCode('YOUR_CODE');
console.log('Validation result:', validation);

// Check calculation
const calc = calculateDiscount(validation.discount, 15, 'monthly');
console.log('Discount calculation:', calc);
```

#### Check sessionStorage

```javascript
// In browser console
sessionStorage.getItem('active_promo_code')
```

#### Verify Discount Code Config

```typescript
import { DISCOUNT_CODES } from './config/discountCodes';
console.log('All codes:', DISCOUNT_CODES);
console.log('Specific code:', DISCOUNT_CODES['PARTNER2026']);
```

---

## Future Enhancements

### Planned Features

1. **Usage Analytics Dashboard**
   - Track code redemptions
   - View conversion rates
   - Monitor partner performance

2. **Admin UI for Code Management**
   - Create codes without editing config file
   - Real-time enable/disable toggle
   - Bulk operations

3. **A/B Testing Support**
   - Test different discount amounts
   - Compare conversion rates
   - Automatic winner selection

4. **User Segment Targeting**
   - Target specific user types
   - Exclude existing customers
   - Limit to specific geographies

5. **Automatic Code Generation**
   - Generate unique codes for campaigns
   - Batch creation for partners
   - Random code generation

6. **Email Integration**
   - Personalized codes per user
   - Automatic delivery via email
   - Welcome sequence codes

---

## Support

For questions or issues:
- Review this guide first
- Check [Troubleshooting](#troubleshooting) section
- Review [API Reference](#api-reference)
- Check browser console for errors
- Test in Stripe test mode first

---

**Version:** 1.0.0
**Last Updated:** 2026-01-15
**Maintained by:** CoachDog Development Team
