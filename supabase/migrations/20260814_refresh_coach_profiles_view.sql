-- Recreate the coach_profiles view so SELECT * expands to include
-- the new secondary_accreditations column added to coaches.
DROP VIEW IF EXISTS coach_profiles CASCADE;

CREATE VIEW coach_profiles AS
SELECT * FROM coaches;

GRANT SELECT ON coach_profiles TO anon, authenticated;

COMMENT ON VIEW coach_profiles IS 'Public view of coach profiles. Uses SECURITY INVOKER (default) to enforce RLS.';
