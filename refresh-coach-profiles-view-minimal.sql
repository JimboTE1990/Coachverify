-- ============================================
-- Refresh coach_profiles VIEW - MINIMAL VERSION
-- ============================================
-- This version just exposes all columns from coaches table
-- No complex joins - keeps it simple and guaranteed to work
-- ============================================

-- Step 1: Drop the existing view
DROP VIEW IF EXISTS coach_profiles CASCADE;

-- Step 2: Recreate the view - just pass through all coaches columns
CREATE VIEW coach_profiles AS
SELECT * FROM coaches;

-- ============================================
-- Verification
-- ============================================
-- Test the view works:
SELECT COUNT(*) as total_coaches FROM coach_profiles;

-- Verify new columns are now accessible:
SELECT
  id,
  name,
  email,
  currency,
  gender,
  accreditation_level,
  coaching_hours,
  location_radius,
  coaching_expertise,
  cpd_qualifications,
  coaching_languages,
  qualifications,
  acknowledgements,
  additional_certifications
FROM coach_profiles
WHERE id IS NOT NULL
LIMIT 2;

-- Check a specific coach to see their data:
-- SELECT * FROM coach_profiles WHERE email = 'your-email@example.com';
