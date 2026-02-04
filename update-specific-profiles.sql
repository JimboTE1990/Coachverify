-- Update Specific Coach Profiles with Accreditation Badges
-- These are profiles created by user that need the new accreditation display

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
  SUBSTRING(photo_url FROM 1 FOR 50) as photo_preview
FROM coaches
WHERE id IN (
  '3df6bae3-c318-4e2c-b579-4dc506330bda',
  '354e2bae-8150-4b2f-80d5-9dc808c15b5b',
  '77f6a80f-817c-4b4c-96ca-a4e73833d844'
)
ORDER BY name;

-- ==============================================================================
-- STEP 2: UPDATE PROFILES BASED ON THEIR ACCREDITATION BODY
-- ==============================================================================

-- Option A: If they should be EMCC verified
-- Uncomment and run for coaches that need EMCC badges:

/*
UPDATE coaches
SET
  emcc_verified = true,
  emcc_verified_at = NOW(),
  emcc_profile_url = CASE
    WHEN emcc_profile_url IS NULL OR emcc_profile_url = ''
    THEN 'https://www.emccouncil.org/eu/en/directories/coaches?search=' || REPLACE(name, ' ', '+')
    ELSE emcc_profile_url
  END,
  accreditation_level = CASE
    WHEN accreditation_level IS NULL OR accreditation_level = ''
    THEN 'Practitioner'
    ELSE accreditation_level
  END
WHERE id IN (
  '3df6bae3-c318-4e2c-b579-4dc506330bda',
  '354e2bae-8150-4b2f-80d5-9dc808c15b5b',
  '77f6a80f-817c-4b4c-96ca-a4e73833d844'
)
AND accreditation_body = 'EMCC';
*/

-- Option B: If they should be ICF verified
-- Uncomment and run for coaches that need ICF badges:

/*
UPDATE coaches
SET
  icf_verified = true,
  icf_verified_at = NOW(),
  icf_profile_url = CASE
    WHEN icf_profile_url IS NULL OR icf_profile_url = ''
    THEN 'https://coachfederation.org/find-a-coach?search=' || REPLACE(name, ' ', '+')
    ELSE icf_profile_url
  END,
  icf_accreditation_level = CASE
    WHEN icf_accreditation_level IS NULL OR icf_accreditation_level = ''
    THEN 'PCC'
    ELSE icf_accreditation_level
  END
WHERE id IN (
  '3df6bae3-c318-4e2c-b579-4dc506330bda',
  '354e2bae-8150-4b2f-80d5-9dc808c15b5b',
  '77f6a80f-817c-4b4c-96ca-a4e73833d844'
)
AND accreditation_body = 'ICF';
*/

-- Option C: Update ALL three profiles regardless of accreditation body
-- This sets EMCC for EMCC coaches and ICF for ICF coaches:

UPDATE coaches
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
FROM coaches
WHERE id IN (
  '3df6bae3-c318-4e2c-b579-4dc506330bda',
  '354e2bae-8150-4b2f-80d5-9dc808c15b5b',
  '77f6a80f-817c-4b4c-96ca-a4e73833d844'
)
ORDER BY name;

-- ==============================================================================
-- NOTES
-- ==============================================================================

-- This script:
-- 1. Checks current state of the three profiles
-- 2. Sets emcc_verified or icf_verified to true based on accreditation_body
-- 3. Adds profile URLs if missing (using coach name in search URL)
-- 4. Sets default accreditation levels if missing
-- 5. Verifies all changes

-- After running:
-- - Hard refresh browser (Cmd+Shift+R)
-- - View each profile to see the new accreditation badges
-- - Badges will show:
--   * Gradient background (navy to gold for EMCC, navy to light blue for ICF)
--   * Subtle border blending with profile theme
--   * "Check out my [EMCC/ICF] accreditation here" link
