-- Migration: Add Coach Reply to Reviews
-- Description: Adds coach_reply field to allow coaches to respond to reviews
-- Date: 2026-01-09

-- Add coach_reply column to reviews table (only if it doesn't exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'reviews' AND column_name = 'coach_reply'
  ) THEN
    ALTER TABLE reviews ADD COLUMN coach_reply TEXT;
    COMMENT ON COLUMN reviews.coach_reply IS 'Coach''s response to the review';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'reviews' AND column_name = 'coach_reply_date'
  ) THEN
    ALTER TABLE reviews ADD COLUMN coach_reply_date TIMESTAMP WITH TIME ZONE;
    COMMENT ON COLUMN reviews.coach_reply_date IS 'Timestamp when coach replied to the review';
  END IF;
END $$;

-- Add index for filtering reviews with replies (only if it doesn't exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_reviews_has_reply'
  ) THEN
    CREATE INDEX idx_reviews_has_reply ON reviews((coach_reply IS NOT NULL));
  END IF;
END $$;

-- Update RLS policy to allow coaches to update their own review replies (only if it doesn't exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename = 'reviews'
    AND policyname = 'Coaches can reply to their own reviews'
  ) THEN
    CREATE POLICY "Coaches can reply to their own reviews"
      ON reviews FOR UPDATE
      TO authenticated
      USING (
        coach_id IN (
          SELECT id FROM coach_profiles WHERE user_id = auth.uid()
        )
      )
      WITH CHECK (
        coach_id IN (
          SELECT id FROM coach_profiles WHERE user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- Migration Notes:
-- 1. This migration is idempotent - safe to run multiple times
-- 2. Coaches can now reply to reviews on their profile
-- 3. coach_reply is optional (NULL by default)
-- 4. coach_reply_date is automatically set when reply is added
-- 5. RLS policy ensures coaches can only update reviews for their own profile
-- 6. Coaches cannot edit the review itself, only add/edit their reply
