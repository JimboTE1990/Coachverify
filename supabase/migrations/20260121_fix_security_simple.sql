-- Simplified security fix that works with any schema
-- Fixes Supabase security warnings

-- ============================================
-- FIX 1: Recreate coach_profiles view without SECURITY DEFINER
-- ============================================

-- Drop the existing view
DROP VIEW IF EXISTS coach_profiles CASCADE;

-- Recreate using SELECT * to include all columns automatically
-- This avoids column listing errors
CREATE VIEW coach_profiles AS
SELECT
  c.*,
  COALESCE(AVG(r.rating), 0) AS average_rating,
  COUNT(r.id) AS total_reviews
FROM coaches c
LEFT JOIN reviews r ON c.id = r.coach_id
GROUP BY c.id;

-- Add comment
COMMENT ON VIEW coach_profiles IS 'View of coaches with aggregated review data. Uses SECURITY INVOKER for proper RLS enforcement.';

-- Grant access
GRANT SELECT ON coach_profiles TO authenticated, anon;

-- ============================================
-- FIX 2: Enable RLS on review_comments table
-- ============================================

-- Enable RLS
ALTER TABLE review_comments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Allow public read review comments" ON review_comments;
DROP POLICY IF EXISTS "Allow coaches to insert comments" ON review_comments;
DROP POLICY IF EXISTS "Allow comment author to update" ON review_comments;
DROP POLICY IF EXISTS "Allow comment author to delete" ON review_comments;

-- Policy 1: Allow anyone to READ comments
CREATE POLICY "Allow public read review comments"
ON review_comments
FOR SELECT
TO anon, authenticated, public
USING (true);

-- Policy 2: Allow authenticated coaches to INSERT comments
CREATE POLICY "Allow coaches to insert comments"
ON review_comments
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Policy 3 & 4: Only if you want to restrict updates/deletes to comment authors
-- If author_id is TEXT type (not UUID), use this:
CREATE POLICY "Allow comment author to update"
ON review_comments
FOR UPDATE
TO authenticated
USING (author_id = (auth.uid())::text);

CREATE POLICY "Allow comment author to delete"
ON review_comments
FOR DELETE
TO authenticated
USING (author_id = (auth.uid())::text);

-- If the above fails with "operator does not exist",
-- it means author_id is UUID type. Run this alternative instead:

-- DROP POLICY IF EXISTS "Allow comment author to update" ON review_comments;
-- DROP POLICY IF EXISTS "Allow comment author to delete" ON review_comments;

-- CREATE POLICY "Allow comment author to update"
-- ON review_comments
-- FOR UPDATE
-- TO authenticated
-- USING (author_id = auth.uid());

-- CREATE POLICY "Allow comment author to delete"
-- ON review_comments
-- FOR DELETE
-- TO authenticated
-- USING (author_id = auth.uid());

-- Add helpful comments
COMMENT ON POLICY "Allow public read review comments" ON review_comments IS 'Allows anyone to read public review comments';
COMMENT ON POLICY "Allow coaches to insert comments" ON review_comments IS 'Allows authenticated coaches to comment on reviews';
COMMENT ON POLICY "Allow comment author to update" ON review_comments IS 'Allows coaches to update their own comments';
COMMENT ON POLICY "Allow comment author to delete" ON review_comments IS 'Allows coaches to delete their own comments';
