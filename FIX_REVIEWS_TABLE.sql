-- ============================================
-- FIX: Add Missing Columns to Reviews Table
-- ============================================
-- Adds coaching_period and reviewer_location columns
-- ============================================

-- Add missing columns to reviews table
ALTER TABLE reviews
ADD COLUMN IF NOT EXISTS coaching_period TEXT,
ADD COLUMN IF NOT EXISTS reviewer_location TEXT;

-- ============================================
-- Verification
-- ============================================
-- Check columns were added:
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'reviews'
ORDER BY ordinal_position;

-- Test inserting a review (with sample data):
-- INSERT INTO reviews (coach_id, author_name, rating, review_text, coaching_period, reviewer_location)
-- VALUES (
--   'your-coach-id-here',
--   'Test Reviewer',
--   5,
--   'Great coach!',
--   '6+ months',
--   'London, UK'
-- );
