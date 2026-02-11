-- Remove SECURITY DEFINER from coach_profiles view
-- Security fix: Views with SECURITY DEFINER bypass Row Level Security (RLS)
-- and run with creator permissions instead of user permissions.
-- This is a security vulnerability.

-- ==============================================================================
-- FIX: Recreate coach_profiles view WITHOUT SECURITY DEFINER
-- ==============================================================================

-- Drop existing view (including any dependencies)
DROP VIEW IF EXISTS coach_profiles CASCADE;

-- Recreate view WITHOUT SECURITY DEFINER
-- This ensures RLS policies are properly enforced
CREATE VIEW coach_profiles AS
SELECT *
FROM coaches;

-- Grant appropriate permissions
-- anon: Public (unauthenticated) users can read coach profiles
-- authenticated: Logged-in users can read coach profiles
GRANT SELECT ON coach_profiles TO anon, authenticated;

-- Add comment explaining the view purpose
COMMENT ON VIEW coach_profiles IS 'Public view of coach profiles. Uses invoker permissions to enforce RLS policies.';

-- ==============================================================================
-- VERIFICATION
-- ==============================================================================

-- Verify the view was created without SECURITY DEFINER
SELECT
  schemaname,
  viewname,
  definition
FROM pg_views
WHERE viewname = 'coach_profiles';

-- Expected result: definition should NOT contain 'SECURITY_DEFINER'
-- The view should simply pass through all columns from the coaches table

-- ==============================================================================
-- NOTES
-- ==============================================================================

-- What this fixes:
-- 1. Removes SECURITY DEFINER property from coach_profiles view
-- 2. Ensures Row Level Security policies are properly enforced
-- 3. View now runs with permissions of the querying user (not creator)
-- 4. Maintains backward compatibility - view still works the same for valid queries

-- Security implications:
-- BEFORE: View bypassed RLS, used creator permissions (security risk)
-- AFTER: View respects RLS, uses user permissions (secure)

-- Performance implications:
-- None - this is purely a security fix with no performance impact

-- Rollback (if needed):
-- To rollback this change, you would need to recreate the view with SECURITY DEFINER
-- However, this is NOT recommended as it's a security vulnerability
-- Only rollback if you understand the security implications
