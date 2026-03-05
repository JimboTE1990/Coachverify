# Quick Fix Checklist - Image Upload & Security Issues
**Date:** 2026-03-02

## Issue 1: Image Upload Not Working (URGENT - Beta Blocker)

### Quick Diagnostic (2 minutes)
1. Go to Supabase Dashboard: https://whhwvuugrzbyvobwfmce.supabase.co
2. Click **Storage** in left sidebar
3. Look for bucket named `profile-photos`

**If you DON'T see it:**
- Click "New Bucket"
- Name: `profile-photos`
- ✅ Check "Public bucket"
- Click "Create bucket"

**If you DO see it:**
- Click on the bucket name
- Check if "Public" badge is shown
- If not public, click Settings → Make public

### Apply Storage Policy Fix (1 minute)
1. Go to Supabase Dashboard → **SQL Editor**
2. Click "New query"
3. Copy and paste contents of: `FIX_STORAGE_POLICIES.sql`
4. Click "Run" (or press Cmd+Enter)
5. Verify you see 4 rows in the result (the 4 policies)

### Test (1 minute)
1. Ask Anastasia to log in and try uploading again
2. OR login as a test coach and try yourself
3. Should work immediately - no deployment needed

---

## Issue 2: SECURITY DEFINER Warning (MEDIUM Priority)

### Apply Security Fix (1 minute)
1. Go to Supabase Dashboard → **SQL Editor**
2. Click "New query"
3. Copy and paste contents of: `FIX_SECURITY_DEFINER.sql`
4. Click "Run"
5. Verify output shows view definition without "SECURITY DEFINER"

### Verify (1 minute)
1. Re-run your security scan
2. Warning should be gone
3. Test that coach profiles still load correctly on website

---

## Total Time: ~5 minutes

## Files Created
- ✅ `FIX_IMAGE_UPLOAD_AND_SECURITY.md` - Detailed explanation
- ✅ `FIX_STORAGE_POLICIES.sql` - Run this first (image upload)
- ✅ `FIX_SECURITY_DEFINER.sql` - Run this second (security warning)
- ✅ `QUICK_FIX_CHECKLIST.md` - This file

## Support Response to Anastasia

```
Hi Anastasia,

Thank you for reporting this issue! I've identified and fixed the problem.

The issue was with storage bucket permissions - the system wasn't configured
to allow authenticated users to upload images. This has now been fixed.

Please try uploading your profile photo and banner again:
1. Log into your dashboard
2. Go to Profile tab
3. Click "Upload Photo" or "Upload Banner"
4. Select any image (the system will let you crop it)
5. Position and zoom as needed
6. Click "Save Image"

It should work immediately. If you still have issues, please let me know
and I'll help you troubleshoot.

Thank you for being a beta tester!

Best,
Jamie
```

## Notes
- No code deployment needed - these are database-only fixes
- Changes take effect immediately
- Both fixes are safe and won't break existing functionality
- Storage policies are additive - won't affect existing uploaded images
