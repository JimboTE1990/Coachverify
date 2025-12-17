-- Migration: Add profile view analytics tracking
-- Date: 2025-12-16
-- Description: Tracks profile views and provides analytics for coaches

-- Create profile_views table (simplified - no viewer_ip for privacy/simplicity)
CREATE TABLE IF NOT EXISTS profile_views (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  coach_id UUID NOT NULL REFERENCES coaches(id) ON DELETE CASCADE,
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  viewer_user_agent TEXT,
  referrer TEXT,
  session_id TEXT -- To deduplicate views from same session
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_profile_views_coach_id ON profile_views(coach_id);
CREATE INDEX IF NOT EXISTS idx_profile_views_viewed_at ON profile_views(viewed_at);
CREATE INDEX IF NOT EXISTS idx_profile_views_session ON profile_views(session_id);

-- Add view_count column to coaches table for quick access
ALTER TABLE coaches
ADD COLUMN IF NOT EXISTS total_profile_views INTEGER DEFAULT 0;

-- Create function to increment view count
CREATE OR REPLACE FUNCTION increment_profile_views()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE coaches
  SET total_profile_views = total_profile_views + 1
  WHERE id = NEW.coach_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-increment view count
DROP TRIGGER IF EXISTS trigger_increment_profile_views ON profile_views;
CREATE TRIGGER trigger_increment_profile_views
AFTER INSERT ON profile_views
FOR EACH ROW
EXECUTE FUNCTION increment_profile_views();

-- Add comments
COMMENT ON TABLE profile_views IS 'Tracks individual profile view events for analytics';
COMMENT ON COLUMN profile_views.session_id IS 'Browser session ID to prevent counting multiple views from same session';
COMMENT ON COLUMN coaches.total_profile_views IS 'Cached count of total profile views';
