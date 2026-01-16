-- Add spam detection fields to reviews table
ALTER TABLE reviews
ADD COLUMN IF NOT EXISTS spam_score INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS spam_reasons TEXT[],
ADD COLUMN IF NOT EXISTS is_spam BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS spam_category TEXT;

-- Add index for spam filtering
CREATE INDEX IF NOT EXISTS idx_reviews_spam ON reviews(is_spam, spam_score);

-- Create review_comments table for coach responses
CREATE TABLE IF NOT EXISTS review_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  author_id UUID NOT NULL, -- Coach ID
  author_name TEXT NOT NULL, -- Coach name for display
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT fk_review FOREIGN KEY (review_id) REFERENCES reviews(id) ON DELETE CASCADE
);

-- Add index for faster comment lookups
CREATE INDEX IF NOT EXISTS idx_review_comments_review_id ON review_comments(review_id);
CREATE INDEX IF NOT EXISTS idx_review_comments_created_at ON review_comments(created_at DESC);

-- Add comments explaining new columns
COMMENT ON COLUMN reviews.spam_score IS 'Confidence score (0-100) that review is spam';
COMMENT ON COLUMN reviews.spam_reasons IS 'Array of reasons why flagged as spam';
COMMENT ON COLUMN reviews.is_spam IS 'Whether review was auto-detected as spam';
COMMENT ON COLUMN reviews.spam_category IS 'Category of spam: abusive, promotional, nonsense, repetitive, suspicious';

COMMENT ON TABLE review_comments IS 'Coach comments on reviews (replaces verify/flag system)';
