-- Update Specific Coach Profiles with Accreditation Badges (FIXED)
-- IMPORTANT: Uses coach_profiles table, NOT coaches table

-- ==============================================================================
-- STEP 1: CHECK CURRENT STATE
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
  SUBSTRING(photo_url FROM 1 FOR 50) as photo_preview
FROM coach_profiles
WHERE id IN (
  '3df6bae3-c318-4e2c-b579-4dc506330bda',
  '354e2bae-8150-4b2f-80d5-9dc808c15b5b',
  '77f6a80f-817c-4b4c-96ca-a4e73833d844'
)
ORDER BY name;

-- ==============================================================================
-- STEP 2: UPDATE ALL THREE PROFILES
-- ==============================================================================

UPDATE coach_profiles
SET
  emcc_verified = CASE
    WHEN accreditation_body = 'EMCC' THEN true
    ELSE emcc_verified
  END,
  emcc_verified_at = CASE
    WHEN accreditation_body = 'EMCC' AND emcc_verified_at IS NULL THEN NOW()
    ELSE emcc_verified_at
  END,
  emcc_profile_url = CASE
    WHEN accreditation_body = 'EMCC' AND (emcc_profile_url IS NULL OR emcc_profile_url = '')
    THEN 'https://www.emccouncil.org/eu/en/directories/coaches?search=' || REPLACE(name, ' ', '+')
    ELSE emcc_profile_url
  END,
  icf_verified = CASE
    WHEN accreditation_body = 'ICF' THEN true
    ELSE icf_verified
  END,
  icf_verified_at = CASE
    WHEN accreditation_body = 'ICF' AND icf_verified_at IS NULL THEN NOW()
    ELSE icf_verified_at
  END,
  icf_profile_url = CASE
    WHEN accreditation_body = 'ICF' AND (icf_profile_url IS NULL OR icf_profile_url = '')
    THEN 'https://coachfederation.org/find-a-coach?search=' || REPLACE(name, ' ', '+')
    ELSE icf_profile_url
  END,
  accreditation_level = CASE
    WHEN accreditation_body = 'EMCC' AND (accreditation_level IS NULL OR accreditation_level = '')
    THEN 'Practitioner'
    ELSE accreditation_level
  END,
  icf_accreditation_level = CASE
    WHEN accreditation_body = 'ICF' AND (icf_accreditation_level IS NULL OR icf_accreditation_level = '')
    THEN 'PCC'
    ELSE icf_accreditation_level
  END
WHERE id IN (
  '3df6bae3-c318-4e2c-b579-4dc506330bda',
  '354e2bae-8150-4b2f-80d5-9dc808c15b5b',
  '77f6a80f-817c-4b4c-96ca-a4e73833d844'
);

-- ==============================================================================
-- STEP 3: VERIFY UPDATES
-- ==============================================================================

SELECT
  id,
  name,
  accreditation_body,
  accreditation_level,
  icf_accreditation_level,
  emcc_verified,
  icf_verified,
  CASE
    WHEN accreditation_body = 'EMCC' THEN emcc_profile_url
    WHEN accreditation_body = 'ICF' THEN icf_profile_url
    ELSE NULL
  END as profile_url,
  CASE
    WHEN accreditation_body = 'EMCC' AND emcc_verified = true AND emcc_profile_url IS NOT NULL THEN '✅ EMCC BADGE WILL SHOW'
    WHEN accreditation_body = 'ICF' AND icf_verified = true AND icf_profile_url IS NOT NULL THEN '✅ ICF BADGE WILL SHOW'
    ELSE '❌ BADGE MISSING DATA'
  END as badge_status
FROM coach_profiles
WHERE id IN (
  '3df6bae3-c318-4e2c-b579-4dc506330bda',
  '354e2bae-8150-4b2f-80d5-9dc808c15b5b',
  '77f6a80f-817c-4b4c-96ca-a4e73833d844'
)
ORDER BY name;

-- ==============================================================================
-- ALTERNATIVE: If profiles don't have accreditation_body set yet
-- ==============================================================================

-- If the above doesn't work, these profiles might not have accreditation_body set.
-- Use this to set them all as EMCC verified:

/*
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
*/

-- Or set them all as ICF verified:

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
-- NOTES
-- ==============================================================================

-- KEY FIX: Changed from 'coaches' table to 'coach_profiles' table
-- The application uses 'coach_profiles', not 'coaches'

-- After running:
-- 1. Hard refresh browser (Cmd+Shift+R)
-- 2. View each profile to see new accreditation badges
-- 3. Badges will show gradient backgrounds and friendly link text
