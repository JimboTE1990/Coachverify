-- Create profile_views table for tracking profile visits
CREATE TABLE IF NOT EXISTS profile_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID NOT NULL REFERENCES coaches(id) ON DELETE CASCADE,
  viewed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  session_id TEXT NOT NULL,
  viewer_user_agent TEXT,
  referrer TEXT
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_profile_views_coach_id ON profile_views(coach_id);
CREATE INDEX IF NOT EXISTS idx_profile_views_viewed_at ON profile_views(viewed_at);
CREATE INDEX IF NOT EXISTS idx_profile_views_session_id ON profile_views(session_id);

-- Enable Row Level Security
ALTER TABLE profile_views ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can insert profile views (for tracking)
CREATE POLICY "Allow anonymous insert profile views"
  ON profile_views
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Policy: Coaches can view their own profile views
CREATE POLICY "Allow coaches to view own profile views"
  ON profile_views
  FOR SELECT
  TO authenticated
  USING (
    coach_id IN (
      SELECT id FROM coaches WHERE user_id::uuid = auth.uid()
    )
  );

-- Add comments for documentation
COMMENT ON TABLE profile_views IS 'Tracks profile page views with session-based deduplication';
COMMENT ON COLUMN profile_views.session_id IS 'Browser session ID for deduplication (30 min window)';
