-- Add country field to coaches table
-- Defaults to 'United Kingdom' for all existing coaches

ALTER TABLE coaches ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'United Kingdom';
