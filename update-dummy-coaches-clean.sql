-- Clean SQL without markdown - Copy and paste this into Supabase SQL Editor

-- Update EMCC verified coaches with placeholder URLs
UPDATE coaches
SET emcc_profile_url = 'https://www.emccouncil.org/eu/en/directories/coaches?search=' || REPLACE(name, ' ', '+')
WHERE accreditation_body = 'EMCC'
  AND emcc_verified = true
  AND (emcc_profile_url IS NULL OR emcc_profile_url = '');

-- Update ICF verified coaches with placeholder URLs
UPDATE coaches
SET icf_profile_url = 'https://coachfederation.org/find-a-coach?search=' || REPLACE(name, ' ', '+')
WHERE accreditation_body = 'ICF'
  AND icf_verified = true
  AND (icf_profile_url IS NULL OR icf_profile_url = '');

-- Verify the updates
SELECT
  id,
  name,
  accreditation_body,
  emcc_verified,
  icf_verified,
  CASE
    WHEN accreditation_body = 'EMCC' THEN emcc_profile_url
    WHEN accreditation_body = 'ICF' THEN icf_profile_url
    ELSE NULL
  END as profile_url
FROM coaches
WHERE (emcc_verified = true OR icf_verified = true)
  AND (emcc_profile_url IS NOT NULL OR icf_profile_url IS NOT NULL)
ORDER BY name;
