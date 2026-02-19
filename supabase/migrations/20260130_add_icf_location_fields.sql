-- Add ICF location support for URL-based verification
-- ICF requires location (City, Country) to disambiguate coaches with same name

-- Add location column to verified_credentials table
-- This stores "City, Country" format (e.g., "London, UK")
ALTER TABLE verified_credentials
ADD COLUMN IF NOT EXISTS location VARCHAR(255);

-- Add icf_location to coaches table (not coach_profiles view)
-- coach_profiles is a view based on coaches table
ALTER TABLE coaches
ADD COLUMN IF NOT EXISTS icf_location VARCHAR(255);

-- Also ensure ICF verification columns exist in coaches table
-- (Previous migration may have tried to add to view instead of table)
ALTER TABLE coaches
ADD COLUMN IF NOT EXISTS icf_verified BOOLEAN DEFAULT FALSE;

ALTER TABLE coaches
ADD COLUMN IF NOT EXISTS icf_verified_at TIMESTAMPTZ;

ALTER TABLE coaches
ADD COLUMN IF NOT EXISTS icf_profile_url TEXT;

-- Add helpful comments
COMMENT ON COLUMN verified_credentials.location IS 'Location in "City, Country" format for ICF disambiguation';
COMMENT ON COLUMN coaches.icf_location IS 'ICF verified location from coach profile';
COMMENT ON COLUMN coaches.icf_verified IS 'Whether coach was successfully verified via ICF';
COMMENT ON COLUMN coaches.icf_verified_at IS 'Timestamp when ICF verification was completed';
COMMENT ON COLUMN coaches.icf_profile_url IS 'ICF directory search URL used for verification';
