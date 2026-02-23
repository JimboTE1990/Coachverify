-- Add 'lifetime' to subscription_status and billing_cycle constraints

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
