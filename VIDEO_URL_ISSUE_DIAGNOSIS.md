# Video URL Issue - Root Cause Found

## Problem
Video URL is typed in dashboard and appears in save payload, but doesn't persist to database or show on profile.

## Root Cause
**The database column `intro_video_url` does not exist in your Supabase database.**

## Evidence from Console Logs

### ✅ What's Working:
1. **Input field works**: `[Video Input Debug] New video URL: "https://www.youtube.com/watch?v=juKC0wsH-0c"`
2. **Dashboard save works**: `[Dashboard Save Debug] introVideoUrl: "https://www.youtube.com/watch?v=juKC0wsH-0c"`
3. **UpdateCoach is called** with the video URL in the payload

### ❌ What's Missing:
1. **NO `[updateCoach Debug]` logs** - The new debugging code in supabaseService.ts isn't appearing
2. **NO `[getCoachById Debug] intro_video_url from DB` logs** - This log should show what the database returned
3. **Result**: `introVideoUrl: undefined` when loading profile

This means either:
- The Vite dev server hasn't reloaded the new code, OR
- The database column doesn't exist, so Supabase silently ignores the field

## Solution

### Step 1: Verify Column Exists
Run this in **Supabase SQL Editor**:

```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'coaches'
  AND column_name = 'intro_video_url';
```

**Expected result**: 1 row showing `intro_video_url | text | YES`

**If it returns 0 rows**, the column doesn't exist. Run this:

```sql
ALTER TABLE coaches ADD COLUMN IF NOT EXISTS intro_video_url TEXT;
COMMENT ON COLUMN coaches.intro_video_url IS 'YouTube or Vimeo embed URL for coach introductory video';
```

### Step 2: Hard Refresh Browser
After confirming the column exists:

1. **Hard refresh** the page: Cmd/Ctrl + Shift + R
2. This forces the browser to reload all JavaScript files
3. The new debugging logs should now appear

### Step 3: Test Again
1. Go to dashboard
2. Enter video URL: `https://www.youtube.com/watch?v=juKC0wsH-0c`
3. Click "Save Profile"
4. Check console for **NEW logs**:
   ```
   [updateCoach Debug] introVideoUrl value: https://www.youtube.com/watch?v=juKC0wsH-0c
   [updateCoach Debug] Setting intro_video_url to: https://www.youtube.com/watch?v=juKC0wsH-0c
   [updateCoach Debug] Full updateData object: {...}
   [updateCoach Debug] intro_video_url in updateData: https://www.youtube.com/watch?v=juKC0wsH-0c
   ```

5. Visit public profile page
6. Check console for:
   ```
   [getCoachById Debug] Fetching coach with id: 55f90c3b-f8fe-4b05-a186-9de7069a7c26
   [getCoachById Debug] Raw data from database: {...}
   [getCoachById Debug] intro_video_url from DB: https://www.youtube.com/watch?v=juKC0wsH-0c
   [Coach Data Debug] introVideoUrl: https://www.youtube.com/watch?v=juKC0wsH-0c
   [Video Debug] Embed URL: https://www.youtube.com/embed/juKC0wsH-0c
   ```

7. **Video should now display on profile!**

---

## EMCC URL Issue (Coach 682f29b1-0385-4929-9b5a-4d2b9931031c)

### Problem
EMCC profile link redirects incorrectly or doesn't load.

### Current Fix (Already Implemented)
The code at `pages/CoachDetails.tsx:895-902` cleans EMCC URLs by:
1. Extracting the `reference=EIA20217053` parameter
2. Rebuilding a clean URL: `https://www.emccglobal.org/accreditation/eia/eia-awards/?reference=EIA20217053&search=1`

### If Still Not Working
The stored `emcc_profile_url` for that coach might be malformed. Check the database:

```sql
SELECT id, name, emcc_profile_url
FROM coaches
WHERE id = '682f29b1-0385-4929-9b5a-4d2b9931031c';
```

**Expected format**:
```
https://www.emccglobal.org/accreditation/eia/eia-awards/?reference=EIA20217053&search=1
```

**If it's missing the reference parameter**, you need to update it manually in the database or re-run the EMCC verification for that coach.

---

## Summary

1. **Video URL issue**: Database migration not run → column doesn't exist → Supabase ignores the field
2. **EMCC URL issue**: URL cleaning code exists, but stored URL might be malformed

**Next action**: Run the SQL check in Supabase to verify `intro_video_url` column exists. If not, run the migration.
