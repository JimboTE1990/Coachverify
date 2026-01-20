-- Fix RLS policies for reviews table to allow anonymous users to submit reviews
-- This fixes the 400 error when submitting reviews

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

-- Policy 2: Allow public READ access to non-spam reviews
CREATE POLICY "Allow public read reviews"
ON reviews
FOR SELECT
TO anon, authenticated, public
USING (is_spam = false OR is_spam IS NULL);

-- Policy 3: Allow authenticated coaches to UPDATE their own reviews via review_token
-- (This allows editing reviews if user has the token stored in localStorage)
CREATE POLICY "Allow review owner update"
ON reviews
FOR UPDATE
TO anon, authenticated
USING (true); -- Token validation happens in application layer

-- Policy 4: Allow review owner to DELETE their own reviews via token
CREATE POLICY "Allow review owner delete"
ON reviews
FOR DELETE
TO anon, authenticated
USING (true); -- Token validation happens in application layer

-- Add comments
COMMENT ON POLICY "Allow anonymous insert reviews" ON reviews IS 'Allows anyone to submit reviews (anonymous or authenticated)';
COMMENT ON POLICY "Allow public read reviews" ON reviews IS 'Allows anyone to read non-spam reviews';
COMMENT ON POLICY "Allow review owner update" ON reviews IS 'Allows review updates with token validation in app layer';
COMMENT ON POLICY "Allow review owner delete" ON reviews IS 'Allows review deletion with token validation in app layer';
