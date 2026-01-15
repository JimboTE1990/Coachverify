# 📋 Dynamic Pricing Configuration Guide

## Overview

The pricing system is now **centralized and dynamic**. All prices, promotional offers, and CTA messages are controlled from a single file: [`config/pricing.ts`](config/pricing.ts)

## ✅ Benefits

1. **Update Once, Reflect Everywhere** - Change the price in one place and it updates across:
   - Top nav bar upgrade button
   - Login notification toast
   - "For Coaches" dropdown upgrade card
   - Any future CTAs

2. **Easy Promotional Offers** - Enable special offers without code changes

3. **Automatic Expiry** - Set expiry dates for promotions

4. **Visual Transformation** - Promotional mode changes colors/styling automatically

## 📁 Configuration File: `config/pricing.ts`

### Standard Pricing

```typescript
export const PRICING_CONFIG = {
  plans: {
    monthly: {
      id: 'monthly',
      name: 'Monthly',
      price: 15,              // ← Change price here
      currency: 'GBP',
      currencySymbol: '£',
      billingPeriod: 'month',
    },
    annual: {
      id: 'annual',
      name: 'Annual',
      price: 150,             // ← Change price here
      currency: 'GBP',
      currencySymbol: '£',
      billingPeriod: 'year',
      savings: '17%',         // ← Update savings calculation
      popular: true,
    },
  },
```

### Promotional Offers

```typescript
  promotionalOffer: {
    enabled: false,           // ← Set to true to activate promotion

    // Uncomment and customize:
    // title: '🎉 New Year Special',
    // description: 'Get 50% off your first 3 months',
    // discount: '50% off',
    // badge: 'Limited Time',
    // expiryDate: '2026-02-01',
    // customMessage: 'Lock in this rate before February 1st!',
  },
};
```

## 🎯 How to Make Changes

### Example 1: Change Base Price

**Scenario:** Increase monthly price from £15 to £18

```typescript
// config/pricing.ts
monthly: {
  price: 18,  // Changed from 15
  // ... rest stays the same
}
```

**Result:** All CTAs will now show "From £18/month"

### Example 2: Launch a Promotional Offer

**Scenario:** 50% off for Valentine's Day

```typescript
// config/pricing.ts
promotionalOffer: {
  enabled: true,                                    // ✅ Enable promotion
  title: '💝 Valentine\'s Day Special',
  description: 'Get 50% off your first 3 months',
  discount: '50% off',
  badge: 'Limited Time',
  expiryDate: '2026-02-15',                        // Expires Feb 15th
  customMessage: 'Lock in 50% off before February 15th!',
}
```

**Result:**
- Login notification changes from amber/orange to purple/pink gradient
- Header changes from "You're on a Free Trial" to "Special Offer Available!"
- Badge appears: "⚡ Limited Time"
- CTA button text changes to "Claim Your Offer Now →"
- Bottom text shows: "Lock in 50% off before February 15th!"

### Example 3: Temporary Price Drop

**Scenario:** Drop monthly price to £12 for Q1

```typescript
// config/pricing.ts
monthly: {
  price: 12,  // Temporarily reduced
  // ...
}

promotionalOffer: {
  enabled: true,
  badge: 'Q1 Special',
  customMessage: 'Special Q1 rate - £12/month until March 31st',
  expiryDate: '2026-03-31',
}
```

## 🎨 Visual Changes During Promotions

When `promotionalOffer.enabled = true`:

| Element | Standard | Promotional |
|---------|----------|-------------|
| **Gradient** | Amber → Orange → Rose | Purple → Pink → Rose |
| **Icon** | ✨ Sparkles | ⚡ Lightning |
| **Header** | "You're on a Free Trial" | "Special Offer Available!" |
| **Badge** | None | "⚡ Limited Time" (or custom) |
| **Button Text** | "Upgrade to Premium Now" | "Claim Your Offer Now" |
| **Color Accent** | Amber/Orange | Purple/Pink |

## 🔄 Where Pricing Appears

### 1. **Top Nav Bar** (`components/Layout.tsx`)
- Bright gradient button (amber/orange or purple/pink)
- Shows starting price dynamically

### 2. **Login Notification Toast** (`components/subscription/TrialLoginNotification.tsx`)
- Bottom-right notification
- Full promotional styling when enabled
- Shows custom message or standard pricing

### 3. **"For Coaches" Dropdown** (`components/Layout.tsx`)
- Upgrade card in dropdown menu
- Updates pricing automatically

## 📅 Automatic Expiry

Set an expiry date and the promotion will automatically deactivate:

```typescript
promotionalOffer: {
  enabled: true,
  expiryDate: '2026-02-01',  // ISO date format
  // ...
}
```

**After Feb 1st, 2026:**
- Promotion styling reverts to standard
- Custom messages disappear
- Standard pricing shows again

**Note:** The system checks the date client-side, so it updates in real-time.

## 🚀 Best Practices

### 1. **Test Before Launch**
Change `enabled: true` locally and test all CTAs before deploying.

### 2. **Clear Messaging**
Keep promotional messages short and action-oriented:
- ✅ "50% off for 3 months"
- ❌ "We're having a sale on our premium tier subscription plans"

### 3. **Update All Related Docs**
If you change pricing, also update:
- `/pricing` page content
- Stripe product prices (in Stripe Dashboard)
- Any marketing materials

### 4. **Set Expiry Dates**
Always set an expiry date for promotions to avoid "expired" offers showing.

### 5. **Currency Consistency**
If you support multiple currencies in the future, update all plans:
```typescript
monthly: {
  price: 18,
  currency: 'USD',
  currencySymbol: '$',
  // ...
}
```

## 🔮 Future Enhancements

This system is designed to support:

### Custom Offer Targeting
```typescript
// Future feature: Target specific user segments
promotionalOffer: {
  enabled: true,
  targetSegments: ['new_trial_users', 'returning_users'],
  // ...
}
```

### Multiple Simultaneous Offers
```typescript
// Future feature: Different offers for different plans
promotionalOffers: [
  {
    planId: 'monthly',
    discount: '30% off',
    // ...
  },
  {
    planId: 'annual',
    discount: '40% off',
    // ...
  }
]
```

### A/B Testing Support
```typescript
// Future feature: Split test different offers
promotionalOffer: {
  enabled: true,
  variants: [
    { weight: 0.5, discount: '50% off' },
    { weight: 0.5, discount: '3 months free' }
  ]
}
```

## 💡 Example Use Cases

### Use Case 1: Flash Sale

```typescript
promotionalOffer: {
  enabled: true,
  title: '⚡ 24-Hour Flash Sale',
  discount: '60% off',
  badge: 'EXPIRES SOON',
  expiryDate: '2026-01-16',  // Tomorrow
  customMessage: 'Flash sale ends in 24 hours - Don\'t miss out!',
}
```

### Use Case 2: Seasonal Offer

```typescript
promotionalOffer: {
  enabled: true,
  title: '🌸 Spring Launch Special',
  description: 'First 100 coaches get 40% off lifetime',
  discount: '40% off forever',
  badge: 'Limited Spots',
  expiryDate: '2026-04-01',
  customMessage: 'Join 57 other coaches who locked in this rate',
}
```

### Use Case 3: Referral Bonus

```typescript
promotionalOffer: {
  enabled: true,
  title: '🎁 Referral Bonus Active',
  description: 'You were referred by another coach',
  discount: '2 months free',
  badge: 'Exclusive',
  customMessage: 'Your colleague unlocked 2 free months for you!',
}
```

## 📊 Helper Functions

The system provides utility functions:

```typescript
import {
  getStartingPrice,           // Returns: "£15"
  getCTAPricingMessage,        // Returns promo message or standard pricing
  getPromotionalBadge,         // Returns badge text or null
  isPromotionActive,           // Returns boolean
} from './config/pricing';
```

Use these in any component that needs dynamic pricing:

```typescript
const MyComponent = () => {
  const price = getStartingPrice();
  const message = getCTAPricingMessage();

  return (
    <div>
      <p>Starting at {price}/month</p>
      <p className="text-sm">{message}</p>
    </div>
  );
};
```

## 🛠️ Troubleshooting

### Promotion Not Showing?

1. Check `enabled: true` is set
2. Check expiry date hasn't passed
3. Hard refresh browser (Cmd+Shift+R)
4. Check browser console for errors

### Wrong Price Displaying?

1. Verify `config/pricing.ts` has correct price
2. Ensure component imports from `config/pricing`
3. Clear browser cache

### Promotion Expired But Still Showing?

1. Check client system date/time
2. Verify `expiryDate` is in future
3. Hard refresh to re-evaluate expiry

---

**Last Updated:** 2026-01-15
**Version:** 1.0.0
