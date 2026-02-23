-- Complete fix for lifetime subscription issue
-- Run this entire script in Supabase SQL Editor

-- Step 1: Update database constraints to allow 'lifetime' values
-- Drop existing constraints
ALTER TABLE coaches DROP CONSTRAINT IF EXISTS coaches_subscription_status_check;
ALTER TABLE coaches DROP CONSTRAINT IF EXISTS coaches_billing_cycle_check;

-- Add new constraints that include 'lifetime'
ALTER TABLE coaches
ADD CONSTRAINT coaches_subscription_status_check
CHECK (subscription_status IN ('onboarding', 'trial', 'active', 'expired', 'lifetime'));

ALTER TABLE coaches
ADD CONSTRAINT coaches_billing_cycle_check
CHECK (billing_cycle IN ('monthly', 'annual', 'lifetime'));

-- Step 2: Fix user 682f29b1-0385-4929-9b5a-4d2b9931031c
UPDATE coaches
SET
  subscription_status = 'lifetime',
  billing_cycle = 'lifetime',
  subscription_ends_at = NULL,  -- Lifetime never expires
  trial_ends_at = NULL
WHERE user_id = '682f29b1-0385-4929-9b5a-4d2b9931031c'::uuid;

-- Step 3: Fix user 77f6a80f-817c-4b4c-96ca-a4e73833d844
UPDATE coaches
SET
  subscription_status = 'lifetime',
  billing_cycle = 'lifetime',
  subscription_ends_at = NULL,  -- Lifetime never expires
  trial_ends_at = NULL
WHERE user_id = '77f6a80f-817c-4b4c-96ca-a4e73833d844'::uuid;

-- Step 4: Verify the updates
SELECT
  id,
  user_id,
  name,
  email,
  subscription_status,
  billing_cycle,
  subscription_ends_at,
  trial_ends_at,
  stripe_customer_id
FROM coaches
WHERE user_id IN (
  '682f29b1-0385-4929-9b5a-4d2b9931031c'::uuid,
  '77f6a80f-817c-4b4c-96ca-a4e73833d844'::uuid
);
