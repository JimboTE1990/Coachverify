/**
 * Discount Code System
 * Supports unique promo codes, partner codes, and automatic promotions
 */

export type DiscountType = 'percentage' | 'fixed' | 'trial_extension' | 'months_free' | 'lifetime_fixed';

export interface DiscountCode {
  code: string;
  type: DiscountType;
  value: number; // Percentage (50 = 50%) or fixed amount or months
  enabled: boolean;

  // Restrictions
  planRestrictions?: ('monthly' | 'annual' | 'lifetime')[]; // Which plans it applies to
  maxUses?: number; // Total uses allowed
  usesRemaining?: number; // Decrements on use
  expiryDate?: string; // ISO date

  // Partner/Campaign tracking
  source?: string; // e.g., 'partner_referral', 'black_friday', 'linkedin_ad'
  partnerId?: string;

  // Display
  displayName?: string; // e.g., "Black Friday Special"
  description?: string;

  // Stripe integration
  stripeCouponId?: string; // Link to Stripe coupon
  stripePromotionCodeId?: string; // Link to Stripe promotion code
}

/**
 * Active Discount Codes
 * Add new codes here
 */
export const DISCOUNT_CODES: Record<string, DiscountCode> = {
  // EMCC member referral code — 15% off once
  'EMCC15': {
    code: 'EMCC15',
    type: 'percentage',
    value: 15,
    enabled: true,
    planRestrictions: ['monthly', 'annual'],
    source: 'partner_referral',
    partnerId: 'emcc',
    displayName: 'EMCC Member Discount',
    description: '15% off your first payment',
    stripeCouponId: 'NStyLey1',
    stripePromotionCodeId: 'promo_1T2AEyDbNBAbZyi',
  },

  // Example: Partner referral code
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
    stripeCouponId: 'partner_30_off', // You'll create this in Stripe
  },

  // Example: Flash sale
  'FLASH50': {
    code: 'FLASH50',
    type: 'percentage',
    value: 50,
    enabled: false, // Enable during flash sale
    planRestrictions: ['annual'],
    maxUses: 50,
    usesRemaining: 50,
    expiryDate: '2026-02-01',
    source: 'flash_sale',
    displayName: 'Flash Sale',
    description: '50% off annual plan',
    stripeCouponId: 'flash_50_annual',
  },

  // Example: Trial extension
  'EXTRATRIAL': {
    code: 'EXTRATRIAL',
    type: 'trial_extension',
    value: 14, // 14 extra days
    enabled: true,
    source: 'support_gesture',
    displayName: 'Extended Trial',
    description: 'Extra 14 days to try premium',
  },

  // Example: Free months
  'WELCOME3': {
    code: 'WELCOME3',
    type: 'months_free',
    value: 3,
    enabled: false,
    planRestrictions: ['annual'],
    source: 'welcome_campaign',
    displayName: 'Welcome Offer',
    description: '3 months free',
  },

  // ============================================================================
  // LIFETIME PLAN DISCOUNTS
  // ============================================================================

  // Beta Tester Exclusive - Limited to 10 uses
  // Lifetime plan: £149 → £49 with BETA100
  'BETA100': {
    code: 'BETA100',
    type: 'lifetime_fixed',
    value: 100, // £100 off the £149 lifetime price = £49 final
    enabled: true,
    planRestrictions: ['lifetime'],
    maxUses: 10,
    usesRemaining: 10, // NOTE: Update this in production to track actual uses
    source: 'beta_tester_exclusive',
    displayName: 'Beta Tester Exclusive',
    description: '£100 off - Pay only £49 for lifetime access',
    stripeCouponId: 'BETA100_LIFETIME', // Create this in Stripe production
  },

  // Limited Time Offer - £89 lifetime (to be enabled later)
  // Lifetime plan: £149 → £89 with LIMITED60
  'LIMITED60': {
    code: 'LIMITED60',
    type: 'lifetime_fixed',
    value: 60, // £60 off the £149 lifetime price = £89 final
    enabled: false, // Enable when ready to launch this offer
    planRestrictions: ['lifetime'],
    maxUses: 50, // Set your desired limit
    usesRemaining: 50,
    expiryDate: '2026-12-31', // Update this to your campaign end date
    source: 'limited_time_offer',
    displayName: 'Limited Time Offer',
    description: '£60 off - Pay only £89 for lifetime access',
    stripeCouponId: 'LIMITED60_LIFETIME', // Create this in Stripe when ready
  },
};

/**
 * Validate a discount code
 */
export const validateDiscountCode = (code: string): {
  valid: boolean;
  discount?: DiscountCode;
  error?: string;
} => {
  const upperCode = code.toUpperCase().trim();
  const discount = DISCOUNT_CODES[upperCode];

  if (!discount) {
    return { valid: false, error: 'Invalid code' };
  }

  if (!discount.enabled) {
    return { valid: false, error: 'This code is no longer active' };
  }

  if (discount.usesRemaining !== undefined && discount.usesRemaining <= 0) {
    return { valid: false, error: 'This code has been fully redeemed' };
  }

  if (discount.expiryDate) {
    const expiry = new Date(discount.expiryDate);
    const now = new Date();
    if (now > expiry) {
      return { valid: false, error: 'This code has expired' };
    }
  }

  return { valid: true, discount };
};

/**
 * Calculate discount amount for a plan
 */
export const calculateDiscount = (
  discount: DiscountCode,
  planPrice: number,
  planId: 'monthly' | 'annual' | 'lifetime'
): {
  discountAmount: number;
  finalPrice: number;
  description: string;
} => {
  // Check plan restrictions
  if (discount.planRestrictions && !discount.planRestrictions.includes(planId)) {
    return {
      discountAmount: 0,
      finalPrice: planPrice,
      description: `This code is not valid for the ${planId} plan`,
    };
  }

  switch (discount.type) {
    case 'percentage': {
      const discountAmount = (planPrice * discount.value) / 100;
      return {
        discountAmount,
        finalPrice: planPrice - discountAmount,
        description: `${discount.value}% off`,
      };
    }

    case 'fixed': {
      const discountAmount = Math.min(discount.value, planPrice);
      return {
        discountAmount,
        finalPrice: planPrice - discountAmount,
        description: `£${discount.value} off`,
      };
    }

    case 'lifetime_fixed': {
      // Specific handling for lifetime plan discounts
      const discountAmount = Math.min(discount.value, planPrice);
      const finalPrice = planPrice - discountAmount;
      return {
        discountAmount,
        finalPrice,
        description: `£${discountAmount} off - Pay only £${finalPrice}`,
      };
    }

    case 'months_free': {
      // For subscription, this means free for X months
      return {
        discountAmount: planPrice * discount.value,
        finalPrice: 0, // First X months free
        description: `${discount.value} months free`,
      };
    }

    case 'trial_extension': {
      return {
        discountAmount: 0,
        finalPrice: planPrice,
        description: `+${discount.value} days trial`,
      };
    }

    default:
      return {
        discountAmount: 0,
        finalPrice: planPrice,
        description: 'Invalid discount type',
      };
  }
};

/**
 * Mark a discount code as used
 */
export const markCodeAsUsed = (code: string): void => {
  const upperCode = code.toUpperCase().trim();
  const discount = DISCOUNT_CODES[upperCode];

  if (discount && discount.usesRemaining !== undefined) {
    discount.usesRemaining = Math.max(0, discount.usesRemaining - 1);

    // In production, this would call an API to persist the change
    console.log(`[DiscountCode] ${code} used. ${discount.usesRemaining} remaining.`);
  }
};

/**
 * Get active promotional code from URL or session
 * Checks for ?promo=CODE in URL or sessionStorage
 */
export const getActivePromoCode = (): string | null => {
  // Check URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  const promoFromUrl = urlParams.get('promo') || urlParams.get('code');

  if (promoFromUrl) {
    // Store in session so it persists during checkout
    sessionStorage.setItem('active_promo_code', promoFromUrl);
    return promoFromUrl;
  }

  // Check session storage
  return sessionStorage.getItem('active_promo_code');
};

/**
 * Clear active promo code from session
 */
export const clearActivePromoCode = (): void => {
  sessionStorage.removeItem('active_promo_code');
};

/**
 * Auto-apply promo code from promotional link
 * Call this on pricing page load
 */
export const autoApplyPromoFromUrl = (): DiscountCode | null => {
  const promoCode = getActivePromoCode();
  if (!promoCode) return null;

  const validation = validateDiscountCode(promoCode);
  if (validation.valid && validation.discount) {
    console.log(`[DiscountCode] Auto-applied: ${promoCode}`);
    return validation.discount;
  }

  // Invalid code, clear it
  clearActivePromoCode();
  return null;
};

/**
 * Generate promotional link with code
 */
export const generatePromoLink = (code: string, baseUrl: string = window.location.origin): string => {
  return `${baseUrl}/pricing?promo=${code.toUpperCase()}`;
};

/**
 * Get all active partner codes
 * Useful for partner dashboard
 */
export const getPartnerCodes = (partnerId?: string): DiscountCode[] => {
  return Object.values(DISCOUNT_CODES).filter(
    (code) =>
      code.enabled &&
      code.source === 'partner_referral' &&
      (!partnerId || code.partnerId === partnerId)
  );
};

/**
 * Create a new discount code (for admin use)
 * In production, this would be an API call
 */
export const createDiscountCode = (discount: DiscountCode): void => {
  DISCOUNT_CODES[discount.code] = discount;
  console.log(`[DiscountCode] Created: ${discount.code}`);

  // In production: POST to /api/discount-codes
};
