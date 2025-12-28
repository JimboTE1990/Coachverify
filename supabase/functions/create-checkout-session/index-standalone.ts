/**
 * Supabase Edge Function: Create Stripe Checkout Session
 *
 * COPY THIS ENTIRE FILE into Supabase Dashboard → Edge Functions → Create Function
 *
 * Function name: create-checkout-session
 *
 * Environment variables to set in Supabase:
 * - STRIPE_SECRET_KEY: Your Stripe secret key from .env file (starts with sk_test_...)
 * - APP_URL: https://coachverify.vercel.app
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get Stripe secret key from environment
    const secretKey = Deno.env.get('STRIPE_SECRET_KEY');

    if (!secretKey) {
      throw new Error('STRIPE_SECRET_KEY environment variable is not set');
    }

    if (!secretKey.startsWith('sk_')) {
      throw new Error('Invalid STRIPE_SECRET_KEY format');
    }

    // Parse request body
    const { priceId, coachId, coachEmail, billingCycle, trialEndsAt } = await req.json();

    // Validate required fields
    if (!priceId || !coachId || !coachEmail || !billingCycle) {
      return new Response(
        JSON.stringify({
          error: 'Missing required fields: priceId, coachId, coachEmail, billingCycle'
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('[Supabase Edge] Creating checkout session:', {
      priceId,
      coachId,
      billingCycle,
      hasTrialEndsAt: !!trialEndsAt
    });

    // Get app URL from environment or use production default
    const appUrl = Deno.env.get('APP_URL') || 'https://coachverify.vercel.app';

    // Prepare checkout session parameters
    const sessionParams: Record<string, string> = {
      'mode': 'subscription',
      'line_items[0][price]': priceId,
      'line_items[0][quantity]': '1',
      'success_url': `${appUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      'cancel_url': `${appUrl}/checkout/${billingCycle}`,
      'client_reference_id': coachId,
      'customer_email': coachEmail,
      'subscription_data[metadata][coachId]': coachId,
      'subscription_data[metadata][billingCycle]': billingCycle,
      'subscription_data[metadata][trialEndsAt]': trialEndsAt || 'none',
      'metadata[coachId]': coachId,
      'metadata[billingCycle]': billingCycle,
    };

    // If user has an active trial, set subscription to start at trial end
    if (trialEndsAt) {
      const trialEndDate = new Date(trialEndsAt);
      const now = new Date();

      if (trialEndDate > now) {
        const billingCycleAnchor = Math.floor(trialEndDate.getTime() / 1000);
        sessionParams['subscription_data[billing_cycle_anchor]'] = billingCycleAnchor.toString();
        sessionParams['subscription_data[trial_end]'] = billingCycleAnchor.toString();

        console.log('[Supabase Edge] Trial ends at:', trialEndDate.toISOString());
      }
    }

    // Call Stripe API
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
    console.log('[Supabase Edge] Checkout session created:', session.id);

    return new Response(
      JSON.stringify({
        sessionId: session.id,
        url: session.url,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('[Supabase Edge] Error:', error);

    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Failed to create checkout session',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
