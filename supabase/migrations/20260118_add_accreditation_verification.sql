-- Add accreditation verification fields to coach_profiles table

ALTER TABLE coach_profiles
ADD COLUMN IF NOT EXISTS accreditation_body TEXT CHECK (accreditation_body IN ('EMCC', 'ICF', 'Other', '')),
ADD COLUMN IF NOT EXISTS emcc_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS emcc_verified_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS emcc_accreditation_level TEXT CHECK (emcc_accreditation_level IN ('', 'Foundation', 'Practitioner', 'Senior Practitioner', 'Master Practitioner')),
ADD COLUMN IF NOT EXISTS emcc_profile_url TEXT;

-- Add index for filtering verified coaches
CREATE INDEX IF NOT EXISTS idx_coach_accreditation ON coach_profiles(accreditation_body, emcc_verified);

-- Add comments explaining the columns
COMMENT ON COLUMN coach_profiles.accreditation_body IS 'Selected accreditation body (EMCC, ICF, Other) - triggers verification flow';
COMMENT ON COLUMN coach_profiles.emcc_verified IS 'Whether coach was successfully verified via EMCC directory search';
COMMENT ON COLUMN coach_profiles.emcc_verified_at IS 'Timestamp when EMCC verification was completed';
COMMENT ON COLUMN coach_profiles.emcc_accreditation_level IS 'EMCC accreditation level (Foundation, Practitioner, Senior Practitioner, Master Practitioner)';
COMMENT ON COLUMN coach_profiles.emcc_profile_url IS 'Link to coach\'s EMCC directory profile if found';
