-- ============================================
-- URGENT: Fix Review Verification Permissions
-- ============================================
-- The update is returning 0 rows because of RLS policies
-- This script will fix the permissions issue
-- ============================================

-- Step 1: Check current RLS status
SELECT
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE tablename = 'reviews';

-- Step 2: Check existing policies
SELECT
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'reviews';

-- Step 3: TEMPORARILY disable RLS to test (ONLY FOR DEBUGGING)
-- Uncomment this line if you want to test without RLS:
-- ALTER TABLE reviews DISABLE ROW LEVEL SECURITY;

-- Step 4: Drop all existing UPDATE policies on reviews
DROP POLICY IF EXISTS "Coaches can update their own reviews" ON reviews;
DROP POLICY IF EXISTS "Enable update for coaches" ON reviews;
DROP POLICY IF EXISTS "Coaches can verify their reviews" ON reviews;
DROP POLICY IF EXISTS "Users can update their own reviews" ON reviews;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON reviews;

-- Step 5: Create a permissive policy that allows coaches to update reviews
CREATE POLICY "Allow coaches to update verification status"
ON reviews
FOR UPDATE
TO authenticated
USING (
  -- Allow if the authenticated user's ID matches the coach's user_id
  EXISTS (
    SELECT 1 FROM coaches
    WHERE coaches.id = reviews.coach_id
    AND coaches.user_id = auth.uid()
  )
)
WITH CHECK (
  -- Same check for the updated data
  EXISTS (
    SELECT 1 FROM coaches
    WHERE coaches.id = reviews.coach_id
    AND coaches.user_id = auth.uid()
  )
);

-- Step 6: Verify the policy was created
SELECT
  policyname,
  cmd,
  roles,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'reviews'
AND cmd = 'UPDATE';

-- Step 7: Test the update directly
-- Replace these UUIDs with your actual values:
-- Your user_id: 354e2bae-8150-4b2f-80d5-9dc808c15b5b
-- Your coach_id: 78fcccb5-95e1-4412-87ec-5ee1d0456d92
-- Review ID: 887906aa-da7d-45a3-b5b2-6d168d027349

-- First, verify the review exists and belongs to you
SELECT
  r.id,
  r.coach_id,
  r.author_name,
  r.verification_status,
  c.user_id as coach_user_id,
  c.name as coach_name
FROM reviews r
JOIN coaches c ON c.id = r.coach_id
WHERE r.id = '887906aa-da7d-45a3-b5b2-6d168d027349'
OR r.id = '0d9dc8b5-93c4-42fe-bf2b-7e973664ca71';

-- Step 8: Try a manual update to test permissions
-- This should work if the policy is correct
UPDATE reviews
SET verification_status = 'verified',
    verified_at = NOW()
WHERE id = '887906aa-da7d-45a3-b5b2-6d168d027349'
AND coach_id = '78fcccb5-95e1-4412-87ec-5ee1d0456d92'
RETURNING id, coach_id, verification_status, verified_at;

-- Step 9: If the above works, also update the second review
UPDATE reviews
SET verification_status = 'verified',
    verified_at = NOW()
WHERE id = '0d9dc8b5-93c4-42fe-bf2b-7e973664ca71'
AND coach_id = '78fcccb5-95e1-4412-87ec-5ee1d0456d92'
RETURNING id, coach_id, verification_status, verified_at;

-- Step 10: Verify the updates worked
SELECT
  id,
  coach_id,
  author_name,
  rating,
  verification_status,
  verified_at,
  created_at
FROM reviews
WHERE coach_id = '78fcccb5-95e1-4412-87ec-5ee1d0456d92'
ORDER BY created_at DESC;

-- ============================================
-- ALTERNATIVE: If RLS is too restrictive
-- ============================================
-- If the above doesn't work, you can temporarily disable RLS on reviews:
-- WARNING: This removes all access control!
--
-- ALTER TABLE reviews DISABLE ROW LEVEL SECURITY;
--
-- Then re-enable it after testing:
-- ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
-- ============================================
