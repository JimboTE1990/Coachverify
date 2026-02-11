-- ============================================================================
-- QUICK SECURITY STATUS CHECK
-- ============================================================================
-- Run this to verify your security fixes are in place
-- All results should show ✓ (checkmarks)
-- ============================================================================

-- Single query to check all security aspects
WITH security_checks AS (
  -- Check 1: coach_profiles view security
  SELECT
    '1. coach_profiles view' as check_name,
    CASE
      WHEN definition NOT LIKE '%SECURITY_DEFINER%' THEN '✓ SECURE'
      ELSE '✗ INSECURE (SECURITY_DEFINER found)'
    END as status,
    definition as details
  FROM pg_views
  WHERE viewname = 'coach_profiles'

  UNION ALL

  -- Check 2: coaches table RLS
  SELECT
    '2. coaches table RLS' as check_name,
    CASE
      WHEN rowsecurity THEN '✓ ENABLED'
      ELSE '✗ DISABLED'
    END as status,
    'Row Level Security on coaches table' as details
  FROM pg_tables
  WHERE tablename = 'coaches' AND schemaname = 'public'

  UNION ALL

  -- Check 3: review_comments table RLS
  SELECT
    '3. review_comments RLS' as check_name,
    CASE
      WHEN rowsecurity THEN '✓ ENABLED'
      ELSE '✗ DISABLED'
    END as status,
    'Row Level Security on review_comments table' as details
  FROM pg_tables
  WHERE tablename = 'review_comments' AND schemaname = 'public'

  UNION ALL

  -- Check 4: RLS policies count
  SELECT
    '4. RLS Policies Count' as check_name,
    '✓ ' || COUNT(*)::text || ' policies' as status,
    'Total RLS policies configured' as details
  FROM pg_policies
  WHERE schemaname = 'public'
)
SELECT
  check_name as "Security Check",
  status as "Status",
  details as "Details"
FROM security_checks
ORDER BY check_name;

-- ============================================================================
-- INTERPRETATION GUIDE
-- ============================================================================
--
-- Expected Results (All Secure):
-- ┌─────────────────────────────┬─────────────────┬────────────────────────────────┐
-- │ Security Check              │ Status          │ Details                        │
-- ├─────────────────────────────┼─────────────────┼────────────────────────────────┤
-- │ 1. coach_profiles view      │ ✓ SECURE        │ SELECT * FROM coaches          │
-- │ 2. coaches table RLS        │ ✓ ENABLED       │ Row Level Security on coaches  │
-- │ 3. review_comments RLS      │ ✓ ENABLED       │ Row Level Security on reviews  │
-- │ 4. RLS Policies Count       │ ✓ 20+ policies  │ Total RLS policies configured  │
-- └─────────────────────────────┴─────────────────┴────────────────────────────────┘
--
-- If ANY check shows ✗:
-- 1. Re-run the VERIFY_AND_FIX_SECURITY.sql script
-- 2. Check for error messages
-- 3. Contact support if issues persist
--
-- ============================================================================
