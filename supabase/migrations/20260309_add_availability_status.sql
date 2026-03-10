-- Add availability status fields to coaches table
-- Allows coaches to optionally display their current availability to clients
-- availability_status: 'accepting' | 'limited' | 'not_accepting'
-- availability_note: optional free-text (e.g. "2 spaces remaining" or "returning Jan 2027")
-- show_availability_publicly: coach controls whether badge appears on their profile

ALTER TABLE coaches
  ADD COLUMN IF NOT EXISTS availability_status TEXT
    CHECK (availability_status IN ('accepting', 'limited', 'not_accepting'))
    DEFAULT 'accepting',
  ADD COLUMN IF NOT EXISTS availability_note TEXT,
  ADD COLUMN IF NOT EXISTS show_availability_publicly BOOLEAN DEFAULT false;

-- Rollback:
-- ALTER TABLE coaches DROP COLUMN IF EXISTS availability_status;
-- ALTER TABLE coaches DROP COLUMN IF EXISTS availability_note;
-- ALTER TABLE coaches DROP COLUMN IF EXISTS show_availability_publicly;
