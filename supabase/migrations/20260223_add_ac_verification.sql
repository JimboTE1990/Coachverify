-- Add AC (Association for Coaching) verification fields to coaches table

ALTER TABLE coaches ADD COLUMN IF NOT EXISTS ac_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE coaches ADD COLUMN IF NOT EXISTS ac_verified_at TIMESTAMPTZ;
ALTER TABLE coaches ADD COLUMN IF NOT EXISTS ac_profile_url TEXT;
ALTER TABLE coaches ADD COLUMN IF NOT EXISTS ac_level TEXT;

-- Add comments for documentation
COMMENT ON COLUMN coaches.ac_verified IS 'Whether the coach AC accreditation has been verified';
COMMENT ON COLUMN coaches.ac_verified_at IS 'Timestamp when AC accreditation was verified';
COMMENT ON COLUMN coaches.ac_profile_url IS 'URL to the coach AC member directory profile';
COMMENT ON COLUMN coaches.ac_level IS 'AC accreditation level (e.g. "AC Accredited Coach")';
