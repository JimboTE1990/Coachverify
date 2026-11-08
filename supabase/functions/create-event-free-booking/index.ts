/**
 * Supabase Edge Function: Free Event Ticket Booking
 * Endpoint: https://YOUR_PROJECT.supabase.co/functions/v1/create-event-free-booking
 *
 * Grants a free event ticket to a logged-in coach with an active or lifetime
 * subscription - trial, expired, onboarding, and anonymous visitors are not
 * eligible and must go through the paid Stripe checkout instead. Eligibility
 * is always re-checked here against the database, never trusted from the
 * client.
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
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Auth check - require a valid Supabase JWT for a real logged-in coach
    const supabaseUrl     = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
    const authHeader      = req.headers.get('Authorization');

    if (!supabaseUrl || !supabaseAnonKey) throw new Error('Missing Supabase env vars');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Re-check eligibility server-side - never trust the client's claim.
    // coaches.id is its own PK, distinct from the auth user id - look up by
    // user_id and use the returned id for the event_registrations FK below.
    const { data: coachRow, error: coachError } = await userClient
      .from('coaches')
      .select('id, subscription_status')
      .eq('user_id', user.id)
      .single();

    if (coachError || !coachRow || !['active', 'lifetime'].includes(coachRow.subscription_status)) {
      return new Response(
        JSON.stringify({ error: 'Not eligible for a free ticket' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { campaignId, source } = await req.json();
    if (!campaignId) {
      return new Response(
        JSON.stringify({ error: 'Missing required field: campaignId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Write via service role, same posture as the Stripe webhook
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!serviceRoleKey) throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY');
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const { error: insertError } = await adminClient.from('event_registrations').insert({
      campaign_id: campaignId,
      email: user.email,
      source: source || 'unknown',
      status: 'free',
      coach_id: coachRow.id,
      amount_paid_pence: 0,
      stripe_session_id: null,
      paid_at: new Date().toISOString(),
    });

    // 23505 = unique violation - already claimed this campaign, treat as success
    if (insertError && insertError.code !== '23505') {
      console.error('[create-event-free-booking] Error recording free booking:', insertError);
      throw insertError;
    }

    return new Response(
      JSON.stringify({ ok: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[create-event-free-booking] Error:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Failed to claim free ticket',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
