-- ============================================
-- Add Currency Field to Coaches Table
-- ============================================
-- Run this in Supabase SQL Editor to add currency support
-- ============================================

-- Step 1: Add currency column to coaches table with default GBP
ALTER TABLE coaches
ADD COLUMN IF NOT EXISTS currency VARCHAR(3) DEFAULT 'GBP';

-- Step 2: Add a check constraint to ensure only valid currencies
ALTER TABLE coaches
ADD CONSTRAINT valid_currency CHECK (
  currency IN ('USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'CHF', 'CNY', 'INR', 'NZD')
);

-- Step 3: Update existing coaches to have GBP as default (if NULL)
UPDATE coaches
SET currency = 'GBP'
WHERE currency IS NULL;

-- Step 4: Create index for faster currency filtering (optional but recommended)
CREATE INDEX IF NOT EXISTS idx_coaches_currency ON coaches(currency);

-- ============================================
-- Verification Query
-- ============================================
-- Run this to verify the column was added:
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'coaches' AND column_name = 'currency';

-- Check existing coach currencies:
SELECT currency, COUNT(*) as coach_count
FROM coaches
GROUP BY currency;
