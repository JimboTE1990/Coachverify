-- No database changes needed for profile URL input
-- Profile URL is provided by coach but not stored separately
-- We already store emcc_profile_url and icf_profile_url (verification result)
-- The input URL is used for verification, then we store the verified URL

-- This migration serves as documentation that profile URLs are collected during verification
-- but are not stored as separate input fields (privacy + storage efficiency)

COMMENT ON COLUMN coach_profiles.emcc_profile_url IS 'Verified EMCC directory profile URL (after successful verification)';
COMMENT ON COLUMN coach_profiles.icf_profile_url IS 'Verified ICF directory profile URL (after successful verification)';
