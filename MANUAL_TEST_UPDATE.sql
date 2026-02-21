-- Manual test to see if we can update intro_video_url directly
-- Replace YOUR_COACH_ID with your actual coach ID: 55f90c3b-f8fe-4b05-a186-9de7069a7c26

-- Step 1: Check current value
SELECT id, name, intro_video_url
FROM coaches
WHERE id = '55f90c3b-f8fe-4b05-a186-9de7069a7c26';

-- Step 2: Try to update it manually
UPDATE coaches
SET intro_video_url = 'https://www.youtube.com/watch?v=TEST123'
WHERE id = '55f90c3b-f8fe-4b05-a186-9de7069a7c26';

-- Step 3: Check if it updated
SELECT id, name, intro_video_url
FROM coaches
WHERE id = '55f90c3b-f8fe-4b05-a186-9de7069a7c26';

-- Step 4: Check via the view (what the app uses)
SELECT id, name, intro_video_url
FROM coach_profiles
WHERE id = '55f90c3b-f8fe-4b05-a186-9de7069a7c26';

-- If the coaches table shows the URL but coach_profiles doesn't, the view needs refreshing
-- If neither shows the URL, there's a deeper database issue
