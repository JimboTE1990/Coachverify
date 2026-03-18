-- Fix H1: Prevent authenticated users from self-writing sensitive coach columns
--
-- The coaches UPDATE RLS policy correctly scopes rows to the owning user but does not
-- restrict which columns can be written. A coach could POST directly to the Supabase
-- REST API and set subscription_status = 'lifetime', emcc_verified = true, etc.
--
-- Defence in depth:
--   Layer 1 (done in supabaseService.ts): removed sensitive fields from updateCoach()
--   Layer 2 (this migration): column-level REVOKE so the DB refuses these writes
--                             even if someone bypasses the service layer.
--
-- Service role (used by edge functions and Stripe webhook) bypasses column-level
-- privileges, so all legitimate server-side writes continue to work.

REVOKE UPDATE (
  is_verified,
  verification_status,
  subscription_status,
  billing_cycle,
  stripe_customer_id,
  stripe_subscription_id,
  emcc_verified,
  emcc_verified_at,
  icf_verified,
  icf_verified_at,
  ac_verified,
  ac_verified_at,
  trial_ends_at,
  deletion_requested_at
) ON public.coaches FROM authenticated;
