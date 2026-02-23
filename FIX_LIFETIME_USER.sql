-- Fix user 682f29b1-0385-4929-9b5a-4d2b9931031c who paid for lifetime
-- Run this in Supabase SQL Editor immediately

UPDATE coaches
SET
  subscription_status = 'lifetime',
  billing_cycle = 'lifetime',
  subscription_ends_at = NULL,  -- Lifetime never expires
  trial_used = true,
  trial_ends_at = NULL
WHERE user_id = '682f29b1-0385-4929-9b5a-4d2b9931031c'::uuid;

-- Verify the update
SELECT
  id,
  user_id,
  name,
  email,
  subscription_status,
  billing_cycle,
  subscription_ends_at,
  trial_ends_at
FROM coaches
WHERE user_id = '682f29b1-0385-4929-9b5a-4d2b9931031c'::uuid;
