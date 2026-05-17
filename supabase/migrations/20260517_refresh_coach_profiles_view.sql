-- Refresh coach_profiles view to pick up columns added after March 9 2026
--
-- The view uses SELECT * FROM coaches which is resolved at creation time.
-- icf_accreditation_level (and any other columns added post-March-9) are invisible
-- until the view is recreated.

DROP VIEW IF EXISTS public.coach_profiles CASCADE;

CREATE VIEW public.coach_profiles AS
SELECT * FROM public.coaches;

GRANT SELECT ON public.coach_profiles TO anon;
GRANT SELECT ON public.coach_profiles TO authenticated;

COMMENT ON VIEW public.coach_profiles IS
'Public view of coach profiles. Uses SECURITY INVOKER (default) to enforce RLS. Recreated 2026-05-17 to include icf_accreditation_level and other post-March-9 columns.';
