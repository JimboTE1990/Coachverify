-- ============================================
-- DIAGNOSE: Why Specialties & Formats Not Sticking
-- ============================================
-- Run this to understand the current database structure
-- ============================================

-- 1. Check if junction tables exist
SELECT 'Checking junction tables...' as step;

SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN (
  'coach_specialties',
  'coach_formats',
  'coach_certifications',
  'specialties',
  'formats',
  'certifications'
)
ORDER BY table_name;

-- 2. Check what columns exist in coaches table
SELECT 'Checking coaches table columns...' as step;

SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'coaches'
AND column_name IN (
  'specialties',
  'formats',
  'certifications',
  'coaching_expertise',
  'cpd_qualifications',
  'coaching_languages'
)
ORDER BY column_name;

-- 3. Check current coach_profiles view definition
SELECT 'Checking coach_profiles view...' as step;

SELECT definition
FROM pg_views
WHERE viewname = 'coach_profiles';

-- 4. Check actual data for a specific coach
SELECT 'Checking your actual data...' as step;

SELECT
  id,
  name,
  email,
  specialties,
  formats,
  certifications,
  coaching_expertise,
  cpd_qualifications,
  coaching_languages
FROM coaches
WHERE email = 'your-email@example.com'  -- Replace with your actual email
LIMIT 1;
