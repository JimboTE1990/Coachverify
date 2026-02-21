-- STEP 1: Check if the intro_video_url column exists
-- Run this first to diagnose the issue

SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'coaches'
  AND column_name = 'intro_video_url';

-- Expected result if column EXISTS:
-- column_name      | data_type | is_nullable | column_default
-- -----------------|-----------|-------------|---------------
-- intro_video_url  | text      | YES         | NULL

-- Expected result if column DOES NOT EXIST:
-- (0 rows returned)

-- ============================================================================
-- STEP 2: If column doesn't exist (0 rows above), run this:
-- ============================================================================

-- Uncomment and run these lines if the column doesn't exist:
-- ALTER TABLE coaches ADD COLUMN IF NOT EXISTS intro_video_url TEXT;
-- COMMENT ON COLUMN coaches.intro_video_url IS 'YouTube or Vimeo embed URL for coach introductory video';

-- ============================================================================
-- STEP 3: After adding the column, verify it worked:
-- ============================================================================

-- Run STEP 1 query again - should now return 1 row showing the column exists
