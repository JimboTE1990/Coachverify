-- Migration: Create Verified Credentials Cache
-- Date: 2026-01-22
-- Purpose: Store verified EMCC/ICF credentials to bypass 403 errors and speed up verification

-- Create verified_credentials table for caching verified EIA/ICF numbers
CREATE TABLE IF NOT EXISTS verified_credentials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Credential details
  accreditation_body TEXT NOT NULL CHECK (accreditation_body IN ('EMCC', 'ICF')),
  credential_number TEXT NOT NULL, -- EIA number (EMCC) or credential number (ICF)
  full_name TEXT NOT NULL,
  accreditation_level TEXT,
  country TEXT,
  profile_url TEXT,

  -- Verification metadata
  verified_at TIMESTAMP NOT NULL DEFAULT NOW(),
  verified_by TEXT NOT NULL DEFAULT 'manual', -- 'manual', 'auto', or admin user ID
  last_checked TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  notes TEXT,

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create unique index on body + credential number
CREATE UNIQUE INDEX idx_verified_credentials_unique
ON verified_credentials(accreditation_body, credential_number);

-- Create index for name searches
CREATE INDEX idx_verified_credentials_name
ON verified_credentials(full_name);

-- Create index for active credentials
CREATE INDEX idx_verified_credentials_active
ON verified_credentials(is_active)
WHERE is_active = true;

-- Enable RLS
ALTER TABLE verified_credentials ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read verified credentials (for verification checks)
CREATE POLICY "Anyone can read verified credentials"
ON verified_credentials FOR SELECT
TO public
USING (is_active = true);

-- Only admins can insert/update/delete (you'll need to create an admins table or use specific user IDs)
-- For now, allow authenticated users (you can restrict this later)
CREATE POLICY "Authenticated users can manage credentials"
ON verified_credentials FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_verified_credentials_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_verified_credentials_timestamp
BEFORE UPDATE ON verified_credentials
FOR EACH ROW
EXECUTE FUNCTION update_verified_credentials_updated_at();

-- Add some initial test data (optional - remove in production)
-- This is Paul Smith's EMCC credential for testing
INSERT INTO verified_credentials (
  accreditation_body,
  credential_number,
  full_name,
  accreditation_level,
  verified_by,
  notes
) VALUES (
  'EMCC',
  'EIA20217053',
  'Paul Smith',
  'Senior Practitioner',
  'manual',
  'Initial test data - manually verified from EMCC directory'
) ON CONFLICT (accreditation_body, credential_number) DO NOTHING;

-- Add verification status to coaches table
ALTER TABLE coaches
ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'pending'
CHECK (verification_status IN ('pending', 'verified', 'rejected', 'manual_review'));

-- Add verification notes
ALTER TABLE coaches
ADD COLUMN IF NOT EXISTS verification_notes TEXT;

-- Create index for verification status
CREATE INDEX IF NOT EXISTS idx_coaches_verification_status
ON coaches(verification_status);

-- Update existing coaches to have 'verified' status if they are already verified
UPDATE coaches
SET verification_status = 'verified'
WHERE emcc_verified = true OR icf_verified = true;

COMMENT ON TABLE verified_credentials IS 'Cache of verified EMCC/ICF credentials to bypass API rate limits and 403 errors';
COMMENT ON COLUMN verified_credentials.credential_number IS 'EIA number for EMCC (e.g., EIA20217053) or credential number for ICF';
COMMENT ON COLUMN verified_credentials.verified_by IS 'How this credential was verified: manual (admin reviewed), auto (automated), or admin user ID';
COMMENT ON COLUMN coaches.verification_status IS 'Current verification status: pending (awaiting review), verified (approved), rejected (invalid), manual_review (needs admin attention)';
