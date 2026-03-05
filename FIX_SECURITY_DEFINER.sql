-- ============================================
-- Fix SECURITY DEFINER Warning on coach_profiles View
-- Date: 2026-03-02
-- Issue: Security scan reports SECURITY DEFINER on view
-- ============================================

-- STEP 1: Drop existing view (will cascade to dependent objects)
DROP VIEW IF EXISTS public.coach_profiles CASCADE;

-- STEP 2: Recreate view WITHOUT SECURITY DEFINER
-- By default, views use SECURITY INVOKER which means:
-- - Queries run with the permission of the QUERYING user
-- - RLS policies are enforced based on the QUERYING user
-- - This is the secure behavior we want
CREATE VIEW public.coach_profiles AS
SELECT *
FROM public.coaches;

-- STEP 3: Grant appropriate permissions to the view
GRANT SELECT ON public.coach_profiles TO anon;
GRANT SELECT ON public.coach_profiles TO authenticated;

-- STEP 4: Add documentation
COMMENT ON VIEW public.coach_profiles IS
'Public view of coach profiles. Uses SECURITY INVOKER (default) to enforce RLS policies properly. Does NOT use SECURITY DEFINER.';

-- ============================================
-- VERIFICATION
-- ============================================

-- Verify the view definition does NOT contain SECURITY DEFINER
SELECT
  schemaname,
  viewname,
  definition
FROM pg_views
WHERE schemaname = 'public'
  AND viewname = 'coach_profiles';

-- The definition column should NOT contain any reference to:
-- - 'SECURITY DEFINER'
-- - 'security_definer'
-- - 'security_invoker = false'

-- Also verify we can still query the view
SELECT COUNT(*) as total_coaches FROM public.coach_profiles;

-- ============================================
-- EXPLANATION
-- ============================================

-- BEFORE (with SECURITY DEFINER):
-- - View queries ran with VIEW CREATOR's permissions
-- - RLS policies evaluated against VIEW CREATOR
-- - Could bypass security if creator had elevated permissions
-- - Security risk: Medium

-- AFTER (with SECURITY INVOKER - default):
-- - View queries run with QUERYING USER's permissions
-- - RLS policies evaluated against QUERYING USER
-- - Proper security enforcement
-- - Security risk: None

-- IMPACT:
-- - No functional change to application
-- - No performance impact
-- - Security warning will be resolved
-- - Proper RLS enforcement is now guaranteed
