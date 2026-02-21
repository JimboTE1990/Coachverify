-- ============================================================================
-- URGENT: Run this in Supabase SQL Editor to fix video URL feature
-- ============================================================================
-- This adds the intro_video_url column that's needed for the video embed feature
-- Once this runs, the video URL will save and display immediately!
-- ============================================================================

-- Add the column (IF NOT EXISTS prevents errors if already added)
ALTER TABLE coaches ADD COLUMN IF NOT EXISTS intro_video_url TEXT;

-- Add helpful comment for future reference
COMMENT ON COLUMN coaches.intro_video_url IS 'YouTube or Vimeo embed URL for coach introductory video';

-- Verify it worked - should return 1 row
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'coaches'
  AND column_name = 'intro_video_url';

-- Expected output:
-- column_name      | data_type | is_nullable
-- -----------------|-----------|------------
-- intro_video_url  | text      | YES

-- ============================================================================
-- After running this:
-- 1. Go to your dashboard
-- 2. Add a video URL: https://www.youtube.com/watch?v=juKC0wsH-0c
-- 3. Click Save Profile
-- 4. Visit your public profile
-- 5. Video should now appear below "Schedule a Session" button!
-- ============================================================================
