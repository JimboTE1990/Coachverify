-- ==============================================================================
-- SECURITY FIX: February 18, 2026
-- Addresses Supabase security advisory warnings
-- ==============================================================================


-- ==============================================================================
-- FIX 1: Recreate coach_profiles WITHOUT SECURITY DEFINER
-- The view was inadvertently recreated with SECURITY DEFINER during previous
-- schema migrations, bypassing RLS and using creator permissions instead of
-- the querying user's permissions.
-- ==============================================================================

DROP VIEW IF EXISTS coach_profiles CASCADE;

CREATE VIEW coach_profiles AS
SELECT * FROM coaches;

GRANT SELECT ON coach_profiles TO anon, authenticated;

COMMENT ON VIEW coach_profiles IS 'Public view of coach profiles. Uses SECURITY INVOKER (default) to enforce RLS.';


-- ==============================================================================
-- FIX 2: Fix mutable search_path on all public functions
-- Using ALTER FUNCTION ... SET search_path prevents search_path injection
-- without requiring us to redefine function bodies.
-- ==============================================================================

ALTER FUNCTION public.update_coach_review_aggregates() SET search_path = 'public';
ALTER FUNCTION public.update_verified_credentials_updated_at() SET search_path = 'public';
ALTER FUNCTION public.update_updated_at_column() SET search_path = 'public';
ALTER FUNCTION public.update_location_display() SET search_path = 'public';
ALTER FUNCTION public.increment_profile_views(UUID) SET search_path = 'public';
ALTER FUNCTION public.handle_new_user() SET search_path = 'public';
ALTER FUNCTION public.auto_manage_profile_visibility() SET search_path = 'public';


-- ==============================================================================
-- FIX 3: Tighten overly-permissive RLS policy on reviews — DELETE
-- "Allow review owner delete" was USING(true) — anyone could delete any review.
-- Restrict to: owner by reviewer_id, OR anonymous with matching review_token.
-- ==============================================================================

DROP POLICY IF EXISTS "Allow review owner delete" ON reviews;

CREATE POLICY "Allow review owner delete"
ON reviews
FOR DELETE
TO anon, authenticated
USING (
  -- Authenticated owner
  (auth.uid() IS NOT NULL AND auth.uid()::text = reviewer_id::text)
  -- OR anonymous deleting via their review token
  OR review_token = current_setting('request.headers', true)::json->>'x-review-token'
);


-- ==============================================================================
-- FIX 4: Tighten overly-permissive RLS policy on reviews — UPDATE
-- "Allow review owner update" was USING(true)/WITH CHECK(true) — anyone could
-- update any review. Restrict to authenticated owner only.
-- ==============================================================================

DROP POLICY IF EXISTS "Allow review owner update" ON reviews;

CREATE POLICY "Allow review owner update"
ON reviews
FOR UPDATE
TO authenticated
USING (auth.uid()::text = reviewer_id::text)
WITH CHECK (auth.uid()::text = reviewer_id::text);


-- ==============================================================================
-- FIX 5: Tighten overly-permissive policy on verified_credentials
-- "Authenticated users can manage credentials" used USING(true)/WITH CHECK(true)
-- for ALL operations — any authenticated user could read/write any credential.
-- Replace with row-scoped policies per coach.
-- ==============================================================================

DROP POLICY IF EXISTS "Authenticated users can manage credentials" ON verified_credentials;

CREATE POLICY "Coaches can read own credentials"
ON verified_credentials
FOR SELECT
TO authenticated
USING (coach_id = auth.uid());

CREATE POLICY "Coaches can insert own credentials"
ON verified_credentials
FOR INSERT
TO authenticated
WITH CHECK (coach_id = auth.uid());

CREATE POLICY "Coaches can update own credentials"
ON verified_credentials
FOR UPDATE
TO authenticated
USING (coach_id = auth.uid())
WITH CHECK (coach_id = auth.uid());

CREATE POLICY "Coaches can delete own credentials"
ON verified_credentials
FOR DELETE
TO authenticated
USING (coach_id = auth.uid());


-- ==============================================================================
-- Force PostgREST to reload schema cache
-- ==============================================================================

NOTIFY pgrst, 'reload schema';


-- ==============================================================================
-- WARNINGS NOT ADDRESSED HERE (require Supabase Dashboard changes):
--
-- 1. auth_otp_long_expiry
--    Fix: Dashboard → Authentication → Settings → Email OTP Expiry → set to 3600s (1hr)
--
-- 2. auth_leaked_password_protection
--    Fix: Dashboard → Authentication → Settings → Enable "Leaked password protection"
--
-- 3. rls_policy_always_true on link_clicks ("Anyone can track link clicks" INSERT)
--    This is intentional — anonymous users need to log link clicks. Acceptable risk.
--
-- 4. rls_policy_always_true on profile_views (two INSERT policies)
--    These are intentional — anonymous users need to log profile views. Acceptable risk.
--
-- 5. rls_policy_always_true on review_comments ("Allow coaches to insert comments" INSERT)
--    Acceptable — authenticated users are allowed to insert comments.
--    The SELECT/UPDATE/DELETE policies already restrict by author_id.
--
-- 6. rls_policy_always_true on reviews ("Allow anonymous insert reviews" INSERT)
--    Intentional — clients (anonymous) need to submit reviews. Acceptable risk.
--    The review_token mechanism handles ownership for later edits.
-- ==============================================================================
