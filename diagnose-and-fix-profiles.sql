-- DIAGNOSTIC: Check current state of Jennifer Martinez and other coaches
-- Run this first to see what data we have

SELECT
  id,
  name,
  accreditation_body,
  emcc_verified,
  icf_verified,
  emcc_profile_url,
  icf_profile_url,
  photo_url
FROM coaches
WHERE name LIKE '%Jennifer%' OR name LIKE '%Martinez%' OR name LIKE '%Paul%' OR name LIKE '%Smith%' OR name LIKE '%Vijaya%'
ORDER BY name;

-- EXPLANATION OF ISSUE:
-- The accreditation badge will ONLY show if ALL these conditions are met:
-- 1. accreditation_body = 'EMCC' (or 'ICF')
-- 2. emcc_verified = true (or icf_verified = true for ICF)
-- 3. emcc_profile_url is not null/empty (or icf_profile_url for ICF)

-- If the badge isn't showing, it means one of these is missing.

-- ==============================================================================
-- FIX: Update Jennifer Martinez to show EMCC badge with profile link
-- ==============================================================================

-- Uncomment and run this ONLY if you want to set Jennifer Martinez as EMCC verified:
/*
UPDATE coaches
SET
  accreditation_body = 'EMCC',
  accreditation_level = 'Senior Practitioner',
  emcc_verified = true,
  emcc_verified_at = NOW(),
  emcc_profile_url = 'https://www.emccouncil.org/eu/en/directories/coaches?search=Jennifer+Martinez'
WHERE name = 'Jennifer Martinez';
*/

-- ==============================================================================
-- VERIFY: Check updated data
-- ==============================================================================

-- Run this after updating to verify the changes:
/*
SELECT
  id,
  name,
  accreditation_body,
  accreditation_level,
  emcc_verified,
  emcc_profile_url,
  photo_url
FROM coaches
WHERE name = 'Jennifer Martinez';
*/
