-- ============================================
-- Fix Review Count Display on Coach Cards
-- Issue: Reviews show on detail page but not on list cards
-- Date: 2026-03-02
-- ============================================

-- This script will:
-- 1. Ensure aggregate columns exist
-- 2. Create/update triggers to auto-calculate review stats
-- 3. Populate existing data for all coaches

-- ============================================
-- STEP 1: Add aggregate columns (if missing)
-- ============================================

ALTER TABLE coaches
ADD COLUMN IF NOT EXISTS total_reviews INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS average_rating DECIMAL(3,2) DEFAULT 0.0;

-- ============================================
-- STEP 2: Create trigger function
-- ============================================

CREATE OR REPLACE FUNCTION update_coach_review_aggregates()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the coach's review statistics whenever a review is added/updated/deleted
  UPDATE coaches
  SET
    total_reviews = (
      SELECT COUNT(*)
      FROM reviews
      WHERE coach_id = COALESCE(NEW.coach_id, OLD.coach_id)
        AND is_flagged = false  -- Don't count flagged/spam reviews
    ),
    average_rating = (
      SELECT COALESCE(AVG(rating), 0.0)
      FROM reviews
      WHERE coach_id = COALESCE(NEW.coach_id, OLD.coach_id)
        AND is_flagged = false  -- Don't include flagged reviews in average
    )
  WHERE id = COALESCE(NEW.coach_id, OLD.coach_id);

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- STEP 3: Create triggers (drop old ones first)
-- ============================================

DROP TRIGGER IF EXISTS update_coach_reviews_on_insert ON reviews;
DROP TRIGGER IF EXISTS update_coach_reviews_on_update ON reviews;
DROP TRIGGER IF EXISTS update_coach_reviews_on_delete ON reviews;

-- Trigger on INSERT: New review added
CREATE TRIGGER update_coach_reviews_on_insert
AFTER INSERT ON reviews
FOR EACH ROW
EXECUTE FUNCTION update_coach_review_aggregates();

-- Trigger on UPDATE: Review modified (rating changed, flagged status changed)
CREATE TRIGGER update_coach_reviews_on_update
AFTER UPDATE ON reviews
FOR EACH ROW
EXECUTE FUNCTION update_coach_review_aggregates();

-- Trigger on DELETE: Review removed
CREATE TRIGGER update_coach_reviews_on_delete
AFTER DELETE ON reviews
FOR EACH ROW
EXECUTE FUNCTION update_coach_review_aggregates();

-- ============================================
-- STEP 4: Populate existing data for ALL coaches
-- ============================================

UPDATE coaches c
SET
  total_reviews = (
    SELECT COUNT(*)
    FROM reviews r
    WHERE r.coach_id = c.id
      AND r.is_flagged = false
  ),
  average_rating = (
    SELECT COALESCE(AVG(r.rating), 0.0)
    FROM reviews r
    WHERE r.coach_id = c.id
      AND r.is_flagged = false
  );

-- ============================================
-- STEP 5: Refresh coach_profiles view
-- ============================================

DROP VIEW IF EXISTS coach_profiles CASCADE;

CREATE VIEW coach_profiles AS
SELECT * FROM coaches;

-- Grant permissions
GRANT SELECT ON coach_profiles TO anon;
GRANT SELECT ON coach_profiles TO authenticated;

-- ============================================
-- VERIFICATION
-- ============================================

-- Check coaches with reviews
SELECT
  c.id,
  c.name,
  c.total_reviews,
  c.average_rating,
  COUNT(r.id) as actual_count,
  AVG(r.rating) as actual_avg
FROM coaches c
LEFT JOIN reviews r ON r.coach_id = c.id AND r.is_flagged = false
GROUP BY c.id, c.name, c.total_reviews, c.average_rating
HAVING COUNT(r.id) > 0
ORDER BY c.total_reviews DESC;

-- Expected: total_reviews should match actual_count for all coaches

-- Check Paul specifically (682f29b1-0385-4929-9b5a-4d2b9931031c)
SELECT
  c.id,
  c.name,
  c.total_reviews,
  c.average_rating,
  COUNT(r.id) as actual_review_count,
  AVG(r.rating) as calculated_average
FROM coaches c
LEFT JOIN reviews r ON r.coach_id = c.id AND r.is_flagged = false
WHERE c.id = '682f29b1-0385-4929-9b5a-4d2b9931031c'
GROUP BY c.id, c.name, c.total_reviews, c.average_rating;

-- Expected: total_reviews > 0 and matches actual_review_count

-- ============================================
-- NOTES
-- ============================================
-- After running this:
-- ✅ All existing coaches will have correct review counts
-- ✅ Future reviews will automatically update counts (triggers)
-- ✅ Coach cards will show correct review stats immediately
-- ✅ No code deployment needed - pure database fix
-- ✅ Flagged/spam reviews are excluded from counts

-- The CoachCard component already checks for coach.totalReviews,
-- so once this populates the database, cards will display correctly.
