-- ============================================================================
-- MANUAL USER DELETION SCRIPT
-- ============================================================================
-- Use this to manually delete a test user when Supabase UI blocks deletion
-- due to foreign key constraints
--
-- USER ID: 676d2c13-a776-4726-b2de-5420f6420175
-- ============================================================================

-- STEP 1: Check what data exists for this user
SELECT 'Coaches table' as table_name, COUNT(*) as record_count
FROM coaches
WHERE user_id = '676d2c13-a776-4726-b2de-5420f6420175'
UNION ALL
SELECT 'Reviews table', COUNT(*)
FROM reviews
WHERE coach_id IN (SELECT id FROM coaches WHERE user_id = '676d2c13-a776-4726-b2de-5420f6420175')
UNION ALL
SELECT 'Social Links', COUNT(*)
FROM social_links
WHERE coach_id IN (SELECT id FROM coaches WHERE user_id = '676d2c13-a776-4726-b2de-5420f6420175')
UNION ALL
SELECT 'Certifications', COUNT(*)
FROM certifications
WHERE coach_id IN (SELECT id FROM coaches WHERE user_id = '676d2c13-a776-4726-b2de-5420f6420175')
UNION ALL
SELECT 'Coach Specialties', COUNT(*)
FROM coach_specialties
WHERE coach_id IN (SELECT id FROM coaches WHERE user_id = '676d2c13-a776-4726-b2de-5420f6420175')
UNION ALL
SELECT 'Coach Formats', COUNT(*)
FROM coach_formats
WHERE coach_id IN (SELECT id FROM coaches WHERE user_id = '676d2c13-a776-4726-b2de-5420f6420175')
UNION ALL
SELECT 'Profile Views', COUNT(*)
FROM profile_views
WHERE coach_id IN (SELECT id FROM coaches WHERE user_id = '676d2c13-a776-4726-b2de-5420f6420175');

-- ============================================================================
-- STEP 2: Delete all related data (CASCADE will handle most of this)
-- ============================================================================

-- Get the coach_id first for reference
DO $$
DECLARE
  v_coach_id UUID;
  v_emcc_number TEXT;
  v_icf_number TEXT;
  v_full_name TEXT;
BEGIN
  -- Get coach_id and credential numbers
  SELECT id, emcc_eia_number, icf_credential_number, name
  INTO v_coach_id, v_emcc_number, v_icf_number, v_full_name
  FROM coaches
  WHERE user_id = '676d2c13-a776-4726-b2de-5420f6420175'
  LIMIT 1;

  IF v_coach_id IS NOT NULL THEN
    RAISE NOTICE 'Found coach_id: %', v_coach_id;
    RAISE NOTICE 'Coach name: %', v_full_name;
    RAISE NOTICE 'EMCC number: %', COALESCE(v_emcc_number, 'none');
    RAISE NOTICE 'ICF number: %', COALESCE(v_icf_number, 'none');

    -- Delete profile views
    DELETE FROM profile_views WHERE coach_id = v_coach_id;
    RAISE NOTICE 'Deleted profile_views';

    -- Delete review comments (if any)
    DELETE FROM review_comments
    WHERE review_id IN (
      SELECT id FROM reviews WHERE coach_id = v_coach_id
    );
    RAISE NOTICE 'Deleted review_comments';

    -- Delete reviews (should cascade to comments anyway)
    DELETE FROM reviews WHERE coach_id = v_coach_id;
    RAISE NOTICE 'Deleted reviews';

    -- Delete social links
    DELETE FROM social_links WHERE coach_id = v_coach_id;
    RAISE NOTICE 'Deleted social_links';

    -- Delete certifications
    DELETE FROM certifications WHERE coach_id = v_coach_id;
    RAISE NOTICE 'Deleted certifications';

    -- Delete coach specialties
    DELETE FROM coach_specialties WHERE coach_id = v_coach_id;
    RAISE NOTICE 'Deleted coach_specialties';

    -- Delete coach formats
    DELETE FROM coach_formats WHERE coach_id = v_coach_id;
    RAISE NOTICE 'Deleted coach_formats';

    -- IMPORTANT: Clear verified credentials cache
    -- This allows the EMCC/ICF credentials to be reused by other accounts
    IF v_emcc_number IS NOT NULL THEN
      DELETE FROM verified_credentials
      WHERE accreditation_body = 'EMCC'
      AND credential_number = v_emcc_number;
      RAISE NOTICE 'Cleared EMCC credential cache for: %', v_emcc_number;
    END IF;

    IF v_icf_number IS NOT NULL THEN
      DELETE FROM verified_credentials
      WHERE accreditation_body = 'ICF'
      AND credential_number = v_icf_number;
      RAISE NOTICE 'Cleared ICF credential cache for: %', v_icf_number;
    END IF;

    -- Delete coach profile
    DELETE FROM coaches WHERE id = v_coach_id;
    RAISE NOTICE 'Deleted coach profile';
  ELSE
    RAISE NOTICE 'No coach found for user_id';
  END IF;
END $$;

-- ============================================================================
-- STEP 3: Delete from auth.users
-- ============================================================================

-- Now delete from auth.users (this requires service_role permissions)
-- If this doesn't work, you need to use the Supabase Dashboard:
-- Authentication → Users → Find user → Delete

-- Try deleting (this may fail if you don't have permissions)
DELETE FROM auth.users
WHERE id = '676d2c13-a776-4726-b2de-5420f6420175';

-- ============================================================================
-- STEP 4: Verify deletion
-- ============================================================================

-- Check if user still exists
SELECT
  CASE
    WHEN EXISTS (SELECT 1 FROM auth.users WHERE id = '676d2c13-a776-4726-b2de-5420f6420175')
    THEN '✗ User still exists in auth.users'
    ELSE '✓ User deleted from auth.users'
  END as auth_status,
  CASE
    WHEN EXISTS (SELECT 1 FROM coaches WHERE user_id = '676d2c13-a776-4726-b2de-5420f6420175')
    THEN '✗ Coach profile still exists'
    ELSE '✓ Coach profile deleted'
  END as coach_status;

-- Verify verified_credentials cache was cleared
-- This ensures the credentials can be reused
SELECT
  '✓ Credentials available for reuse' as cache_status,
  COUNT(*) as cached_credentials_remaining
FROM verified_credentials
WHERE full_name LIKE '%Paul Smith%' -- Adjust if needed
OR credential_number IN (
  SELECT emcc_eia_number FROM coaches WHERE user_id = '676d2c13-a776-4726-b2de-5420f6420175'
  UNION
  SELECT icf_credential_number FROM coaches WHERE user_id = '676d2c13-a776-4726-b2de-5420f6420175'
);

-- ============================================================================
-- TROUBLESHOOTING
-- ============================================================================

-- If the deletion fails:
--
-- 1. RLS Policies Blocking Deletion:
--    - Temporarily disable RLS on coaches table
--    ALTER TABLE coaches DISABLE ROW LEVEL SECURITY;
--    -- Run deletions
--    -- Re-enable RLS
--    ALTER TABLE coaches ENABLE ROW LEVEL SECURITY;
--
-- 2. Active Sessions:
--    - Revoke all sessions for this user
--    DELETE FROM auth.sessions WHERE user_id = '676d2c13-a776-4726-b2de-5420f6420175';
--
-- 3. Foreign Key Constraints:
--    - Check what's blocking:
--    SELECT
--      conname AS constraint_name,
--      conrelid::regclass AS table_name,
--      confrelid::regclass AS referenced_table
--    FROM pg_constraint
--    WHERE confrelid = 'auth.users'::regclass;
--
-- 4. Use Supabase Dashboard:
--    - Go to Authentication → Users
--    - Search for user ID: 676d2c13-a776-4726-b2de-5420f6420175
--    - Click the three dots → Delete user
--    - This uses service_role and bypasses most restrictions
--
-- ============================================================================
-- NOTES
-- ============================================================================
--
-- Why deletion might be blocked:
-- - Supabase protects auth.users from direct deletion via SQL
-- - Must use Supabase Dashboard or service_role API
-- - Foreign key constraints require deleting related data first
-- - RLS policies may prevent deletion even with correct permissions
--
-- Best practice for production:
-- - Never hard-delete users immediately
-- - Use soft deletion (mark as deleted, hide from queries)
-- - Schedule permanent deletion after retention period (30 days)
-- - This is what the handleDeleteAccount function does
--
-- ============================================================================
