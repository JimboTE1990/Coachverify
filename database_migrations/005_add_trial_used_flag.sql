-- Migration: Add trial_used flag
-- Date: 2024-12-11
-- Purpose: Track if user has already used their free trial (prevents multiple trials)

-- Step 1: Add trial_used column
ALTER TABLE coaches
ADD COLUMN IF NOT EXISTS trial_used BOOLEAN DEFAULT FALSE;

-- Step 2: Set trial_used = TRUE for users who have already activated a trial
-- This prevents existing trial users from getting another trial later
UPDATE coaches
SET trial_used = TRUE
WHERE subscription_status IN ('trial', 'active', 'expired')
  AND trial_ends_at IS NOT NULL;

-- Step 3: Add comment documentation
COMMENT ON COLUMN coaches.trial_used IS 'TRUE if user has already used their one-time free trial';

-- Verification query
SELECT
  id,
  email,
  subscription_status,
  trial_used,
  trial_ends_at
FROM coaches
ORDER BY created_at DESC
LIMIT 10;
