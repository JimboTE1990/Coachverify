-- Migration: Fix Coach Visibility for Testing
-- Description: Ensures test coaches are visible in the directory
-- Date: 2024-12-16
-- Run this manually in your Supabase SQL editor

-- STEP 1: Set all coaches with trial or active subscription to be verified
UPDATE coaches
SET
  is_verified = true
WHERE subscription_status IN ('trial', 'active');

-- STEP 2: Verify the changes
SELECT
  id,
  name,
  email,
  subscription_status,
  is_verified,
  created_at
FROM coaches
ORDER BY created_at DESC;

-- Expected result: All coaches with 'trial' or 'active' status should have:
-- is_verified = true

-- STEP 3: Test query to match what the app will query
-- This should show the coaches that will appear in the directory
SELECT
  id,
  name,
  email,
  subscription_status,
  is_verified
FROM coach_profiles
WHERE is_verified = true
  AND subscription_status IN ('trial', 'active')
ORDER BY created_at DESC;
