/**
 * Stripe Service
 * Handles all Stripe-related operations for payment processing
 */

import { getStripe, STRIPE_PRICES, isStripeConfigured } from '../lib/stripe';

export interface CreateCheckoutSessionParams {
  priceId: string;
  coachId: string;
  coachEmail: string;
  billingCycle: 'monthly' | 'annual' | 'lifetime';
  trialEndsAt?: string;
  discountCode?: string; // Raw code string (for display/logging)
  stripePromotionCodeId?: string; // Stripe promo code ID (e.g. promo_xxx) to apply at checkout
}

/**
 * Create a Stripe Checkout Session
 * Calls the Vercel serverless function to create a Stripe session securely
 */
export const createCheckoutSession = async (params: CreateCheckoutSessionParams): Promise<void> => {
  const { priceId, coachId, coachEmail, billingCycle, trialEndsAt, discountCode, stripePromotionCodeId } = params;

  console.log('[StripeService] Creating checkout session:', {
    priceId,
    coachId,
    coachEmail,
    billingCycle,
    hasTrialEndsAt: !!trialEndsAt,
    discountCode: discountCode || 'none',
    hasPromoCode: !!stripePromotionCodeId,
  });

  try {
    // Call backend API to create Stripe session
    // In development, use localhost:3001 (dev-server.js)
    // In production, use Supabase Edge Function
    const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const apiUrl = isDevelopment
      ? 'http://localhost:3001/api'
      : 'https://whhwvuugrzbyvobwfmce.supabase.co/functions/v1';

    console.log('[StripeService] API URL:', apiUrl);

    const response = await fetch(`${apiUrl}/create-checkout-session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        priceId,
        coachId,
        coachEmail,
        billingCycle,
        trialEndsAt,
        discountCode,
        stripePromotionCodeId, // Pass Stripe promo code ID to apply at checkout
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to create checkout session');
    }

    const { url } = await response.json();

    if (!url) {
      throw new Error('No checkout URL returned from server');
    }

    console.log('[StripeService] Redirecting to Stripe Checkout:', url);

    // Redirect to Stripe hosted checkout page
    window.location.href = url;

  } catch (error: any) {
    console.error('[StripeService] Error:', error);
    throw new Error(error.message || 'Failed to initiate checkout. Please try again.');
  }
};

/**
 * Get the Price ID for a billing cycle
 */
export const getPriceId = (billingCycle: 'monthly' | 'annual' | 'lifetime'): string => {
  const priceId = billingCycle === 'monthly'
    ? STRIPE_PRICES.monthly
    : billingCycle === 'annual'
    ? STRIPE_PRICES.annual
    : STRIPE_PRICES.lifetime;

  if (!priceId) {
    throw new Error(`Price ID not configured for ${billingCycle} billing cycle`);
  }

  return priceId;
};

/**
 * Create a Stripe Billing Portal Session
 * This allows customers to manage their subscription, payment methods, and view invoices
 * WITHOUT needing a Stripe account - professional UX like Netflix, Spotify, etc.
 */
export const createBillingPortalSession = async (customerId: string): Promise<void> => {
  console.log('[StripeService] Creating billing portal session for customer:', customerId);

  try {
    // Call backend API to create billing portal session
    const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const apiUrl = isDevelopment
      ? 'http://localhost:3001/api'
      : 'https://whhwvuugrzbyvobwfmce.supabase.co/functions/v1';

    console.log('[StripeService] API URL:', apiUrl);

    const response = await fetch(`${apiUrl}/create-billing-portal-session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        customerId,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to create billing portal session');
    }

    const { url } = await response.json();

    if (!url) {
      throw new Error('No billing portal URL returned from server');
    }

    console.log('[StripeService] Redirecting to Stripe Billing Portal:', url);

    // Redirect to Stripe hosted billing portal page
    window.location.href = url;

  } catch (error: any) {
    console.error('[StripeService] Error:', error);
    throw new Error(error.message || 'Failed to open billing portal. Please try again.');
  }
};

/**
 * Verify Stripe configuration on app load
 */
export const verifyStripeConfiguration = (): { configured: boolean; message?: string } => {
  if (!isStripeConfigured()) {
    return {
      configured: false,
      message: 'Stripe is not configured. Missing publishable key or price IDs in environment variables.'
    };
  }

  return { configured: true };
};
