-- Add referral_source column to coaches table
-- Stores the partner that referred a coach to CoachDog (e.g. 'emcc', 'icf', 'ac')
-- Captured from ?ref= or ?partner= URL params at signup

ALTER TABLE coaches ADD COLUMN IF NOT EXISTS referral_source TEXT;
