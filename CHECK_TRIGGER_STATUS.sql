-- Check current status for user c820f63e-64b1-487e-b1f3-1da3bc5c40c4

-- 1. Is trigger installed?
SELECT
  tgname as trigger_name,
  tgenabled as enabled_status,
  tgrelid::regclass as table_name
FROM pg_trigger
WHERE tgname = 'on_auth_user_email_confirmed';
-- If empty: trigger not installed
-- If enabled_status = 'D': trigger is disabled
-- If enabled_status = 'O': trigger is enabled (correct)

-- 2. Was email confirmed?
SELECT
  id,
  email,
  email_confirmed_at,
  raw_user_meta_data->>'full_name' as full_name,
  created_at
FROM auth.users
WHERE id = 'c820f63e-64b1-487e-b1f3-1da3bc5c40c4';
-- email_confirmed_at should NOT be NULL

-- 3. Was profile created?
SELECT
  id,
  user_id,
  name,
  email,
  subscription_status,
  trial_ends_at,
  created_at
FROM coaches
WHERE user_id = 'c820f63e-64b1-487e-b1f3-1da3bc5c40c4';
-- If empty: trigger didn't fire or failed

-- 4. Check for ALL verified users without profiles
SELECT
  u.id,
  u.email,
  u.email_confirmed_at,
  c.id as has_profile
FROM auth.users u
LEFT JOIN coaches c ON c.user_id = u.id
WHERE u.email_confirmed_at IS NOT NULL
  AND c.id IS NULL;
-- Shows all stuck users
