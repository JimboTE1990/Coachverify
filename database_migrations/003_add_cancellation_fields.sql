-- Migration: Add Cancellation Tracking Fields
-- Date: 2024-12-11
-- Purpose: Track subscription cancellations and allow reversible cancellation with access until billing period end

-- Step 1: Add cancellation tracking columns
ALTER TABLE coaches
ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS subscription_ends_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS cancel_reason TEXT,
ADD COLUMN IF NOT EXISTS cancel_feedback TEXT;

-- Step 2: Add Stripe integration fields (for future use)
ALTER TABLE coaches
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;

-- Step 3: Add check constraint for cancel_reason (optional but recommended)
ALTER TABLE coaches
ADD CONSTRAINT cancel_reason_check CHECK (
  cancel_reason IS NULL OR cancel_reason IN (
    'too_expensive',
    'not_enough_clients',
    'switching_platform',
    'technical_issues',
    'no_longer_coaching',
    'other'
  )
);

-- Step 4: Add index for Stripe customer ID lookups (for future Stripe webhooks)
CREATE INDEX IF NOT EXISTS idx_coaches_stripe_customer_id ON coaches(stripe_customer_id)
WHERE stripe_customer_id IS NOT NULL;

-- Step 5: Add comment documentation
COMMENT ON COLUMN coaches.cancelled_at IS 'Timestamp when user requested cancellation';
COMMENT ON COLUMN coaches.subscription_ends_at IS 'When access actually ends (billing period end or trial end)';
COMMENT ON COLUMN coaches.cancel_reason IS 'Reason for cancellation from dropdown';
COMMENT ON COLUMN coaches.cancel_feedback IS 'Optional text feedback from user';
COMMENT ON COLUMN coaches.stripe_customer_id IS 'Stripe customer ID for payment processing';
COMMENT ON COLUMN coaches.stripe_subscription_id IS 'Stripe subscription ID for webhook updates';

-- Verification query - check the migration results
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'coaches'
  AND column_name IN (
    'cancelled_at',
    'subscription_ends_at',
    'cancel_reason',
    'cancel_feedback',
    'stripe_customer_id',
    'stripe_subscription_id'
  )
ORDER BY ordinal_position;

-- Sample data check
SELECT
  id,
  email,
  subscription_status,
  cancelled_at,
  subscription_ends_at,
  cancel_reason
FROM coaches
WHERE cancelled_at IS NOT NULL OR subscription_ends_at IS NOT NULL
LIMIT 5;
