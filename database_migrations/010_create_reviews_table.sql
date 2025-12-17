-- Migration: Create Reviews Table
-- Description: Creates table for coach reviews with moderation and verification features
-- Date: 2024-12-16

-- Create reviews table
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID NOT NULL REFERENCES coach_profiles(id) ON DELETE CASCADE,
  author_name TEXT NOT NULL,
  author_photo_url TEXT,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT NOT NULL,
  is_flagged BOOLEAN DEFAULT FALSE,
  is_verified_client BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for common queries
CREATE INDEX idx_reviews_coach_id ON reviews(coach_id);
CREATE INDEX idx_reviews_created_at ON reviews(created_at DESC);
CREATE INDEX idx_reviews_rating ON reviews(rating);
CREATE INDEX idx_reviews_is_flagged ON reviews(is_flagged);

-- Add comments for documentation
COMMENT ON TABLE reviews IS 'Coach reviews submitted by clients';
COMMENT ON COLUMN reviews.coach_id IS 'Foreign key to coach_profiles';
COMMENT ON COLUMN reviews.author_name IS 'Name of the person leaving the review';
COMMENT ON COLUMN reviews.author_photo_url IS 'Optional profile photo URL for review author';
COMMENT ON COLUMN reviews.rating IS 'Rating from 1-5 stars';
COMMENT ON COLUMN reviews.review_text IS 'Text content of the review';
COMMENT ON COLUMN reviews.is_flagged IS 'Whether review has been flagged for moderation';
COMMENT ON COLUMN reviews.is_verified_client IS 'Whether reviewer actually booked with this coach';

-- Create function to update coach average rating and total reviews
CREATE OR REPLACE FUNCTION update_coach_rating_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Update average_rating and total_reviews for the coach
  UPDATE coach_profiles
  SET
    average_rating = (
      SELECT ROUND(AVG(rating)::numeric, 2)
      FROM reviews
      WHERE coach_id = COALESCE(NEW.coach_id, OLD.coach_id)
        AND is_flagged = FALSE
    ),
    total_reviews = (
      SELECT COUNT(*)
      FROM reviews
      WHERE coach_id = COALESCE(NEW.coach_id, OLD.coach_id)
        AND is_flagged = FALSE
    )
  WHERE id = COALESCE(NEW.coach_id, OLD.coach_id);

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update coach rating stats
CREATE TRIGGER trigger_update_coach_rating_stats
AFTER INSERT OR UPDATE OR DELETE ON reviews
FOR EACH ROW
EXECUTE FUNCTION update_coach_rating_stats();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_reviews_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER trigger_reviews_updated_at
BEFORE UPDATE ON reviews
FOR EACH ROW
EXECUTE FUNCTION update_reviews_updated_at();

-- Enable Row Level Security
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view non-flagged reviews
CREATE POLICY "Anyone can view non-flagged reviews"
  ON reviews FOR SELECT
  USING (is_flagged = FALSE);

-- Policy: Authenticated users can insert reviews (with future booking verification)
CREATE POLICY "Authenticated users can insert reviews"
  ON reviews FOR INSERT
  TO authenticated
  WITH CHECK (TRUE);

-- Policy: Users can update their own reviews (future: add author_user_id column)
-- For now, only admins can update (via admin panel)

-- Policy: Only admins can delete reviews (via admin panel)

-- Migration Notes:
-- 1. Reviews automatically update coach average_rating and total_reviews via trigger
-- 2. Flagged reviews are excluded from rating calculations
-- 3. RLS policies ensure only non-flagged reviews are publicly visible
-- 4. Future enhancement: Add author_user_id to link reviews to user accounts
-- 5. Future enhancement: Add booking_id to verify reviews are from actual clients
-- 6. is_verified_client will be manually set or automated via booking system integration
