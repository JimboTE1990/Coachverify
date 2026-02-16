-- ==============================================================================
-- Delete Account System Redesign - Database Schema
-- ==============================================================================
-- This migration adds comprehensive deletion tracking to support the new
-- delete account flow with password protection, billing period scheduling,
-- 30-day restoration window, and full audit trail.
--
-- Date: 2026-02-16
-- ==============================================================================

-- Add deletion tracking columns to coaches table
ALTER TABLE coaches
ADD COLUMN IF NOT EXISTS deletion_requested_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS deletion_effective_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS deletion_permanent_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS deletion_reason TEXT,
ADD COLUMN IF NOT EXISTS can_restore BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS restored_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS restored_by TEXT;

-- Add descriptive comments for documentation
COMMENT ON COLUMN coaches.deletion_requested_at IS 'When user first requested account deletion';
COMMENT ON COLUMN coaches.deletion_effective_date IS 'When account will be hidden/locked (end of billing period)';
COMMENT ON COLUMN coaches.deletion_permanent_date IS 'When data will be permanently deleted (effective_date + 30 days)';
COMMENT ON COLUMN coaches.deletion_reason IS 'Optional reason provided by user for leaving';
COMMENT ON COLUMN coaches.can_restore IS 'Whether account can still be restored (false after permanent deletion)';
COMMENT ON COLUMN coaches.restored_at IS 'When account was restored from deletion (if applicable)';
COMMENT ON COLUMN coaches.restored_by IS 'Who restored the account (user_id for self-service, admin email for manual restore)';

-- Create index for efficient deletion processing queries
CREATE INDEX IF NOT EXISTS idx_coaches_deletion_effective_date
ON coaches(deletion_effective_date)
WHERE deletion_effective_date IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_coaches_deletion_permanent_date
ON coaches(deletion_permanent_date)
WHERE deletion_permanent_date IS NOT NULL;

-- ==============================================================================
-- Notes for Implementation:
-- ==============================================================================
--
-- Deletion Timeline Example:
-- 1. User requests deletion → deletion_requested_at = NOW
-- 2. Calculate deletion_effective_date = subscription_ends_at (end of billing period)
-- 3. Calculate deletion_permanent_date = deletion_effective_date + 30 days
-- 4. On effective date: Set subscription_status = 'expired', profile_visible = FALSE
-- 5. Within 30 days: User can restore (clear all deletion fields)
-- 6. On permanent date: Permanently delete all data, set can_restore = FALSE
--
-- Restoration (within 30-day window):
-- - Clear deletion_requested_at, deletion_effective_date, deletion_permanent_date
-- - Set restored_at = NOW, restored_by = user_id or admin email
-- - Set subscription_status = 'active', profile_visible = TRUE
--
-- ==============================================================================
