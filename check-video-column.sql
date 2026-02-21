-- Run this in Supabase SQL Editor to check if intro_video_url column exists

-- Check if the column exists in the coaches table
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'coaches'
  AND column_name = 'intro_video_url';

-- If the above returns 0 rows, the column doesn't exist.
-- In that case, run this migration:

-- ALTER TABLE coaches ADD COLUMN IF NOT EXISTS intro_video_url TEXT;
-- COMMENT ON COLUMN coaches.intro_video_url IS 'YouTube or Vimeo embed URL for coach introductory video';
