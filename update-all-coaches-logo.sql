-- Force update ALL coaches to use correct logo images
-- Profile photo: Logo Image only (dog icon)
-- Banner: Full CoachDog logo with text

-- This updates ALL coaches, including those that already have coachdog-logo.png
UPDATE coaches
SET
  photo_url = '/logo-image-only.png',
  banner_image_url = '/coachdog-logo.png'
WHERE
  -- Update any coach that doesn't already have logo-image-only.png as profile photo
  photo_url != '/logo-image-only.png'
  OR photo_url IS NULL;

-- Verify the update
SELECT
  COUNT(*) as total_coaches,
  SUM(CASE WHEN photo_url = '/logo-image-only.png' THEN 1 ELSE 0 END) as coaches_with_correct_photo,
  SUM(CASE WHEN banner_image_url = '/coachdog-logo.png' THEN 1 ELSE 0 END) as coaches_with_correct_banner
FROM coaches;
