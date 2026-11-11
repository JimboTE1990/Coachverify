/**
 * Supabase Edge Function: Confirm a lifetime pre-payment succeeded, then
 * issue a one-time redeemable code. Retrieves the session from Stripe
 * directly rather than relying on a webhook - safe to call more than once
 * (idempotent on stripe_session_id). Public - no JWT required.
 *
 * Endpoint: https://YOUR_PROJECT.supabase.co/functions/v1/confirm-prepayment
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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

async function sendBrevoEmail({ to, subject, html }: { to: string; subject: string; html: string }) {
  const apiKey = Deno.env.get('BREVO_API_KEY');
  if (!apiKey) {
    console.warn('[Supabase Edge] BREVO_API_KEY not set - skipping email send');
    return;
  }
  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'api-key': apiKey,
      'Content-Type': 'application/json',
      'accept': 'application/json',
    },
    body: JSON.stringify({
      sender: {
        name: Deno.env.get('BREVO_SENDER_NAME') || 'CoachDog',
        email: Deno.env.get('BREVO_SENDER_EMAIL'),
      },
      to: [{ email: to }],
      subject,
      htmlContent: html,
    }),
  });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Brevo API error (${response.status}): ${body}`);
  }
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { session_id } = await req.json();
    if (!session_id) {
      return new Response(
        JSON.stringify({ error: 'Missing required field: session_id' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const secretKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!secretKey) throw new Error('STRIPE_SECRET_KEY environment variable is not set');

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !serviceRoleKey) throw new Error('Missing Supabase env vars');
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // Already processed? Return the existing code instead of creating another.
    const { data: existing } = await adminClient
      .from('prepayment_credits')
      .select('promo_code, amount_paid_pence')
      .eq('stripe_session_id', session_id)
      .maybeSingle();
    if (existing) {
      return new Response(
        JSON.stringify({ promoCode: existing.promo_code, amountPaidPence: existing.amount_paid_pence }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const sessionResponse = await fetch(`https://api.stripe.com/v1/checkout/sessions/${session_id}`, {
      headers: { 'Authorization': `Bearer ${secretKey}` },
    });
    if (!sessionResponse.ok) {
      const errorData = await sessionResponse.json();
      throw new Error(errorData.error?.message || 'Failed to retrieve checkout session');
    }
    const session = await sessionResponse.json();

    if (session.payment_status !== 'paid' || session.metadata?.purchaseType !== 'lifetime_prepayment') {
      return new Response(
        JSON.stringify({ error: 'Session is not a paid lifetime pre-payment' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const amountPaidPence = session.amount_total;
    const email = session.metadata.email || session.customer_details?.email;

    const promoCode = 'PREPAID-' + Math.random().toString(36).slice(2, 8).toUpperCase();

    const couponResponse = await fetch('https://api.stripe.com/v1/coupons', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${secretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        'percent_off': '100',
        'duration': 'once',
        'max_redemptions': '1',
        'name': `Pre-payment credit - ${promoCode}`,
      }),
    });
    if (!couponResponse.ok) {
      const errorData = await couponResponse.json();
      throw new Error(errorData.error?.message || 'Failed to create coupon');
    }
    const coupon = await couponResponse.json();

    const promoResponse = await fetch('https://api.stripe.com/v1/promotion_codes', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${secretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        'coupon': coupon.id,
        'code': promoCode,
        'max_redemptions': '1',
      }),
    });
    if (!promoResponse.ok) {
      const errorData = await promoResponse.json();
      throw new Error(errorData.error?.message || 'Failed to create promotion code');
    }
    const promotionCode = await promoResponse.json();

    console.log('[Supabase Edge] Prepayment confirmed, code issued:', { email, promoCode });

    const { error: insertError } = await adminClient.from('prepayment_credits').insert({
      email,
      amount_paid_pence: amountPaidPence,
      stripe_session_id: session.id,
      stripe_payment_intent_id: session.payment_intent,
      stripe_coupon_id: coupon.id,
      stripe_promotion_code_id: promotionCode.id,
      promo_code: promoCode,
    });
    if (insertError) {
      // A concurrent request for the same session_id (e.g. two tabs, a
      // retried request) already won the insert - defer to its code instead
      // of erroring. The coupon/promotion code created above just goes unused.
      if (insertError.code === '23505') {
        const { data: winner } = await adminClient
          .from('prepayment_credits')
          .select('promo_code, amount_paid_pence')
          .eq('stripe_session_id', session.id)
          .maybeSingle();
        if (winner) {
          return new Response(
            JSON.stringify({ promoCode: winner.promo_code, amountPaidPence: winner.amount_paid_pence }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }
      throw insertError;
    }

    try {
      await sendBrevoEmail({
        to: email,
        subject: 'Your CoachDog pre-payment code',
        html: `
          <p>Thanks for pre-paying for your CoachDog Lifetime membership.</p>
          <p>You paid <strong>£${(amountPaidPence / 100).toFixed(2)}</strong>. Save the code below -
          you'll enter it at checkout once you're accredited and sign up, and it will cover
          your Lifetime membership in full.</p>
          <p style="font-size:20px;font-weight:bold;letter-spacing:1px;">${promoCode}</p>
          <p>When you're ready, sign up as normal and enter this code in the
          "Have a discount code?" box at checkout.</p>
        `,
      });
    } catch (emailError) {
      // Non-critical - the code is already generated, stored, and shown on
      // screen regardless of whether the email goes out.
      console.error('[Supabase Edge] Failed to send prepayment confirmation email:', emailError);
    }

    return new Response(
      JSON.stringify({ promoCode, amountPaidPence }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[Supabase Edge] Error confirming prepayment:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Failed to confirm prepayment' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
