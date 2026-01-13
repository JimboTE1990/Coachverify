-- ============================================
-- Refresh coach_profiles VIEW to include new columns (SAFE VERSION)
-- ============================================
-- This version uses SELECT * to automatically include all columns
-- Much safer than manually listing columns that may not exist
-- ============================================

-- Step 1: Drop the existing view
DROP VIEW IF EXISTS coach_profiles CASCADE;

-- Step 2: Recreate the view using SELECT * with aggregated data
CREATE VIEW coach_profiles AS
SELECT
  c.*,  -- Include ALL columns from coaches table automatically

  -- Aggregated data from related tables
  COALESCE(
    (SELECT json_agg(s.specialty)
     FROM coach_specialties cs
     JOIN specialties s ON cs.specialty_id = s.id
     WHERE cs.coach_id = c.id),
    '[]'::json
  ) AS specialties,

  COALESCE(
    (SELECT json_agg(f.format)
     FROM coach_formats cf
     JOIN formats f ON cf.format_id = f.id
     WHERE cf.coach_id = c.id),
    '[]'::json
  ) AS formats,

  COALESCE(
    (SELECT json_agg(cert.certification)
     FROM coach_certifications cc
     JOIN certifications cert ON cc.certification_id = cert.id
     WHERE cc.coach_id = c.id),
    '[]'::json
  ) AS certifications,

  -- Languages (legacy field, may be superseded by coaching_languages)
  COALESCE(
    (SELECT json_agg(cl.language)
     FROM coach_languages cl
     WHERE cl.coach_id = c.id),
    '[]'::json
  ) AS languages,

  -- Review statistics
  COALESCE(
    (SELECT AVG(rating)::numeric(3,2)
     FROM reviews
     WHERE coach_id = c.id
     AND is_flagged = false),
    0
  ) AS average_rating,

  COALESCE(
    (SELECT COUNT(*)::integer
     FROM reviews
     WHERE coach_id = c.id
     AND is_flagged = false),
    0
  ) AS total_reviews

FROM coaches c;

-- ============================================
-- Verification
-- ============================================
-- Check that the view was created successfully:
SELECT COUNT(*) as total_coaches_in_view FROM coach_profiles;

-- Check that new columns are accessible:
SELECT
  id,
  name,
  email,
  CASE WHEN currency IS NOT NULL THEN 'YES' ELSE 'NO' END as has_currency,
  CASE WHEN gender IS NOT NULL THEN 'YES' ELSE 'NO' END as has_gender,
  CASE WHEN accreditation_level IS NOT NULL THEN 'YES' ELSE 'NO' END as has_accreditation
FROM coach_profiles
LIMIT 5;

-- Verify all new columns exist:
SELECT
  id,
  name,
  currency,
  gender,
  accreditation_level,
  coaching_hours,
  location_radius,
  additional_certifications,
  qualifications,
  acknowledgements,
  coaching_expertise,
  cpd_qualifications,
  coaching_languages
FROM coach_profiles
LIMIT 1;
