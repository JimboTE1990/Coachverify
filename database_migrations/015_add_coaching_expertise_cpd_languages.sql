-- Migration: Add Coaching Expertise, CPD Qualifications, and Enhanced Languages
-- Description: Adds comprehensive coaching expertise areas (7 categories), CPD qualifications, and enhanced language options
-- Date: 2026-01-03

-- Add coaching expertise (stored as JSONB array of strings)
ALTER TABLE coach_profiles
ADD COLUMN coaching_expertise JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN coach_profiles.coaching_expertise IS 'Array of coaching expertise areas from 7 categories: Career & Professional Development, Business & Entrepreneurship, Health & Wellness, Personal & Life, Financial, Niche & Demographic, Methodology & Modality (e.g., ["Executive Coaching", "Leadership Development", "Stress Management"])';

-- Add CPD qualifications (stored as JSONB array of strings)
ALTER TABLE coach_profiles
ADD COLUMN cpd_qualifications JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN coach_profiles.cpd_qualifications IS 'Array of CPD (Continuing Professional Development) qualifications and certifications (e.g., ["ICF Associate Certified Coach (ACC)", "EMCC Practitioner Level", "Mental Health First Aid (MHFA)"])';

-- Add enhanced coaching languages (stored as JSONB array of strings)
ALTER TABLE coach_profiles
ADD COLUMN coaching_languages JSONB DEFAULT '["English"]'::jsonb;

COMMENT ON COLUMN coach_profiles.coaching_languages IS 'Array of languages in which coaching sessions are offered (e.g., ["English", "Spanish", "French", "Mandarin Chinese"])';

-- Create GIN indexes for efficient array containment queries
CREATE INDEX idx_coach_profiles_coaching_expertise ON coach_profiles USING GIN (coaching_expertise);
CREATE INDEX idx_coach_profiles_cpd_qualifications ON coach_profiles USING GIN (cpd_qualifications);
CREATE INDEX idx_coach_profiles_coaching_languages ON coach_profiles USING GIN (coaching_languages);

-- Migration Notes:
-- 1. All new fields are nullable with sensible defaults (empty arrays for expertise/qualifications, ["English"] for languages)
-- 2. GIN indexes support efficient filtering by expertise area, qualification, or language
-- 3. coaching_languages supersedes the existing "languages" field (keeping both for backward compatibility)
-- 4. coaching_expertise provides much more granular filtering than the legacy "specialties" field
-- 5. cpd_qualifications allows coaches to showcase professional development beyond basic accreditation

-- Example coaching_expertise data:
-- [
--   "Executive Coaching",
--   "Leadership Development",
--   "Career Transition",
--   "Stress Management",
--   "Work-Life Balance",
--   "Mindfulness-Based Coaching"
-- ]

-- Example cpd_qualifications data:
-- [
--   "ICF Professional Certified Coach (PCC)",
--   "EMCC Senior Practitioner Level",
--   "Mental Health First Aid (MHFA)",
--   "Trauma-Informed Coaching Certificate",
--   "NLP Master Practitioner Certification"
-- ]

-- Example coaching_languages data:
-- [
--   "English",
--   "Spanish",
--   "French",
--   "Mandarin Chinese"
-- ]

-- Search Performance Notes:
-- GIN indexes enable fast queries like:
--   - Find coaches with specific expertise: WHERE coaching_expertise @> '["Executive Coaching"]'
--   - Find coaches with CPD qualification: WHERE cpd_qualifications @> '["ICF PCC"]'
--   - Find coaches offering sessions in language: WHERE coaching_languages @> '["Spanish"]'
--   - Combined filters: WHERE coaching_expertise @> '["Leadership"]' AND coaching_languages @> '["French"]'
