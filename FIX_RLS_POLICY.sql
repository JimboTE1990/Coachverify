-- ISSUE: intro_video_url is being sent to database but not saved
-- CAUSE: RLS policy might be blocking the update

-- Step 1: Check current RLS policies on coaches table
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
WHERE tablename = 'coaches';

-- Step 2: Check if RLS is enabled
SELECT
  tablename,
  rowsecurity
FROM pg_tables
WHERE tablename = 'coaches';

-- ============================================================================
-- LIKELY FIX: Update the UPDATE policy to allow intro_video_url
-- ============================================================================

-- Drop the existing update policy (if it's too restrictive)
-- DROP POLICY IF EXISTS "Allow authenticated coaches to update own profile" ON coaches;

-- Create a new policy that explicitly allows all columns
-- CREATE POLICY "Allow authenticated coaches to update own profile"
-- ON coaches
-- FOR UPDATE
-- TO authenticated
-- USING (auth.uid()::text = user_id::text)
-- WITH CHECK (auth.uid()::text = user_id::text);

-- ============================================================================
-- Alternative: Grant direct UPDATE permission on the column
-- ============================================================================

-- GRANT UPDATE (intro_video_url) ON coaches TO authenticated;
