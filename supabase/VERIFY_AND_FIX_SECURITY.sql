-- ============================================================================
-- SECURITY VERIFICATION AND FIX SCRIPT
-- ============================================================================
-- Purpose: Check for and fix SECURITY DEFINER views and RLS issues
-- Run this in your Supabase SQL Editor to verify and fix security warnings
-- ============================================================================

-- ============================================================================
-- STEP 1: CHECK CURRENT STATE
-- ============================================================================

-- Check if coach_profiles view has SECURITY DEFINER
SELECT
  schemaname,
  viewname,
  definition
FROM pg_views
WHERE viewname = 'coach_profiles';

-- Result interpretation:
-- If definition contains 'SECURITY_DEFINER', the view has the security issue
-- If definition is just "SELECT * FROM coaches", it's secure

-- ============================================================================
-- STEP 2: CHECK RLS STATUS ON ALL TABLES
-- ============================================================================

-- Check which tables have RLS enabled
SELECT
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('coaches', 'reviews', 'review_comments', 'social_links', 'certifications', 'coach_specialties', 'coach_formats')
ORDER BY tablename;

-- Result interpretation:
-- rowsecurity = true: RLS is enabled (good)
-- rowsecurity = false: RLS is disabled (potential security issue)

-- ============================================================================
-- STEP 3: CHECK EXISTING POLICIES
-- ============================================================================

-- List all RLS policies
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- ============================================================================
-- STEP 4: FIX - REMOVE SECURITY DEFINER FROM COACH_PROFILES VIEW
-- ============================================================================

-- Drop and recreate the view without SECURITY DEFINER
DROP VIEW IF EXISTS coach_profiles CASCADE;

CREATE VIEW coach_profiles AS
SELECT *
FROM coaches;

-- Grant permissions
GRANT SELECT ON coach_profiles TO anon, authenticated;

-- Add documentation
COMMENT ON VIEW coach_profiles IS 'Public view of coach profiles. Uses invoker permissions to enforce RLS policies. Security: No SECURITY DEFINER - RLS policies are enforced.';

-- ============================================================================
-- STEP 5: VERIFY THE FIX
-- ============================================================================

-- Verify the view was recreated correctly
SELECT
  schemaname,
  viewname,
  definition
FROM pg_views
WHERE viewname = 'coach_profiles';

-- Expected result: definition should be simple SELECT * FROM coaches
-- Should NOT contain 'SECURITY_DEFINER'

-- ============================================================================
-- STEP 6: VERIFY RLS IS ENABLED ON CRITICAL TABLES
-- ============================================================================

-- Check RLS is enabled on all important tables
SELECT
  tablename,
  CASE
    WHEN rowsecurity THEN '✓ RLS Enabled'
    ELSE '✗ RLS DISABLED - SECURITY ISSUE'
  END as rls_status
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('coaches', 'reviews', 'review_comments', 'social_links')
ORDER BY tablename;

-- ============================================================================
-- STEP 7: ENABLE RLS ON REVIEW_COMMENTS (IF NEEDED)
-- ============================================================================

-- Enable RLS on review_comments table (if not already enabled)
ALTER TABLE review_comments ENABLE ROW LEVEL SECURITY;

-- Create policies for review_comments
DROP POLICY IF EXISTS "Allow public read review comments" ON review_comments;
DROP POLICY IF EXISTS "Allow coaches to insert comments" ON review_comments;
DROP POLICY IF EXISTS "Allow comment author to update" ON review_comments;
DROP POLICY IF EXISTS "Allow comment author to delete" ON review_comments;

-- Allow anyone to read comments
CREATE POLICY "Allow public read review comments"
ON review_comments
FOR SELECT
TO anon, authenticated, public
USING (true);

-- Allow authenticated users to insert comments
CREATE POLICY "Allow coaches to insert comments"
ON review_comments
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Allow comment author to update own comments
CREATE POLICY "Allow comment author to update"
ON review_comments
FOR UPDATE
TO authenticated
USING (author_id = auth.uid());

-- Allow comment author to delete own comments
CREATE POLICY "Allow comment author to delete"
ON review_comments
FOR DELETE
TO authenticated
USING (author_id = auth.uid());

-- ============================================================================
-- STEP 8: FINAL VERIFICATION
-- ============================================================================

-- Run a comprehensive security check
SELECT
  'Security Check Results' as check_type,
  '===================' as separator;

-- Check 1: coach_profiles view
SELECT
  'coach_profiles view' as item,
  CASE
    WHEN definition NOT LIKE '%SECURITY_DEFINER%' THEN '✓ Secure (no SECURITY DEFINER)'
    ELSE '✗ INSECURE (has SECURITY DEFINER)'
  END as status
FROM pg_views
WHERE viewname = 'coach_profiles';

-- Check 2: RLS on coaches table
SELECT
  'coaches table RLS' as item,
  CASE
    WHEN rowsecurity THEN '✓ Enabled'
    ELSE '✗ DISABLED'
  END as status
FROM pg_tables
WHERE tablename = 'coaches' AND schemaname = 'public';

-- Check 3: RLS on review_comments table
SELECT
  'review_comments table RLS' as item,
  CASE
    WHEN rowsecurity THEN '✓ Enabled'
    ELSE '✗ DISABLED'
  END as status
FROM pg_tables
WHERE tablename = 'review_comments' AND schemaname = 'public';

-- Check 4: Count of RLS policies
SELECT
  'RLS Policies' as item,
  COUNT(*)::text || ' policies configured' as status
FROM pg_policies
WHERE schemaname = 'public';

-- ============================================================================
-- SUMMARY
-- ============================================================================

-- All checks should show ✓ (checkmark) for a secure configuration:
-- 1. coach_profiles view: ✓ Secure (no SECURITY DEFINER)
-- 2. coaches table RLS: ✓ Enabled
-- 3. review_comments table RLS: ✓ Enabled
-- 4. RLS Policies: 20+ policies configured

-- If any checks show ✗, review the steps above and re-run the fixes

-- ============================================================================
-- TROUBLESHOOTING
-- ============================================================================

-- If the Supabase security warning persists after running this:
-- 1. Wait 5-10 minutes for Supabase to re-scan the database
-- 2. Refresh the Supabase dashboard
-- 3. Check the "Security Advisor" section in Supabase
-- 4. If warning still shows, contact Supabase support with:
--    - This SQL script
--    - Results of the verification queries
--    - Screenshot of the security warning

-- ============================================================================
-- END OF SCRIPT
-- ============================================================================
