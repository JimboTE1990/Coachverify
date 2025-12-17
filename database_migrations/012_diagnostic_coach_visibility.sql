-- Diagnostic Query: Check Coach Visibility Issue
-- Date: 2024-12-16
-- Purpose: Understand why coaches aren't appearing despite profile_visible = true

-- STEP 1: Check what's in the coaches table (the actual table)
SELECT
  'COACHES TABLE' as source,
  id,
  name,
  email,
  subscription_status,
  is_verified,
  profile_visible,
  created_at
FROM coaches
ORDER BY created_at DESC
LIMIT 10;

-- STEP 2: Check what's in the coach_profiles view (what the app queries)
SELECT
  'COACH_PROFILES VIEW' as source,
  id,
  name,
  email,
  subscription_status,
  is_verified,
  profile_visible,
  created_at
FROM coach_profiles
ORDER BY created_at DESC
LIMIT 10;

-- STEP 3: Check the view definition to see if there's a filter
SELECT
  table_name,
  view_definition
FROM information_schema.views
WHERE table_name = 'coach_profiles';

-- STEP 4: Count how many coaches should be visible
SELECT
  'Total coaches in coaches table' as description,
  COUNT(*) as count
FROM coaches
UNION ALL
SELECT
  'Coaches with is_verified=true',
  COUNT(*)
FROM coaches
WHERE is_verified = true
UNION ALL
SELECT
  'Coaches with profile_visible=true',
  COUNT(*)
FROM coaches
WHERE profile_visible = true
UNION ALL
SELECT
  'Coaches with BOTH is_verified=true AND profile_visible=true',
  COUNT(*)
FROM coaches
WHERE is_verified = true AND profile_visible = true
UNION ALL
SELECT
  'Coaches in coach_profiles view',
  COUNT(*)
FROM coach_profiles
UNION ALL
SELECT
  'Coaches in coach_profiles with is_verified=true AND profile_visible=true',
  COUNT(*)
FROM coach_profiles
WHERE is_verified = true AND profile_visible = true;

-- STEP 5: Check if coach_profiles is filtering out coaches
-- This will show coaches that are in 'coaches' but NOT in 'coach_profiles'
SELECT
  c.id,
  c.name,
  c.email,
  c.subscription_status,
  c.is_verified,
  c.profile_visible
FROM coaches c
LEFT JOIN coach_profiles cp ON c.id = cp.id
WHERE cp.id IS NULL;
