-- ============================================
-- Diagnose Why New Coaches Don't Appear in Directory
-- ============================================
-- Run this in Supabase SQL Editor to check profile visibility
-- ============================================

-- Step 1: Check all coaches in the database
SELECT
  id,
  name,
  email,
  is_verified,
  profile_visible,
  dashboard_access,
  subscription_status,
  trial_ends_at,
  created_at
FROM coaches
ORDER BY created_at DESC
LIMIT 10;

-- Step 2: Check which coaches should appear in the directory
-- (Same filters as the app uses)
SELECT
  id,
  name,
  email,
  is_verified,
  subscription_status,
  profile_visible,
  created_at
FROM coaches
WHERE is_verified = true
AND subscription_status IN ('trial', 'active')
ORDER BY created_at DESC;

-- Step 3: Check coaches that are NOT showing (but should be)
SELECT
  id,
  name,
  email,
  is_verified,
  subscription_status,
  profile_visible,
  dashboard_access,
  created_at,
  CASE
    WHEN is_verified = false THEN 'NOT VERIFIED'
    WHEN subscription_status NOT IN ('trial', 'active') THEN 'INACTIVE SUBSCRIPTION'
    WHEN profile_visible = false THEN 'PROFILE NOT VISIBLE'
    ELSE 'SHOULD BE VISIBLE'
  END as visibility_status
FROM coaches
WHERE subscription_status IN ('trial', 'active')
ORDER BY created_at DESC
LIMIT 10;

-- Step 4: Count coaches by verification status
SELECT
  is_verified,
  COUNT(*) as count,
  subscription_status
FROM coaches
GROUP BY is_verified, subscription_status
ORDER BY subscription_status, is_verified;

-- Step 5: Check if there are recent coaches (last 24 hours)
SELECT
  id,
  name,
  email,
  is_verified,
  profile_visible,
  subscription_status,
  created_at,
  (NOW() - created_at) as age
FROM coaches
WHERE created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;

-- ============================================
-- RECOMMENDED FIX (if coaches are not verified)
-- ============================================
-- If Step 1 shows coaches with is_verified = false, run this:

-- Option A: Set ALL trial coaches to verified (RECOMMENDED for launch)
-- UPDATE coaches
-- SET is_verified = true
-- WHERE subscription_status IN ('trial', 'active')
-- AND is_verified = false;

-- Option B: Set a specific coach to verified (for testing)
-- UPDATE coaches
-- SET is_verified = true
-- WHERE email = 'your-email@example.com';

-- ============================================
-- Verify the fix worked
-- ============================================
-- SELECT COUNT(*) as visible_coaches
-- FROM coaches
-- WHERE is_verified = true
-- AND subscription_status IN ('trial', 'active');
