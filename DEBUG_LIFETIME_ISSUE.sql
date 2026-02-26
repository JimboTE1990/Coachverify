-- Debug lifetime subscription issue for Jerry's account
-- Run this in Supabase SQL Editor

-- 1. Check Jerry's current subscription state
SELECT
  id,
  name,
  email,
  subscription_status,
  billing_cycle,
  stripe_customer_id,
  stripe_subscription_id,
  subscription_ends_at,
  trial_ends_at,
  created_at
FROM coaches
WHERE name ILIKE '%jerry%'
ORDER BY created_at DESC;

-- 2. If billing_cycle is not 'lifetime', fix it manually:
-- UPDATE coaches
-- SET
--   billing_cycle = 'lifetime',
--   subscription_status = 'active',
--   subscription_ends_at = NULL,
--   trial_ends_at = NULL
-- WHERE name ILIKE '%jerry%' AND subscription_status = 'active';

-- 3. Check if there are multiple Jerry accounts
SELECT COUNT(*) as jerry_count
FROM coaches
WHERE name ILIKE '%jerry%';
