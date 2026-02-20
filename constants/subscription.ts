/**
 * Subscription & Billing Constants
 * Single source of truth for all subscription-related values
 */

export const SUBSCRIPTION_CONSTANTS = {
  // Trial Configuration
  TRIAL_DURATION_DAYS: 30,
  TRIAL_WARNING_DAYS: [7, 3, 1], // Show warnings at these day marks

  // Pricing (GBP)
  MONTHLY_PRICE_GBP: 15,
  ANNUAL_PRICE_GBP: 150,
  ANNUAL_SAVINGS_PERCENT: 17, // (15*12 - 150) / (15*12) * 100

  // Lifetime plan
  LIFETIME_PRICE_GBP: 149,
  LIFETIME_STRIPE_PRICE_ID: 'price_1QsEv5DbNBAbZyioZRzvMzJo', // Stripe production price ID

  // Billing
  BILLING_GRACE_PERIOD_DAYS: 3, // Days after payment failure before expiry

  // Feature Limits (for future tiered features)
  MAX_PROFILE_PHOTOS_TRIAL: 5,
  MAX_PROFILE_PHOTOS_PAID: 20,
} as const;

// Derived constants
export const TRIAL_DURATION_MS = SUBSCRIPTION_CONSTANTS.TRIAL_DURATION_DAYS * 24 * 60 * 60 * 1000;
export const GRACE_PERIOD_MS = SUBSCRIPTION_CONSTANTS.BILLING_GRACE_PERIOD_DAYS * 24 * 60 * 60 * 1000;

// Subscription status types (exported for reuse)
export type SubscriptionStatus = 'active' | 'trial' | 'expired' | 'onboarding' | 'lifetime';
export type BillingCycle = 'monthly' | 'annual' | 'lifetime';

// Cancellation reasons (for dropdown in cancellation modal)
export const CANCELLATION_REASONS = [
  { value: 'too_expensive', label: 'Too expensive' },
  { value: 'not_enough_clients', label: 'Not getting enough clients' },
  { value: 'switching_platform', label: 'Switching to another platform' },
  { value: 'technical_issues', label: 'Technical issues' },
  { value: 'no_longer_coaching', label: 'No longer coaching' },
  { value: 'other', label: 'Other reason' },
] as const;

// Helper functions for subscription calculations
export const calculateTrialEndDate = (startDate: Date = new Date()): Date => {
  return new Date(startDate.getTime() + TRIAL_DURATION_MS);
};

export const calculateDaysRemaining = (endDate: string | Date): number => {
  const end = typeof endDate === 'string' ? new Date(endDate) : endDate;
  const now = new Date();
  const diffMs = end.getTime() - now.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
};

export const shouldShowTrialWarning = (daysRemaining: number): boolean => {
  return SUBSCRIPTION_CONSTANTS.TRIAL_WARNING_DAYS.includes(daysRemaining);
};

export const getTrialWarningLevel = (daysRemaining: number): 'info' | 'warning' | 'urgent' | 'none' => {
  if (daysRemaining <= 0) return 'none';
  if (daysRemaining === 1) return 'urgent';
  if (daysRemaining === 3) return 'warning';
  if (daysRemaining === 7) return 'info';
  return 'none';
};

export const formatPrice = (amount: number, currency: string = 'GBP'): string => {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency,
  }).format(amount);
};

export const calculateAnnualSavings = (): number => {
  const monthlyYearlyCost = SUBSCRIPTION_CONSTANTS.MONTHLY_PRICE_GBP * 12;
  return monthlyYearlyCost - SUBSCRIPTION_CONSTANTS.ANNUAL_PRICE_GBP;
};
