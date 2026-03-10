-- Refresh coach_profiles view to pick up new columns added since last recreation
-- Background: PostgreSQL evaluates SELECT * at view creation time, not dynamically.
-- The view was last recreated on 2026-02-25. Columns added after that date
-- (availability_status, availability_note, show_availability_publicly) are invisible
-- to the view until it is dropped and recreated.

DROP VIEW IF EXISTS public.coach_profiles CASCADE;

CREATE VIEW public.coach_profiles AS
SELECT * FROM public.coaches;

GRANT SELECT ON public.coach_profiles TO anon;
GRANT SELECT ON public.coach_profiles TO authenticated;

COMMENT ON VIEW public.coach_profiles IS
'Public view of coach profiles. Uses SECURITY INVOKER (default) to enforce RLS. Recreated 2026-03-09 to include availability columns.';

-- Rollback:
-- (No rollback needed — recreating again with same definition restores prior state)
