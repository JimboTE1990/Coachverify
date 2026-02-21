-- Create contact_clicks table for tracking contact interactions
CREATE TABLE IF NOT EXISTS contact_clicks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID NOT NULL REFERENCES coaches(id) ON DELETE CASCADE,
  click_type TEXT NOT NULL, -- 'email', 'phone', 'booking', 'whatsapp'
  session_id TEXT NOT NULL,
  clicked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  referrer TEXT,
  user_agent TEXT
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_contact_clicks_coach_id ON contact_clicks(coach_id);
CREATE INDEX IF NOT EXISTS idx_contact_clicks_type ON contact_clicks(click_type);
CREATE INDEX IF NOT EXISTS idx_contact_clicks_clicked_at ON contact_clicks(clicked_at);

-- Enable Row Level Security
ALTER TABLE contact_clicks ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can insert contact clicks (for tracking)
CREATE POLICY "Allow anonymous insert contact clicks"
  ON contact_clicks
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Policy: Coaches can view their own contact clicks
CREATE POLICY "Allow coaches to view own contact clicks"
  ON contact_clicks
  FOR SELECT
  TO authenticated
  USING (
    coach_id IN (
      SELECT id FROM coaches WHERE user_id = auth.uid()::text
    )
  );

-- Add comments for documentation
COMMENT ON TABLE contact_clicks IS 'Tracks when visitors click on contact methods (email, phone, booking links)';
COMMENT ON COLUMN contact_clicks.click_type IS 'Type of contact: email, phone, booking, whatsapp';
