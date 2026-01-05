-- Migration: Add Coaching Expertise, CPD Qualifications, and Enhanced Languages
-- Description: Adds comprehensive coaching expertise areas (7 categories), CPD qualifications, and enhanced language options
-- Date: 2026-01-03
-- FIXED: Now alters the base 'coaches' table instead of the 'coach_profiles' view

-- ============================================================
-- STEP 1: Add columns to the base 'coaches' table
-- ============================================================

-- Add coaching expertise (stored as JSONB array of strings)
ALTER TABLE coaches
ADD COLUMN coaching_expertise JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN coaches.coaching_expertise IS 'Array of coaching expertise areas from 7 categories: Career & Professional Development, Business & Entrepreneurship, Health & Wellness, Personal & Life, Financial, Niche & Demographic, Methodology & Modality (e.g., ["Executive Coaching", "Leadership Development", "Stress Management"])';

-- Add CPD qualifications (stored as JSONB array of strings)
ALTER TABLE coaches
ADD COLUMN cpd_qualifications JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN coaches.cpd_qualifications IS 'Array of CPD (Continuing Professional Development) qualifications and certifications (e.g., ["ICF Associate Certified Coach (ACC)", "EMCC Practitioner Level", "Mental Health First Aid (MHFA)"])';

-- Add enhanced coaching languages (stored as JSONB array of strings)
ALTER TABLE coaches
ADD COLUMN coaching_languages JSONB DEFAULT '["English"]'::jsonb;

COMMENT ON COLUMN coaches.coaching_languages IS 'Array of languages in which coaching sessions are offered (e.g., ["English", "Spanish", "French", "Mandarin Chinese"])';

-- ============================================================
-- STEP 2: Create GIN indexes for efficient array containment queries
-- ============================================================

CREATE INDEX idx_coaches_coaching_expertise ON coaches USING GIN (coaching_expertise);
CREATE INDEX idx_coaches_cpd_qualifications ON coaches USING GIN (cpd_qualifications);
CREATE INDEX idx_coaches_coaching_languages ON coaches USING GIN (coaching_languages);

-- ============================================================
-- STEP 3: Update the coach_profiles view to include new columns
-- ============================================================

-- Drop the existing view first
DROP VIEW IF EXISTS coach_profiles;

-- Recreate the view with new columns
CREATE VIEW coach_profiles AS
SELECT
  c.id,
  c.user_id,
  c.name,
  c.email,
  c.phone_number,
  c.photo_url,
  c.bio,
  c.location,
  c.hourly_rate,
  c.years_experience,
  c.is_verified,
  c.documents_submitted,
  c.verification_body,
  c.verification_number,
  c.verified_at,
  c.subscription_status,
  c.billing_cycle,
  c.trial_ends_at,
  c.last_payment_date,
  c.two_factor_enabled,
  c.created_at,
  c.updated_at,
  -- NEW COLUMNS:
  c.coaching_expertise,
  c.cpd_qualifications,
  c.coaching_languages,
  -- Aggregated columns
  COALESCE(AVG(r.rating), 0) as avg_rating,
  COUNT(DISTINCT r.id) as review_count,
  COUNT(DISTINCT pv.id) as total_profile_views,
  ARRAY_AGG(DISTINCT s.name) FILTER (WHERE s.name IS NOT NULL) as specialties,
  ARRAY_AGG(DISTINCT f.name) FILTER (WHERE f.name IS NOT NULL) as formats,
  ARRAY_AGG(DISTINCT cert.name) FILTER (WHERE cert.name IS NOT NULL) as certifications
FROM coaches c
LEFT JOIN reviews r ON c.id = r.coach_id
LEFT JOIN profile_views pv ON c.id = pv.coach_id
LEFT JOIN coach_specialties cs ON c.id = cs.coach_id
LEFT JOIN specialties s ON cs.specialty_id = s.id
LEFT JOIN coach_formats cf ON c.id = cf.coach_id
LEFT JOIN formats f ON cf.format_id = f.id
LEFT JOIN certifications cert ON c.id = cert.coach_id
GROUP BY c.id, c.user_id, c.name, c.email, c.phone_number, c.photo_url, c.bio,
         c.location, c.hourly_rate, c.years_experience, c.is_verified,
         c.documents_submitted, c.verification_body, c.verification_number,
         c.verified_at, c.subscription_status, c.billing_cycle, c.trial_ends_at,
         c.last_payment_date, c.two_factor_enabled, c.created_at, c.updated_at,
         c.coaching_expertise, c.cpd_qualifications, c.coaching_languages;

-- ============================================================
-- STEP 4: Verify the migration
-- ============================================================

-- Verify new columns exist in coaches table
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'coaches'
  AND column_name IN ('coaching_expertise', 'cpd_qualifications', 'coaching_languages')
ORDER BY column_name;

-- Verify view includes new columns
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'coach_profiles'
  AND column_name IN ('coaching_expertise', 'cpd_qualifications', 'coaching_languages')
ORDER BY column_name;

-- ============================================================
-- Migration Notes:
-- ============================================================
-- 1. All new fields are nullable with sensible defaults (empty arrays for expertise/qualifications, ["English"] for languages)
-- 2. GIN indexes support efficient filtering by expertise area, qualification, or language
-- 3. coaching_languages supersedes the existing "languages" field (keeping both for backward compatibility)
-- 4. coaching_expertise provides much more granular filtering than the legacy "specialties" field
-- 5. cpd_qualifications allows coaches to showcase professional development beyond basic accreditation
-- 6. View must be recreated whenever base table schema changes

-- Example coaching_expertise data:
-- [
--   "Executive Coaching",
--   "Leadership Development",
--   "Career Transition",
--   "Stress Management",
--   "Work-Life Balance",
--   "Mindfulness-Based Coaching"
-- ]

-- Example cpd_qualifications data:
-- [
--   "ICF Professional Certified Coach (PCC)",
--   "EMCC Senior Practitioner Level",
--   "Mental Health First Aid (MHFA)",
--   "Trauma-Informed Coaching Certificate",
--   "NLP Master Practitioner Certification"
-- ]

-- Example coaching_languages data:
-- [
--   "English",
--   "Spanish",
--   "French",
--   "Mandarin Chinese"
-- ]

-- Search Performance Notes:
-- GIN indexes enable fast queries like:
--   - Find coaches with specific expertise: WHERE coaching_expertise @> '["Executive Coaching"]'
--   - Find coaches with CPD qualification: WHERE cpd_qualifications @> '["ICF PCC"]'
--   - Find coaches offering sessions in language: WHERE coaching_languages @> '["Spanish"]'
--   - Combined filters: WHERE coaching_expertise @> '["Leadership"]' AND coaching_languages @> '["French"]'
