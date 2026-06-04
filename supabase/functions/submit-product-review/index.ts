/**
 * Supabase Edge Function: submit-product-review
 *
 * Lets an authenticated coach submit a product review of CoachDog.
 * Uses the service role to bypass the RLS INSERT policy entirely —
 * the client-side Supabase JS client consistently fails to attach the
 * user JWT to the INSERT request, causing 42501 from PostgREST.
 *
 * Auth: requires a valid user JWT in the Authorization: Bearer header.
 *
 * Body: { reviewerName: string, reviewerTitle?: string, rating: number, text: string }
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

serve(async (req: Request) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Verify the user JWT from the Authorization header
  const authHeader = req.headers.get('Authorization');
  const token = authHeader?.replace('Bearer ', '');
  if (!token) {
    return new Response(JSON.stringify({ error: 'Missing authorization token' }), {
      status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Service role client to verify the user and insert
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  // Verify the token — getUser() with a token does server-side JWT validation
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) {
    return new Response(JSON.stringify({ error: 'Invalid or expired token' }), {
      status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  let body: { reviewerName: string; reviewerTitle?: string; rating: number; text: string };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const { reviewerName, reviewerTitle, rating, text } = body;
  if (!reviewerName?.trim() || !text?.trim() || typeof rating !== 'number') {
    return new Response(JSON.stringify({ error: 'Missing required fields' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Insert with service role — bypasses RLS entirely.
  // is_approved = false so new reviews go through the admin pending queue.
  const { data, error } = await supabase
    .from('product_reviews')
    .insert({
      reviewer_id: user.id,
      reviewer_name: reviewerName.trim(),
      reviewer_title: reviewerTitle?.trim() || null,
      rating,
      review_text: text.trim(),
      is_approved: false,
    })
    .select('id, reviewer_id, reviewer_name, reviewer_title, rating, review_text, source, source_url, created_at')
    .single();

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ review: data }), {
    status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
