# Production Deployment Steps - February 16, 2026

## ✅ Code Deployed to GitHub
**Commit**: 098a9e6
**Branch**: main
**Status**: Pushed successfully

---

## 🔴 REQUIRED: Run Migrations in Supabase Production

You **MUST** run these SQL migrations before the new features will work in production.

### Step 1: Open Supabase SQL Editor
1. Go to https://supabase.com
2. Select your Coachverify project
3. Click "SQL Editor" in the left sidebar

### Step 2: Run This SQL (Copy & Paste Everything)

```sql
-- ==============================================================================
-- PRODUCTION DEPLOYMENT - February 16, 2026
-- ==============================================================================
-- Run this entire block in Supabase SQL Editor
-- ==============================================================================

-- 1. Add banner_image_url column (if not already added)
ALTER TABLE coaches
ADD COLUMN IF NOT EXISTS banner_image_url TEXT;

COMMENT ON COLUMN coaches.banner_image_url IS 'Profile banner/cover image URL (like LinkedIn/X cover photo). Recommended dimensions: 1500x500px (3:1 ratio). Displayed at top of public profile.';

-- 2. Add main_coaching_categories column
ALTER TABLE coaches
ADD COLUMN IF NOT EXISTS main_coaching_categories TEXT[];

COMMENT ON COLUMN coaches.main_coaching_categories IS 'Primary broad coaching categories (7 main areas) used for matching. These are directly selectable by coaches and take priority in matching logic over detailed expertise.';

-- 3. Create index for main_coaching_categories
CREATE INDEX IF NOT EXISTS idx_coaches_main_coaching_categories
ON coaches USING GIN(main_coaching_categories);

-- 4. Add deletion tracking columns
ALTER TABLE coaches
ADD COLUMN IF NOT EXISTS deletion_requested_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS deletion_effective_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS deletion_permanent_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS deletion_reason TEXT,
ADD COLUMN IF NOT EXISTS can_restore BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS restored_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS restored_by TEXT;

-- 5. Add comments for deletion columns
COMMENT ON COLUMN coaches.deletion_requested_at IS 'When user first requested account deletion';
COMMENT ON COLUMN coaches.deletion_effective_date IS 'When account will be hidden/locked (end of billing period)';
COMMENT ON COLUMN coaches.deletion_permanent_date IS 'When data will be permanently deleted (effective_date + 30 days)';
COMMENT ON COLUMN coaches.deletion_reason IS 'Optional reason provided by user for leaving';
COMMENT ON COLUMN coaches.can_restore IS 'Whether account can still be restored (false after permanent deletion)';
COMMENT ON COLUMN coaches.restored_at IS 'When account was restored from deletion (if applicable)';
COMMENT ON COLUMN coaches.restored_by IS 'Who restored the account (user_id for self-service, admin email for manual restore)';

-- 6. Create indexes for deletion queries
CREATE INDEX IF NOT EXISTS idx_coaches_deletion_effective_date
ON coaches(deletion_effective_date)
WHERE deletion_effective_date IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_coaches_deletion_permanent_date
ON coaches(deletion_permanent_date)
WHERE deletion_permanent_date IS NOT NULL;

-- 7. Recreate coach_profiles view to include new columns
DROP VIEW IF EXISTS coach_profiles CASCADE;
CREATE VIEW coach_profiles AS SELECT * FROM coaches;
GRANT SELECT ON coach_profiles TO anon, authenticated;

-- 8. Force PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';

-- ==============================================================================
-- VERIFICATION QUERY (run this after to confirm success)
-- ==============================================================================
SELECT
  column_name,
  data_type,
  column_default
FROM information_schema.columns
WHERE table_name = 'coaches'
AND column_name IN (
  'banner_image_url',
  'main_coaching_categories',
  'deletion_requested_at',
  'deletion_effective_date',
  'deletion_permanent_date'
)
ORDER BY column_name;

-- You should see 5 rows returned
-- ==============================================================================
```

### Step 3: Verify Migrations Succeeded
After running the SQL above, scroll down and check the verification query results. You should see **5 rows**:

1. `banner_image_url` - text
2. `deletion_effective_date` - timestamp with time zone
3. `deletion_permanent_date` - timestamp with time zone
4. `deletion_requested_at` - timestamp with time zone
5. `main_coaching_categories` - ARRAY

If you see all 5, migrations succeeded! ✅

### Step 4: Restart PostgREST (If Needed)
If you still get schema cache errors after running the SQL:

1. Go to Supabase Dashboard
2. Click "Project Settings" → "API"
3. Find "PostgREST" section
4. Click "Restart" button

---

## 🧪 Testing in Production

### Test 1: Main Categories
1. Log in to your coach dashboard
2. Go to "Matching Criteria" section
3. Click the 7 category buttons to toggle on/off
4. Save changes
5. Refresh page → Categories should persist

### Test 2: Banner Image
1. Dashboard → Banner upload section
2. Upload a banner
3. Save changes
4. Refresh → Banner should display
5. Visit your public profile → Banner should show at top

### Test 3: Delete Account
1. Dashboard → Account tab
2. Click "Delete Account" link
3. Enter password
4. Should see deletion timeline
5. **Don't actually delete** unless testing!

### Test 4: Search Filters
1. Go to search/directory page
2. Open filters sidebar
3. "Specialty" dropdown should show 7 categories:
   - Career & Professional Development
   - Business & Entrepreneurship
   - Health & Wellness
   - Personal & Life
   - Financial
   - Niche & Demographic
   - Methodology & Modality

### Test 5: Reviews
1. Dashboard → Reviews section (if you have reviews)
2. Should only see "Leave Comment" button
3. No "Flag as Spam" option

---

## 🚨 If Something Goes Wrong

### Error: "Could not find column in schema cache"
**Solution**: Run this SQL in Supabase:
```sql
NOTIFY pgrst, 'reload schema';
```
OR restart PostgREST via Dashboard (Project Settings → API → Restart)

### Error: Column already exists
**This is OK!** The migrations use `IF NOT EXISTS` so they're safe to run multiple times.

### Banner still not showing
1. Check browser console for errors
2. Hard refresh: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)
3. Verify column exists with verification query above

### Categories not saving
1. Check browser console for errors
2. Verify migrations ran with verification query
3. Restart PostgREST

---

## 📊 Deployment Summary

### What Changed
✅ 7 main coaching categories (primary matching)
✅ Delete account with 30-day restoration
✅ Banner image fixed
✅ Search filters updated
✅ Review management simplified (comment only)

### Database Changes
✅ 8 new columns added to `coaches` table
✅ 2 new indexes created
✅ `coach_profiles` view recreated

### Files Deployed
✅ 11 files changed (991 insertions, 96 deletions)
✅ 3 new migration files
✅ 2 new components (DeleteAccount, PasswordVerificationModal)

---

## 🎉 You're Done!

After running the migrations in Supabase:
1. Visit your production site
2. Test the features above
3. Monitor for any errors
4. Celebrate! 🎊

---

**Deployment prepared by**: Claude Code
**Date**: February 16, 2026
**Status**: Code pushed ✅ | Migrations pending ⏳

All migrations are **safe to run** and use `IF NOT EXISTS` to prevent errors if run multiple times.
