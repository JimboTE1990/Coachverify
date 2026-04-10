-- Migration: Add is_lifetime_member column to coaches
-- Date: 2026-03-26
-- Reason: Webhook handler sets this flag on lifetime purchases.
--         Separate boolean makes it easy to query lifetime members without
--         relying on subscription_status string matching.

ALTER TABLE coaches ADD COLUMN IF NOT EXISTS is_lifetime_member BOOLEAN DEFAULT false;

-- Backfill existing lifetime coaches
UPDATE coaches
SET is_lifetime_member = true
WHERE subscription_status = 'lifetime';

CREATE INDEX IF NOT EXISTS idx_coaches_lifetime ON coaches(is_lifetime_member) WHERE is_lifetime_member = true;
