-- ============================================
-- FIX: Add Specialties, Formats, AND Certifications Columns
-- ============================================
-- This adds ALL missing columns so matching criteria can persist
-- ============================================

-- Add specialties, formats, AND certifications as JSONB columns
ALTER TABLE coaches
ADD COLUMN IF NOT EXISTS specialties JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS formats JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS certifications JSONB DEFAULT '[]'::jsonb;

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_coaches_specialties ON coaches USING GIN (specialties);
CREATE INDEX IF NOT EXISTS idx_coaches_formats ON coaches USING GIN (formats);
CREATE INDEX IF NOT EXISTS idx_coaches_certifications ON coaches USING GIN (certifications);

-- ============================================
-- Refresh the coach_profiles view
-- ============================================
DROP VIEW IF EXISTS coach_profiles CASCADE;

CREATE VIEW coach_profiles AS
SELECT * FROM coaches;

-- ============================================
-- Verification
-- ============================================
-- Check ALL columns were added:
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'coaches'
AND column_name IN ('specialties', 'formats', 'certifications')
ORDER BY column_name;

-- Test the view includes ALL new columns:
SELECT
  id,
  name,
  email,
  specialties,
  formats,
  certifications,
  currency,
  gender,
  coaching_expertise,
  cpd_qualifications,
  coaching_languages
FROM coach_profiles
WHERE id IS NOT NULL
LIMIT 2;
