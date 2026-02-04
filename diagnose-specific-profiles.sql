-- Diagnose why specific profiles aren't updating

-- ==============================================================================
-- STEP 1: CHECK IF PROFILES EXIST AND CURRENT STATE
-- ==============================================================================

SELECT
  id,
  name,
  email,
  accreditation_body,
  emcc_verified,
  icf_verified,
  emcc_profile_url,
  icf_profile_url,
  accreditation_level,
  icf_accreditation_level,
  created_at,
  subscription_status
FROM coaches
WHERE id IN (
  '3df6bae3-c318-4e2c-b579-4dc506330bda',
  '354e2bae-8150-4b2f-80d5-9dc808c15b5b',
  '77f6a80f-817c-4b4c-96ca-a4e73833d844'
)
ORDER BY name;

-- If this returns no rows, the IDs might be wrong or in a different table
-- Let's also check coach_profiles table:

SELECT
  id,
  name,
  email,
  accreditation_body,
  emcc_verified,
  icf_verified,
  emcc_profile_url,
  icf_profile_url,
  accreditation_level,
  icf_accreditation_level,
  created_at,
  subscription_status
FROM coach_profiles
WHERE id IN (
  '3df6bae3-c318-4e2c-b579-4dc506330bda',
  '354e2bae-8150-4b2f-80d5-9dc808c15b5b',
  '77f6a80f-817c-4b4c-96ca-a4e73833d844'
)
ORDER BY name;

-- ==============================================================================
-- STEP 2: FIND PROFILES BY CREATION TIME (if IDs don't match)
-- ==============================================================================

-- Show recently created profiles to help identify the correct ones:
SELECT
  id,
  name,
  email,
  accreditation_body,
  created_at,
  subscription_status
FROM coaches
WHERE created_at > NOW() - INTERVAL '30 days'
ORDER BY created_at DESC
LIMIT 20;

-- Or from coach_profiles:
SELECT
  id,
  name,
  email,
  accreditation_body,
  created_at,
  subscription_status
FROM coach_profiles
WHERE created_at > NOW() - INTERVAL '30 days'
ORDER BY created_at DESC
LIMIT 20;

-- ==============================================================================
-- STEP 3: CHECK TABLE STRUCTURE
-- ==============================================================================

-- Verify which table is being used:
SELECT table_name
FROM information_schema.tables
WHERE table_name IN ('coaches', 'coach_profiles')
  AND table_schema = 'public';

-- ==============================================================================
-- STEP 4: SIMPLE UPDATE TEST (Once we know the correct table)
-- ==============================================================================

-- Test update on coaches table:
/*
UPDATE coaches
SET emcc_verified = true
WHERE id = '3df6bae3-c318-4e2c-b579-4dc506330bda';
*/

-- Or test update on coach_profiles table:
/*
UPDATE coach_profiles
SET emcc_verified = true
WHERE id = '3df6bae3-c318-4e2c-b579-4dc506330bda';
*/

-- ==============================================================================
-- NOTES
-- ==============================================================================

-- Possible issues:
-- 1. Wrong table name (coaches vs coach_profiles)
-- 2. Wrong IDs provided
-- 3. RLS (Row Level Security) policies blocking updates
-- 4. The profiles don't have accreditation_body set yet

-- Once we identify the issue, we can create the correct UPDATE statement
