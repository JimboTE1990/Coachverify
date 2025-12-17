-- Check current coach visibility status
SELECT 
  id,
  name,
  email,
  subscription_status,
  is_verified,
  profile_visible,
  billing_cycle
FROM coaches
ORDER BY created_at DESC
LIMIT 20;
