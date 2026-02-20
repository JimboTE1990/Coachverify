-- Add intro_video_url column to coaches table for YouTube/Vimeo embed functionality
ALTER TABLE coaches ADD COLUMN IF NOT EXISTS intro_video_url TEXT;

COMMENT ON COLUMN coaches.intro_video_url IS 'YouTube or Vimeo embed URL for coach introductory video';
