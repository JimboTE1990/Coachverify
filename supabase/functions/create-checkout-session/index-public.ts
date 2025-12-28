/**
 * Supabase Edge Function: Create Stripe Checkout Session (PUBLIC)
 *
 * IMPORTANT: This version works without JWT authentication
 *
 * To deploy:
 * 1. Copy this entire file
 * 2. In Supabase Dashboard → Edge Functions → create-checkout-session
 * 3. Replace the existing code with this version
 * 4. Click "Deploy"
 *
 * Environment variables needed:
 * - STRIPE_SECRET_KEY: Your Stripe secret key (starts with sk_test_...)
 * - APP_URL: https://coachverify.vercel.app
 */

// Import Supabase client for manual CORS handling
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight - CRITICAL for browser requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      status: 200,
      headers: corsHeaders
    });
  }

  // Only allow POST
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }

  try {
    // Get environment variables
    const secretKey = Deno.env.get('STRIPE_SECRET_KEY');
    const appUrl = Deno.env.get('APP_URL') || 'https://coachverify.vercel.app';

    console.log('[Supabase Edge] Environment check:', {
      hasSecretKey: !!secretKey,
      appUrl,
    });

    if (!secretKey) {
      throw new Error('STRIPE_SECRET_KEY environment variable is not set');
    }

    if (!secretKey.startsWith('sk_')) {
      throw new Error('Invalid STRIPE_SECRET_KEY format');
    }

    // Parse request body
    const body = await req.json();
    const { priceId, coachId, coachEmail, billingCycle, trialEndsAt } = body;

    console.log('[Supabase Edge] Request received:', {
      priceId,
      coachId,
      billingCycle,
      hasTrialEndsAt: !!trialEndsAt,
    });

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

    // Build Stripe checkout session parameters
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

    // Handle trial billing anchor if provided
    if (trialEndsAt) {
      const trialEndDate = new Date(trialEndsAt);
      const now = new Date();

      if (trialEndDate > now) {
        const billingCycleAnchor = Math.floor(trialEndDate.getTime() / 1000);
        sessionParams['subscription_data[billing_cycle_anchor]'] = billingCycleAnchor.toString();
        sessionParams['subscription_data[trial_end]'] = billingCycleAnchor.toString();

        console.log('[Supabase Edge] Trial billing set:', {
          trialEndsAt: trialEndDate.toISOString(),
          billingCycleAnchor,
        });
      }
    }

    console.log('[Supabase Edge] Calling Stripe API...');

    // Call Stripe Checkout API
    const stripeResponse = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${secretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams(sessionParams),
    });

    if (!stripeResponse.ok) {
      const errorText = await stripeResponse.text();
      console.error('[Supabase Edge] Stripe API error:', {
        status: stripeResponse.status,
        statusText: stripeResponse.statusText,
        body: errorText,
      });

      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { error: { message: errorText } };
      }

      throw new Error(errorData.error?.message || 'Stripe API request failed');
    }

    const session = await stripeResponse.json();

    console.log('[Supabase Edge] Success! Session created:', {
      sessionId: session.id,
      url: session.url,
    });

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
