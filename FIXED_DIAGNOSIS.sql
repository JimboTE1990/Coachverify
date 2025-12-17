-- CORRECTED diagnostic queries for user fb48c500-bb1a-4854-8623-7ded69f6493a

-- 1. Check if trigger exists and is enabled
SELECT
  tgname as trigger_name,
  tgenabled as enabled_status,
  tgrelid::regclass as table_name
FROM pg_trigger
WHERE tgname = 'on_auth_user_email_confirmed';
-- Expected: 1 row with enabled_status = 'O' (origin/enabled)

-- 2. Check user in auth.users table
SELECT
  id,
  email,
  email_confirmed_at,
  raw_user_meta_data->>'full_name' as full_name,
  created_at,
  updated_at
FROM auth.users
WHERE id = 'fb48c500-bb1a-4854-8623-7ded69f6493a';
-- Expected: email_confirmed_at should have a timestamp (not NULL)

-- 3. Check what columns actually exist in coaches table
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'coaches'
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 4. Check if coach profile was created (using only columns that exist)
SELECT
  id,
  user_id,
  name,
  email,
  subscription_status,
  trial_ends_at,
  created_at
FROM coaches
WHERE user_id = 'fb48c500-bb1a-4854-8623-7ded69f6493a';
-- Expected: 1 row if trigger worked
-- If empty: Trigger didn't fire or it failed due to schema mismatch
