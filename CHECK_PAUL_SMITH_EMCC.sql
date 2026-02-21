-- Check Paul Smith's EMCC URL in the database
SELECT
  id,
  name,
  emcc_verified,
  emcc_profile_url,
  LENGTH(emcc_profile_url) as url_length
FROM coaches
WHERE id = '682f29b1-0385-4929-9b5a-4d2b9931031c';

-- This will show:
-- 1. If emcc_verified is true
-- 2. The exact URL stored
-- 3. The length of the URL (to check for hidden characters)

-- Expected URL format:
-- https://www.emccglobal.org/accreditation/eia/eia-awards/?reference=EIA20217053&search=1
