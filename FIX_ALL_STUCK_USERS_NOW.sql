-- =============================================
-- IMMEDIATE FIX: Create profiles for ALL verified users without profiles
-- =============================================
-- This will fix all stuck users in one query
-- Run this NOW to unblock everyone
-- =============================================

-- Insert profiles for all verified users who don't have one yet
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
WHERE u.email_confirmed_at IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM coaches c WHERE c.user_id = u.id
  );

-- Verify - show all profiles created
SELECT
  c.id,
  c.user_id,
  c.name,
  c.email,
  c.subscription_status,
  c.trial_ends_at,
  c.created_at
FROM coaches c
INNER JOIN auth.users u ON u.id = c.user_id
WHERE u.email_confirmed_at IS NOT NULL
ORDER BY c.created_at DESC;
