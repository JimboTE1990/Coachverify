-- Migration: Add Data Retention Preference
-- Date: 2025-01-02
-- Purpose: Track user preference for data retention after cancellation

-- Add data retention preference field
ALTER TABLE coaches
ADD COLUMN IF NOT EXISTS data_retention_preference TEXT DEFAULT 'keep';

-- Add check constraint for valid values
ALTER TABLE coaches
ADD CONSTRAINT data_retention_preference_check CHECK (
  data_retention_preference IN ('keep', 'delete')
);

-- Add scheduled deletion date (for users who chose 'keep' - auto-delete after 2 years)
ALTER TABLE coaches
ADD COLUMN IF NOT EXISTS scheduled_deletion_at TIMESTAMP WITH TIME ZONE;

-- Add comment documentation
COMMENT ON COLUMN coaches.data_retention_preference IS 'User preference for data retention: keep (retain for 2 years) or delete (delete within 30 days)';
COMMENT ON COLUMN coaches.scheduled_deletion_at IS 'Date when data will be automatically deleted (2 years after cancellation for keep preference, 30 days for delete preference)';

-- Verification query
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'coaches'
  AND column_name IN (
    'data_retention_preference',
    'scheduled_deletion_at'
  )
ORDER BY ordinal_position;
