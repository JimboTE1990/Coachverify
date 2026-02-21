# Final Fix Instructions - Video URL Feature

## Current Status

✅ **All code is complete and deployed:**
- Video input field in dashboard
- Video embed display on profile pages
- Database mapping in supabaseService.ts
- URL conversion (YouTube/Vimeo → embed format)

❌ **What's blocking it:**
- Database column `intro_video_url` doesn't exist in Supabase yet

## The Fix (Takes 30 seconds)

### Step 1: Open Supabase SQL Editor
1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your CoachDog project
3. Click **SQL Editor** in the left sidebar
4. Click **New Query**

### Step 2: Copy and Paste This SQL

```sql
-- Add intro_video_url column to coaches table
ALTER TABLE coaches ADD COLUMN IF NOT EXISTS intro_video_url TEXT;

COMMENT ON COLUMN coaches.intro_video_url IS 'YouTube or Vimeo embed URL for coach introductory video';
```

### Step 3: Run the Query
- Click **Run** (or press Cmd/Ctrl + Enter)
- You should see: `Success. No rows returned`

### Step 4: Verify It Worked
Run this query:

```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'coaches'
  AND column_name = 'intro_video_url';
```

**Expected output:**
```
column_name      | data_type | is_nullable
-----------------|-----------|------------
intro_video_url  | text      | YES
```

If you see this ✓ = Success! Column exists!

### Step 5: Test the Video Feature
1. **Go to your dashboard** (hard refresh: Cmd/Ctrl + Shift + R)
2. **Scroll to "Intro Video" section** (blue gradient box)
3. **Paste a YouTube URL**: `https://www.youtube.com/watch?v=juKC0wsH-0c`
4. **Click "Save Profile"**
5. **Visit your public profile page**
6. **Video should appear** below "Schedule a Session" button! 🎉

---

## Debugging Logs

After applying the migration and hard refreshing your browser, you should see these NEW console logs:

### When Saving in Dashboard:
```
[Video Input Debug] New video URL: https://www.youtube.com/watch?v=juKC0wsH-0c
[Dashboard Save Debug] Saving coach data: {...}
[Dashboard Save Debug] introVideoUrl: https://www.youtube.com/watch?v=juKC0wsH-0c
[updateCoach Debug] introVideoUrl value: https://www.youtube.com/watch?v=juKC0wsH-0c
[updateCoach Debug] Setting intro_video_url to: https://www.youtube.com/watch?v=juKC0wsH-0c
[updateCoach Debug] Full updateData object: {...}
```

### When Loading Profile:
```
[getCoachById Debug] Fetching coach with id: 55f90c3b-f8fe-4b05-a186-9de7069a7c26
[getCoachById Debug] Raw data from database: {...}
[getCoachById Debug] intro_video_url from DB: https://www.youtube.com/watch?v=juKC0wsH-0c
[Coach Data Debug] Loaded coach: {...}
[Coach Data Debug] introVideoUrl: https://www.youtube.com/watch?v=juKC0wsH-0c
[Video Debug] coach.introVideoUrl: https://www.youtube.com/watch?v=juKC0wsH-0c
[Video Debug] Original URL: https://www.youtube.com/watch?v=juKC0wsH-0c
[Video Debug] Embed URL: https://www.youtube.com/embed/juKC0wsH-0c
```

If you see `introVideoUrl: undefined`, the migration didn't run successfully.

---

## EMCC URL Issue (Paul Smith - 682f29b1-0385-4929-9b5a-4d2b9931031c)

### Status: ✅ SHOULD BE WORKING

The URL stored is already correct:
```
https://www.emccglobal.org/accreditation/eia/eia-awards/?reference=EIA20217053&search=1
```

The code at `pages/CoachDetails.tsx:895-902` cleans EMCC URLs by extracting the `reference=` parameter and rebuilding a clean URL. This URL already has the correct format.

### If the link still doesn't work:

1. **Check the link on Paul Smith's profile**: `/coach/682f29b1-0385-4929-9b5a-4d2b9931031c`
2. **Click "Check out my EMCC accreditation here"**
3. **It should open**: `https://www.emccglobal.org/accreditation/eia/eia-awards/?reference=EIA20217053&search=1`

If it redirects to a different URL or shows an error, check the browser console for any errors.

### Manual Database Check (if needed):

```sql
SELECT id, name, emcc_verified, emcc_profile_url
FROM coaches
WHERE id = '682f29b1-0385-4929-9b5a-4d2b9931031c';
```

Should return:
```
id: 682f29b1-0385-4929-9b5a-4d2b9931031c
name: Paul Smith (or similar)
emcc_verified: true
emcc_profile_url: https://www.emccglobal.org/accreditation/eia/eia-awards/?reference=EIA20217053&search=1
```

---

## Summary

1. **Video URL issue**: Run the SQL migration above → column will exist → feature works immediately
2. **EMCC URL issue**: Already fixed in code, URL format is correct, should work fine

**Next step**: Run the SQL migration in Supabase!
