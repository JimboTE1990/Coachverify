-- Add optional social media URL to reviews for reviewer identity verification
ALTER TABLE reviews
ADD COLUMN IF NOT EXISTS reviewer_social_url TEXT;

COMMENT ON COLUMN reviews.reviewer_social_url IS 'Optional social media profile URL submitted by reviewer for identity verification purposes. Not displayed publicly.';
