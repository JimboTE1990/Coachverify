-- =============================================
-- EMERGENCY FIX: Create Profile for Stuck User
-- =============================================
-- User ID: 086710da-2823-407d-86e6-a6d9f9d69b71
-- Issue: Email verified but no coach profile created
-- Date: December 13, 2025
-- =============================================

-- STEP 1: Check user's metadata to get their name
SELECT
  id,
  email,
  email_confirmed_at,
  raw_user_meta_data->>'full_name' as full_name,
  raw_user_meta_data->>'first_name' as first_name,
  raw_user_meta_data->>'last_name' as last_name,
  raw_user_meta_data
FROM auth.users
WHERE id = '086710da-2823-407d-86e6-a6d9f9d69b71';

-- STEP 2: Check if profile already exists (safety check)
SELECT id, user_id, name, email
FROM coaches
WHERE user_id = '086710da-2823-407d-86e6-a6d9f9d69b71';

-- STEP 3: Create profile (ONLY RUN IF STEP 2 RETURNS NO ROWS!)
-- Replace the placeholders below with actual values from STEP 1:
-- - FULL_NAME_HERE
-- - FIRST_NAME_HERE
-- - LAST_NAME_HERE
-- - EMAIL_HERE

/*
INSERT INTO coaches (
  user_id,
  name,
  first_name,
  last_name,
  email,
  is_verified,
  documents_submitted,
  subscription_status,
  billing_cycle,
  trial_ends_at,
  trial_used,
  two_factor_enabled,
  photo_url,
  bio,
  location,
  hourly_rate,
  years_experience,
  certifications,
  specialties,
  available_formats,
  phone_number,
  social_links,
  reviews,
  profile_visible,
  dashboard_access
) VALUES (
  '086710da-2823-407d-86e6-a6d9f9d69b71',
  'FULL_NAME_HERE', -- Replace with value from STEP 1
  'FIRST_NAME_HERE', -- Replace with value from STEP 1
  'LAST_NAME_HERE', -- Replace with value from STEP 1
  'EMAIL_HERE', -- Replace with value from STEP 1
  true, -- Email verified
  false, -- No documents yet
  'trial', -- 30-day trial
  'monthly', -- Default billing
  NOW() + INTERVAL '30 days', -- Trial ends 30 days from now
  false, -- Trial not consumed
  false, -- 2FA disabled
  '', -- Empty photo URL
  '', -- Empty bio
  '', -- Empty location
  0, -- Hourly rate to be set later
  0, -- Years experience to be set later
  ARRAY[]::TEXT[], -- Empty certifications array
  ARRAY[]::TEXT[], -- Empty specialties array
  ARRAY[]::TEXT[], -- Empty available formats array
  '', -- Empty phone number
  ARRAY[]::JSONB[], -- Empty social links array
  ARRAY[]::JSONB[], -- Empty reviews array
  true, -- Profile visible
  true -- Dashboard access enabled
);
*/

-- STEP 4: Verify profile was created
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
WHERE user_id = '086710da-2823-407d-86e6-a6d9f9d69b71';

-- Expected: 1 row with subscription_status = 'trial' and trial_ends_at ~30 days from now

-- =============================================
-- INSTRUCTIONS:
-- =============================================
-- 1. Run STEP 1 - copy the full_name, first_name, last_name, email values
-- 2. Run STEP 2 - if it returns rows, profile already exists, STOP HERE
-- 3. Uncomment STEP 3 (remove /* and */)
-- 4. Replace placeholders with actual values from STEP 1
-- 5. Run STEP 3
-- 6. Run STEP 4 to verify
-- 7. Test login at /coach-login
-- =============================================
