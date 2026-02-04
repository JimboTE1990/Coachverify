-- Restore Profile Photos for All Affected Coaches
-- This fixes the issue where picsum.photos URLs return different random images

-- ==============================================================================
-- STEP 1: IDENTIFY ALL AFFECTED PROFILES
-- ==============================================================================
-- Find all coaches using picsum.photos URLs (these will have changing images)

SELECT
  id,
  name,
  email,
  photo_url,
  created_at,
  subscription_status
FROM coaches
WHERE photo_url LIKE '%picsum.photos%'
ORDER BY created_at DESC;

-- ==============================================================================
-- STEP 2: LOCK ALL PICSUM PHOTOS TO CONSISTENT IMAGES
-- ==============================================================================
-- This converts random picsum URLs to seed-based URLs that always return the same image

UPDATE coaches
SET photo_url = 'https://picsum.photos/seed/' || REPLACE(LOWER(name), ' ', '-') || '/200/200'
WHERE photo_url LIKE '%picsum.photos%';

-- Explanation:
-- This changes:
--   FROM: https://picsum.photos/200/200?random=101  (different image each time)
--   TO:   https://picsum.photos/seed/jennifer-martinez/200/200  (same image always)
--
-- The seed is based on the coach's name, so each coach gets a consistent unique image

-- ==============================================================================
-- STEP 3: VERIFY ALL CHANGES
-- ==============================================================================

SELECT
  name,
  email,
  photo_url,
  CASE
    WHEN photo_url LIKE '%/seed/%' THEN '✅ Photo locked'
    WHEN photo_url LIKE '%picsum.photos%' THEN '❌ Still random'
    ELSE '✓ Custom photo URL'
  END as photo_status
FROM coaches
WHERE photo_url LIKE '%picsum.photos%'
   OR name IN (
     SELECT name FROM coaches
     WHERE photo_url LIKE '%picsum.photos%'
   )
ORDER BY name;

-- ==============================================================================
-- ALTERNATIVE: RESET TO DEFAULT GRAYSCALE PLACEHOLDER
-- ==============================================================================
-- If you prefer all test profiles to use the same default placeholder:

/*
UPDATE coaches
SET photo_url = 'https://picsum.photos/200/200?grayscale'
WHERE photo_url LIKE '%picsum.photos%'
  AND subscription_status IN ('trial', 'onboarding');
*/

-- ==============================================================================
-- WHAT THIS FIXES
-- ==============================================================================

-- BEFORE:
-- - Profile photos changed on every refresh/cache clear
-- - Picsum.photos served different random images each time
-- - Co-founder profiles and test profiles all affected

-- AFTER:
-- - Each coach has a consistent photo based on their name
-- - Same image will load every time
-- - Photos won't change unless you manually update photo_url

-- ==============================================================================
-- FOR REAL PROFILES (Co-founders, paying coaches)
-- ==============================================================================
-- You should upload actual profile photos and update URLs:

-- Step 1: Upload photos to Supabase Storage bucket 'coach-photos'
-- Step 2: Update URLs like this:

/*
UPDATE coaches
SET photo_url = 'https://[YOUR-PROJECT].supabase.co/storage/v1/object/public/coach-photos/john-doe.jpg'
WHERE email = 'john@example.com';
*/

-- ==============================================================================
-- NOTES
-- ==============================================================================

-- 1. This SQL is SAFE to run - it only affects picsum.photos URLs
-- 2. Custom photo URLs (real uploads) are NOT touched
-- 3. The seed-based approach ensures consistency without manual work
-- 4. Each coach gets a unique image based on their name
-- 5. Images won't change unless you manually update the URL

-- To revert back to random photos (not recommended):
/*
UPDATE coaches
SET photo_url = 'https://picsum.photos/200/200?random=' || FLOOR(RANDOM() * 1000)::TEXT
WHERE photo_url LIKE '%/seed/%';
*/
