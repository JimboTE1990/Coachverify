-- ============================================
-- IMMEDIATE FIX: Make Trial Coaches Visible
-- ============================================
-- This fixes the immediate issue where new coaches don't appear
-- Run this NOW to fix existing coaches
-- ============================================

-- Fix 1: Set ALL trial coaches to verified
-- This makes them immediately visible in the directory
UPDATE coaches
SET is_verified = true,
    profile_visible = true
WHERE subscription_status IN ('trial', 'active')
AND is_verified = false;

-- Fix 2: Verify the update worked
SELECT
  COUNT(*) as total_visible_coaches,
  COUNT(CASE WHEN subscription_status = 'trial' THEN 1 END) as trial_coaches,
  COUNT(CASE WHEN subscription_status = 'active' THEN 1 END) as active_coaches
FROM coaches
WHERE is_verified = true
AND subscription_status IN ('trial', 'active');

-- Fix 3: List the coaches that are now visible
SELECT
  id,
  name,
  email,
  subscription_status,
  is_verified,
  profile_visible,
  created_at
FROM coaches
WHERE subscription_status IN ('trial', 'active')
ORDER BY created_at DESC
LIMIT 20;

-- ============================================
-- Success Message
-- ============================================
-- After running this, all trial coaches should be visible in the directory!
