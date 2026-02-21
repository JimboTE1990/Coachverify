-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow public read review comments" ON review_comments;
DROP POLICY IF EXISTS "Allow coaches to insert review comments" ON review_comments;

-- Create review_comments table for coach comments on reviews
CREATE TABLE IF NOT EXISTS review_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  author_id UUID NOT NULL,
  author_name TEXT NOT NULL,
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_review_comments_review_id ON review_comments(review_id);
CREATE INDEX IF NOT EXISTS idx_review_comments_author_id ON review_comments(author_id);
CREATE INDEX IF NOT EXISTS idx_review_comments_created_at ON review_comments(created_at);

-- Enable Row Level Security
ALTER TABLE review_comments ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read comments (they're public)
CREATE POLICY "Allow public read review comments"
  ON review_comments
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Policy: Only authenticated coaches can insert comments
CREATE POLICY "Allow coaches to insert review comments"
  ON review_comments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    author_id::text IN (
      SELECT id::text FROM coaches WHERE user_id::uuid = auth.uid()
    )
  );

-- Add comments for documentation
COMMENT ON TABLE review_comments IS 'Public comments coaches can add to reviews on their profile';
COMMENT ON COLUMN review_comments.review_id IS 'The review this comment is attached to';
