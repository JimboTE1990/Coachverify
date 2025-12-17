-- Quick diagnosis for user fb48c500-bb1a-4854-8623-7ded69f6493a
-- Run these queries in Supabase SQL Editor

-- 1. Check if trigger exists and is enabled
SELECT
  tgname as trigger_name,
  tgenabled as enabled_status,
  tgrelid::regclass as table_name
FROM pg_trigger
WHERE tgname = 'on_auth_user_email_confirmed';
-- Expected: 1 row with enabled_status = 'O' (origin/enabled)
-- If empty: Trigger was not created!

-- 2. Check user in auth.users table
SELECT
  id,
  email,
  email_confirmed_at,
  raw_user_meta_data->>'full_name' as full_name,
  raw_user_meta_data->>'first_name' as first_name,
  raw_user_meta_data->>'last_name' as last_name,
  created_at,
  updated_at
FROM auth.users
WHERE id = 'fb48c500-bb1a-4854-8623-7ded69f6493a';
-- Expected: email_confirmed_at should have a timestamp (not NULL)

-- 3. Check if coach profile was created
SELECT
  id,
  user_id,
  name,
  first_name,
  last_name,
  email,
  subscription_status,
  trial_ends_at,
  created_at
FROM coaches
WHERE user_id = 'fb48c500-bb1a-4854-8623-7ded69f6493a';
-- Expected: 1 row if trigger worked
-- If empty: Trigger didn't fire or failed

-- 4. Check database logs for trigger execution
-- (Run this in Supabase Dashboard → Database → Logs, filter by:)
-- "handle_new_user_email_confirmation"
-- Look for:
-- - "Email confirmed for user fb48c500-bb1a-4854-8623-7ded69f6493a"
-- - "Profile created successfully for user fb48c500-bb1a-4854-8623-7ded69f6493a"
-- Or any errors/warnings
