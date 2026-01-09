-- Migration: Add Review Verification Fields
-- Description: Adds coaching_period and verification_status for coach-managed review verification
-- Date: 2026-01-09

-- Add new columns to reviews table (only if they don't exist)
DO $$
BEGIN
  -- Add coaching_period field
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'reviews' AND column_name = 'coaching_period'
  ) THEN
    ALTER TABLE reviews ADD COLUMN coaching_period TEXT;
    COMMENT ON COLUMN reviews.coaching_period IS 'When the coaching took place (e.g., "December 2024")';
  END IF;

  -- Add verification_status field
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'reviews' AND column_name = 'verification_status'
  ) THEN
    ALTER TABLE reviews ADD COLUMN verification_status TEXT DEFAULT 'unverified' CHECK (verification_status IN ('unverified', 'verified', 'flagged'));
    COMMENT ON COLUMN reviews.verification_status IS 'Coach verification status: unverified (default), verified (coach confirmed), flagged (marked as fake)';
  END IF;

  -- Add verified_at timestamp
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'reviews' AND column_name = 'verified_at'
  ) THEN
    ALTER TABLE reviews ADD COLUMN verified_at TIMESTAMP WITH TIME ZONE;
    COMMENT ON COLUMN reviews.verified_at IS 'Timestamp when coach verified this review';
  END IF;

  -- Add reviewer_location field
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'reviews' AND column_name = 'reviewer_location'
  ) THEN
    ALTER TABLE reviews ADD COLUMN reviewer_location TEXT;
    COMMENT ON COLUMN reviews.reviewer_location IS 'General location of reviewer (e.g., "Cardiff, Wales")';
  END IF;
END $$;

-- Add index for filtering by verification status
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_reviews_verification_status'
  ) THEN
    CREATE INDEX idx_reviews_verification_status ON reviews(verification_status);
  END IF;
END $$;

-- Update RLS policy to exclude flagged reviews from public view
DO $$
BEGIN
  -- Drop old policy if exists
  DROP POLICY IF EXISTS "Anyone can view non-flagged reviews" ON reviews;

  -- Create new policy that excludes flagged reviews
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename = 'reviews'
    AND policyname = 'Public can view non-flagged reviews'
  ) THEN
    CREATE POLICY "Public can view non-flagged reviews"
      ON reviews FOR SELECT
      USING (
        is_flagged = FALSE
        AND verification_status != 'flagged'
      );
  END IF;
END $$;

-- Migration Notes:
-- 1. This migration is idempotent - safe to run multiple times
-- 2. All reviews default to 'unverified' status (publicly visible)
-- 3. Coaches can mark reviews as 'verified' (adds green badge) or 'flagged' (hides from public)
-- 4. Flagged reviews are hidden from public view but visible to coach in dashboard
-- 5. No email or sensitive PII collected - just first name + last initial and coaching period
-- 6. GDPR-friendly: minimal data collection
