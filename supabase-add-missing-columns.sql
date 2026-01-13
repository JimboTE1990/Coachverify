-- ============================================
-- Add Missing Columns to coaches Table
-- ============================================
-- Run this in Supabase SQL Editor to fix profile save errors
-- This adds all columns that the app expects but are missing from the database
-- NOTE: 'coach_profiles' is a VIEW - we need to alter the 'coaches' TABLE
-- ============================================

-- Step 1: Add currency column (if not already added)
ALTER TABLE coaches
ADD COLUMN IF NOT EXISTS currency VARCHAR(3) DEFAULT 'GBP';

-- Step 2: Add enhanced profile fields
ALTER TABLE coaches
ADD COLUMN IF NOT EXISTS accreditation_level VARCHAR(50),
ADD COLUMN IF NOT EXISTS additional_certifications JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS coaching_hours INTEGER,
ADD COLUMN IF NOT EXISTS location_radius VARCHAR(100),
ADD COLUMN IF NOT EXISTS qualifications JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS acknowledgements JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS coaching_expertise JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS cpd_qualifications JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS coaching_languages JSONB DEFAULT '["English"]'::jsonb;

-- Step 3: Add gender field (if not already added)
ALTER TABLE coaches
ADD COLUMN IF NOT EXISTS gender VARCHAR(50);

-- Step 4: Add constraints for valid values
-- Currency constraint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'valid_currency'
  ) THEN
    ALTER TABLE coaches
    ADD CONSTRAINT valid_currency CHECK (
      currency IN ('USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'CHF', 'CNY', 'INR', 'NZD')
    );
  END IF;
END $$;

-- Accreditation level constraint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'valid_accreditation_level'
  ) THEN
    ALTER TABLE coaches
    ADD CONSTRAINT valid_accreditation_level CHECK (
      accreditation_level IS NULL OR
      accreditation_level IN ('Foundation', 'Practitioner', 'Senior Practitioner', 'Master Practitioner')
    );
  END IF;
END $$;

-- Step 5: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_coaches_currency ON coaches(currency);
CREATE INDEX IF NOT EXISTS idx_coaches_accreditation ON coaches(accreditation_level);
CREATE INDEX IF NOT EXISTS idx_coaches_coaching_hours ON coaches(coaching_hours);

-- Step 6: Update existing coaches with default values where NULL
UPDATE coaches
SET currency = 'GBP'
WHERE currency IS NULL;

UPDATE coaches
SET additional_certifications = '[]'::jsonb
WHERE additional_certifications IS NULL;

UPDATE coaches
SET qualifications = '[]'::jsonb
WHERE qualifications IS NULL;

UPDATE coaches
SET acknowledgements = '[]'::jsonb
WHERE acknowledgements IS NULL;

UPDATE coaches
SET coaching_expertise = '[]'::jsonb
WHERE coaching_expertise IS NULL;

UPDATE coaches
SET cpd_qualifications = '[]'::jsonb
WHERE cpd_qualifications IS NULL;

UPDATE coaches
SET coaching_languages = '["English"]'::jsonb
WHERE coaching_languages IS NULL;

-- ============================================
-- Verification Queries
-- ============================================
-- Run these to verify all columns were added successfully:

-- Check all new columns exist
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns
WHERE table_name = 'coaches'
AND column_name IN (
  'currency',
  'accreditation_level',
  'additional_certifications',
  'coaching_hours',
  'location_radius',
  'qualifications',
  'acknowledgements',
  'coaching_expertise',
  'cpd_qualifications',
  'coaching_languages',
  'gender'
)
ORDER BY column_name;

-- Check constraints
SELECT conname, contype
FROM pg_constraint
WHERE conrelid = 'coaches'::regclass
AND conname IN ('valid_currency', 'valid_accreditation_level');

-- Count coaches with data
SELECT
  COUNT(*) as total_coaches,
  COUNT(currency) as with_currency,
  COUNT(accreditation_level) as with_accreditation,
  COUNT(coaching_hours) as with_coaching_hours,
  COUNT(gender) as with_gender
FROM coaches;
