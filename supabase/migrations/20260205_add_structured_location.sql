-- Add Structured Location Fields to Coach Profiles
-- This enables structured location selection with city dropdown and radius
-- NOTE: coach_profiles is a VIEW that points to the coaches TABLE
-- We must alter the underlying coaches table, not the view

-- ==============================================================================
-- STEP 1: Add new columns
-- ==============================================================================

ALTER TABLE coaches
ADD COLUMN IF NOT EXISTS location_city VARCHAR(100),
ADD COLUMN IF NOT EXISTS location_radius VARCHAR(50),
ADD COLUMN IF NOT EXISTS location_is_custom BOOLEAN DEFAULT false;

-- Add comments for documentation
COMMENT ON COLUMN coaches.location_city IS 'Primary city/town for coaching (from dropdown or custom entry)';
COMMENT ON COLUMN coaches.location_radius IS 'Travel radius for in-person coaching: 5, 10, 25, 50, nationwide, international';
COMMENT ON COLUMN coaches.location_is_custom IS 'True if location_city is custom entry (not from predefined UK cities list)';

-- ==============================================================================
-- STEP 2: Migrate existing location data
-- ==============================================================================

-- Extract city from existing location field for major UK cities
UPDATE coaches
SET location_city = CASE
  WHEN location ~* 'london' THEN 'London'
  WHEN location ~* 'manchester' THEN 'Manchester'
  WHEN location ~* 'birmingham' THEN 'Birmingham'
  WHEN location ~* 'leeds' THEN 'Leeds'
  WHEN location ~* 'glasgow' THEN 'Glasgow'
  WHEN location ~* 'edinburgh' THEN 'Edinburgh'
  WHEN location ~* 'liverpool' THEN 'Liverpool'
  WHEN location ~* 'bristol' THEN 'Bristol'
  WHEN location ~* 'sheffield' THEN 'Sheffield'
  WHEN location ~* 'newcastle' THEN 'Newcastle'
  WHEN location ~* 'nottingham' THEN 'Nottingham'
  WHEN location ~* 'leicester' THEN 'Leicester'
  WHEN location ~* 'southampton' THEN 'Southampton'
  WHEN location ~* 'cardiff' THEN 'Cardiff'
  WHEN location ~* 'belfast' THEN 'Belfast'
  WHEN location ~* 'brighton' THEN 'Brighton'
  WHEN location ~* 'cambridge' THEN 'Cambridge'
  WHEN location ~* 'oxford' THEN 'Oxford'
  WHEN location ~* 'york' THEN 'York'
  WHEN location ~* 'bath' THEN 'Bath'
  WHEN location ~* 'remote' THEN 'Remote'
  -- If no match, use original location as custom
  ELSE COALESCE(location, 'Remote')
END
WHERE location_city IS NULL;

-- Extract radius from existing location string
UPDATE coaches
SET location_radius = CASE
  WHEN location ~* 'within 5 miles|5 miles' THEN '5'
  WHEN location ~* 'within 10 miles|10 miles' THEN '10'
  WHEN location ~* 'within 25 miles|25 miles' THEN '25'
  WHEN location ~* 'within 50 miles|50 miles' THEN '50'
  WHEN location ~* 'nationwide' THEN 'nationwide'
  WHEN location ~* 'international' THEN 'international'
  ELSE NULL
END
WHERE location_radius IS NULL;

-- Mark as custom if not a standard UK city
UPDATE coaches
SET location_is_custom = true
WHERE location_city NOT IN (
  'London', 'Manchester', 'Birmingham', 'Leeds', 'Glasgow', 'Edinburgh',
  'Liverpool', 'Bristol', 'Sheffield', 'Newcastle', 'Nottingham', 'Leicester',
  'Southampton', 'Cardiff', 'Belfast', 'Brighton', 'Cambridge', 'Oxford',
  'York', 'Bath', 'Norwich', 'Exeter', 'Plymouth', 'Aberdeen', 'Dundee',
  'Inverness', 'Stirling', 'Perth', 'Swansea', 'Newport', 'Coventry',
  'Reading', 'Derby', 'Portsmouth', 'Bournemouth', 'Milton Keynes',
  'Swindon', 'Northampton', 'Luton', 'Wolverhampton', 'Stoke-on-Trent',
  'Preston', 'Hull', 'Bradford', 'Wakefield', 'Huddersfield', 'Doncaster',
  'Bolton', 'Salford', 'Blackpool', 'Remote', 'Other'
)
AND location_is_custom IS NULL;

-- ==============================================================================
-- STEP 3: Regenerate display location from structured data
-- ==============================================================================

-- Update the location field to be auto-generated from structured data
UPDATE coaches
SET location = CASE
  WHEN location_radius IS NOT NULL AND location_radius NOT IN ('nationwide', 'international') THEN
    location_city || ' (within ' || location_radius || ' miles)'
  WHEN location_radius = 'nationwide' THEN
    location_city || ' (nationwide)'
  WHEN location_radius = 'international' THEN
    location_city || ' (international)'
  WHEN location_city = 'Remote' THEN
    'Remote'
  ELSE
    location_city
END
WHERE location_city IS NOT NULL;

-- ==============================================================================
-- STEP 4: Create indexes for better search performance
-- ==============================================================================

CREATE INDEX IF NOT EXISTS idx_coaches_location_city
ON coaches(location_city);

CREATE INDEX IF NOT EXISTS idx_coaches_location_radius
ON coaches(location_radius);

-- Composite index for city + radius searches
CREATE INDEX IF NOT EXISTS idx_coaches_location_city_radius
ON coaches(location_city, location_radius);

-- ==============================================================================
-- STEP 5: Add trigger to auto-update location display field
-- ==============================================================================

-- Function to auto-generate location display string
CREATE OR REPLACE FUNCTION update_location_display()
RETURNS TRIGGER AS $$
BEGIN
  -- Auto-generate location field from structured data
  NEW.location := CASE
    WHEN NEW.location_radius IS NOT NULL AND NEW.location_radius NOT IN ('nationwide', 'international') THEN
      NEW.location_city || ' (within ' || NEW.location_radius || ' miles)'
    WHEN NEW.location_radius = 'nationwide' THEN
      NEW.location_city || ' (nationwide)'
    WHEN NEW.location_radius = 'international' THEN
      NEW.location_city || ' (international)'
    WHEN NEW.location_city = 'Remote' THEN
      'Remote'
    ELSE
      COALESCE(NEW.location_city, 'Remote')
  END;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_update_location_display ON coaches;
CREATE TRIGGER trigger_update_location_display
  BEFORE INSERT OR UPDATE OF location_city, location_radius
  ON coaches
  FOR EACH ROW
  EXECUTE FUNCTION update_location_display();

-- ==============================================================================
-- STEP 6: Verify migration
-- ==============================================================================

-- Check how many profiles were migrated
SELECT
  COUNT(*) as total_profiles,
  COUNT(location_city) as profiles_with_city,
  COUNT(location_radius) as profiles_with_radius,
  COUNT(CASE WHEN location_is_custom THEN 1 END) as custom_locations
FROM coaches;

-- Show sample of migrated data
SELECT
  name,
  location as old_location,
  location_city,
  location_radius,
  location_is_custom
FROM coaches
WHERE location_city IS NOT NULL
LIMIT 10;

-- ==============================================================================
-- NOTES
-- ==============================================================================

-- After running this migration:
-- 1. Existing location data is preserved in structured format
-- 2. location field is auto-generated from location_city + location_radius
-- 3. Future updates will automatically format location string
-- 4. Search can now filter by exact city and radius
-- 5. Backward compatible - location field still works for display
