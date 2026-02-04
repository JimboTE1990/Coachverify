-- Force Update Profiles - Simple and Direct
-- This will SET the accreditation data regardless of current state

-- ==============================================================================
-- STEP 1: CHECK WHAT DATA EXISTS NOW
-- ==============================================================================

SELECT
  id,
  name,
  email,
  accreditation_body,
  emcc_verified,
  icf_verified,
  emcc_profile_url,
  icf_profile_url
FROM coach_profiles
WHERE id IN (
  '3df6bae3-c318-4e2c-b579-4dc506330bda',
  '354e2bae-8150-4b2f-80d5-9dc808c15b5b',
  '77f6a80f-817c-4b4c-96ca-a4e73833d844'
);

-- ==============================================================================
-- STEP 2: FORCE SET AS EMCC VERIFIED (ALL THREE)
-- ==============================================================================
-- If you want all three as EMCC, run this:

UPDATE coach_profiles
SET
  accreditation_body = 'EMCC',
  accreditation_level = 'Practitioner',
  emcc_verified = true,
  emcc_verified_at = NOW(),
  emcc_profile_url = 'https://www.emccouncil.org/eu/en/directories/coaches?search=' || REPLACE(name, ' ', '+')
WHERE id IN (
  '3df6bae3-c318-4e2c-b579-4dc506330bda',
  '354e2bae-8150-4b2f-80d5-9dc808c15b5b',
  '77f6a80f-817c-4b4c-96ca-a4e73833d844'
);

-- ==============================================================================
-- STEP 3: VERIFY IT WORKED
-- ==============================================================================

SELECT
  id,
  name,
  accreditation_body,
  accreditation_level,
  emcc_verified,
  emcc_profile_url,
  CASE
    WHEN accreditation_body = 'EMCC' AND emcc_verified = true AND emcc_profile_url IS NOT NULL
    THEN '✅ BADGE WILL SHOW'
    ELSE '❌ STILL MISSING DATA'
  END as status
FROM coach_profiles
WHERE id IN (
  '3df6bae3-c318-4e2c-b579-4dc506330bda',
  '354e2bae-8150-4b2f-80d5-9dc808c15b5b',
  '77f6a80f-817c-4b4c-96ca-a4e73833d844'
);

-- ==============================================================================
-- ALTERNATIVE: Set as ICF instead
-- ==============================================================================

/*
UPDATE coach_profiles
SET
  accreditation_body = 'ICF',
  icf_accreditation_level = 'PCC',
  icf_verified = true,
  icf_verified_at = NOW(),
  icf_profile_url = 'https://coachfederation.org/find-a-coach?search=' || REPLACE(name, ' ', '+')
WHERE id IN (
  '3df6bae3-c318-4e2c-b579-4dc506330bda',
  '354e2bae-8150-4b2f-80d5-9dc808c15b5b',
  '77f6a80f-817c-4b4c-96ca-a4e73833d844'
);
*/

-- ==============================================================================
-- STEP 4: Test with just ONE profile first
-- ==============================================================================
-- If the above still doesn't work, try updating just one profile:

/*
UPDATE coach_profiles
SET
  accreditation_body = 'EMCC',
  accreditation_level = 'Practitioner',
  emcc_verified = true,
  emcc_verified_at = NOW(),
  emcc_profile_url = 'https://www.emccouncil.org/eu/en/directories/coaches?search=Test+Coach'
WHERE id = '3df6bae3-c318-4e2c-b579-4dc506330bda';

-- Then check if it worked:
SELECT * FROM coach_profiles WHERE id = '3df6bae3-c318-4e2c-b579-4dc506330bda';
*/

-- ==============================================================================
-- TROUBLESHOOTING
-- ==============================================================================

-- If this still doesn't work, possible issues:
-- 1. Row Level Security (RLS) policies blocking updates
-- 2. The IDs are incorrect
-- 3. The profiles don't exist in coach_profiles table

-- Check if RLS is blocking:
SELECT tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'coach_profiles';

-- List ALL profiles to find the correct IDs:
SELECT id, name, email, accreditation_body, created_at
FROM coach_profiles
ORDER BY created_at DESC
LIMIT 20;
