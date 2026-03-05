-- ============================================
-- Diagnose Paul's Review Display Issue
-- Coach ID: 682f29b1-0385-4929-9b5a-4d2b9931031c
-- ============================================

-- STEP 1: Check Paul's current aggregate values
SELECT
  id,
  name,
  total_reviews,
  average_rating
FROM coaches
WHERE id = '682f29b1-0385-4929-9b5a-4d2b9931031c';

-- Expected: total_reviews should match actual review count
-- If total_reviews = 0 but has reviews, aggregates aren't updating

-- STEP 2: Check actual reviews for Paul
SELECT
  COUNT(*) as actual_review_count,
  AVG(rating) as actual_average_rating
FROM reviews
WHERE coach_id = '682f29b1-0385-4929-9b5a-4d2b9931031c';

-- STEP 3: Check if aggregate columns exist
SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'coaches'
  AND column_name IN ('total_reviews', 'average_rating');

-- Expected: 2 rows showing both columns exist

-- STEP 4: Check if triggers exist
SELECT
  trigger_name,
  event_manipulation,
  event_object_table
FROM information_schema.triggers
WHERE trigger_name LIKE '%coach_reviews%'
ORDER BY trigger_name;

-- Expected: 3 triggers (INSERT, UPDATE, DELETE)

-- STEP 5: Check if the update function exists
SELECT
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name = 'update_coach_review_aggregates';

-- Expected: 1 row showing function exists

-- ============================================
-- DIAGNOSIS:
-- ============================================
-- If STEP 1 shows total_reviews = 0 but STEP 2 shows count > 0:
--   → Aggregates exist but aren't populated
--   → Need to run manual update (see FIX below)
--
-- If STEP 3 shows 0 rows:
--   → Columns don't exist
--   → Need to run ADD_REVIEW_AGGREGATES.sql
--
-- If STEP 4 shows fewer than 3 triggers:
--   → Triggers missing
--   → Need to run ADD_REVIEW_AGGREGATES.sql
--
-- If STEP 5 shows 0 rows:
--   → Function doesn't exist
--   → Need to run ADD_REVIEW_AGGREGATES.sql
-- ============================================

-- ============================================
-- FIX: Manual Update (if aggregates exist but aren't populated)
-- ============================================
-- Run this ONLY if columns exist but values are wrong:

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
  )
WHERE c.id = '682f29b1-0385-4929-9b5a-4d2b9931031c';

-- After running, verify:
SELECT
  id,
  name,
  total_reviews,
  average_rating
FROM coaches
WHERE id = '682f29b1-0385-4929-9b5a-4d2b9931031c';

-- Should now show correct values!
