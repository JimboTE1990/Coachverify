-- Update all dummy coaches to use CoachDog logo for profile photo and banner
-- This gives a consistent branded look for test/demo profiles

UPDATE coaches
SET
  photo_url = '/coachdog-logo.png',
  banner_image_url = '/coachdog-logo.png'
WHERE
  -- Update coaches that have placeholder or missing images
  (photo_url LIKE '%picsum%' OR photo_url LIKE '%placeholder%' OR photo_url IS NULL OR photo_url = '')
  OR
  (banner_image_url IS NULL OR banner_image_url = '');

-- Show updated count
SELECT COUNT(*) as updated_coaches FROM coaches
WHERE photo_url = '/coachdog-logo.png';
