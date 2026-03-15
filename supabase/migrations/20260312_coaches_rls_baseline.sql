-- Baseline RLS policies for the coaches table.
--
-- Background: RLS on coaches was enabled via the Supabase Dashboard and was never
-- committed to a migration. The coach_profiles view previously used SECURITY DEFINER,
-- which bypassed RLS entirely and allowed all rows to be read. Now that the view uses
-- SECURITY INVOKER, a SELECT policy for anon/authenticated is required on the
-- underlying coaches table.
--
-- The coaches table has accumulated several overlapping SELECT policies. This migration
-- consolidates them into two clear policies:
--   1. Public read  — anon and authenticated can read all coaches (app code filters by
--                     verification status and subscription tier, as before)
--   2. Own profile  — authenticated coaches can always read their own row
--   3. Own update   — authenticated coaches can update their own row only
--
-- Policies removed (all made redundant by the consolidated ones below):
--   "Anyone can view verified coaches"  (public, is_verified OR own)
--   "Public can view active coaches"    (anon+authenticated, active/trial AND is_verified)
--   "Allow public read coaches"         (anon+authenticated, true — added as emergency fix)

ALTER TABLE public.coaches ENABLE ROW LEVEL SECURITY;

-- Remove all existing SELECT policies to start clean
DROP POLICY IF EXISTS "Anyone can view verified coaches" ON public.coaches;
DROP POLICY IF EXISTS "Coaches can view own profile" ON public.coaches;
DROP POLICY IF EXISTS "Public can view active coaches" ON public.coaches;
DROP POLICY IF EXISTS "Allow public read coaches" ON public.coaches;

-- 1. All coaches readable by anyone (mirrors previous SECURITY DEFINER view behaviour)
--    Application code is responsible for filtering by is_verified / subscription_status.
CREATE POLICY "Public read coaches"
  ON public.coaches
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- 2. Authenticated coaches can always read their own row (e.g. dashboard, pending profiles)
CREATE POLICY "Coach reads own profile"
  ON public.coaches
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- 3. Keep existing update policy (unchanged)
DROP POLICY IF EXISTS "Coaches can update own profile" ON public.coaches;
CREATE POLICY "Coach updates own profile"
  ON public.coaches
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- INSERT policy (unchanged — was already correct)
-- "Anyone can register as coach" ON coaches FOR INSERT TO public USING (true)

-- Verify:
-- SELECT policyname, cmd, roles, qual FROM pg_policies
-- WHERE schemaname = 'public' AND tablename = 'coaches' ORDER BY cmd;
