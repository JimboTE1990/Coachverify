-- Add custom_url field to coaches table for vanity URLs
-- Allows coaches to set custom URLs like /coach/jonnysmith instead of /coach/uuid

ALTER TABLE coaches
ADD COLUMN IF NOT EXISTS custom_url TEXT UNIQUE;

-- Add index for faster custom URL lookups
CREATE INDEX IF NOT EXISTS idx_coaches_custom_url ON coaches(custom_url);

-- Add constraint to enforce URL-safe characters (lowercase letters, numbers, hyphens only)
ALTER TABLE coaches
ADD CONSTRAINT custom_url_format CHECK (
  custom_url IS NULL OR
  custom_url ~ '^[a-z0-9-]{3,50}$'
);

-- Add comment
COMMENT ON COLUMN coaches.custom_url IS 'Custom vanity URL slug for coach profile (e.g., "jonnysmith" for /coach/jonnysmith). Must be 3-50 characters, lowercase letters, numbers, and hyphens only.';
