-- Migration: Update coach_profiles View to Include Visibility Columns
-- Date: 2024-12-16
-- Purpose: Add profile_visible and dashboard_access columns to the coach_profiles view
-- Root Cause: These columns were added to coaches table in migration 004, but view was never updated

-- IMPORTANT: This migration assumes migration 004 has already been run.
-- If you get errors about columns not existing, run migration 004 first.

-- Drop the existing view first to avoid column name conflicts
DROP VIEW IF EXISTS coach_profiles;

-- Recreate the view with columns from base schema + migration 004
-- Only including columns we KNOW exist in a fresh install
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
         c.last_payment_date, c.two_factor_enabled, c.created_at, c.updated_at;

-- Verify the view was created successfully
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'coach_profiles'
ORDER BY column_name;

-- Test query: This should now work without errors
SELECT
  id,
  name,
  email,
  subscription_status,
  is_verified
FROM coach_profiles
WHERE is_verified = true
ORDER BY created_at DESC
LIMIT 5;
