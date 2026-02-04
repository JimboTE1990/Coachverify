# Add Placeholder Accreditation URLs to Dummy Coaches

## Purpose
Add placeholder accreditation profile URLs to test/dummy coaches so you can visually see what the accreditation link looks like on coach profiles.

## Instructions

### Option 1: Update All Verified Coaches (Recommended for Testing)

Run this SQL in your Supabase SQL Editor:

```sql
-- Update EMCC verified coaches with placeholder URLs
UPDATE coaches
SET emcc_profile_url = 'https://www.emccouncil.org/eu/en/directories/coaches?search=' || REPLACE(name, ' ', '+')
WHERE accreditation_body = 'EMCC'
  AND emcc_verified = true
  AND (emcc_profile_url IS NULL OR emcc_profile_url = '');

-- Update ICF verified coaches with placeholder URLs
UPDATE coaches
SET icf_profile_url = 'https://coachfederation.org/find-a-coach?search=' || REPLACE(name, ' ', '+')
WHERE accreditation_body = 'ICF'
  AND icf_verified = true
  AND (icf_profile_url IS NULL OR icf_profile_url = '');
```

### Option 2: Update Specific Coaches by ID

If you want to update specific test coaches:

```sql
-- Update a specific EMCC coach
UPDATE coaches
SET emcc_profile_url = 'https://www.emccouncil.org/eu/en/directories/coaches?search=John+Smith'
WHERE id = 'YOUR_COACH_ID_HERE';

-- Update a specific ICF coach
UPDATE coaches
SET icf_profile_url = 'https://coachfederation.org/find-a-coach?search=Jane+Doe'
WHERE id = 'YOUR_COACH_ID_HERE';
```

### Option 3: Mark Existing Coaches as Verified with URLs

If you want to test with specific coaches, mark them as verified:

```sql
-- Mark a coach as EMCC verified with URL
UPDATE coaches
SET
  accreditation_body = 'EMCC',
  emcc_verified = true,
  emcc_verified_at = NOW(),
  emcc_profile_url = 'https://www.emccouncil.org/eu/en/directories/coaches?search=Coach+Name'
WHERE id = 'YOUR_COACH_ID_HERE';

-- Mark a coach as ICF verified with URL
UPDATE coaches
SET
  accreditation_body = 'ICF',
  icf_verified = true,
  icf_verified_at = NOW(),
  icf_profile_url = 'https://coachfederation.org/find-a-coach?search=Coach+Name'
WHERE id = 'YOUR_COACH_ID_HERE';
```

## Verify the Updates

After running the updates, verify them with:

```sql
-- Check all verified coaches with profile URLs
SELECT
  id,
  name,
  accreditation_body,
  emcc_verified,
  icf_verified,
  CASE
    WHEN accreditation_body = 'EMCC' THEN emcc_profile_url
    WHEN accreditation_body = 'ICF' THEN icf_profile_url
    ELSE NULL
  END as profile_url
FROM coaches
WHERE (emcc_verified = true OR icf_verified = true)
  AND (emcc_profile_url IS NOT NULL OR icf_profile_url IS NOT NULL)
ORDER BY name;
```

## What You'll See

After updating, when you view a verified coach's profile:

### EMCC Verified Coach:
```
✅ EMCC Verified

🔗 View my EMCC accreditation profile
   (clickable link opens in new tab)
```

### ICF Verified Coach:
```
✅ ICF Verified

🔗 View my ICF accreditation profile
   (clickable link opens in new tab)
```

## Example URLs Created

The SQL above creates search URLs like:
- **EMCC**: `https://www.emccouncil.org/eu/en/directories/coaches?search=John+Smith`
- **ICF**: `https://coachfederation.org/find-a-coach?search=Jane+Doe`

These are placeholder URLs for visual testing. In production, these would be the actual URLs from the coaches' signup verification.

## Notes

- The link only appears for **verified** coaches with a profile URL
- The link opens in a new tab (`target="_blank"`)
- Clients can use this to independently verify coach credentials
- This increases transparency and trust in the platform
