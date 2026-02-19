-- =============================================================================
-- SUPABASE DEPLOYMENT COMMANDS
-- Run these commands in Supabase SQL Editor after deploying code to production
-- =============================================================================

-- STEP 1: Add missing database columns
-- These migrations add support for country and referral tracking
-- -----------------------------------------------------------------------------

ALTER TABLE coaches ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'United Kingdom';
ALTER TABLE coaches ADD COLUMN IF NOT EXISTS referral_source TEXT;

-- STEP 2: Update dummy coaches with branded logo images
-- Sets CoachDog logos for all profiles that currently have placeholders
-- Profile photo: Logo Image only (dog icon)
-- Banner: Full CoachDog logo with text
-- -----------------------------------------------------------------------------

UPDATE coaches
SET
  photo_url = '/logo-image-only.png',
  banner_image_url = '/coachdog-logo.png'
WHERE
  -- Update coaches that have placeholder or missing images
  (photo_url LIKE '%picsum%' OR photo_url LIKE '%placeholder%' OR photo_url IS NULL OR photo_url = '')
  OR
  (banner_image_url IS NULL OR banner_image_url = '');

-- STEP 3: Refresh Supabase schema cache
-- Forces PostgREST to reload the schema and recognize new columns
-- -----------------------------------------------------------------------------

NOTIFY pgrst, 'reload schema';

-- STEP 4: Verify changes
-- Check that columns were added and coaches were updated
-- -----------------------------------------------------------------------------

-- Verify country column exists
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'coaches' AND column_name IN ('country', 'referral_source');

-- Count coaches with logo images
SELECT
  COUNT(*) as total_coaches,
  SUM(CASE WHEN photo_url = '/logo-image-only.png' THEN 1 ELSE 0 END) as coaches_with_logo_photo,
  SUM(CASE WHEN banner_image_url = '/coachdog-logo.png' THEN 1 ELSE 0 END) as coaches_with_logo_banner
FROM coaches;

-- =============================================================================
-- EXPECTED RESULTS
-- =============================================================================
--
-- After running these commands:
-- 1. country and referral_source columns should exist in coaches table
-- 2. All dummy coaches should have CoachDog logo images
-- 3. New signups will automatically get logo defaults
-- 4. Profile updates will work without custom_url constraint errors
-- 5. Accreditation badges will display correctly on coach profiles
--
-- =============================================================================
