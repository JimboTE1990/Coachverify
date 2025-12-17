-- =============================================
-- CLEANUP: Remove duplicate user accounts
-- =============================================
-- Multiple users were created with same emails
-- This will keep the MOST RECENT one and delete older duplicates
-- =============================================

-- 1. First, let's see all duplicates
SELECT
  email,
  COUNT(*) as account_count,
  STRING_AGG(id::text, ', ' ORDER BY created_at DESC) as user_ids
FROM auth.users
GROUP BY email
HAVING COUNT(*) > 1;

-- 2. For each email, keep ONLY the most recent account, delete others
-- (This is safe because none have logged in successfully yet)

-- Delete duplicate accounts for jfamarketingsolutions@gmail.com
-- Keep: c820f63e-64b1-487e-b1f3-1da3bc5c40c4 (most recent)
DELETE FROM auth.users
WHERE email = 'jfamarketingsolutions@gmail.com'
  AND id NOT IN (
    SELECT id FROM auth.users
    WHERE email = 'jfamarketingsolutions@gmail.com'
    ORDER BY created_at DESC
    LIMIT 1
  );

-- Delete duplicate accounts for coachdogverify@gmail.com
-- Keep most recent
DELETE FROM auth.users
WHERE email = 'coachdogverify@gmail.com'
  AND id NOT IN (
    SELECT id FROM auth.users
    WHERE email = 'coachdogverify@gmail.com'
    ORDER BY created_at DESC
    LIMIT 1
  );

-- 3. Verify - should show only 1 account per email now
SELECT
  id,
  email,
  email_confirmed_at,
  created_at
FROM auth.users
WHERE email IN ('jfamarketingsolutions@gmail.com', 'coachdogverify@gmail.com')
ORDER BY email, created_at DESC;

-- 4. Create profiles for the remaining accounts (if not already created)
INSERT INTO coaches (
  user_id,
  name,
  email,
  phone_number,
  photo_url,
  bio,
  location,
  hourly_rate,
  years_experience,
  is_verified,
  documents_submitted,
  subscription_status,
  billing_cycle,
  trial_ends_at,
  two_factor_enabled
)
SELECT
  u.id as user_id,
  COALESCE(u.raw_user_meta_data->>'full_name', u.email) as name,
  u.email,
  '' as phone_number,
  '' as photo_url,
  '' as bio,
  '' as location,
  0 as hourly_rate,
  0 as years_experience,
  true as is_verified,
  false as documents_submitted,
  'trial' as subscription_status,
  'monthly' as billing_cycle,
  NOW() + INTERVAL '30 days' as trial_ends_at,
  false as two_factor_enabled
FROM auth.users u
WHERE u.email IN ('jfamarketingsolutions@gmail.com', 'coachdogverify@gmail.com')
  AND NOT EXISTS (
    SELECT 1 FROM coaches c WHERE c.user_id = u.id
  );

-- 5. Final verification
SELECT
  u.id,
  u.email,
  u.email_confirmed_at,
  c.id as coach_profile_id,
  c.subscription_status
FROM auth.users u
LEFT JOIN coaches c ON c.user_id = u.id
WHERE u.email IN ('jfamarketingsolutions@gmail.com', 'coachdogverify@gmail.com')
ORDER BY u.email;
