-- Complete Fix for Profile Photos & Accreditation Badges
-- Copy and paste this entire file into Supabase SQL Editor

-- ==============================================================================
-- STEP 1: CHECK CURRENT STATE (Diagnostic)
-- ==============================================================================

SELECT
  name,
  accreditation_body,
  emcc_verified,
  icf_verified,
  emcc_profile_url,
  icf_profile_url,
  accreditation_level,
  SUBSTRING(photo_url FROM 1 FOR 50) as photo_preview
FROM coaches
WHERE name IN ('Jennifer Martinez', 'Paul Smith', 'Vijaya Gowrisankar')
ORDER BY name;

-- ==============================================================================
-- STEP 2: FIX JENNIFER MARTINEZ
-- ==============================================================================
-- Set as EMCC verified with profile URL and locked photo

UPDATE coaches
SET
  accreditation_body = 'EMCC',
  accreditation_level = 'Senior Practitioner',
  emcc_verified = true,
  emcc_verified_at = NOW(),
  emcc_profile_url = 'https://www.emccouncil.org/eu/en/directories/coaches?search=Jennifer+Martinez',
  photo_url = 'https://picsum.photos/seed/jennifer-martinez/200/200'
WHERE name = 'Jennifer Martinez';

-- ==============================================================================
-- STEP 3: FIX PAUL SMITH
-- ==============================================================================
-- Set as EMCC verified with profile URL and locked photo

UPDATE coaches
SET
  accreditation_body = 'EMCC',
  accreditation_level = 'Practitioner',
  emcc_verified = true,
  emcc_verified_at = NOW(),
  emcc_profile_url = 'https://www.emccouncil.org/eu/en/directories/coaches?search=Paul+Smith',
  photo_url = 'https://picsum.photos/seed/paul-smith/200/200'
WHERE name = 'Paul Smith';

-- ==============================================================================
-- STEP 4: FIX VIJAYA GOWRISANKAR
-- ==============================================================================
-- Set as ICF verified with profile URL and locked photo

UPDATE coaches
SET
  accreditation_body = 'ICF',
  icf_accreditation_level = 'PCC',
  icf_verified = true,
  icf_verified_at = NOW(),
  icf_profile_url = 'https://coachfederation.org/find-a-coach?search=Vijaya+Gowrisankar',
  photo_url = 'https://picsum.photos/seed/vijaya-gowrisankar/200/200'
WHERE name = 'Vijaya Gowrisankar';

-- ==============================================================================
-- STEP 5: VERIFY ALL CHANGES
-- ==============================================================================

SELECT
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
  SUBSTRING(photo_url FROM 1 FOR 60) as photo_url_preview,
  CASE
    WHEN accreditation_body = 'EMCC' AND emcc_verified = true AND emcc_profile_url IS NOT NULL THEN '✅ BADGE WILL SHOW'
    WHEN accreditation_body = 'ICF' AND icf_verified = true AND icf_profile_url IS NOT NULL THEN '✅ BADGE WILL SHOW'
    ELSE '❌ BADGE MISSING DATA'
  END as badge_status
FROM coaches
WHERE name IN ('Jennifer Martinez', 'Paul Smith', 'Vijaya Gowrisankar')
ORDER BY name;

-- ==============================================================================
-- EXPECTED RESULTS AFTER RUNNING
-- ==============================================================================

-- Jennifer Martinez:
-- ✅ Large EMCC badge with navy blue border and gold accents
-- ✅ "VERIFIED ACCREDITATION" heading
-- ✅ "Senior Practitioner" level shown
-- ✅ Clickable link: "Verify on EMCC Directory"
-- ✅ Photo locked to same image every time

-- Paul Smith:
-- ✅ Large EMCC badge with navy blue border and gold accents
-- ✅ "VERIFIED ACCREDITATION" heading
-- ✅ "Practitioner" level shown
-- ✅ Clickable link: "Verify on EMCC Directory"
-- ✅ Photo locked to same image every time

-- Vijaya Gowrisankar:
-- ✅ Large ICF badge with navy blue border
-- ✅ "VERIFIED ACCREDITATION" heading
-- ✅ "International Coaching Federation" subtitle
-- ✅ "PCC" credential level shown
-- ✅ Clickable link: "Verify on ICF Directory"
-- ✅ Photo locked to same image every time
