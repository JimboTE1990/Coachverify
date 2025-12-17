-- Migration: Add pending_plan_change field for scheduled plan changes
-- Date: 2025-12-15
-- Description: Adds JSONB column to store scheduled plan changes (Amazon-style)

-- Add pending_plan_change column to coach_profiles
ALTER TABLE coach_profiles
ADD COLUMN IF NOT EXISTS pending_plan_change JSONB DEFAULT NULL;

-- Add comment explaining the field structure
COMMENT ON COLUMN coach_profiles.pending_plan_change IS
'Stores scheduled plan changes with structure:
{
  "newBillingCycle": "monthly" | "annual",
  "effectiveDate": "ISO date string when change takes effect",
  "scheduledAt": "ISO date string when user requested change",
  "previousBillingCycle": "monthly" | "annual"
}';

-- Verification query (run after migration)
-- SELECT
--   id,
--   billing_cycle,
--   pending_plan_change,
--   pending_plan_change->>'newBillingCycle' as new_plan,
--   pending_plan_change->>'effectiveDate' as effective_date
-- FROM coach_profiles
-- WHERE pending_plan_change IS NOT NULL;
