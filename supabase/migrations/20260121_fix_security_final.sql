-- Final security fix - clean version without errors
-- Fixes both Supabase security warnings

-- ============================================
-- FIX 1: Recreate coach_profiles view without SECURITY DEFINER
-- ============================================

-- First check if view exists and drop it
DROP VIEW IF EXISTS coach_profiles CASCADE;

-- Simply pass through all columns from coaches table
-- The coaches table already has average_rating and total_reviews columns
-- so we don't need to calculate them here
CREATE VIEW coach_profiles AS
SELECT *
FROM coaches;

GRANT SELECT ON coach_profiles TO authenticated, anon;

-- ============================================
-- FIX 2: Enable RLS on review_comments table
-- ============================================

ALTER TABLE review_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read review comments" ON review_comments;
DROP POLICY IF EXISTS "Allow coaches to insert comments" ON review_comments;
DROP POLICY IF EXISTS "Allow comment author to update" ON review_comments;
DROP POLICY IF EXISTS "Allow comment author to delete" ON review_comments;

-- Allow anyone to read comments
CREATE POLICY "Allow public read review comments"
ON review_comments
FOR SELECT
TO anon, authenticated, public
USING (true);

-- Allow authenticated users to insert comments
CREATE POLICY "Allow coaches to insert comments"
ON review_comments
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Allow comment author to update own comments (assuming author_id is UUID)
CREATE POLICY "Allow comment author to update"
ON review_comments
FOR UPDATE
TO authenticated
USING (author_id = auth.uid());

-- Allow comment author to delete own comments (assuming author_id is UUID)
CREATE POLICY "Allow comment author to delete"
ON review_comments
FOR DELETE
TO authenticated
USING (author_id = auth.uid());
