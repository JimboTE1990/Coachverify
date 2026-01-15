/**
 * Centralized Pricing Configuration
 * Update prices here and they'll reflect everywhere in the app
 */

export interface PricingPlan {
  id: 'monthly' | 'annual';
  name: string;
  price: number;
  currency: string;
  currencySymbol: string;
  billingPeriod: 'month' | 'year';
  savings?: string; // e.g., "17%"
  popular?: boolean;
}

export interface PromotionalOffer {
  enabled: boolean;
  title?: string;
  description?: string;
  discount?: string; // e.g., "50% off"
  badge?: string; // e.g., "Limited Time"
  expiryDate?: string; // ISO date string
  customMessage?: string;
}

export const PRICING_CONFIG = {
  plans: {
    monthly: {
      id: 'monthly',
      name: 'Monthly',
      price: 15,
      currency: 'GBP',
      currencySymbol: '£',
      billingPeriod: 'month',
    } as PricingPlan,
    annual: {
      id: 'annual',
      name: 'Annual',
      price: 150,
      currency: 'GBP',
      currencySymbol: '£',
      billingPeriod: 'year',
      savings: '17%',
      popular: true,
    } as PricingPlan,
  },

  // Current promotional offer (if any)
  promotionalOffer: {
    enabled: false,
    // Uncomment and customize for future offers:
    // title: '🎉 New Year Special',
    // description: 'Get 50% off your first 3 months',
    // discount: '50% off',
    // badge: 'Limited Time',
    // expiryDate: '2026-02-01',
    // customMessage: 'Lock in this rate before February 1st!',
  } as PromotionalOffer,
};

/**
 * Get the starting price for display (lowest monthly price)
 */
export const getStartingPrice = (): string => {
  const monthlyPrice = PRICING_CONFIG.plans.monthly.price;
  const symbol = PRICING_CONFIG.plans.monthly.currencySymbol;
  return `${symbol}${monthlyPrice}`;
};

/**
 * Get the promotional message if active
 */
export const getPromotionalMessage = (): string | null => {
  const promo = PRICING_CONFIG.promotionalOffer;
  if (!promo.enabled) return null;

  if (promo.customMessage) return promo.customMessage;
  if (promo.discount) return `${promo.discount} - ${promo.description || 'Limited time offer'}`;
  return promo.description || null;
};

/**
 * Check if promotional offer is still valid
 */
export const isPromotionActive = (): boolean => {
  const promo = PRICING_CONFIG.promotionalOffer;
  if (!promo.enabled) return false;
  if (!promo.expiryDate) return true;

  const expiryDate = new Date(promo.expiryDate);
  const today = new Date();
  return today < expiryDate;
};

/**
 * Get the promotional badge text
 */
export const getPromotionalBadge = (): string | null => {
  const promo = PRICING_CONFIG.promotionalOffer;
  if (!promo.enabled || !isPromotionActive()) return null;
  return promo.badge || null;
};

/**
 * Get the pricing message for CTAs
 * Returns promotional message if active, otherwise standard pricing
 */
export const getCTAPricingMessage = (): string => {
  if (isPromotionActive()) {
    const promoMessage = getPromotionalMessage();
    if (promoMessage) return promoMessage;
  }

  const startingPrice = getStartingPrice();
  return `From ${startingPrice}/month • Lock in your rate today`;
};
