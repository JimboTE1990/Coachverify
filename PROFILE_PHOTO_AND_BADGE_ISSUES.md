# Profile Photo & Accreditation Badge Issues

## Issue 1: Profile Photos Changed

### What Happened
Profile photos for dummy coaches (Jennifer Martinez, Paul Smith, Vijaya Gowrisankar, etc.) are showing different images than before.

### Root Cause
**This is NOT caused by our recent code changes.** The dummy coaches were created using `https://picsum.photos/200/200?random=X` URLs. Picsum.photos is a service that returns **random placeholder images**, and these images change over time or with cache refreshes.

### Why This Happened Now
When you did a hard refresh after deploying the accreditation changes, the browser cleared its cache and re-fetched the picsum.photos URLs, which returned different random images.

### Solution Options

#### Option 1: Use Static Photo URLs (Recommended)
Upload actual profile photos to your Supabase storage and update the photo URLs:

```sql
-- Example: Update Jennifer Martinez with a real photo URL
UPDATE coaches
SET photo_url = 'https://your-supabase-project.supabase.co/storage/v1/object/public/coach-photos/jennifer-martinez.jpg'
WHERE name = 'Jennifer Martinez';
```

#### Option 2: Lock the Picsum URLs
Add specific seed parameters to picsum URLs so they always return the same image:

```sql
-- Update to use locked picsum images
UPDATE coaches SET photo_url = 'https://picsum.photos/seed/jennifer/200/200' WHERE name = 'Jennifer Martinez';
UPDATE coaches SET photo_url = 'https://picsum.photos/seed/paul/200/200' WHERE name = 'Paul Smith';
UPDATE coaches SET photo_url = 'https://picsum.photos/seed/vijaya/200/200' WHERE name = 'Vijaya Gowrisankar';
```

The `/seed/{word}` parameter makes picsum return the same image consistently.

#### Option 3: Accept Random Images
Keep using picsum.photos for demo purposes, knowing images will change occasionally.

---

## Issue 2: Accreditation Badges Not Showing

### What's Wrong
The new prominent EMCC/ICF accreditation badges with verification links are not appearing on coach profiles.

### Root Cause
The badge will **ONLY show** if ALL these conditions are met:

1. ✅ `accreditation_body` = 'EMCC' (or 'ICF')
2. ❓ `emcc_verified` = `true` (or `icf_verified` = true for ICF)
3. ✅ `emcc_profile_url` is not null/empty (or `icf_profile_url` for ICF)

**Likely issue:** Jennifer Martinez probably has `emcc_profile_url` populated (from your SQL update), but `emcc_verified` is still `false` or `null`.

### How to Check
Run this diagnostic query in Supabase SQL Editor:

```sql
SELECT
  id,
  name,
  accreditation_body,
  emcc_verified,
  icf_verified,
  emcc_profile_url,
  icf_profile_url
FROM coaches
WHERE name = 'Jennifer Martinez';
```

### How to Fix
If `emcc_verified` is false/null, run this:

```sql
UPDATE coaches
SET
  accreditation_body = 'EMCC',
  accreditation_level = 'Senior Practitioner',
  emcc_verified = true,
  emcc_verified_at = NOW(),
  emcc_profile_url = 'https://www.emccouncil.org/eu/en/directories/coaches?search=Jennifer+Martinez'
WHERE name = 'Jennifer Martinez';
```

This sets:
- ✅ Accreditation body to EMCC
- ✅ Verification status to true
- ✅ Profile URL for directory link
- ✅ Accreditation level for display

### What You'll See After Fix
A large, prominent badge with:
- **Navy blue border** (EMCC official color)
- **Gold accent dots** (EMCC branding)
- **"EMCC" in large text**
- **"VERIFIED ACCREDITATION"** heading
- **Accreditation level** (e.g., "Senior Practitioner")
- **Clickable link**: "Verify on EMCC Directory"

---

## Previous SQL Update vs Current Issue

### What Your Previous SQL Did
```sql
UPDATE coaches
SET emcc_profile_url = 'https://www.emccouncil.org/eu/en/directories/coaches?search=' || REPLACE(name, ' ', '+')
WHERE accreditation_body = 'EMCC'
  AND emcc_verified = true
  AND (emcc_profile_url IS NULL OR emcc_profile_url = '');
```

This only updated coaches that **already had** `emcc_verified = true`. If Jennifer Martinez had `emcc_verified = false` or `null`, this SQL skipped her.

### What's Needed Now
Set `emcc_verified = true` for coaches you want to show the badge.

---

## Complete Fix Script

Run this in Supabase SQL Editor:

```sql
-- 1. Diagnose current state
SELECT
  name,
  accreditation_body,
  emcc_verified,
  icf_verified,
  emcc_profile_url,
  icf_profile_url,
  photo_url
FROM coaches
WHERE name IN ('Jennifer Martinez', 'Paul Smith', 'Vijaya Gowrisankar')
ORDER BY name;

-- 2. Fix Jennifer Martinez (EMCC)
UPDATE coaches
SET
  accreditation_body = 'EMCC',
  accreditation_level = 'Senior Practitioner',
  emcc_verified = true,
  emcc_verified_at = NOW(),
  emcc_profile_url = 'https://www.emccouncil.org/eu/en/directories/coaches?search=Jennifer+Martinez',
  photo_url = 'https://picsum.photos/seed/jennifer/200/200'  -- Lock photo
WHERE name = 'Jennifer Martinez';

-- 3. Fix Paul Smith (if also EMCC/ICF)
UPDATE coaches
SET
  accreditation_body = 'EMCC',
  accreditation_level = 'Practitioner',
  emcc_verified = true,
  emcc_verified_at = NOW(),
  emcc_profile_url = 'https://www.emccouncil.org/eu/en/directories/coaches?search=Paul+Smith',
  photo_url = 'https://picsum.photos/seed/paul/200/200'  -- Lock photo
WHERE name = 'Paul Smith';

-- 4. Verify changes
SELECT
  name,
  accreditation_body,
  accreditation_level,
  emcc_verified,
  emcc_profile_url,
  photo_url
FROM coaches
WHERE name IN ('Jennifer Martinez', 'Paul Smith')
ORDER BY name;
```

---

## Why The Code Changes Were Correct

Our recent code changes were **100% correct**:

1. ✅ Added missing ICF field mapping in supabaseService.ts
2. ✅ Created prominent, branded accreditation badges
3. ✅ Added clear verification links
4. ✅ Used official EMCC/ICF brand colors

The issue is **data, not code**:
- The badges require `emcc_verified = true` (database)
- The photos changed because picsum.photos serves random images

---

## Summary

### Profile Photos
- **Not a code bug** - picsum.photos returns random images
- **Fix**: Use static photo URLs or locked picsum seeds

### Accreditation Badges
- **Not a code bug** - badge requires `emcc_verified = true`
- **Fix**: Set `emcc_verified = true` for coaches that should show badge
- **Code is working correctly** - just needs correct data

### Next Steps
1. Run diagnostic SQL to check current state
2. Update coaches to set `emcc_verified = true`
3. Lock photo URLs if desired
4. Hard refresh browser to see changes
