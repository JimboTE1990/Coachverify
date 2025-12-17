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
 * Redirects user to Stripe's hosted checkout page
 */
export const createCheckoutSession = async (params: CreateCheckoutSessionParams): Promise<void> => {
  const { priceId, coachId, coachEmail, billingCycle, trialEndsAt } = params;

  // Check if Stripe is properly configured
  if (!isStripeConfigured()) {
    throw new Error('Stripe is not properly configured. Please check your environment variables.');
  }

  const stripe = await getStripe();
  if (!stripe) {
    throw new Error('Failed to load Stripe. Please refresh the page and try again.');
  }

  const appUrl = import.meta.env.VITE_APP_URL || window.location.origin;

  console.log('[StripeService] Creating checkout session:', {
    priceId,
    coachId,
    billingCycle,
    hasTrialEndsAt: !!trialEndsAt
  });

  // Prepare checkout session parameters
  const checkoutParams: any = {
    mode: 'subscription',
    lineItems: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    successUrl: `${appUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancelUrl: `${appUrl}/checkout/${billingCycle}`,
    clientReferenceId: coachId, // Used to identify the coach in webhook
    customerEmail: coachEmail,
    subscriptionData: {
      metadata: {
        coachId: coachId,
        billingCycle: billingCycle,
        trialEndsAt: trialEndsAt || 'none',
      },
    },
  };

  // If user has an active trial, set subscription to start at trial end
  if (trialEndsAt) {
    const trialEndDate = new Date(trialEndsAt);
    const now = new Date();

    // Only set billing cycle anchor if trial hasn't ended yet
    if (trialEndDate > now) {
      // Convert to Unix timestamp (Stripe expects seconds, not milliseconds)
      const billingCycleAnchor = Math.floor(trialEndDate.getTime() / 1000);

      checkoutParams.subscriptionData.billing_cycle_anchor = billingCycleAnchor;
      checkoutParams.subscriptionData.trial_end = billingCycleAnchor;

      console.log('[StripeService] Trial ends at:', trialEndDate.toISOString());
      console.log('[StripeService] Billing will start on:', trialEndDate.toDateString());
    }
  }

  try {
    // Redirect to Stripe Checkout
    const { error } = await stripe.redirectToCheckout(checkoutParams);

    if (error) {
      console.error('[StripeService] Checkout error:', error);
      throw new Error(error.message || 'Failed to initiate checkout. Please try again.');
    }
  } catch (err: any) {
    console.error('[StripeService] Unexpected error:', err);
    throw new Error(err.message || 'An unexpected error occurred. Please try again.');
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
