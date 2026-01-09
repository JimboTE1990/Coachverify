-- Migration: Add email validation constraint to coaches table
-- Date: 2026-01-09
-- Purpose: Enforce valid email format at the database level to prevent invalid emails

-- Step 1: Add CHECK constraint for email validation
-- This uses PostgreSQL regex to ensure emails follow standard format: user@domain.tld
ALTER TABLE coaches
ADD CONSTRAINT coaches_email_format_check
CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

-- Step 2: Verification - Test the constraint (this should fail with invalid email)
-- Uncomment the line below to test (it should fail):
-- INSERT INTO coaches (email, name, user_id) VALUES ('invalid', 'Test', '00000000-0000-0000-0000-000000000000');

-- Step 3: Verification - Check that constraint exists
SELECT
  conname AS constraint_name,
  contype AS constraint_type,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'coaches'::regclass
  AND conname = 'coaches_email_format_check';

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Email validation constraint has been added to coaches table';
  RAISE NOTICE 'Invalid email formats will now be rejected at the database level';
END $$;

-- Note: This constraint will prevent any INSERT or UPDATE with invalid email format
-- Examples of VALID emails: jane@coaching.com, john.doe@example.co.uk, test+tag@domain.com
-- Examples of INVALID emails: invalid, @domain.com, user@, user@domain
