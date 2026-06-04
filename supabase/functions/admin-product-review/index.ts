/**
 * Supabase Edge Function: admin-product-review
 *
 * Approve or delete a product_reviews row.
 * Uses SUPABASE_SERVICE_ROLE_KEY so it bypasses RLS and column-level REVOKEs.
 *
 * Auth: requires x-admin-password header matching ADMIN_PASSWORD env var.
 *
 * Body: { action: 'approve' | 'delete', reviewId: string }
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
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-admin-password',
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

  // Admin auth — simple shared secret
  const adminPassword = Deno.env.get('ADMIN_PASSWORD');
  const providedPassword = req.headers.get('x-admin-password');
  if (!adminPassword || providedPassword !== adminPassword) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  let body: { action: string; reviewId?: string };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const { action, reviewId } = body;
  if (!['approve', 'delete', 'list-pending', 'list-approved'].includes(action)) {
    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
  if (['approve', 'delete'].includes(action) && !reviewId) {
    return new Response(JSON.stringify({ error: 'Missing reviewId' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Service role client — bypasses RLS and column-level REVOKEs
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  if (action === 'list-pending' || action === 'list-approved') {
    const { data, error } = await supabase
      .from('product_reviews')
      .select('id, reviewer_id, reviewer_name, reviewer_title, rating, review_text, source, source_url, created_at')
      .eq('is_approved', action === 'list-approved')
      .order('created_at', { ascending: false });

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    return new Response(JSON.stringify({ reviews: data ?? [] }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  if (action === 'approve') {
    const { error } = await supabase
      .from('product_reviews')
      .update({ is_approved: true })
      .eq('id', reviewId);

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  } else {
    const { error } = await supabase
      .from('product_reviews')
      .delete()
      .eq('id', reviewId);

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  }

  return new Response(JSON.stringify({ success: true }), {
    status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
