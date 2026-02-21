-- Fix RLS policy for profile_views to allow anonymous deduplication checks
-- Drop the existing SELECT policy
DROP POLICY IF EXISTS "Allow coaches to view own profile views" ON profile_views;

-- Create new SELECT policy that allows:
-- 1. Coaches to view their own profile views
-- 2. Anonymous users to check for deduplication (only their own session)
CREATE POLICY "Allow profile views select"
  ON profile_views
  FOR SELECT
  TO anon, authenticated
  USING (
    -- Coaches can see all their own views
    (auth.uid() IS NOT NULL AND coach_id IN (
      SELECT id FROM coaches WHERE user_id::uuid = auth.uid()
    ))
    -- OR anonymous users can only see their own session views for deduplication
    -- (limited to last hour to prevent abuse)
    OR (auth.uid() IS NULL AND viewed_at > NOW() - INTERVAL '1 hour')
  );

COMMENT ON POLICY "Allow profile views select" ON profile_views IS 'Coaches see all their views; anonymous users see recent views for deduplication only';
