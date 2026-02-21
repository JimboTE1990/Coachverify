# Video URL Feature - Migration Required

## Issue
The video URL feature has been fully coded but the database column doesn't exist yet in your Supabase database.

## Symptom
- Video URL input field appears in dashboard ✓
- You can type a video URL ✓
- The URL saves without errors ✓
- BUT the video doesn't appear on your profile ✗
- Console shows: `introVideoUrl: undefined` ✗

## Root Cause
The database migration `20260220_add_intro_video_url.sql` exists in your codebase but **hasn't been applied to your Supabase database yet**.

---

## How to Fix

### Option A: Using Supabase CLI (Recommended)

If you have Supabase CLI installed:

```bash
cd /Users/jamiefletcher/Documents/Claude\ Projects/CoachDog/Coachverify
supabase db push
```

This will apply all pending migrations including the video URL column.

---

### Option B: Manual SQL in Supabase Dashboard

1. Go to: https://supabase.com/dashboard/project/YOUR_PROJECT/sql
2. Create a new query
3. Paste this SQL:

```sql
-- Add intro_video_url column to coaches table
ALTER TABLE coaches ADD COLUMN IF NOT EXISTS intro_video_url TEXT;

COMMENT ON COLUMN coaches.intro_video_url IS 'YouTube or Vimeo embed URL for coach introductory video';
```

4. Click "Run" (or press Cmd/Ctrl + Enter)

---

## Verify It Worked

After running the migration:

1. Go to your dashboard
2. Add a YouTube video URL (e.g., `https://www.youtube.com/watch?v=dQw4w9WgXcQ`)
3. Click "Save Profile"
4. Open browser console (F12 → Console tab)
5. You should now see:
   ```
   [Dashboard Save Debug] introVideoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
   ```
6. Visit your public profile page
7. Console should show:
   ```
   [Coach Data Debug] introVideoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
   [Video Debug] Embed URL: "https://www.youtube.com/embed/dQw4w9WgXcQ"
   ```
8. **The video should now appear below the "Schedule a Session" button!** 🎉

---

## What the Migration Does

Adds a new `intro_video_url` column to the `coaches` table:
- Type: `TEXT` (can store any length URL)
- Nullable: `YES` (optional field)
- Purpose: Store YouTube/Vimeo embed URLs for coach intro videos

The `coach_profiles` view automatically includes this new column since it uses `SELECT * FROM coaches`.

---

## Already Applied?

To check if the migration was already applied:

1. Go to Supabase Dashboard → Table Editor → `coaches` table
2. Scroll through the columns
3. Look for `intro_video_url` column
4. If it exists ✓ = migration already applied
5. If it doesn't exist ✗ = run the migration above

---

**After applying the migration, the video URL feature will work immediately with no code changes needed!**
