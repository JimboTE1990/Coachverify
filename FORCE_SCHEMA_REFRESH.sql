-- ==============================================================================
-- Force Supabase to Refresh Schema Cache
-- ==============================================================================
-- Run this in Supabase SQL Editor to make the banner_image_url column visible
-- ==============================================================================

-- Method 1: NOTIFY command (recommended)
NOTIFY pgrst, 'reload schema';

-- If the above doesn't work, try Method 2: Re-create the view
-- This forces PostgREST to recognize the new column

DROP VIEW IF EXISTS coach_profiles CASCADE;

CREATE VIEW coach_profiles AS
SELECT * FROM coaches;

GRANT SELECT ON coach_profiles TO anon, authenticated;

-- Verify the column exists in both table and view
SELECT
    'coaches table' as source,
    column_name,
    data_type
FROM information_schema.columns
WHERE table_name = 'coaches'
  AND column_name = 'banner_image_url'
UNION ALL
SELECT
    'coach_profiles view' as source,
    column_name,
    data_type
FROM information_schema.columns
WHERE table_name = 'coach_profiles'
  AND column_name = 'banner_image_url';

-- You should see 2 rows returned if everything is working correctly
