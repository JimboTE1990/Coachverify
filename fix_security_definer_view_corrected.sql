-- Migration: Fix SECURITY DEFINER issue on coach_profiles view (CORRECTED VERSION)
-- Date: 2026-01-09
-- Purpose: Replace SECURITY DEFINER with SECURITY INVOKER to enforce RLS properly
-- Note: This version removes first_name and last_name columns as they don't exist in the coaches table yet

-- Step 1: Drop the existing view
DROP VIEW IF EXISTS public.coach_profiles;

-- Step 2: Recreate the view with SECURITY INVOKER
-- This ensures the view enforces permissions and RLS policies of the querying user
CREATE OR REPLACE VIEW public.coach_profiles
WITH (security_invoker = true)
AS
SELECT
  c.id,
  c.user_id,
  c.email,
  c.name,
  c.date_of_birth,
  c.photo_url,
  c.bio,
  c.specialties,
  c.hourly_rate,
  c.location,
  c.is_verified,
  c.accreditation_body,
  c.accreditation_level,
  c.registration_number,
  c.coaching_hours,
  c.additional_certifications,
  c.certifications,
  c.qualifications,
  c.coaching_expertise,
  c.cpd_qualifications,
  c.coaching_languages,
  c.coaching_formats,
  c.location_radius,
  c.acknowledgements,
  c.subscription_status,
  c.billing_cycle,
  c.trial_ends_at,
  c.subscription_ends_at,
  c.created_at,
  c.updated_at
FROM coaches c;

-- Step 3: Grant appropriate permissions to authenticated users
-- Users can only view their own profile or public profiles
GRANT SELECT ON public.coach_profiles TO authenticated;
GRANT SELECT ON public.coach_profiles TO anon;

-- Step 4: Ensure RLS is enabled on the underlying coaches table
ALTER TABLE coaches ENABLE ROW LEVEL SECURITY;

-- Step 5: Create RLS policies if they don't exist

-- Policy: Coaches can view their own profile
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename = 'coaches'
    AND policyname = 'Coaches can view own profile'
  ) THEN
    CREATE POLICY "Coaches can view own profile"
      ON coaches
      FOR SELECT
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- Policy: Coaches can update their own profile
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename = 'coaches'
    AND policyname = 'Coaches can update own profile'
  ) THEN
    CREATE POLICY "Coaches can update own profile"
      ON coaches
      FOR UPDATE
      TO authenticated
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- Policy: Public can view active coach profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename = 'coaches'
    AND policyname = 'Public can view active coaches'
  ) THEN
    CREATE POLICY "Public can view active coaches"
      ON coaches
      FOR SELECT
      TO anon, authenticated
      USING (
        subscription_status IN ('active', 'trial')
        AND is_verified = true
      );
  END IF;
END $$;

-- Step 6: Verification query
-- Check that the view is now using SECURITY INVOKER
SELECT
  viewname,
  definition
FROM pg_views
WHERE schemaname = 'public'
  AND viewname = 'coach_profiles';

-- Check RLS policies
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'coaches'
ORDER BY policyname;

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'View coach_profiles has been recreated with SECURITY INVOKER';
  RAISE NOTICE 'RLS policies have been applied to coaches table';
  RAISE NOTICE 'Security issue resolved!';
END $$;
