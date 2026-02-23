-- Fix users who paid for lifetime but subscription status wasn't updated
-- Run this in Supabase SQL Editor

-- Fix user 682f29b1-0385-4929-9b5a-4d2b9931031c
UPDATE coaches
SET
  subscription_status = 'lifetime',
  billing_cycle = 'lifetime',
  subscription_ends_at = NULL,  -- Lifetime never expires
  trial_ends_at = NULL
WHERE user_id = '682f29b1-0385-4929-9b5a-4d2b9931031c'::uuid;

-- Fix user 77f6a80f-817c-4b4c-96ca-a4e73833d844
UPDATE coaches
SET
  subscription_status = 'lifetime',
  billing_cycle = 'lifetime',
  subscription_ends_at = NULL,  -- Lifetime never expires
  trial_ends_at = NULL
WHERE user_id = '77f6a80f-817c-4b4c-96ca-a4e73833d844'::uuid;

-- Verify the updates
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
