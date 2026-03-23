/**
 * Supabase Edge Function: Stripe Webhook Handler
 * Handles Stripe webhook events to update subscription status
 *
 * Webhook events handled:
 * - checkout.session.completed: When payment succeeds (both subscription and one-time)
 * - customer.subscription.updated: When subscription changes
 * - customer.subscription.deleted: When subscription is cancelled
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// CORS headers for webhook responses
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
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
  };
}

const STRIPE_WEBHOOK_SECRET = Deno.env.get('STRIPE_WEBHOOK_SECRET');
const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get Stripe signature from headers
    const signature = req.headers.get('stripe-signature');
    if (!signature) {
      return new Response(JSON.stringify({ error: 'No signature' }), { status: 400 });
    }

    if (!STRIPE_WEBHOOK_SECRET) {
      console.error('[Stripe Webhook] STRIPE_WEBHOOK_SECRET is not set');
      return new Response(JSON.stringify({ error: 'Webhook secret not configured' }), { status: 500 });
    }

    // Get raw body for signature verification
    const body = await req.text();

    // Verify webhook signature using HMAC-SHA256
    const event = await verifyStripeSignature(body, signature, STRIPE_WEBHOOK_SECRET);

    console.log('[Stripe Webhook] Event received:', event.type);

    // Create Supabase client with service role (bypass RLS)
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object, supabase);
        break;

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object, supabase);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object, supabase);
        break;

      default:
        console.log('[Stripe Webhook] Unhandled event type:', event.type);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('[Stripe Webhook] Error:', error);
    return new Response(
      JSON.stringify({ error: 'Webhook processing failed' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function verifyStripeSignature(body: string, signature: string, secret: string) {
  // Parse the stripe-signature header: t=<timestamp>,v1=<sig>[,v1=<sig>...]
  const parts = signature.split(',');
  let timestamp: string | null = null;
  const v1Signatures: string[] = [];

  for (const part of parts) {
    const [key, value] = part.split('=');
    if (key === 't') timestamp = value;
    if (key === 'v1') v1Signatures.push(value);
  }

  if (!timestamp || v1Signatures.length === 0) {
    throw new Error('Invalid stripe-signature header format');
  }

  // Reject webhooks older than 24 hours — prevents replay attacks while allowing
  // Stripe's retry schedule (retries reuse the original timestamp, up to 3 days)
  const ageSeconds = Math.floor(Date.now() / 1000) - parseInt(timestamp, 10);
  if (ageSeconds > 86400) {
    throw new Error('Webhook timestamp too old — possible replay attack');
  }

  // Compute HMAC-SHA256 of "<timestamp>.<body>" using the webhook secret
  const signedPayload = `${timestamp}.${body}`;
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signatureBytes = await crypto.subtle.sign(
    'HMAC',
    cryptoKey,
    new TextEncoder().encode(signedPayload)
  );
  const expectedSig = Array.from(new Uint8Array(signatureBytes))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  // Stripe may rotate secrets — check all v1 signatures provided
  const isValid = v1Signatures.some(sig => sig === expectedSig);
  if (!isValid) {
    throw new Error('Webhook signature verification failed');
  }

  return JSON.parse(body);
}

async function handleCheckoutCompleted(session: any, supabase: any) {
  console.log('[Webhook] Checkout completed:', session.id);

  const coachId = session.client_reference_id || session.metadata?.coachId;
  const billingCycle = session.metadata?.billingCycle;

  if (!coachId) {
    console.error('[Webhook] No coachId in session');
    return;
  }

  console.log('[Webhook] Processing payment for coach:', coachId, 'billing cycle:', billingCycle);

  // Determine subscription status based on billing cycle
  const isLifetime = billingCycle === 'lifetime';
  const subscriptionStatus = isLifetime ? 'lifetime' : 'active';

  // Update coach profile
  const { error } = await supabase
    .from('coaches')
    .update({
      subscription_status: subscriptionStatus,
      billing_cycle: billingCycle,
      stripe_customer_id: session.customer,
      stripe_subscription_id: isLifetime ? null : session.subscription,
      subscription_ends_at: null, // Lifetime never expires, active will be managed by subscription events
      trial_ends_at: null, // Clear trial when they subscribe
    })
    .eq('id', coachId);

  if (error) {
    console.error('[Webhook] Error updating coach:', error);
    throw error;
  }

  console.log('[Webhook] Successfully updated coach subscription:', {
    coachId,
    status: subscriptionStatus,
    billingCycle,
  });
}

async function handleSubscriptionUpdated(subscription: any, supabase: any) {
  console.log('[Webhook] Subscription updated:', subscription.id);

  const coachId = subscription.metadata?.coachId;
  if (!coachId) {
    console.error('[Webhook] No coachId in subscription metadata');
    return;
  }

  // Determine status based on Stripe subscription status
  let subscriptionStatus = 'active';
  if (subscription.status === 'canceled' || subscription.status === 'unpaid') {
    subscriptionStatus = 'expired';
  } else if (subscription.status === 'trialing') {
    subscriptionStatus = 'trial';
  }

  const { error } = await supabase
    .from('coaches')
    .update({
      subscription_status: subscriptionStatus,
      stripe_subscription_id: subscription.id,
      subscription_ends_at: subscription.current_period_end
        ? new Date(subscription.current_period_end * 1000).toISOString()
        : null,
    })
    .eq('id', coachId);

  if (error) {
    console.error('[Webhook] Error updating subscription:', error);
    throw error;
  }

  console.log('[Webhook] Subscription updated successfully');
}

async function handleSubscriptionDeleted(subscription: any, supabase: any) {
  console.log('[Webhook] Subscription deleted:', subscription.id);

  const coachId = subscription.metadata?.coachId;
  if (!coachId) {
    console.error('[Webhook] No coachId in subscription metadata');
    return;
  }

  const { error } = await supabase
    .from('coaches')
    .update({
      subscription_status: 'expired',
      subscription_ends_at: new Date().toISOString(),
    })
    .eq('id', coachId);

  if (error) {
    console.error('[Webhook] Error handling deletion:', error);
    throw error;
  }

  console.log('[Webhook] Subscription marked as expired');
}
