-- ==============================================================================
-- Fix Main Coaching Categories Schema Cache Issue
-- ==============================================================================
-- Run this entire file in Supabase SQL Editor to fix the schema cache error
-- ==============================================================================

-- Step 1: Add the column to the base coaches table
ALTER TABLE coaches
ADD COLUMN IF NOT EXISTS main_coaching_categories TEXT[];

-- Step 2: Add descriptive comment
COMMENT ON COLUMN coaches.main_coaching_categories IS 'Primary broad coaching categories (7 main areas) used for matching. These are directly selectable by coaches and take priority in matching logic over detailed expertise.';

-- Step 3: Create index for efficient filtering by categories
CREATE INDEX IF NOT EXISTS idx_coaches_main_coaching_categories
ON coaches USING GIN(main_coaching_categories);

-- Step 4: Recreate the coach_profiles view to include the new column
DROP VIEW IF EXISTS coach_profiles CASCADE;

CREATE VIEW coach_profiles AS
SELECT * FROM coaches;

-- Step 5: Grant permissions
GRANT SELECT ON coach_profiles TO anon, authenticated;

-- Step 6: Force PostgREST to reload the schema cache
NOTIFY pgrst, 'reload schema';

-- ==============================================================================
-- Verification Query (run this after to confirm it worked):
-- ==============================================================================
-- SELECT column_name, data_type
-- FROM information_schema.columns
-- WHERE table_name = 'coaches'
-- AND column_name IN ('banner_image_url', 'main_coaching_categories');
-- ==============================================================================
