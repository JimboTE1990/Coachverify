/**
 * Supabase Edge Function: Check whether a typed code is an unredeemed
 * prepayment credit - returns a DiscountCode-shaped payload so it drops into
 * the checkout page's existing discount logic unchanged. Public - no JWT
 * required.
 *
 * Endpoint: https://YOUR_PROJECT.supabase.co/functions/v1/validate-prepayment-code
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

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { code } = await req.json();
    if (!code) {
      return new Response(
        JSON.stringify({ valid: false }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !serviceRoleKey) throw new Error('Missing Supabase env vars');
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const { data } = await adminClient
      .from('prepayment_credits')
      .select('amount_paid_pence, stripe_promotion_code_id')
      .eq('promo_code', code.toUpperCase().trim())
      .eq('redeemed', false)
      .maybeSingle();

    if (!data) {
      return new Response(
        JSON.stringify({ valid: false }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // The underlying Stripe coupon is always percent_off:100 (see
    // confirm-prepayment) - once pre-paid, redemption is always free,
    // regardless of what was actually paid upfront (e.g. a discount code
    // applied at pre-pay time). Must match that here or the displayed total
    // is wrong even though the real Stripe charge would still be £0.
    return new Response(
      JSON.stringify({
        valid: true,
        discount: {
          code: code.toUpperCase().trim(),
          type: 'percentage',
          value: 100,
          enabled: true,
          planRestrictions: ['lifetime'],
          displayName: 'Pre-payment credit',
          description: `Already paid £${(data.amount_paid_pence / 100).toFixed(2)} - fully covered`,
          stripePromotionCodeId: data.stripe_promotion_code_id,
        },
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[Supabase Edge] Error validating prepayment code:', error);
    return new Response(
      JSON.stringify({ valid: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
