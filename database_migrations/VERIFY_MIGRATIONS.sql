-- ============================================================================
-- VERIFICATION SCRIPT: Check if migrations 003 and 004 were applied correctly
-- ============================================================================
-- Run this in your Supabase SQL Editor to verify the migrations

-- ============================================================================
-- 1. Check if all new columns exist
-- ============================================================================
SELECT
  'Column Check' as test_type,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'coaches'
  AND column_name IN (
    -- Migration 003 fields
    'cancelled_at',
    'subscription_ends_at',
    'cancel_reason',
    'cancel_feedback',
    'stripe_customer_id',
    'stripe_subscription_id',
    -- Migration 004 fields
    'profile_visible',
    'dashboard_access',
    -- Migration 002 fields (first/last name)
    'first_name',
    'last_name'
  )
ORDER BY column_name;

-- Expected: 10 rows returned (all new columns exist)

-- ============================================================================
-- 2. Check if the trigger function exists
-- ============================================================================
SELECT
  'Function Check' as test_type,
  proname as function_name,
  pg_get_functiondef(oid) as function_definition
FROM pg_proc
WHERE proname = 'auto_manage_profile_visibility';

-- Expected: 1 row with function definition

-- ============================================================================
-- 3. Check if the trigger exists
-- ============================================================================
SELECT
  'Trigger Check' as test_type,
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement,
  action_timing,
  action_orientation
FROM information_schema.triggers
WHERE trigger_name = 'trigger_auto_manage_profile_visibility';

-- Expected: 1 row showing BEFORE UPDATE trigger

-- ============================================================================
-- 4. Check current coach data with new fields
-- ============================================================================
SELECT
  'Data Check' as test_type,
  id,
  email,
  subscription_status,
  profile_visible,
  dashboard_access,
  first_name,
  last_name,
  cancelled_at,
  subscription_ends_at,
  stripe_customer_id
FROM coaches
ORDER BY created_at DESC
LIMIT 5;

-- Expected: Shows your existing coaches with new fields populated

-- ============================================================================
-- 5. Check profile visibility distribution by subscription status
-- ============================================================================
SELECT
  'Visibility Distribution' as test_type,
  subscription_status,
  COUNT(*) as total_coaches,
  SUM(CASE WHEN profile_visible = TRUE THEN 1 ELSE 0 END) as visible_profiles,
  SUM(CASE WHEN profile_visible = FALSE THEN 1 ELSE 0 END) as hidden_profiles,
  SUM(CASE WHEN dashboard_access = TRUE THEN 1 ELSE 0 END) as dashboard_access_granted
FROM coaches
GROUP BY subscription_status
ORDER BY subscription_status;

-- Expected:
-- onboarding: profile_visible = FALSE, dashboard_access = FALSE
-- trial: profile_visible = TRUE, dashboard_access = TRUE
-- active: profile_visible = TRUE, dashboard_access = TRUE
-- expired: profile_visible = FALSE, dashboard_access = FALSE

-- ============================================================================
-- 6. Check indexes were created
-- ============================================================================
SELECT
  'Index Check' as test_type,
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'coaches'
  AND indexname IN (
    'idx_coaches_stripe_customer_id',
    'idx_coaches_profile_visible',
    'idx_coaches_subscription_status_visible'
  )
ORDER BY indexname;

-- Expected: 3 rows (all indexes exist)

-- ============================================================================
-- 7. Check constraints
-- ============================================================================
SELECT
  'Constraint Check' as test_type,
  conname as constraint_name,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'coaches'::regclass
  AND conname IN ('cancel_reason_check');

-- Expected: 1 row showing cancel_reason check constraint

-- ============================================================================
-- 8. Test the trigger (optional - only if you have test data)
-- ============================================================================
-- This will show what happens when subscription status changes
-- DO NOT RUN THIS ON PRODUCTION DATA WITHOUT BACKING UP FIRST

-- Uncomment to test:
/*
DO $$
DECLARE
  test_coach_id UUID;
BEGIN
  -- Find a coach to test with (or create a test coach)
  SELECT id INTO test_coach_id FROM coaches LIMIT 1;

  IF test_coach_id IS NOT NULL THEN
    -- Test 1: Set to expired (should hide profile)
    UPDATE coaches
    SET subscription_status = 'expired'
    WHERE id = test_coach_id;

    RAISE NOTICE 'After setting to expired:';
    RAISE NOTICE 'profile_visible should be FALSE';

    -- Check result
    SELECT 'Trigger Test (Expired)' as test_type, profile_visible, dashboard_access
    FROM coaches WHERE id = test_coach_id;

    -- Test 2: Set back to active (should show profile)
    UPDATE coaches
    SET subscription_status = 'active'
    WHERE id = test_coach_id;

    RAISE NOTICE 'After setting to active:';
    RAISE NOTICE 'profile_visible should be TRUE';

    -- Check result
    SELECT 'Trigger Test (Active)' as test_type, profile_visible, dashboard_access
    FROM coaches WHERE id = test_coach_id;
  END IF;
END $$;
*/

-- ============================================================================
-- SUMMARY
-- ============================================================================
-- If all queries above return expected results, migrations were successful!
--
-- Quick checklist:
-- ✅ All 10 new columns exist
-- ✅ Trigger function exists
-- ✅ Trigger is active on coaches table
-- ✅ Indexes created
-- ✅ Constraints applied
-- ✅ Existing data migrated with correct visibility settings
-- ✅ Trigger automatically updates visibility on status change
