-- Fix profile_views table to ensure all columns exist with correct names

-- Drop and recreate the table with correct schema
DROP TABLE IF EXISTS profile_views CASCADE;

-- Create profile_views table with correct column names
CREATE TABLE profile_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID NOT NULL REFERENCES coaches(id) ON DELETE CASCADE,
  viewed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  session_id TEXT NOT NULL,
  viewer_user_agent TEXT,
  referrer TEXT
);

-- Create indexes for efficient querying
CREATE INDEX idx_profile_views_coach_id ON profile_views(coach_id);
CREATE INDEX idx_profile_views_viewed_at ON profile_views(viewed_at);
CREATE INDEX idx_profile_views_session_id ON profile_views(session_id);

-- Enable Row Level Security
ALTER TABLE profile_views ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can insert profile views (for tracking)
CREATE POLICY "Allow insert profile views"
  ON profile_views
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Policy: Coaches can view their own views, anonymous can see recent for deduplication
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

-- Add comments for documentation
COMMENT ON TABLE profile_views IS 'Tracks profile page views with session-based deduplication';
COMMENT ON COLUMN profile_views.session_id IS 'Browser session ID for deduplication (30 min window)';
COMMENT ON COLUMN profile_views.viewer_user_agent IS 'User agent string of the visitor';
COMMENT ON COLUMN profile_views.referrer IS 'Referrer URL or "direct"';
