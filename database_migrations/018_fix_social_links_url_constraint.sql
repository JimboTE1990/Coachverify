-- Migration: Fix social_links URL constraint to allow mailto: and tel:
-- Description: Updates the valid_url constraint to accept mailto:, tel:, http://, and https:// URLs
-- Date: 2026-01-09

-- Step 1: Drop the old constraint
ALTER TABLE social_links DROP CONSTRAINT IF EXISTS valid_url;

-- Step 2: Add new constraint that allows mailto:, tel:, http://, and https://
ALTER TABLE social_links
ADD CONSTRAINT valid_url CHECK (
  url ~* '^(https?|mailto|tel):.+'
);

-- Step 3: Add comment explaining the constraint
COMMENT ON CONSTRAINT valid_url ON social_links IS 'Allows http://, https://, mailto:, and tel: URLs';

-- Migration Notes:
-- 1. This migration updates the URL validation to support contact methods
-- 2. Supported URL formats:
--    - http://example.com
--    - https://example.com
--    - mailto:email@example.com
--    - tel:+1234567890
-- 3. The regex pattern is case-insensitive (~* operator)
-- 4. Safe to run multiple times (uses DROP CONSTRAINT IF EXISTS)
