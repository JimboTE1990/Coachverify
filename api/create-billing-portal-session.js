/**
 * Vercel Edge Function: Create Stripe Billing Portal Session
 * Endpoint: POST /api/create-billing-portal-session
 *
 * Creates a Stripe Billing Portal session for customers to:
 * - Update payment methods
 * - View invoices
 * - Cancel subscription
 * - Download receipts
 *
 * This is the professional way to handle subscription management
 * (instead of redirecting to Stripe dashboard which requires Stripe account)
 */

export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  // Set CORS headers
  const headers = {
    'Access-Control-Allow-Origin': req.headers.get('origin') || '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers });
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers }
    );
  }

  try {
    // Get environment variable
    const secretKey = process.env.STRIPE_SECRET_KEY;

    console.log('[Billing Portal] Environment check:', {
      hasSecretKey: !!secretKey,
      keyPrefix: secretKey ? secretKey.substring(0, 7) + '...' : 'undefined',
    });

    if (!secretKey) {
      throw new Error('STRIPE_SECRET_KEY environment variable is not set');
    }

    if (!secretKey.startsWith('sk_')) {
      throw new Error('Invalid STRIPE_SECRET_KEY format');
    }

    // Parse request body
    const body = await req.json();
    const { customerId } = body;

    // Validate required field
    if (!customerId) {
      return new Response(
        JSON.stringify({
          error: 'Missing required field: customerId'
        }),
        { status: 400, headers }
      );
    }

    console.log('[Billing Portal] Creating billing portal session for customer:', customerId);

    const appUrl = process.env.VITE_APP_URL || 'https://coachverify.vercel.app';

    // Call Stripe API to create billing portal session
    const stripeResponse = await fetch('https://api.stripe.com/v1/billing_portal/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${secretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        'customer': customerId,
        'return_url': `${appUrl}/for-coaches?tab=subscription`,
      }),
    });

    if (!stripeResponse.ok) {
      const errorData = await stripeResponse.json();
      console.error('[Billing Portal] Error from Stripe API:', errorData);
      throw new Error(errorData.error?.message || 'Failed to create billing portal session');
    }

    const session = await stripeResponse.json();
    console.log('[Billing Portal] Billing portal session created:', session.id);

    return new Response(
      JSON.stringify({
        sessionId: session.id,
        url: session.url,
      }),
      { status: 200, headers }
    );

  } catch (error) {
    console.error('[Billing Portal] Error creating billing portal session:', error);

    return new Response(
      JSON.stringify({
        error: error.message || 'Failed to create billing portal session',
      }),
      { status: 500, headers }
    );
  }
}
