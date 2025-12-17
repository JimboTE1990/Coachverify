-- Migration: Fix Supabase Security Issues
-- Date: 2024-12-17
-- Purpose: Enable RLS on public tables and fix view security definer issue

-- ============================================================================
-- ISSUE 1: Enable RLS on specialties table
-- ============================================================================

-- Enable RLS on specialties table
ALTER TABLE specialties ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anyone to read specialties (they're reference data)
CREATE POLICY "Anyone can view specialties"
  ON specialties FOR SELECT
  USING (true);

-- ============================================================================
-- ISSUE 2: Enable RLS on formats table
-- ============================================================================

-- Enable RLS on formats table
ALTER TABLE formats ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anyone to read formats (they're reference data)
CREATE POLICY "Anyone can view formats"
  ON formats FOR SELECT
  USING (true);

-- ============================================================================
-- ISSUE 3: Fix coach_profiles view SECURITY DEFINER issue
-- ============================================================================

-- Drop existing view
DROP VIEW IF EXISTS coach_profiles;

-- Recreate view WITHOUT SECURITY DEFINER (default is SECURITY INVOKER)
-- This means RLS policies of the querying user will be enforced, not the creator
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

-- Add RLS policy for the view (inherits from coaches table policies)
-- Note: Views don't have RLS themselves, but respect RLS of underlying tables

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Verify RLS is enabled on specialties
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename = 'specialties';

-- Verify RLS is enabled on formats
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename = 'formats';

-- Verify view exists and is queryable
SELECT COUNT(*) as coach_count
FROM coach_profiles;

-- Check that policies exist
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename IN ('specialties', 'formats')
ORDER BY tablename, policyname;

-- ============================================================================
-- SUMMARY
-- ============================================================================
-- This migration fixes three security issues:
-- 1. Enables RLS on specialties table with SELECT policy
-- 2. Enables RLS on formats table with SELECT policy
-- 3. Recreates coach_profiles view without SECURITY DEFINER
--    (uses default SECURITY INVOKER to enforce querying user's RLS policies)
