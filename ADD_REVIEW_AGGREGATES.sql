-- ============================================
-- Add Review Aggregation Columns to Coaches Table
-- ============================================
-- This ensures totalReviews and averageRating are available
-- without having to fetch all reviews separately
-- ============================================

-- Step 1: Add columns if they don't exist
ALTER TABLE coaches
ADD COLUMN IF NOT EXISTS total_reviews INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS average_rating DECIMAL(3,2) DEFAULT 0.0;

-- Step 2: Create a function to update review aggregates
CREATE OR REPLACE FUNCTION update_coach_review_aggregates()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the coach's review statistics
  UPDATE coaches
  SET
    total_reviews = (
      SELECT COUNT(*)
      FROM reviews
      WHERE coach_id = COALESCE(NEW.coach_id, OLD.coach_id)
    ),
    average_rating = (
      SELECT COALESCE(AVG(rating), 0.0)
      FROM reviews
      WHERE coach_id = COALESCE(NEW.coach_id, OLD.coach_id)
    )
  WHERE id = COALESCE(NEW.coach_id, OLD.coach_id);

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Step 3: Create triggers to auto-update aggregates
DROP TRIGGER IF EXISTS update_coach_reviews_on_insert ON reviews;
DROP TRIGGER IF EXISTS update_coach_reviews_on_update ON reviews;
DROP TRIGGER IF EXISTS update_coach_reviews_on_delete ON reviews;

CREATE TRIGGER update_coach_reviews_on_insert
AFTER INSERT ON reviews
FOR EACH ROW
EXECUTE FUNCTION update_coach_review_aggregates();

CREATE TRIGGER update_coach_reviews_on_update
AFTER UPDATE ON reviews
FOR EACH ROW
EXECUTE FUNCTION update_coach_review_aggregates();

CREATE TRIGGER update_coach_reviews_on_delete
AFTER DELETE ON reviews
FOR EACH ROW
EXECUTE FUNCTION update_coach_review_aggregates();

-- Step 4: Populate existing data
UPDATE coaches c
SET
  total_reviews = (
    SELECT COUNT(*)
    FROM reviews r
    WHERE r.coach_id = c.id
  ),
  average_rating = (
    SELECT COALESCE(AVG(r.rating), 0.0)
    FROM reviews r
    WHERE r.coach_id = c.id
  );

-- Step 5: Refresh the coach_profiles view to include new columns
DROP VIEW IF EXISTS coach_profiles CASCADE;

CREATE VIEW coach_profiles AS
SELECT * FROM coaches;

-- Step 6: Verify the data
SELECT
  id,
  name,
  email,
  total_reviews,
  average_rating
FROM coaches
WHERE total_reviews > 0
ORDER BY total_reviews DESC;

-- Step 7: Verify your specific coach
SELECT
  c.id,
  c.name,
  c.total_reviews,
  c.average_rating,
  COUNT(r.id) as actual_review_count,
  AVG(r.rating) as actual_avg_rating
FROM coaches c
LEFT JOIN reviews r ON r.coach_id = c.id
WHERE c.id = '78fcccb5-95e1-4412-87ec-5ee1d0456d92'
GROUP BY c.id, c.name, c.total_reviews, c.average_rating;
