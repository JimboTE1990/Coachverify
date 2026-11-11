/**
 * Supabase Edge Function: Mark a prepayment credit redeemed once the real
 * signup checkout that used it has actually completed. Harmless no-op for
 * every normal (non-prepayment) lifetime purchase, since
 * metadata.prepaymentCode just won't be set. Public - no JWT required.
 *
 * Endpoint: https://YOUR_PROJECT.supabase.co/functions/v1/confirm-redemption
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
    const { session_id } = await req.json();
    if (!session_id) {
      return new Response(
        JSON.stringify({ error: 'Missing required field: session_id' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const secretKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!secretKey) throw new Error('STRIPE_SECRET_KEY environment variable is not set');

    const sessionResponse = await fetch(`https://api.stripe.com/v1/checkout/sessions/${session_id}`, {
      headers: { 'Authorization': `Bearer ${secretKey}` },
    });
    if (!sessionResponse.ok) {
      const errorData = await sessionResponse.json();
      throw new Error(errorData.error?.message || 'Failed to retrieve checkout session');
    }
    const session = await sessionResponse.json();

    const prepaymentCode = session.metadata?.prepaymentCode;
    if (!prepaymentCode || session.payment_status !== 'paid') {
      return new Response(
        JSON.stringify({ ok: true, redeemed: false }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !serviceRoleKey) throw new Error('Missing Supabase env vars');
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const { error } = await adminClient
      .from('prepayment_credits')
      .update({
        redeemed: true,
        redeemed_at: new Date().toISOString(),
        coach_id: session.metadata?.coachId || null,
      })
      .eq('promo_code', prepaymentCode);

    if (error) throw error;

    console.log('[Supabase Edge] Prepayment credit redeemed:', { prepaymentCode, coachId: session.metadata?.coachId });

    return new Response(
      JSON.stringify({ ok: true, redeemed: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[Supabase Edge] Error confirming redemption:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Failed to confirm redemption' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
