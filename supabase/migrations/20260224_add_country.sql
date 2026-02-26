-- Add country field to coaches table
-- Default to 'United Kingdom' since all current coaches are UK-based

ALTER TABLE coaches ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'United Kingdom';

-- Add comment for documentation
COMMENT ON COLUMN coaches.country IS 'Country where the coach is based';
