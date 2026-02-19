# Image Storage Setup Guide

## Problem
Currently, profile photos and banners are being saved as base64 strings directly in the database. This causes:
- Very large database entries (base64 is ~33% larger than the original file)
- Slow page loads
- Potential database size limits
- No image optimization

## Solution
Set up Supabase Storage buckets to store images as files and save only the URL in the database.

---

## Step 1: Create Storage Bucket in Supabase

1. Go to **Supabase Dashboard** → **Storage**
2. Click **"New Bucket"**
3. Create bucket with these settings:
   - **Name:** `profile-images`
   - **Public bucket:** ✅ YES (checked)
   - **File size limit:** 5MB
   - **Allowed MIME types:** `image/*`
4. Click **"Create bucket"**

---

## Step 2: Set Storage Policies

After creating the bucket, click on `profile-images` → **Policies** tab

### Policy 1: Allow Public Read (SELECT)
```sql
-- Name: Public read access
-- Allowed operation: SELECT
-- Target roles: public

CREATE POLICY "Public read access for profile images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'profile-images');
```

### Policy 2: Allow Authenticated Upload (INSERT)
```sql
-- Name: Authenticated users can upload
-- Allowed operation: INSERT
-- Target roles: authenticated

CREATE POLICY "Authenticated users can upload profile images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'profile-images');
```

### Policy 3: Allow Users to Update Their Own Images (UPDATE)
```sql
-- Name: Users can update their own images
-- Allowed operation: UPDATE
-- Target roles: authenticated

CREATE POLICY "Users can update their own profile images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'profile-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
```

### Policy 4: Allow Users to Delete Their Own Images (DELETE)
```sql
-- Name: Users can delete their own images
-- Allowed operation: DELETE
-- Target roles: authenticated

CREATE POLICY "Users can delete their own profile images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'profile-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
```

---

## Step 3: Verify Setup

After setting up policies, test by running this query in SQL Editor:

```sql
-- Check bucket exists and is public
SELECT
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets
WHERE name = 'profile-images';
```

Expected result:
```
id              | name            | public | file_size_limit | allowed_mime_types
----------------|-----------------|--------|-----------------|-------------------
profile-images  | profile-images  | true   | 5242880         | {image/*}
```

---

## Step 4: Update Code (Already Done)

The code has been updated to use Supabase Storage instead of base64. Once you complete steps 1-3 above, image uploads will automatically start working with proper URL storage.

---

## Benefits After Setup

✅ **Faster page loads** - URLs instead of large base64 strings
✅ **Smaller database** - Images stored in optimized file storage
✅ **Better performance** - Supabase CDN serves images
✅ **Image cropping** - New feature enables crop/zoom before upload
✅ **Automatic optimization** - Supabase optimizes image delivery

---

## Troubleshooting

**Issue:** Images still not uploading after setup
**Solution:** Check browser console for errors. Verify bucket name matches `profile-images` exactly.

**Issue:** "Policy violation" errors
**Solution:** Verify all 4 policies are created correctly. Check that user is authenticated.

**Issue:** Images upload but don't display
**Solution:** Ensure bucket is marked as PUBLIC. Check that image URLs are being saved to database.
