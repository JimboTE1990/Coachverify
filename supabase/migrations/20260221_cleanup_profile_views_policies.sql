-- Clean up duplicate and conflicting RLS policies on profile_views table

-- Drop all existing policies
DROP POLICY IF EXISTS "Anyone can track profile views" ON profile_views;
DROP POLICY IF EXISTS "Coaches can view own profile views" ON profile_views;
DROP POLICY IF EXISTS "Allow anonymous insert profile views" ON profile_views;
DROP POLICY IF EXISTS "Allow public read profile views" ON profile_views;
DROP POLICY IF EXISTS "Allow profile views select" ON profile_views;

-- Create clean INSERT policy (anyone can track views)
CREATE POLICY "Allow insert profile views"
  ON profile_views
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Create clean SELECT policy (coaches see their views, anonymous users see recent views for deduplication)
CREATE POLICY "Allow select profile views"
  ON profile_views
  FOR SELECT
  TO anon, authenticated
  USING (
    -- Authenticated coaches can see all their own views
    (auth.uid() IS NOT NULL AND coach_id IN (
      SELECT id FROM coaches WHERE user_id::uuid = auth.uid()
    ))
    -- Anonymous users can only see recent views (1 hour) for deduplication
    OR (auth.uid() IS NULL AND viewed_at > NOW() - INTERVAL '1 hour')
  );

-- Add helpful comments
COMMENT ON POLICY "Allow insert profile views" ON profile_views IS 'Anyone (anon/authenticated) can insert profile view tracking events';
COMMENT ON POLICY "Allow select profile views" ON profile_views IS 'Coaches see all their views; anonymous users see recent views (1h) for deduplication only';
