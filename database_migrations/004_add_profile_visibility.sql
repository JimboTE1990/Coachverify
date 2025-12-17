-- Migration: Add Profile Visibility with Automatic Triggers
-- Date: 2024-12-11
-- Purpose: Automatically hide/show profiles based on subscription status using database triggers

-- Step 1: Add visibility and access control columns
ALTER TABLE coaches
ADD COLUMN IF NOT EXISTS profile_visible BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS dashboard_access BOOLEAN DEFAULT TRUE;

-- Step 2: Set initial values based on existing subscription status
-- Hide profiles for expired/onboarding coaches
UPDATE coaches
SET
  profile_visible = CASE
    WHEN subscription_status IN ('trial', 'active') THEN TRUE
    WHEN subscription_status IN ('expired', 'onboarding') THEN FALSE
    ELSE TRUE
  END,
  dashboard_access = CASE
    WHEN subscription_status IN ('trial', 'active') THEN TRUE
    ELSE FALSE
  END
WHERE profile_visible IS NULL OR dashboard_access IS NULL;

-- Step 3: Drop existing function if it exists
DROP FUNCTION IF EXISTS auto_manage_profile_visibility() CASCADE;

-- Step 4: Create function to auto-manage profile visibility
CREATE FUNCTION auto_manage_profile_visibility()
RETURNS TRIGGER AS $$
BEGIN
  -- Auto-hide profile when subscription expires
  IF NEW.subscription_status = 'expired' AND OLD.subscription_status != 'expired' THEN
    NEW.profile_visible := FALSE;
    NEW.dashboard_access := FALSE;
    RAISE NOTICE 'Profile hidden due to subscription expiry: %', NEW.id;
  END IF;

  -- Auto-show profile when subscription becomes active or trial
  IF NEW.subscription_status IN ('active', 'trial') AND OLD.subscription_status = 'expired' THEN
    NEW.profile_visible := TRUE;
    NEW.dashboard_access := TRUE;
    RAISE NOTICE 'Profile visible due to subscription activation: %', NEW.id;
  END IF;

  -- Hide profile for onboarding coaches (not verified yet)
  IF NEW.subscription_status = 'onboarding' AND OLD.subscription_status != 'onboarding' THEN
    NEW.profile_visible := FALSE;
    NEW.dashboard_access := FALSE;
  END IF;

  -- When trial activates from onboarding, show profile
  IF NEW.subscription_status = 'trial' AND OLD.subscription_status = 'onboarding' THEN
    NEW.profile_visible := TRUE;
    NEW.dashboard_access := TRUE;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 5: Create trigger to run before UPDATE on subscription_status
DROP TRIGGER IF EXISTS trigger_auto_manage_profile_visibility ON coaches;

CREATE TRIGGER trigger_auto_manage_profile_visibility
  BEFORE UPDATE OF subscription_status ON coaches
  FOR EACH ROW
  WHEN (NEW.subscription_status IS DISTINCT FROM OLD.subscription_status)
  EXECUTE FUNCTION auto_manage_profile_visibility();

-- Step 6: Add indexes for filtering visible profiles (performance optimization)
CREATE INDEX IF NOT EXISTS idx_coaches_profile_visible ON coaches(profile_visible)
WHERE profile_visible = TRUE;

CREATE INDEX IF NOT EXISTS idx_coaches_subscription_status_visible ON coaches(subscription_status, profile_visible)
WHERE profile_visible = TRUE;

-- Step 7: Add NOT NULL constraints (optional - can be done later if needed)
-- Uncomment if you want to enforce non-null values:
-- ALTER TABLE coaches ALTER COLUMN profile_visible SET DEFAULT TRUE;
-- ALTER TABLE coaches ALTER COLUMN dashboard_access SET DEFAULT TRUE;
-- UPDATE coaches SET profile_visible = TRUE WHERE profile_visible IS NULL;
-- UPDATE coaches SET dashboard_access = FALSE WHERE dashboard_access IS NULL;
-- ALTER TABLE coaches ALTER COLUMN profile_visible SET NOT NULL;
-- ALTER TABLE coaches ALTER COLUMN dashboard_access SET NOT NULL;

-- Step 8: Add comment documentation
COMMENT ON COLUMN coaches.profile_visible IS 'Auto-managed: TRUE if profile should appear in public listings (trial/active only)';
COMMENT ON COLUMN coaches.dashboard_access IS 'Auto-managed: TRUE if coach can access dashboard (trial/active only)';
COMMENT ON FUNCTION auto_manage_profile_visibility() IS 'Automatically updates profile_visible and dashboard_access based on subscription_status changes';
COMMENT ON TRIGGER trigger_auto_manage_profile_visibility ON coaches IS 'Runs before subscription_status UPDATE to auto-manage visibility';

-- Verification query - check the migration results
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'coaches'
  AND column_name IN ('profile_visible', 'dashboard_access')
ORDER BY ordinal_position;

-- Sample data check - show visibility status by subscription status
SELECT
  subscription_status,
  COUNT(*) as total_coaches,
  SUM(CASE WHEN profile_visible THEN 1 ELSE 0 END) as visible_profiles,
  SUM(CASE WHEN dashboard_access THEN 1 ELSE 0 END) as dashboard_access_granted
FROM coaches
GROUP BY subscription_status
ORDER BY subscription_status;

-- Test trigger by showing a sample coach's current state
SELECT
  id,
  email,
  subscription_status,
  profile_visible,
  dashboard_access,
  trial_ends_at
FROM coaches
LIMIT 5;

-- Note: To test the trigger manually, run:
-- UPDATE coaches SET subscription_status = 'expired' WHERE id = 'some-coach-id';
-- Then check that profile_visible was automatically set to FALSE
