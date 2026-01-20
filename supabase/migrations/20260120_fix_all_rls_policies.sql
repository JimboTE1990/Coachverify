-- Comprehensive RLS policy fix for reviews and profile_views tables
-- This fixes all 400 errors when submitting reviews and tracking profile views

-- ============================================
-- REVIEWS TABLE RLS POLICIES
-- ============================================

-- Enable RLS on reviews table if not already enabled
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Allow anonymous insert reviews" ON reviews;
DROP POLICY IF EXISTS "Allow public read reviews" ON reviews;
DROP POLICY IF EXISTS "Allow review owner update" ON reviews;
DROP POLICY IF EXISTS "Allow review owner delete" ON reviews;

-- Policy 1: Allow anonymous users to INSERT reviews (public can submit reviews)
CREATE POLICY "Allow anonymous insert reviews"
ON reviews
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Policy 2: Allow public READ access to all reviews
CREATE POLICY "Allow public read reviews"
ON reviews
FOR SELECT
TO anon, authenticated, public
USING (true);

-- Policy 3: Allow UPDATE for review management
CREATE POLICY "Allow review owner update"
ON reviews
FOR UPDATE
TO anon, authenticated
USING (true);

-- Policy 4: Allow DELETE for review management
CREATE POLICY "Allow review owner delete"
ON reviews
FOR DELETE
TO anon, authenticated
USING (true);

-- ============================================
-- PROFILE_VIEWS TABLE RLS POLICIES
-- ============================================

-- Enable RLS on profile_views table if not already enabled
ALTER TABLE profile_views ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow anonymous insert profile views" ON profile_views;
DROP POLICY IF EXISTS "Allow public read profile views" ON profile_views;

-- Policy 1: Allow anonymous users to INSERT profile views (track anonymous visits)
CREATE POLICY "Allow anonymous insert profile views"
ON profile_views
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Policy 2: Allow reading profile views (for analytics)
CREATE POLICY "Allow public read profile views"
ON profile_views
FOR SELECT
TO anon, authenticated
USING (true);

-- ============================================
-- ADD HELPFUL COMMENTS
-- ============================================

COMMENT ON POLICY "Allow anonymous insert reviews" ON reviews IS 'Allows anyone to submit reviews (anonymous or authenticated)';
COMMENT ON POLICY "Allow public read reviews" ON reviews IS 'Allows anyone to read reviews';
COMMENT ON POLICY "Allow review owner update" ON reviews IS 'Allows review updates with token validation in app layer';
COMMENT ON POLICY "Allow review owner delete" ON reviews IS 'Allows review deletion with token validation in app layer';

COMMENT ON POLICY "Allow anonymous insert profile views" ON profile_views IS 'Allows tracking profile views from anonymous and authenticated users';
COMMENT ON POLICY "Allow public read profile views" ON profile_views IS 'Allows reading profile view analytics';
