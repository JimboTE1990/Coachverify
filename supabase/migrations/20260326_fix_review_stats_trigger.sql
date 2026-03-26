-- Migration: Fix review stats trigger
-- Date: 2026-03-26
-- Problem: The original trigger targeted coach_profiles (now a VIEW, not a table),
--          so total_reviews and average_rating on coaches were never updated automatically.
-- Fix: Create a new trigger targeting the coaches table directly.

-- Drop old trigger if it somehow still exists on reviews
DROP TRIGGER IF EXISTS trigger_update_coach_rating_stats ON reviews;
DROP FUNCTION IF EXISTS update_coach_rating_stats();

-- Create new function targeting coaches table
CREATE OR REPLACE FUNCTION update_coach_review_stats()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE coaches
  SET
    total_reviews = (
      SELECT COUNT(*)
      FROM reviews
      WHERE coach_id = COALESCE(NEW.coach_id, OLD.coach_id)
        AND is_flagged = FALSE
    ),
    average_rating = (
      SELECT COALESCE(ROUND(AVG(rating)::numeric, 2), 0)
      FROM reviews
      WHERE coach_id = COALESCE(NEW.coach_id, OLD.coach_id)
        AND is_flagged = FALSE
    )
  WHERE id = COALESCE(NEW.coach_id, OLD.coach_id);

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger on reviews table
CREATE TRIGGER trigger_update_coach_review_stats
AFTER INSERT OR UPDATE OR DELETE ON reviews
FOR EACH ROW
EXECUTE FUNCTION update_coach_review_stats();

-- Backfill all existing coaches to fix any that are out of sync
UPDATE coaches c
SET
  total_reviews = sub.total,
  average_rating = sub.avg_rating
FROM (
  SELECT
    coach_id,
    COUNT(*) AS total,
    COALESCE(ROUND(AVG(rating)::numeric, 2), 0) AS avg_rating
  FROM reviews
  WHERE is_flagged = FALSE
  GROUP BY coach_id
) sub
WHERE c.id = sub.coach_id;

-- Zero out coaches with no reviews (in case they have stale values)
UPDATE coaches
SET total_reviews = 0, average_rating = 0
WHERE id NOT IN (
  SELECT DISTINCT coach_id FROM reviews WHERE is_flagged = FALSE
)
AND (total_reviews > 0 OR average_rating > 0);
