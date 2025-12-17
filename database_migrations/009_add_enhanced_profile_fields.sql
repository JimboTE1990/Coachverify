-- Migration: Add Enhanced Profile Fields for Coach Details Page
-- Description: Adds new fields for accreditation, certifications, qualifications, acknowledgements, and other profile enhancements
-- Date: 2024-12-16

-- Add accreditation level (enum-like constraint)
ALTER TABLE coach_profiles
ADD COLUMN accreditation_level TEXT CHECK (
  accreditation_level IN (
    'Foundation',
    'Practitioner',
    'Senior Practitioner',
    'Master Practitioner',
    'Certified',
    'Advanced Certified'
  )
);

COMMENT ON COLUMN coach_profiles.accreditation_level IS 'Coach accreditation level from recognized coaching bodies';

-- Add additional certifications (stored as JSONB array)
ALTER TABLE coach_profiles
ADD COLUMN additional_certifications JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN coach_profiles.additional_certifications IS 'Array of additional certifications (e.g., ["Mental Health First Aid Trained", "Trauma Informed"])';

-- Add coaching hours (total hours of coaching experience)
ALTER TABLE coach_profiles
ADD COLUMN coaching_hours INTEGER;

COMMENT ON COLUMN coach_profiles.coaching_hours IS 'Total hours of coaching experience (e.g., 500)';

-- Add location radius (for in-person coaching)
ALTER TABLE coach_profiles
ADD COLUMN location_radius TEXT;

COMMENT ON COLUMN coach_profiles.location_radius IS 'Location radius for in-person coaching (e.g., "within 5 miles of London")';

-- Add qualifications (stored as JSONB array of objects)
ALTER TABLE coach_profiles
ADD COLUMN qualifications JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN coach_profiles.qualifications IS 'Array of qualification objects: [{ id, degree, institution, year }]';

-- Add acknowledgements (stored as JSONB array of objects)
ALTER TABLE coach_profiles
ADD COLUMN acknowledgements JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN coach_profiles.acknowledgements IS 'Array of acknowledgement objects: [{ id, title, icon, year }]';

-- Add languages (stored as JSONB array)
ALTER TABLE coach_profiles
ADD COLUMN languages JSONB DEFAULT '["English"]'::jsonb;

COMMENT ON COLUMN coach_profiles.languages IS 'Array of languages spoken (e.g., ["English", "Spanish", "French"])';

-- Add average rating (calculated from reviews)
ALTER TABLE coach_profiles
ADD COLUMN average_rating NUMERIC(3, 2) CHECK (average_rating >= 0 AND average_rating <= 5);

COMMENT ON COLUMN coach_profiles.average_rating IS 'Average rating from reviews (1-5 scale, calculated)';

-- Add total reviews count
ALTER TABLE coach_profiles
ADD COLUMN total_reviews INTEGER DEFAULT 0;

COMMENT ON COLUMN coach_profiles.total_reviews IS 'Total number of reviews received';

-- Create indexes for commonly queried fields
CREATE INDEX idx_coach_profiles_accreditation_level ON coach_profiles(accreditation_level);
CREATE INDEX idx_coach_profiles_coaching_hours ON coach_profiles(coaching_hours);
CREATE INDEX idx_coach_profiles_average_rating ON coach_profiles(average_rating);

-- Create GIN index for JSONB arrays to support efficient array containment queries
CREATE INDEX idx_coach_profiles_additional_certifications ON coach_profiles USING GIN (additional_certifications);
CREATE INDEX idx_coach_profiles_languages ON coach_profiles USING GIN (languages);

-- Migration Notes:
-- 1. All new fields are nullable to support gradual profile completion
-- 2. Default values provided where appropriate (empty arrays, 0 reviews)
-- 3. Indexes added for filtering/sorting on common search criteria
-- 4. JSONB format allows flexible storage of complex nested data
-- 5. Constraints ensure data integrity (rating 0-5, valid accreditation levels)

-- Example data structure for qualifications:
-- [
--   {
--     "id": "qual_1",
--     "degree": "Masters in Law (MLAW)",
--     "institution": "University of London",
--     "year": 2015
--   }
-- ]

-- Example data structure for acknowledgements:
-- [
--   {
--     "id": "ack_1",
--     "title": "Coach of the Year 2025",
--     "icon": "trophy",
--     "year": 2025
--   },
--   {
--     "id": "ack_2",
--     "title": "Author of multiple books",
--     "icon": "book"
--   }
-- ]
