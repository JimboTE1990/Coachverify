-- Migration: Add first_name and last_name columns to coaches table
-- Date: 2025-12-09
-- Purpose: Split name field into first_name and last_name for better data structure

-- Step 1: Add new columns (nullable initially for existing data)
ALTER TABLE coaches
ADD COLUMN IF NOT EXISTS first_name TEXT,
ADD COLUMN IF NOT EXISTS last_name TEXT;

-- Step 2: Migrate existing data from 'name' column to first_name and last_name
-- This splits the name on the first space
UPDATE coaches
SET
  first_name = CASE
    WHEN name LIKE '% %' THEN SPLIT_PART(name, ' ', 1)
    ELSE name
  END,
  last_name = CASE
    WHEN name LIKE '% %' THEN SUBSTRING(name FROM POSITION(' ' IN name) + 1)
    ELSE ''
  END
WHERE first_name IS NULL OR last_name IS NULL;

-- Step 3: Set default values for any remaining NULL values
UPDATE coaches
SET
  first_name = COALESCE(first_name, name, 'Coach'),
  last_name = COALESCE(last_name, '')
WHERE first_name IS NULL OR last_name IS NULL;

-- Step 4 (OPTIONAL): Make first_name NOT NULL if you want to enforce it
-- Uncomment the line below if you want first_name to be required:
-- ALTER TABLE coaches ALTER COLUMN first_name SET NOT NULL;

-- Verification query - check the migration results
SELECT
  id,
  name as original_name,
  first_name,
  last_name,
  email
FROM coaches
ORDER BY created_at DESC
LIMIT 10;

-- Note: The 'name' column is kept for backward compatibility
-- New records will populate name as "first_name last_name"
-- You can drop the 'name' column later once all code is updated:
-- ALTER TABLE coaches DROP COLUMN name;
