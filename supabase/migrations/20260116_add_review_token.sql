-- Add review_token column to reviews table for ownership verification
-- This allows users to manage their reviews without authentication

ALTER TABLE reviews
ADD COLUMN IF NOT EXISTS review_token TEXT UNIQUE;

-- Add index for faster token lookups
CREATE INDEX IF NOT EXISTS idx_reviews_token ON reviews(review_token);

-- Add comment explaining the column
COMMENT ON COLUMN reviews.review_token IS 'Unique token for review ownership verification - stored in browser localStorage';
