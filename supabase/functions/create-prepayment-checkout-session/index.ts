/**
 * Supabase Edge Function: Create a Stripe Checkout Session for a lifetime
 * pre-payment (no login, not yet accredited - the coach doesn't have a
 * CoachDog account yet). Public - no JWT required.
 *
 * Endpoint: https://YOUR_PROJECT.supabase.co/functions/v1/create-prepayment-checkout-session
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const ALLOWED_ORIGINS = [
  'https://www.coachdog.co.uk',
  'https://coachdog.co.uk',
  'https://coachverify.vercel.app',
];

function getCorsHeaders(req: Request) {
  const origin = req.headers.get('Origin') ?? '';
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'content-type',
  };
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, discountCode, stripePromotionCodeId } = await req.json();

    console.log('[Supabase Edge] Creating prepayment checkout session:', { email, discountCode });

    if (!email) {
      return new Response(
        JSON.stringify({ error: 'Missing required field: email' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const secretKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!secretKey) throw new Error('STRIPE_SECRET_KEY environment variable is not set');

    const priceId = Deno.env.get('STRIPE_LIFETIME_PRICE_ID');
    if (!priceId) throw new Error('STRIPE_LIFETIME_PRICE_ID environment variable is not set');

    const appUrl = Deno.env.get('APP_URL') || 'https://coachverify.vercel.app';

    const sessionParams: Record<string, string> = {
      'mode': 'payment',
      'line_items[0][price]': priceId,
      'line_items[0][quantity]': '1',
      'success_url': `${appUrl}/partner-prepay?session_id={CHECKOUT_SESSION_ID}&paid=1`,
      'cancel_url': `${appUrl}/partner-prepay`,
      'customer_email': email,
      'metadata[purchaseType]': 'lifetime_prepayment',
      'metadata[email]': email,
    };

    if (stripePromotionCodeId) {
      sessionParams['discounts[0][promotion_code]'] = stripePromotionCodeId;
    }

    const stripeResponse = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${secretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams(sessionParams),
    });

    if (!stripeResponse.ok) {
      const errorData = await stripeResponse.json();
      console.error('[Supabase Edge] Error from Stripe API:', errorData);
      throw new Error(errorData.error?.message || 'Failed to create checkout session');
    }

    const session = await stripeResponse.json();
    console.log('[Supabase Edge] Prepayment checkout session created:', session.id);

    return new Response(
      JSON.stringify({ sessionId: session.id, url: session.url }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[Supabase Edge] Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Failed to create checkout session' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
