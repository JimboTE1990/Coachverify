-- Fix coach visibility for testing/demo users
-- This will make all coaches with trial or active subscriptions visible in the directory

UPDATE coaches
SET 
  is_verified = true,
  profile_visible = true
WHERE subscription_status IN ('trial', 'active')
  AND (is_verified = false OR profile_visible = false OR profile_visible IS NULL);

-- Verify the update
SELECT 
  id,
  name,
  email,
  subscription_status,
  is_verified,
  profile_visible
FROM coaches
WHERE subscription_status IN ('trial', 'active')
ORDER BY created_at DESC;
