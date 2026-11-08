/**
 * Supabase Edge Function: Create Stripe Checkout Session for an event ticket
 * Endpoint: https://YOUR_PROJECT.supabase.co/functions/v1/create-event-checkout-session
 *
 * Public endpoint - event ticket buyers are not logged-in coaches, so unlike
 * create-checkout-session, there is no auth check here.
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
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const secretKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!secretKey) {
      throw new Error('STRIPE_SECRET_KEY environment variable is not set');
    }

    const priceId = Deno.env.get('EVENT_TICKET_PRICE_ID');
    if (!priceId) {
      throw new Error('EVENT_TICKET_PRICE_ID environment variable is not set');
    }

    const { campaignId, source } = await req.json();

    if (!campaignId) {
      return new Response(
        JSON.stringify({ error: 'Missing required field: campaignId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const appUrl = Deno.env.get('APP_URL') || 'https://coachverify.vercel.app';

    const sessionParams: Record<string, string> = {
      'mode': 'payment',
      'line_items[0][price]': priceId,
      'line_items[0][quantity]': '1',
      'success_url': `${appUrl}/events/strategy-not-resolutions/success?session_id={CHECKOUT_SESSION_ID}`,
      'cancel_url': `${appUrl}/events/strategy-not-resolutions`,
      'metadata[purchaseType]': 'event_ticket',
      'metadata[campaignId]': campaignId,
      'metadata[source]': source || 'unknown',
    };

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
      console.error('[create-event-checkout-session] Error from Stripe API:', errorData);
      throw new Error(errorData.error?.message || 'Failed to create checkout session');
    }

    const session = await stripeResponse.json();
    console.log('[create-event-checkout-session] Checkout session created:', session.id);

    return new Response(
      JSON.stringify({ sessionId: session.id, url: session.url }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[create-event-checkout-session] Error:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Failed to create checkout session',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
