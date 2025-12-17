/**
 * Stripe Configuration
 * Initializes Stripe.js for client-side payment processing
 */

import { loadStripe, Stripe } from '@stripe/stripe-js';

// Get publishable key from environment variables
const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

if (!stripePublishableKey) {
  console.warn('[Stripe] VITE_STRIPE_PUBLISHABLE_KEY not found in environment variables');
  console.warn('[Stripe] Payment processing will not work until you add your Stripe keys');
}

// Singleton pattern - only load Stripe once
let stripePromise: Promise<Stripe | null> | null = null;

/**
 * Get Stripe instance (lazy loaded)
 * @returns Promise resolving to Stripe instance or null if key is missing
 */
export const getStripe = (): Promise<Stripe | null> => {
  if (!stripePromise) {
    if (!stripePublishableKey) {
      console.error('[Stripe] Cannot initialize Stripe without publishable key');
      return Promise.resolve(null);
    }
    stripePromise = loadStripe(stripePublishableKey);
  }
  return stripePromise;
};

/**
 * Stripe Product Price IDs (from environment)
 */
export const STRIPE_PRICES = {
  monthly: import.meta.env.VITE_STRIPE_MONTHLY_PRICE_ID || '',
  annual: import.meta.env.VITE_STRIPE_ANNUAL_PRICE_ID || ''
};

/**
 * Check if Stripe is properly configured
 */
export const isStripeConfigured = (): boolean => {
  return !!(
    stripePublishableKey &&
    STRIPE_PRICES.monthly &&
    STRIPE_PRICES.annual
  );
};
