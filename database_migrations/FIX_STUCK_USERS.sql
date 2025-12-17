-- =============================================
-- EMERGENCY: Create Profiles for Stuck Users
-- =============================================
-- These users verified their email but no profile was created
-- because the trigger had the wrong schema
-- =============================================

-- User 1: fb48c500-bb1a-4854-8623-7ded69f6493a (coachdogverify@gmail.com)
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
  'fb48c500-bb1a-4854-8623-7ded69f6493a',
  COALESCE(raw_user_meta_data->>'full_name', email),
  email,
  '',
  '',
  '',
  '',
  0,
  0,
  true,
  false,
  'trial',
  'monthly',
  NOW() + INTERVAL '30 days',
  false
FROM auth.users
WHERE id = 'fb48c500-bb1a-4854-8623-7ded69f6493a'
  AND NOT EXISTS (
    SELECT 1 FROM coaches WHERE user_id = 'fb48c500-bb1a-4854-8623-7ded69f6493a'
  );

-- User 2: 086710da-2823-407d-86e6-a6d9f9d69b71 (if still needed)
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
  '086710da-2823-407d-86e6-a6d9f9d69b71',
  COALESCE(raw_user_meta_data->>'full_name', email),
  email,
  '',
  '',
  '',
  '',
  0,
  0,
  true,
  false,
  'trial',
  'monthly',
  NOW() + INTERVAL '30 days',
  false
FROM auth.users
WHERE id = '086710da-2823-407d-86e6-a6d9f9d69b71'
  AND NOT EXISTS (
    SELECT 1 FROM coaches WHERE user_id = '086710da-2823-407d-86e6-a6d9f9d69b71'
  );

-- Verify profiles were created
SELECT
  id,
  user_id,
  name,
  email,
  subscription_status,
  trial_ends_at,
  created_at
FROM coaches
WHERE user_id IN (
  'fb48c500-bb1a-4854-8623-7ded69f6493a',
  '086710da-2823-407d-86e6-a6d9f9d69b71'
);
