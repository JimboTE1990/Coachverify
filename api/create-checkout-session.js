/**
 * Vercel Edge Function: Create Stripe Checkout Session
 * Endpoint: POST /api/create-checkout-session
 *
 * Using Edge Runtime for better environment variable support
 * Updated: 2024-12-28 - Migrated to Edge Runtime
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

    console.log('[Stripe Edge] Environment check:', {
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
    const { priceId, coachId, coachEmail, billingCycle, trialEndsAt, stripePromotionCodeId } = body;

    // Validate required fields
    if (!priceId || !coachId || !coachEmail || !billingCycle) {
      return new Response(
        JSON.stringify({
          error: 'Missing required fields: priceId, coachId, coachEmail, billingCycle'
        }),
        { status: 400, headers }
      );
    }

    console.log('[Stripe Edge] Creating checkout session:', {
      priceId,
      coachId,
      billingCycle,
      hasTrialEndsAt: !!trialEndsAt,
      hasPromoCode: !!stripePromotionCodeId,
    });

    const appUrl = process.env.VITE_APP_URL || 'https://coachverify.vercel.app';

    // Determine mode based on billing cycle
    const isLifetime = billingCycle === 'lifetime';
    const mode = isLifetime ? 'payment' : 'subscription';

    // Prepare checkout session parameters
    const sessionParams = {
      mode: mode,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${appUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/checkout/${billingCycle}`,
      client_reference_id: coachId,
      customer_email: coachEmail,
      metadata: {
        coachId: coachId,
        billingCycle: billingCycle,
      },
    };

    // Only add subscription_data for recurring subscriptions (not lifetime)
    if (!isLifetime) {
      sessionParams.subscription_data = {
        metadata: {
          coachId: coachId,
          billingCycle: billingCycle,
          trialEndsAt: trialEndsAt || 'none',
        },
      };
    }

    // If user has an active trial, set subscription to start at trial end
    // Only applicable for recurring subscriptions (not lifetime)
    if (trialEndsAt && !isLifetime) {
      const trialEndDate = new Date(trialEndsAt);
      const now = new Date();

      if (trialEndDate > now) {
        const trialEndTimestamp = Math.floor(trialEndDate.getTime() / 1000);
        // Use trial_end (not billing_cycle_anchor) to continue existing trial
        sessionParams.subscription_data.trial_end = trialEndTimestamp;

        console.log('[Stripe Edge] Trial continues until:', trialEndDate.toISOString());
      }
    }

    // Build request body based on mode
    const requestBody = {
      'mode': sessionParams.mode,
      'line_items[0][price]': sessionParams.line_items[0].price,
      'line_items[0][quantity]': sessionParams.line_items[0].quantity,
      'success_url': sessionParams.success_url,
      'cancel_url': sessionParams.cancel_url,
      'client_reference_id': sessionParams.client_reference_id,
      'customer_email': sessionParams.customer_email,
      'metadata[coachId]': sessionParams.metadata.coachId,
      'metadata[billingCycle]': sessionParams.metadata.billingCycle,
    };

    // Only add subscription-specific parameters for recurring plans
    if (!isLifetime && sessionParams.subscription_data) {
      requestBody['subscription_data[metadata][coachId]'] = sessionParams.subscription_data.metadata.coachId;
      requestBody['subscription_data[metadata][billingCycle]'] = sessionParams.subscription_data.metadata.billingCycle;
      requestBody['subscription_data[metadata][trialEndsAt]'] = sessionParams.subscription_data.metadata.trialEndsAt;

      // Add trial_end if present
      if (sessionParams.subscription_data.trial_end) {
        requestBody['subscription_data[trial_end]'] = sessionParams.subscription_data.trial_end;
      }
    }

    // Apply Stripe promotion code if provided
    if (stripePromotionCodeId) {
      requestBody['discounts[0][promotion_code]'] = stripePromotionCodeId;
    }

    // Call Stripe API directly via fetch (Edge Runtime doesn't support npm packages)
    const stripeResponse = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${secretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams(requestBody),
    });

    if (!stripeResponse.ok) {
      const errorData = await stripeResponse.json();
      console.error('[Stripe Edge] Error from Stripe API:', errorData);
      throw new Error(errorData.error?.message || 'Failed to create checkout session');
    }

    const session = await stripeResponse.json();
    console.log('[Stripe Edge] Checkout session created:', session.id);

    return new Response(
      JSON.stringify({
        sessionId: session.id,
        url: session.url,
      }),
      { status: 200, headers }
    );

  } catch (error) {
    console.error('[Stripe Edge] Error creating checkout session:', error);

    return new Response(
      JSON.stringify({
        error: error.message || 'Failed to create checkout session',
      }),
      { status: 500, headers }
    );
  }
}
