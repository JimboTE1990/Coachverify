-- Add ICF verification fields to coach_profiles table
-- Similar to EMCC verification but for ICF (International Coaching Federation)

ALTER TABLE coach_profiles
ADD COLUMN IF NOT EXISTS icf_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS icf_verified_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS icf_accreditation_level TEXT CHECK (icf_accreditation_level IN ('', 'ACC', 'PCC', 'MCC')),
ADD COLUMN IF NOT EXISTS icf_profile_url TEXT;

-- Add index for filtering verified ICF coaches
CREATE INDEX IF NOT EXISTS idx_coach_icf_verification ON coach_profiles(accreditation_body, icf_verified);

-- Add comments explaining the columns
COMMENT ON COLUMN coach_profiles.icf_verified IS 'Whether coach was successfully verified via ICF directory search';
COMMENT ON COLUMN coach_profiles.icf_verified_at IS 'Timestamp when ICF verification was completed';
COMMENT ON COLUMN coach_profiles.icf_accreditation_level IS 'ICF credential level (ACC, PCC, MCC)';
COMMENT ON COLUMN coach_profiles.icf_profile_url IS 'Link to coach\'s ICF directory profile if found';
