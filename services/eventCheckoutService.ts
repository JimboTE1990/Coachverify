/**
 * Event Checkout Service
 * Creates Stripe Checkout Sessions for one-off event ticket purchases.
 *
 * Public endpoint - event ticket buyers are not logged-in coaches, so unlike
 * stripeService.ts's createCheckoutSession, no Supabase JWT is attached.
 */

export interface CreateEventCheckoutSessionParams {
  campaignId: string;
  source: string;
}

export const createEventCheckoutSession = async (params: CreateEventCheckoutSessionParams): Promise<void> => {
  const { campaignId, source } = params;

  const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  const apiUrl = isDevelopment
    ? 'http://localhost:3001/api'
    : 'https://whhwvuugrzbyvobwfmce.supabase.co/functions/v1';

  const response = await fetch(`${apiUrl}/create-event-checkout-session`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ campaignId, source }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to create checkout session');
  }

  const { url } = await response.json();

  if (!url) {
    throw new Error('No checkout URL returned from server');
  }

  window.location.href = url;
};
