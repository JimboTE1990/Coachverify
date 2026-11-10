/**
 * Supabase Edge Function: health-check-lead-intake
 * Endpoint: https://YOUR_PROJECT.supabase.co/functions/v1/health-check-lead-intake
 *
 * Public endpoint - receives a completed Coach Business Health Check lead
 * (public/resources/health-check.html's CDHC_CONFIG.onLead) and records it
 * via service role. No login required; anyone taking the quiz is anonymous.
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const ALLOWED_ORIGINS = [
  'https://www.coachdog.co.uk',
  'https://coachdog.co.uk',
  'https://coachverify.vercel.app',
  'http://localhost:3000',
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
    const body = await req.json();
    const { firstName, email, marketingOptIn, archetype, stickingPoint, stage, overall, areas, sides, completedAt, source } = body;

    if (!email) {
      return new Response(
        JSON.stringify({ error: 'Missing required field: email' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const { error } = await adminClient.from('health_check_leads').insert({
      first_name: firstName ?? null,
      email,
      marketing_opt_in: !!marketingOptIn,
      archetype: archetype ?? null,
      sticking_point: stickingPoint ?? null,
      stage: stage ?? null,
      overall: overall ?? null,
      areas: areas ?? null,
      sides: sides ?? null,
      completed_at: completedAt ?? null,
      source: source ?? null,
    });

    if (error) {
      console.error('[health-check-lead-intake] Error recording lead:', error);
      throw error;
    }

    return new Response(
      JSON.stringify({ ok: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[health-check-lead-intake] Error:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Failed to record lead',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
