-- Clear AC verification test data from test accounts
-- Run this in Supabase SQL Editor

-- Option 1: Clear AC data for specific test users (replace with actual test user emails)
UPDATE coaches
SET
  ac_verified = false,
  ac_verified_at = NULL,
  ac_level = NULL,
  ac_profile_url = NULL
WHERE email IN (
  'your-test-email@example.com',  -- Replace with actual test email(s)
  'another-test@example.com'
);

-- Option 2: View all AC-verified coaches to identify test accounts
SELECT
  id,
  name,
  email,
  ac_verified,
  ac_verified_at,
  ac_level,
  ac_profile_url
FROM coaches
WHERE ac_verified = true
ORDER BY ac_verified_at DESC;

-- After reviewing the above, clear specific coaches by ID:
-- UPDATE coaches
-- SET
--   ac_verified = false,
--   ac_verified_at = NULL,
--   ac_level = NULL,
--   ac_profile_url = NULL
-- WHERE id = 'coach-id-here';
