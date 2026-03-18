-- Fix N1: Prevent authenticated users from self-inserting sensitive coach columns
--
-- The column-level REVOKE in 20260317_restrict_sensitive_coach_columns.sql only covers
-- UPDATE. A coach registering via the REST API directly could INSERT a row with
-- subscription_status = 'lifetime' or is_verified = true baked in from the start.
--
-- This migration:
--   1. Commits the coaches INSERT policy to source control (previously only in Dashboard)
--      and tightens it so a user can only INSERT a row for themselves.
--   2. Adds column-level REVOKE on INSERT for all sensitive fields.
--
-- Service role (used by edge functions) bypasses column-level privileges.

-- 1. Tighten INSERT policy — user can only create their own coach row
DROP POLICY IF EXISTS "Anyone can register as coach" ON public.coaches;
DROP POLICY IF EXISTS "Coach inserts own row" ON public.coaches;
CREATE POLICY "Coach inserts own row"
  ON public.coaches
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- 2. Block sensitive columns on INSERT
REVOKE INSERT (
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
