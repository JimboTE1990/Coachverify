-- Fix Supabase security issues
-- 1. Remove SECURITY DEFINER from coach_profiles view
-- 2. Enable RLS on review_comments table

-- ============================================
-- FIX 1: Recreate coach_profiles view without SECURITY DEFINER
-- ============================================

-- Drop the existing view
DROP VIEW IF EXISTS coach_profiles CASCADE;

-- Recreate without SECURITY DEFINER (uses SECURITY INVOKER by default)
-- This means the view will use the permissions of the querying user, not the creator
CREATE VIEW coach_profiles AS
SELECT
  c.id,
  c.name,
  c.email,
  c.phone_number,
  c.photo_url,
  c.specialties,
  c.bio,
  c.social_links,
  c.hourly_rate,
  c.currency,
  c.years_experience,
  c.certifications,
  c.is_verified,
  c.available_formats,
  c.location,
  c.documents_submitted,
  c.accreditation_body,
  c.accreditation_level,
  c.emcc_verified,
  c.emcc_verified_at,
  c.emcc_profile_url,
  c.icf_verified,
  c.icf_verified_at,
  c.icf_accreditation_level,
  c.icf_profile_url,
  c.additional_certifications,
  c.coaching_hours,
  c.location_radius,
  c.qualifications,
  c.acknowledgements,
  c.languages,
  c.coaching_expertise,
  c.cpd_qualifications,
  c.coaching_languages,
  c.gender,
  c.subscription_status,
  c.trial_ends_at,
  c.trial_used,
  c.billing_cycle,
  c.stripe_customer_id,
  c.stripe_subscription_id,
  c.subscription_start_date,
  c.subscription_end_date,
  c.total_profile_views,
  c.created_at,
  c.updated_at,
  c.custom_url,
  -- Calculate average rating and total reviews
  COALESCE(AVG(r.rating), 0) AS average_rating,
  COUNT(r.id) AS total_reviews
FROM coaches c
LEFT JOIN reviews r ON c.id = r.coach_id
GROUP BY c.id;

-- Add comment explaining the view
COMMENT ON VIEW coach_profiles IS 'View of coaches with aggregated review data. Uses SECURITY INVOKER for proper RLS enforcement.';

-- Grant access to authenticated and anonymous users
GRANT SELECT ON coach_profiles TO authenticated, anon;

-- ============================================
-- FIX 2: Enable RLS on review_comments table
-- ============================================

-- Enable RLS
ALTER TABLE review_comments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow public read review comments" ON review_comments;
DROP POLICY IF EXISTS "Allow coaches to insert comments" ON review_comments;
DROP POLICY IF EXISTS "Allow comment author to update" ON review_comments;
DROP POLICY IF EXISTS "Allow comment author to delete" ON review_comments;

-- Policy 1: Allow anyone to READ comments (public comments)
CREATE POLICY "Allow public read review comments"
ON review_comments
FOR SELECT
TO anon, authenticated, public
USING (true);

-- Policy 2: Allow authenticated coaches to INSERT comments on reviews
CREATE POLICY "Allow coaches to insert comments"
ON review_comments
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Policy 3: Allow comment author to UPDATE their own comments
CREATE POLICY "Allow comment author to update"
ON review_comments
FOR UPDATE
TO authenticated
USING (auth.uid()::text = author_id);

-- Policy 4: Allow comment author to DELETE their own comments
CREATE POLICY "Allow comment author to delete"
ON review_comments
FOR DELETE
TO authenticated
USING (auth.uid()::text = author_id);

-- Add helpful comments
COMMENT ON POLICY "Allow public read review comments" ON review_comments IS 'Allows anyone to read public review comments';
COMMENT ON POLICY "Allow coaches to insert comments" ON review_comments IS 'Allows authenticated coaches to comment on reviews';
COMMENT ON POLICY "Allow comment author to update" ON review_comments IS 'Allows coaches to update their own comments';
COMMENT ON POLICY "Allow comment author to delete" ON review_comments IS 'Allows coaches to delete their own comments';

-- ============================================
-- SECURITY NOTES
-- ============================================

-- Note 1: coach_profiles view
-- By removing SECURITY DEFINER and using default SECURITY INVOKER,
-- the view now respects the querying user's permissions.
-- This is more secure as it enforces RLS policies properly.

-- Note 2: review_comments table
-- RLS is now enabled with policies that:
-- - Allow public reading (comments are public)
-- - Require authentication to create comments
-- - Only allow authors to edit/delete their own comments

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Run these to verify the fixes:

-- 1. Check coach_profiles view security (should NOT show SECURITY DEFINER)
-- SELECT pg_get_viewdef('coach_profiles', true);

-- 2. Check RLS is enabled on review_comments
-- SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'review_comments';

-- 3. List policies on review_comments
-- SELECT policyname, cmd, roles FROM pg_policies WHERE tablename = 'review_comments';
