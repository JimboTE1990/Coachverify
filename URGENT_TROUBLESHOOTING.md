# URGENT: Image Upload Still Failing - Troubleshooting Guide
**Date:** 2026-03-02
**Status:** SQLs ran successfully but uploads still failing on test account

## Immediate Diagnostic Steps

### Step 1: Check Browser Console for Exact Error (CRITICAL)

1. Open your test coach dashboard in browser
2. Press **F12** (or right-click → Inspect)
3. Go to **Console** tab
4. Clear console (trash icon)
5. Try uploading an image
6. **Screenshot or copy the exact error message**

**Look for these specific errors:**

```
[ImageUpload] Upload error: <ERROR MESSAGE HERE>
```

Common errors and what they mean:
- **"Not authenticated"** → Auth token expired or missing
- **"403 Forbidden"** → Storage policies still not working
- **"404 Not Found"** → Storage bucket doesn't exist
- **"new row violates row-level security"** → RLS policy on coaches table blocking update
- **"Bucket not found"** → Bucket name mismatch
- **"Invalid JWT"** → Authentication issue

### Step 2: Verify Storage Bucket Exists and Is Public

Run this SQL in Supabase SQL Editor:

```sql
-- Check if bucket exists and is public
SELECT
  id,
  name,
  public,
  created_at
FROM storage.buckets
WHERE name = 'profile-photos';
```

**Expected output:**
```
id: some-uuid
name: profile-photos
public: true  ← MUST BE TRUE
created_at: (some date)
```

**If you get 0 rows:**
❌ Bucket doesn't exist - need to create it manually

**If public = false:**
❌ Bucket is private - need to make it public

### Step 3: Verify Storage Policies Actually Exist

Run this SQL:

```sql
-- Check storage policies
SELECT
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
  AND policyname LIKE '%photo%';
```

**Expected output:** 4 rows

**If you get 0 rows:**
❌ Policies didn't create - there was a silent error

**If you get fewer than 4 rows:**
⚠️ Some policies missing - need to re-run SQL

### Step 4: Check RLS Policies on Coaches Table

The upload might succeed but the database update might fail due to RLS.

```sql
-- Check if you can update your own coach profile
SELECT
  policyname,
  cmd,
  roles::text,
  qual
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'coaches'
  AND cmd = 'UPDATE';
```

**Look for a policy that allows:**
- `authenticated` users to `UPDATE`
- With condition checking user_id matches

**If missing:** Database update is blocked even if upload succeeds

### Step 5: Test Storage Upload Manually

Let's bypass the app and test storage directly:

1. Supabase Dashboard → **Storage**
2. Click `profile-photos` bucket
3. Click **Upload file**
4. Try uploading any image

**If this fails:**
❌ Storage itself is broken - not a code issue

**If this succeeds:**
✅ Storage works - issue is in the code or auth

---

## Possible Root Causes

### Issue A: Storage Bucket Doesn't Exist

**Symptoms:**
- Console shows: "Bucket not found" or 404 error
- SQL query returns 0 rows

**Fix:**
1. Supabase Dashboard → Storage
2. Click "New Bucket"
3. Name: `profile-photos` (exact spelling, no spaces)
4. ✅ Check "Public bucket"
5. Click "Create bucket"
6. Re-run `FIX_STORAGE_POLICIES.sql`

### Issue B: Storage Bucket Is Private

**Symptoms:**
- Upload succeeds in console
- Images appear in Storage dashboard
- But don't display on frontend (broken image icons)

**Fix:**
1. Supabase Dashboard → Storage → `profile-photos`
2. Click "Settings" tab (or three dots menu)
3. Toggle "Public bucket" to ON
4. Save

### Issue C: Authentication Token Issue

**Symptoms:**
- Console shows: "Not authenticated" or "Invalid JWT"
- Happens even though you're logged in

**Fix:**
```sql
-- Check if user is properly authenticated
-- Run this while logged into dashboard
SELECT
  auth.uid() as user_id,
  auth.role() as user_role;
```

**Expected:**
- user_id: (some UUID)
- user_role: authenticated

**If NULL:** Auth session is broken - need to re-login

### Issue D: RLS Policy Blocking Database Update

**Symptoms:**
- Upload succeeds (file appears in storage)
- But photo_url doesn't update in database
- No error shown to user

**Fix:**
```sql
-- Check which coach profile you're trying to update
SELECT
  id,
  user_id,
  name,
  photo_url
FROM coaches
WHERE user_id = auth.uid();

-- Verify RLS allows updates
-- This should NOT error:
UPDATE coaches
SET photo_url = photo_url  -- dummy update
WHERE user_id = auth.uid();
```

**If you get RLS error:** Need to fix UPDATE policy on coaches table

### Issue E: CORS Issue (Unlikely but Possible)

**Symptoms:**
- Console shows: "CORS policy" error
- Blocked by CORS

**Fix:**
Supabase Dashboard → Settings → API → CORS
Ensure your domain is allowed: `https://coachverify.vercel.app`

---

## Common Mistakes in SQL Execution

### Mistake 1: Ran SQL in Wrong Database
- Make sure you're in the **correct Supabase project**
- Check URL: `whhwvuugrzbyvobwfmce.supabase.co`

### Mistake 2: SQL Had Syntax Error But Didn't Report
- Check for success message after running SQL
- Look for green checkmark or success notification

### Mistake 3: Policies Created But With Wrong Bucket Name
```sql
-- Check if policies reference correct bucket
SELECT
  policyname,
  with_check::text
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
  AND policyname LIKE '%photo%';

-- Look for: bucket_id = 'profile-photos'
-- NOT: bucket_id = 'profile_photos' or other variants
```

---

## Alternative Quick Fix: Use Different Bucket

If `profile-photos` bucket is problematic, we can use a different one:

### Option 1: Create New Bucket with Different Name

1. Create bucket: `coach-images` (instead of `profile-photos`)
2. Make it public
3. Update code to use new bucket name

**Code change needed:**
`components/ImageUploadWithCrop.tsx` line 141:
```typescript
const { data: uploadData, error: uploadError } = await supabase.storage
  .from('coach-images')  // ← Change this
  .upload(filePath, croppedBlob, {
```

Then redeploy frontend.

### Option 2: Use Existing Avatars Bucket

Check if you have other storage buckets that work:
```sql
SELECT name, public FROM storage.buckets;
```

If you see another public bucket, we can use that temporarily.

---

## Emergency Workaround for Beta Week

If we can't fix this quickly, here's a temporary solution:

### Temporary Fix: Manual Upload Process

1. **Hide upload buttons in UI** (quick code change)
2. **Add message:** "Email photos to support@coachdog.com for upload"
3. **Manually upload** each coach's photos via Supabase Dashboard
4. **Update database** with URLs manually
5. **Fix properly** after beta week

**Code to hide upload (temporary):**
`pages/CoachDashboard.tsx` line 1344-1362:
```typescript
{/* TEMPORARILY HIDDEN FOR BETA
<ImageUploadWithCrop ... />
*/}
<div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
  <p className="text-sm text-amber-900">
    📧 Email your profile photo to support@coachdog.com and we'll upload it for you.
  </p>
</div>
```

---

## What I Need From You

**Send me these results:**

1. **Browser console error** (exact text or screenshot)
2. **Storage bucket check** (result of Step 2 SQL)
3. **Storage policies check** (result of Step 3 SQL)
4. **Manual upload test** (did Step 5 work?)

With these 4 pieces of info, I can tell you exactly what's wrong and how to fix it.

---

## Next Steps

**Right now:**
1. Check browser console (F12) for exact error
2. Run Step 2 SQL (verify bucket exists and is public)
3. Run Step 3 SQL (verify policies exist)
4. Reply with results

**Don't proceed with beta until we fix this.**

It's better to delay 1 day and fix it properly than have all beta testers hit the same issue.
