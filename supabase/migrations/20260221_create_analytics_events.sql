-- Create analytics_events table for tracking coach profile interactions
CREATE TABLE IF NOT EXISTS analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID NOT NULL REFERENCES coaches(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL, -- 'profile_view', 'contact_click', 'booking_click', 'email_click', 'phone_click'
  visitor_session_id TEXT, -- Session ID for deduplication (stored in sessionStorage)
  visitor_ip TEXT, -- IP address for additional deduplication
  metadata JSONB, -- Additional event data (e.g., referrer, user agent, etc.)
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_analytics_events_coach_id ON analytics_events(coach_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_event_type ON analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON analytics_events(created_at);
CREATE INDEX IF NOT EXISTS idx_analytics_events_session_id ON analytics_events(visitor_session_id);

-- Create composite index for deduplication queries
CREATE INDEX IF NOT EXISTS idx_analytics_events_dedup
  ON analytics_events(coach_id, event_type, visitor_session_id, created_at);

-- Enable Row Level Security
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can insert analytics events (for tracking)
CREATE POLICY "Allow anonymous insert analytics events"
  ON analytics_events
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Policy: Coaches can view their own analytics
CREATE POLICY "Allow coaches to view own analytics"
  ON analytics_events
  FOR SELECT
  TO authenticated
  USING (
    coach_id IN (
      SELECT id FROM coaches WHERE user_id = auth.uid()::text
    )
  );

-- Add comments for documentation
COMMENT ON TABLE analytics_events IS 'Tracks user interactions with coach profiles for analytics';
COMMENT ON COLUMN analytics_events.event_type IS 'Type of event: profile_view, contact_click, booking_click, email_click, phone_click';
COMMENT ON COLUMN analytics_events.visitor_session_id IS 'Browser session ID for deduplication of profile views';
COMMENT ON COLUMN analytics_events.metadata IS 'Additional event metadata (referrer, user agent, etc.)';
