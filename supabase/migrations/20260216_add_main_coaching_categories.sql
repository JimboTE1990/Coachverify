-- ==============================================================================
-- Add Main Coaching Categories Column
-- ==============================================================================
-- This migration adds the primary coaching categories field that will be used
-- for matching. These 7 broad categories are the primary selectable fields,
-- while the detailed coaching_expertise remains optional.
--
-- Date: 2026-02-16
-- ==============================================================================

-- Add main_coaching_categories column to coaches table
ALTER TABLE coaches
ADD COLUMN IF NOT EXISTS main_coaching_categories TEXT[];

-- Add descriptive comment
COMMENT ON COLUMN coaches.main_coaching_categories IS 'Primary broad coaching categories (7 main areas) used for matching. These are directly selectable by coaches and take priority in matching logic over detailed expertise.';

-- Create index for efficient filtering by categories
CREATE INDEX IF NOT EXISTS idx_coaches_main_coaching_categories
ON coaches USING GIN(main_coaching_categories);

-- ==============================================================================
-- Valid Categories (for reference):
-- ==============================================================================
-- 1. Career & Professional Development
-- 2. Business & Entrepreneurship
-- 3. Health & Wellness
-- 4. Personal & Life
-- 5. Financial
-- 6. Niche & Demographic
-- 7. Methodology & Modality
-- ==============================================================================
