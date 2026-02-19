# Quick Fix Guide - Schema Cache & Banner Image

## Problem
1. ❌ Profile changes not saving: `"Could not find the 'main_coaching_categories' column of 'coach_profiles' in the schema cache"`
2. ❌ Banner image not showing in dashboard

## Solution

### Step 1: Run SQL in Supabase SQL Editor

**Copy and paste the entire contents of this file:**
[FIX_MAIN_CATEGORIES_SCHEMA.sql](FIX_MAIN_CATEGORIES_SCHEMA.sql)

This will:
- Add `main_coaching_categories` column to `coaches` table
- Recreate the `coach_profiles` view
- Force schema cache reload

### Step 2: Refresh Your Browser

After running the SQL:
1. Go back to your localhost:3000 dashboard
2. Hard refresh: `Cmd + Shift + R` (Mac) or `Ctrl + Shift + R` (Windows)
3. The banner should now appear in the dashboard
4. Changes should now save successfully

---

## What Was Fixed in Code

### Issue 1: Banner Image Not in Local State
**File**: [pages/CoachDashboard.tsx](pages/CoachDashboard.tsx:178)

**Problem**: `bannerImageUrl` wasn't included in the `localProfile` initialization, so the BannerImageUpload component couldn't see the existing banner.

**Fix**: Added `bannerImageUrl: currentCoach.bannerImageUrl` to the state initialization (line 178)

### Issue 2: Schema Cache Not Updated
**File**: [FIX_MAIN_CATEGORIES_SCHEMA.sql](FIX_MAIN_CATEGORIES_SCHEMA.sql)

**Problem**: The `main_coaching_categories` column was added to the `coaches` table, but the `coach_profiles` VIEW wasn't recreated, so PostgREST's schema cache didn't know about the new column.

**Fix**: Recreate the view and force schema reload with `NOTIFY pgrst, 'reload schema';`

---

## Testing After Fix

1. **Banner Image**:
   - Go to dashboard
   - You should see your banner at the top (if you uploaded one)
   - Try removing it and uploading a new one
   - Click "Save Changes"
   - Refresh page → Banner should persist

2. **Main Categories**:
   - Scroll to "Matching Criteria" section
   - Click the 7 category buttons to toggle them on/off
   - Selected categories turn blue
   - Click "Save Changes"
   - Refresh page → Selections should persist

3. **Verify in Database** (optional):
   ```sql
   SELECT name, banner_image_url, main_coaching_categories
   FROM coaches
   WHERE email = 'your-email@example.com';
   ```

---

## If Still Not Working

### Banner Still Not Showing:
1. Check browser console for errors
2. Verify column exists in database:
   ```sql
   SELECT column_name FROM information_schema.columns
   WHERE table_name = 'coaches' AND column_name = 'banner_image_url';
   ```

### Main Categories Still Not Saving:
1. Check browser console for schema cache errors
2. Try restarting PostgREST:
   - Supabase Dashboard → Project Settings → API → Restart button
3. Run `NOTIFY pgrst, 'reload schema';` again

---

## Summary

✅ **Code Fix**: Added `bannerImageUrl` to localProfile state initialization
✅ **SQL Fix**: Run [FIX_MAIN_CATEGORIES_SCHEMA.sql](FIX_MAIN_CATEGORIES_SCHEMA.sql) to update schema
✅ **After SQL**: Hard refresh browser (Cmd+Shift+R)

Everything should work after these steps! 🎉
