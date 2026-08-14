-- Add secondary_accreditations JSONB column to coaches table.
-- Stores an array of {body, level} objects for accreditation bodies
-- beyond the coach's primary (e.g. an ICF coach who also holds EMCC).
-- Example: [{"body": "EMCC", "level": "Practitioner"}, {"body": "ICF", "level": "PCC"}]

ALTER TABLE public.coaches
  ADD COLUMN IF NOT EXISTS secondary_accreditations JSONB NOT NULL DEFAULT '[]'::jsonb;
