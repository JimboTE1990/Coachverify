-- SAFE UPDATE: Only update dummy coaches with placeholder/default images
-- This will NOT touch real coaches who have uploaded their own photos
-- Profile photo: Logo Image only (dog icon)
-- Banner: Full CoachDog logo with text

UPDATE coaches
SET
  photo_url = '/logo-image-only.png',
  banner_image_url = '/coachdog-logo.png'
WHERE
  -- Only update coaches that have placeholder/default images
  -- (not real uploaded photos from real coaches)
  (
    photo_url LIKE '%picsum%'
    OR photo_url LIKE '%placeholder%'
    OR photo_url = '/coachdog-logo.png'  -- Old default logo
    OR photo_url = '/logo.png'
    OR photo_url IS NULL
    OR photo_url = ''
  )
  OR
  (
    banner_image_url IS NULL
    OR banner_image_url = ''
    OR banner_image_url LIKE '%placeholder%'
  );

-- Verify what will be updated (run this FIRST to check)
SELECT
  id,
  name,
  email,
  photo_url as current_photo,
  banner_image_url as current_banner,
  CASE
    WHEN photo_url LIKE '%picsum%' THEN 'Picsum placeholder'
    WHEN photo_url = '/coachdog-logo.png' THEN 'Old default logo'
    WHEN photo_url LIKE '%supabase%' THEN 'Real uploaded photo - WILL NOT UPDATE'
    WHEN photo_url IS NULL THEN 'No photo'
    ELSE 'Other: ' || photo_url
  END as photo_status
FROM coaches
WHERE
  (
    photo_url LIKE '%picsum%'
    OR photo_url LIKE '%placeholder%'
    OR photo_url = '/coachdog-logo.png'
    OR photo_url = '/logo.png'
    OR photo_url IS NULL
    OR photo_url = ''
  )
ORDER BY name;

-- After reviewing the above list, if it looks correct, run the UPDATE above
