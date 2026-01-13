-- ============================================
-- FIX: Add Specialties and Formats Columns
-- ============================================
-- This adds missing columns so specialties/formats can persist
-- ============================================

-- Add specialties and formats as JSONB columns
ALTER TABLE coaches
ADD COLUMN IF NOT EXISTS specialties JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS formats JSONB DEFAULT '[]'::jsonb;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_coaches_specialties ON coaches USING GIN (specialties);
CREATE INDEX IF NOT EXISTS idx_coaches_formats ON coaches USING GIN (formats);

-- ============================================
-- Refresh the coach_profiles view
-- ============================================
DROP VIEW IF EXISTS coach_profiles CASCADE;

CREATE VIEW coach_profiles AS
SELECT * FROM coaches;

-- ============================================
-- Verification
-- ============================================
-- Check columns were added:
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'coaches'
AND column_name IN ('specialties', 'formats')
ORDER BY column_name;

-- Test the view includes new columns:
SELECT
  id,
  name,
  email,
  specialties,
  formats,
  currency,
  gender,
  coaching_expertise,
  cpd_qualifications,
  coaching_languages
FROM coach_profiles
WHERE id IS NOT NULL
LIMIT 2;
