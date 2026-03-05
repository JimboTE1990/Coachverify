# Pre-Beta Test Verification Checklist
**Date:** 2026-03-02
**Critical:** Run BEFORE beta tester group arrives this week

## Current Status: ⚠️ NOT READY FOR BETA

### Issues Found
1. ❌ **CRITICAL:** Image upload failing (storage policies missing)
2. ⚠️ **MEDIUM:** SECURITY DEFINER warning (security issue)

---

## Fix Checklist (MUST DO BEFORE BETA)

### ✅ Step 1: Verify Storage Bucket Exists (1 minute)

1. Go to: https://whhwvuugrzbyvobwfmce.supabase.co
2. Login to Supabase Dashboard
3. Click **Storage** in left sidebar
4. Look for bucket: `profile-photos`

**If bucket DOES NOT exist:**
```
1. Click "New Bucket"
2. Name: profile-photos
3. ✅ Check "Public bucket"
4. Click "Create bucket"
```

**If bucket exists but is NOT public:**
```
1. Click on bucket name
2. Click "Settings" tab
3. Check "Public bucket"
4. Click "Save"
```

**Status after this step:**
- [ ] Bucket `profile-photos` exists and is PUBLIC

---

### ✅ Step 2: Apply Storage Policies (1 minute)

1. In Supabase Dashboard → Click **SQL Editor**
2. Click "New query"
3. Copy entire contents of `FIX_STORAGE_POLICIES.sql`
4. Paste into SQL editor
5. Click **Run** (or press Cmd+Enter)

**Expected output:**
```
4 rows returned showing:
- Coaches can delete their own photos    | DELETE   | authenticated
- Coaches can upload their own photos    | INSERT   | authenticated
- Anyone can view profile photos         | SELECT   | public
- Coaches can update their own photos    | UPDATE   | authenticated
```

**If you get an error:**
- Check error message
- Most common: Policies already exist (this is OK - they'll be recreated)
- If error persists, contact me

**Status after this step:**
- [ ] All 4 storage policies created successfully
- [ ] Verification query shows 4 rows

---

### ✅ Step 3: Fix Security Warning (1 minute)

1. In Supabase Dashboard → **SQL Editor**
2. Click "New query"
3. Copy entire contents of `FIX_SECURITY_DEFINER.sql`
4. Paste into SQL editor
5. Click **Run**

**Expected output:**
```
First query: Shows view definition (should NOT contain "SECURITY DEFINER")
Second query: Shows count of coaches (e.g., "total_coaches: 15")
```

**Status after this step:**
- [ ] View recreated without SECURITY DEFINER
- [ ] Coach count query returns a number (proves view works)

---

### ✅ Step 4: Test Image Upload YOURSELF (5 minutes)

**CRITICAL:** Test this yourself BEFORE beta testers arrive!

1. **Create a test coach account** (if you don't have one):
   - Go to: https://coachverify.vercel.app/signup
   - Sign up with a test email
   - Use EMCC as accreditation body
   - Enter any EIA number (e.g., EIA20230001)
   - Complete signup

2. **Test profile photo upload:**
   - Login to dashboard
   - Go to "Profile" tab
   - Click "Upload Photo"
   - Select ANY image from your computer
   - Crop/position it
   - Click "Save Image"
   - ✅ **Must see:** Image appears in preview immediately
   - ❌ **Error means:** Something is still wrong

3. **Test banner upload:**
   - Still in "Profile" tab
   - Click "Upload Banner"
   - Select ANY image
   - Crop/position it
   - Click "Save Image"
   - ✅ **Must see:** Banner appears in preview immediately
   - ❌ **Error means:** Something is still wrong

4. **Test public view:**
   - Go to main coaches list: https://coachverify.vercel.app/coaches
   - Find your test coach profile
   - Click to view details
   - ✅ **Must see:** Your uploaded photo and banner visible
   - ❌ **Error means:** Storage is private or URLs are wrong

**Status after this step:**
- [ ] Profile photo uploaded successfully
- [ ] Banner image uploaded successfully
- [ ] Both images visible in dashboard preview
- [ ] Both images visible on public profile page

---

### ✅ Step 5: Test with Anastasia (Optional but Recommended)

Since Anastasia already reported the issue:

1. **Contact her:**
   ```
   Hi Anastasia,

   I've fixed the image upload issue. Could you please try uploading
   your profile photo and banner again? It should work now.

   Let me know immediately if you encounter any problems.

   Thanks!
   Jamie
   ```

2. **Wait for her confirmation** before opening to full beta group

**Status after this step:**
- [ ] Anastasia confirms upload works
- [ ] OR you're confident from your own testing

---

## Post-Fix Verification

### Storage Bucket Check
```sql
-- Run in Supabase SQL Editor to verify bucket configuration
SELECT
  name,
  public
FROM storage.buckets
WHERE name = 'profile-photos';

-- Expected: 1 row, public = true
```

### Storage Policies Check
```sql
-- Verify all 4 policies exist
SELECT
  policyname,
  cmd,
  roles::text
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
  AND policyname LIKE '%photo%'
ORDER BY cmd;

-- Expected: 4 rows (DELETE, INSERT, SELECT, UPDATE)
```

### Security Definer Check
```sql
-- Verify view does NOT have SECURITY DEFINER
SELECT
  schemaname,
  viewname,
  definition
FROM pg_views
WHERE schemaname = 'public'
  AND viewname = 'coach_profiles';

-- Expected: definition should NOT contain "security_definer"
```

### End-to-End Functional Check
```sql
-- Verify coach profiles can be queried (proves RLS is working)
SELECT COUNT(*) FROM coach_profiles;

-- Expected: Returns total number of coaches (not 0, not error)
```

---

## Known Issues (Non-Blocking)

These won't affect beta testing but should be fixed later:

1. **Image upload component uses `upsert: false`**
   - Impact: If user uploads same photo twice, second upload fails
   - Workaround: User can just delete old photo first
   - Fix: Change to `upsert: true` in future update

2. **No upload progress indicator**
   - Impact: Large images (3-5MB) may seem slow
   - Workaround: Tell users to wait ~5-10 seconds for large files
   - Fix: Add progress bar in future update

3. **Default fallback images in code**
   - Impact: If storage fails, fallback to `/logo-image-only.png`
   - Status: Fallback images exist in public folder (verified)
   - Fix: None needed, this is intentional

---

## Beta Test Communication Template

**After all fixes verified, send this to beta group:**

```
Hi everyone,

Our beta test week is starting soon! I want to make sure everything is
working perfectly for you.

IMPORTANT - Profile Setup:
✅ Upload your profile photo and banner from the Profile tab
✅ Images can be any size up to 5MB - we'll let you crop and position them
✅ This should work smoothly now (we fixed an issue earlier)

If you encounter ANY issues uploading images, please let me know
immediately at support@coachdog.com.

Looking forward to your feedback!

Best,
Jamie
```

---

## Confidence Level

**After completing all 5 steps above:**

- ✅ **100% confident** if:
  - All storage policies created
  - Security warning fixed
  - You successfully uploaded images yourself
  - Images appear on public profile

- ⚠️ **90% confident** if:
  - All storage policies created
  - You didn't test yourself but verification queries pass

- ❌ **NOT READY** if:
  - Storage policies failed to create
  - Test upload failed
  - Images don't appear on public profile

---

## Rollback Plan (If Something Goes Wrong During Beta)

If image uploads fail during beta week:

### Quick Fix Option 1: Manual Upload
```
1. Have user email you their photos
2. Upload manually via Supabase Dashboard → Storage → profile-photos
3. Update database with public URLs
4. Apologize and offer discount/extension
```

### Quick Fix Option 2: Disable Feature Temporarily
```
1. Update dashboard to hide image upload buttons temporarily
2. Add message: "Image uploads coming soon - profiles will use defaults"
3. Fix issue properly after beta week
4. Re-enable feature
```

---

## Final Pre-Beta Checklist

Before announcing beta test to group:

- [ ] Storage bucket exists and is public
- [ ] All 4 storage policies created
- [ ] Security DEFINER warning fixed
- [ ] Test upload completed successfully (by you)
- [ ] Images visible on public profile
- [ ] Anastasia confirmed fix works (optional)
- [ ] Beta group communication ready
- [ ] Rollback plan understood

**Time required:** 10-15 minutes total
**Status:** ⚠️ NOT READY (fixes not yet applied)

---

## Next Steps

1. **RIGHT NOW:** Run Steps 1-4 above (10 minutes)
2. **Optional:** Test with Anastasia first (Step 5)
3. **Then:** Open to full beta group
4. **Monitor:** Watch for any image upload issues during beta week

## Questions?

If anything fails or you're unsure, **STOP** and contact me before opening to beta group.

Better to delay beta by 1 day than have all testers hit the same issue.
