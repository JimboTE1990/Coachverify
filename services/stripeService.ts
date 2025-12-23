/**
 * Stripe Service
 * Handles all Stripe-related operations for payment processing
 */

import { getStripe, STRIPE_PRICES, isStripeConfigured } from '../lib/stripe';

export interface CreateCheckoutSessionParams {
  priceId: string;
  coachId: string;
  coachEmail: string;
  billingCycle: 'monthly' | 'annual';
  trialEndsAt?: string;
}

/**
 * Create a Stripe Checkout Session
 * Calls the Vercel serverless function to create a Stripe session securely
 */
export const createCheckoutSession = async (params: CreateCheckoutSessionParams): Promise<void> => {
  const { priceId, coachId, coachEmail, billingCycle, trialEndsAt } = params;

  console.log('[StripeService] Creating checkout session:', {
    priceId,
    coachId,
    coachEmail,
    billingCycle,
    hasTrialEndsAt: !!trialEndsAt
  });

  try {
    // Call backend API to create Stripe session
    // In development, use localhost:3001 (dev-server.js)
    // In production, use same origin (Vercel serverless function)
    const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const apiUrl = isDevelopment ? 'http://localhost:3001' : (import.meta.env.VITE_APP_URL || window.location.origin);

    console.log('[StripeService] API URL:', apiUrl);

    const response = await fetch(`${apiUrl}/api/create-checkout-session`, {
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
export const getPriceId = (billingCycle: 'monthly' | 'annual'): string => {
  const priceId = billingCycle === 'monthly' ? STRIPE_PRICES.monthly : STRIPE_PRICES.annual;

  if (!priceId) {
    throw new Error(`Price ID not configured for ${billingCycle} billing cycle`);
  }

  return priceId;
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
