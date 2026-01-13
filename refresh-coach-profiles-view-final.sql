-- ============================================
-- Refresh coach_profiles VIEW - FINAL VERSION
-- ============================================
-- This version uses the actual column names from your database
-- ============================================

-- Step 1: Drop the existing view
DROP VIEW IF EXISTS coach_profiles CASCADE;

-- Step 2: Recreate the view with proper column names
CREATE VIEW coach_profiles AS
SELECT
  c.*,  -- Include ALL columns from coaches table

  -- Aggregated specialties (check if column is 'name' or 'specialty')
  COALESCE(
    (SELECT json_agg(s.name)
     FROM coach_specialties cs
     JOIN specialties s ON cs.specialty_id = s.id
     WHERE cs.coach_id = c.id),
    '[]'::json
  ) AS specialties,

  -- Aggregated formats
  COALESCE(
    (SELECT json_agg(f.name)
     FROM coach_formats cf
     JOIN formats f ON cf.format_id = f.id
     WHERE cf.coach_id = c.id),
    '[]'::json
  ) AS formats,

  -- Aggregated certifications
  COALESCE(
    (SELECT json_agg(cert.name)
     FROM coach_certifications cc
     JOIN certifications cert ON cc.certification_id = cert.id
     WHERE cc.coach_id = c.id),
    '[]'::json
  ) AS certifications,

  -- Languages (legacy field - check if coach_languages table exists)
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
-- Test the view:
SELECT COUNT(*) as total_coaches FROM coach_profiles;

-- Check new columns are accessible:
SELECT
  id,
  name,
  currency,
  gender,
  accreditation_level,
  coaching_hours,
  coaching_expertise,
  cpd_qualifications,
  coaching_languages
FROM coach_profiles
LIMIT 2;
