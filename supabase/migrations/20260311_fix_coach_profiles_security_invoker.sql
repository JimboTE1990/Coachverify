-- Fix: coach_profiles view must not use SECURITY DEFINER
-- Supabase flagged this view as having SECURITY DEFINER, which bypasses RLS
-- and enforces the view creator's permissions rather than the querying user's.
-- SECURITY INVOKER (the PostgreSQL default) is correct here.

DROP VIEW IF EXISTS public.coach_profiles CASCADE;

CREATE VIEW public.coach_profiles WITH (security_invoker = true) AS
SELECT * FROM public.coaches;

GRANT SELECT ON public.coach_profiles TO anon;
GRANT SELECT ON public.coach_profiles TO authenticated;

COMMENT ON VIEW public.coach_profiles IS
'Public view of coach profiles. Uses SECURITY INVOKER (default) to enforce RLS. Recreated 2026-03-11 to resolve SECURITY DEFINER advisory warning.';

-- Verify the fix (run manually to confirm):
-- SELECT viewname, definition
-- FROM pg_views
-- WHERE schemaname = 'public' AND viewname = 'coach_profiles';
-- The definition must NOT contain 'security_definer'.
