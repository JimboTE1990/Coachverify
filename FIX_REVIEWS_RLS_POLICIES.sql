-- ============================================
-- FIX: Reviews Table RLS Policies
-- ============================================
-- This ensures coaches can update verification status on their own reviews
-- ============================================

-- First, check existing policies
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'reviews';

-- Drop existing UPDATE policy if it exists (to recreate with correct permissions)
DROP POLICY IF EXISTS "Coaches can update their own reviews" ON reviews;
DROP POLICY IF EXISTS "Enable update for coaches" ON reviews;
DROP POLICY IF EXISTS "Coaches can verify their reviews" ON reviews;

-- Create new policy allowing coaches to update verification_status on their reviews
CREATE POLICY "Coaches can verify their reviews"
ON reviews
FOR UPDATE
USING (
  auth.uid() IN (
    SELECT user_id FROM coaches WHERE id = reviews.coach_id
  )
)
WITH CHECK (
  auth.uid() IN (
    SELECT user_id FROM coaches WHERE id = reviews.coach_id
  )
);

-- Verify the new policy was created
SELECT
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'reviews'
AND policyname = 'Coaches can verify their reviews';

-- Test query: Check if current user can see and update their reviews
-- (Replace with your actual coach_id and review_id to test)
SELECT
  id,
  coach_id,
  author_name,
  rating,
  verification_status,
  verified_at
FROM reviews
WHERE coach_id = (SELECT id FROM coaches WHERE user_id = auth.uid())
ORDER BY created_at DESC;
