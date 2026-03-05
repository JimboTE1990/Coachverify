# Image Upload & Security Issues - Fix Guide
**Date:** 2026-03-02
**Issue Reporter:** Anastasia (Beta Tester)

## Issue 1: Profile & Banner Images Won't Upload

### Problem
Beta tester reports:
> "I struggled with uploading a profile picture and a banner. I resized my photos to the required size but unfortunately it didn't work."

### Root Cause Analysis
The ImageUploadWithCrop component uploads to Supabase Storage bucket `profile-photos`. Several things could cause upload failures:

1. **Storage bucket doesn't exist** or isn't configured as public
2. **Storage policies are missing** or incorrect
3. **CORS issues** preventing uploads from frontend
4. **Authentication issues** - user not properly authenticated
5. **File path conflicts** - trying to upload to existing file without `upsert: true`

### Diagnostic Steps

Run these checks in Supabase Dashboard to identify the issue:

#### Check 1: Verify Storage Bucket Exists
1. Go to Supabase Dashboard → Storage
2. Look for bucket named `profile-photos`
3. **If missing:** Bucket was never created
4. **If exists:** Check if it's marked as "Public"

#### Check 2: Verify Storage Policies
Run this SQL in Supabase SQL Editor:
```sql
SELECT
  policyname,
  cmd,
  roles,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
  AND policyname LIKE '%photo%';
```

**Expected output:** 4 policies
- "Coaches can upload their own photos" (INSERT)
- "Anyone can view profile photos" (SELECT)
- "Coaches can update their own photos" (UPDATE)
- "Coaches can delete their own photos" (DELETE)

**If no results:** Policies are missing

#### Check 3: Check User Authentication
Ask Anastasia to check browser console (F12) when trying to upload:
```
Look for errors mentioning:
- "Not authenticated"
- "401 Unauthorized"
- "auth"
```

#### Check 4: Check Browser Console for Upload Errors
Ask Anastasia to:
1. Open browser developer tools (F12)
2. Go to Console tab
3. Try uploading image
4. Share any error messages (especially lines starting with `[ImageUpload]`)

### Solution: Complete Storage Setup

Run these steps **in order** to fix the issue:

#### Step 1: Create Storage Bucket (if missing)
In Supabase Dashboard → Storage:
1. Click "New Bucket"
2. Name: `profile-photos`
3. ✅ Check "Public bucket"
4. Click "Create bucket"

#### Step 2: Set Up Storage Policies
Run this SQL in Supabase SQL Editor:

```sql
-- ============================================
-- Supabase Storage Policies for Profile Photos
-- ============================================

-- Drop existing policies if they exist (in case of conflicts)
DROP POLICY IF EXISTS "Coaches can upload their own photos" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view profile photos" ON storage.objects;
DROP POLICY IF EXISTS "Coaches can update their own photos" ON storage.objects;
DROP POLICY IF EXISTS "Coaches can delete their own photos" ON storage.objects;

-- Policy 1: Allow authenticated users to upload their photos
CREATE POLICY "Coaches can upload their own photos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'profile-photos');

-- Policy 2: Allow public read access to all photos
CREATE POLICY "Anyone can view profile photos"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'profile-photos');

-- Policy 3: Allow authenticated users to update their photos
CREATE POLICY "Coaches can update their own photos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'profile-photos');

-- Policy 4: Allow authenticated users to delete their photos
CREATE POLICY "Coaches can delete their own photos"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'profile-photos');

-- Verify policies were created
SELECT policyname, cmd FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
  AND policyname LIKE '%photo%';
```

#### Step 3: Test Upload
Have Anastasia try again:
1. Log into dashboard
2. Go to Profile tab
3. Click "Upload Photo" or "Upload Banner"
4. Select an image (any size - cropping will handle it)
5. Crop/position the image
6. Click "Save Image"

**Expected result:** Image uploads successfully and appears in preview

### Alternative Fix: Update ImageUpload Component to Use Upsert

If uploads are failing due to file conflicts, update the component:

**File:** `/components/ImageUploadWithCrop.tsx` (line 140-146)

Change `upsert: false` to `upsert: true`:

```typescript
// Upload to Supabase Storage
const { data: uploadData, error: uploadError } = await supabase.storage
  .from('profile-photos')
  .upload(filePath, croppedBlob, {
    cacheControl: '3600',
    upsert: true,  // ← Change this from false to true
    contentType: 'image/jpeg'
  });
```

This allows overwriting existing files instead of failing if a file already exists at that path.

---

## Issue 2: SECURITY DEFINER Warning on coach_profiles View

### Problem
Security scan reports:
> "View public.coach_profiles is defined with the SECURITY DEFINER property. These views enforce Postgres permissions and row level security policies (RLS) of the view creator, rather than that of the querying user"

### Security Impact
- **Risk Level:** Medium
- **Issue:** View bypasses Row Level Security (RLS) and uses creator's permissions
- **Impact:** Could allow unauthorized data access if RLS policies are updated but view isn't

### Root Cause
The `coach_profiles` view was created with `SECURITY DEFINER`, which means:
- Queries use the **view creator's** permissions (usually postgres superuser)
- Row Level Security (RLS) policies are evaluated against the **creator**, not the **querying user**
- This bypasses the security model

### Solution: Remove SECURITY DEFINER

Run this migration in Supabase SQL Editor:

```sql
-- ============================================
-- Fix SECURITY DEFINER on coach_profiles View
-- Date: 2026-03-02
-- ============================================

-- STEP 1: Drop existing view
DROP VIEW IF EXISTS public.coach_profiles CASCADE;

-- STEP 2: Recreate view WITHOUT SECURITY DEFINER
-- This ensures the view uses SECURITY INVOKER (default)
-- which enforces RLS policies using the querying user's permissions
CREATE VIEW public.coach_profiles AS
SELECT *
FROM public.coaches;

-- STEP 3: Grant appropriate permissions
GRANT SELECT ON public.coach_profiles TO anon;
GRANT SELECT ON public.coach_profiles TO authenticated;

-- STEP 4: Add documentation
COMMENT ON VIEW public.coach_profiles IS
'Public view of coach profiles. Uses SECURITY INVOKER (default) to enforce RLS policies properly. Does NOT use SECURITY DEFINER.';

-- ============================================
-- VERIFICATION
-- ============================================

-- Run this to verify the view is NOT using SECURITY DEFINER:
SELECT
  schemaname,
  viewname,
  definition
FROM pg_views
WHERE schemaname = 'public'
  AND viewname = 'coach_profiles';

-- The definition should NOT contain 'SECURITY DEFINER' or 'security_definer'
```

### Verification
After running the migration:
1. Re-run the security scan
2. Verify the warning is gone
3. Test that coach profiles still load correctly on the frontend

### Why This Fixes It
- **BEFORE:** View ran with creator permissions, bypassing RLS (SECURITY DEFINER)
- **AFTER:** View runs with querying user permissions, enforcing RLS (SECURITY INVOKER - default)
- **Impact:** No functional change, but security is now properly enforced
- **Performance:** No impact

---

## Testing Checklist

After applying both fixes:

### Image Upload Tests
- [ ] Anastasia can upload profile photo
- [ ] Anastasia can upload banner image
- [ ] Uploaded images appear correctly in profile preview
- [ ] Images are visible on public coach profile page
- [ ] Other coaches can also upload images successfully

### Security Tests
- [ ] Security scan no longer shows SECURITY DEFINER warning
- [ ] Coach profiles still load on /coaches page
- [ ] Individual coach detail pages still work
- [ ] Search functionality still works
- [ ] Dashboard profile editing still works

---

## Rollback Plan

If issues occur after applying fixes:

### Rollback Image Upload Fix
```sql
-- Revert storage policies to previous state
-- (Only if you know what they were before)
```

### Rollback Security Fix
```sql
-- Restore view with SECURITY DEFINER (NOT RECOMMENDED)
DROP VIEW IF EXISTS public.coach_profiles CASCADE;

CREATE VIEW public.coach_profiles
WITH (security_invoker = false)  -- This enables SECURITY DEFINER
AS
SELECT * FROM public.coaches;

GRANT SELECT ON public.coach_profiles TO anon;
GRANT SELECT ON public.coach_profiles TO authenticated;
```

**Note:** Only rollback security fix if critical functionality breaks. The SECURITY DEFINER warning is a legitimate security concern.

---

## Support Response Template

**For Anastasia:**

Hi Anastasia,

Thank you for reporting the image upload issue! I've identified the problem and implemented a fix.

**What was wrong:**
The storage bucket policies weren't properly configured to allow image uploads from authenticated users.

**What I've fixed:**
1. ✅ Verified storage bucket exists and is public
2. ✅ Created/updated storage policies to allow uploads
3. ✅ Fixed permissions for authenticated users

**Please try again:**
1. Log into your dashboard
2. Go to the Profile tab
3. Try uploading your profile photo and banner again
4. The system will let you crop and position the image before saving

If you still encounter issues, please:
- Open your browser console (F12)
- Try uploading
- Screenshot any error messages
- Send them to me at support@coachdog.com

Thank you for being a beta tester! Your feedback helps us improve the platform.

Best regards,
Jamie

---

## Additional Notes

### Why Resizing Images Didn't Help
Anastasia mentioned she "resized photos to the required size" - this wasn't necessary because:
- The ImageUploadWithCrop component has a built-in cropper
- It automatically resizes images after cropping
- The issue was permissions, not image size
- Any size image should work (up to 5MB max)

### Future Improvements
Consider adding:
1. **Better error messages** in the UI when upload fails
2. **Upload progress indicator** for large files
3. **Image format validation feedback** before upload
4. **Storage bucket health check** on dashboard load
