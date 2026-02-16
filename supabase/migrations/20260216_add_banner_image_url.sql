-- ==============================================================================
-- Add banner_image_url column to coaches table
-- ==============================================================================
-- This column stores the profile banner/cover image (like LinkedIn/X/Facebook)
-- for display at the top of the coach's public profile page.
--
-- Date: 2026-02-16
-- ==============================================================================

-- Add the banner_image_url column to the base coaches table
ALTER TABLE coaches
ADD COLUMN IF NOT EXISTS banner_image_url TEXT;

-- Add a descriptive comment
COMMENT ON COLUMN coaches.banner_image_url IS 'Profile banner/cover image URL (like LinkedIn/X cover photo). Recommended dimensions: 1500x500px (3:1 ratio). Displayed at top of public profile.';

-- The coach_profiles view will automatically include this column since it uses SELECT *
