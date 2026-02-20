-- Fix profile crash for user 682f29b1-0385-4929-9b5a-4d2b9931031c
-- Issue: Qualifications field contains objects instead of strings, causing React render error

-- Step 1: Check current qualifications data
SELECT
  id,
  name,
  email,
  qualifications,
  pg_typeof(qualifications) as data_type
FROM coaches
WHERE id = '682f29b1-0385-4929-9b5a-4d2b9931031c';

-- Step 2: If qualifications contains objects like {id, year, degree, institution},
-- we need to either:
-- Option A: Clear the field (safest for immediate fix)
UPDATE coaches
SET qualifications = NULL
WHERE id = '682f29b1-0385-4929-9b5a-4d2b9931031c';

-- Option B: Convert to array of strings (if you want to preserve some data)
-- UPDATE coaches
-- SET qualifications = ARRAY['Qualification 1', 'Qualification 2']
-- WHERE id = '682f29b1-0385-4929-9b5a-4d2b9931031c';

-- Step 3: Verify the fix
SELECT
  id,
  name,
  qualifications
FROM coaches
WHERE id = '682f29b1-0385-4929-9b5a-4d2b9931031c';
