-- Test script to verify banner_image_url column exists and works
-- Run this in Supabase SQL Editor

-- Step 1: Check if column exists in coaches table
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'coaches'
  AND column_name = 'banner_image_url';

-- Step 2: Check if view includes the column
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'coach_profiles'
  AND column_name = 'banner_image_url';

-- Step 3: Try reading banner_image_url from a coach
SELECT id, name, banner_image_url
FROM coaches
LIMIT 5;

-- Step 4: Try reading from the view
SELECT id, name, banner_image_url
FROM coach_profiles
LIMIT 5;

-- If the above queries work but updates still fail, you may need to:
-- 1. Restart Supabase PostgREST (Project Settings → API → Restart)
-- 2. Or wait a few minutes for schema cache to refresh automatically
