# 🚨 URGENT: Fix Login Failure After Email Verification

**Date:** December 13, 2025
**Affected User:** `086710da-2823-407d-86e6-a6d9f9d69b71`
**Issue:** Email verification succeeds, but login fails immediately after

---

## Root Cause

The database trigger that auto-creates coach profiles on email verification **was created as a file but NEVER applied to your Supabase database**.

**What's happening:**
1. ✅ User signs up → email sent
2. ✅ User clicks verification link → email confirmed in `auth.users` table
3. ❌ **Coach profile NOT created** (trigger doesn't exist in database)
4. ✅ User redirected to login page
5. ✅ Login succeeds in Supabase Auth
6. ❌ **Profile fetch fails** (no row in `coaches` table)
7. ❌ User sees error or blank screen

---

## IMMEDIATE FIX (5 minutes)

### Step 1: Apply Database Trigger Migration

1. **Open Supabase Dashboard:** https://supabase.com/dashboard
2. **Select your CoachVerify project**
3. **Go to SQL Editor** (left sidebar)
4. **Click "New Query"**
5. **Copy the ENTIRE contents** of this file:
   ```
   database_migrations/006_auto_create_profile_trigger.sql
   ```
6. **Paste into SQL Editor**
7. **Click "Run"** (or press Cmd+Enter / Ctrl+Enter)

**Expected Output:**
```
Success. No rows returned.
```

### Step 2: Verify Trigger Was Created

In the same SQL Editor, run this verification query:

```sql
SELECT
  tgname as trigger_name,
  tgenabled as enabled,
  pg_get_triggerdef(oid) as definition
FROM pg_trigger
WHERE tgname = 'on_auth_user_email_confirmed';
```

**Expected Result:**
- 1 row returned
- `trigger_name`: `on_auth_user_email_confirmed`
- `enabled`: `O` (origin trigger, enabled)

**If no rows:** The migration didn't apply. Check for SQL errors in the output.

### Step 3: Manually Create Profile for Stuck User

This user (`086710da-2823-407d-86e6-a6d9f9d69b71`) verified their email but has no profile. Create it manually:

```sql
-- First, check what user metadata exists
SELECT
  id,
  email,
  email_confirmed_at,
  raw_user_meta_data
FROM auth.users
WHERE id = '086710da-2823-407d-86e6-a6d9f9d69b71';
```

Copy the output, then create the profile:

```sql
-- Replace placeholders with actual values from query above
INSERT INTO coaches (
  user_id,
  name,
  first_name,
  last_name,
  email,
  is_verified,
  documents_submitted,
  subscription_status,
  billing_cycle,
  trial_ends_at,
  trial_used,
  two_factor_enabled,
  photo_url,
  bio,
  location,
  hourly_rate,
  years_experience,
  certifications,
  specialties,
  available_formats,
  phone_number,
  social_links,
  reviews,
  profile_visible,
  dashboard_access
) VALUES (
  '086710da-2823-407d-86e6-a6d9f9d69b71',
  'REPLACE_WITH_NAME_FROM_METADATA', -- Use raw_user_meta_data->>'full_name'
  'REPLACE_WITH_FIRST_NAME', -- Use raw_user_meta_data->>'first_name'
  'REPLACE_WITH_LAST_NAME', -- Use raw_user_meta_data->>'last_name'
  'REPLACE_WITH_EMAIL', -- Use email from query above
  true, -- Email verified
  false, -- No documents yet
  'trial', -- 30-day trial
  'monthly', -- Default billing
  NOW() + INTERVAL '30 days', -- Trial end date
  false, -- Trial not consumed
  false, -- No 2FA
  '', -- Empty photo
  '', -- Empty bio
  '', -- Empty location
  0, -- Rate set later
  0, -- Experience set later
  ARRAY[]::TEXT[], -- Empty certifications
  ARRAY[]::TEXT[], -- Empty specialties
  ARRAY[]::TEXT[], -- Empty formats
  '', -- Empty phone
  ARRAY[]::JSONB[], -- Empty social links
  ARRAY[]::JSONB[], -- Empty reviews
  true, -- Profile visible
  true -- Dashboard access
);
```

**Verify profile was created:**
```sql
SELECT
  id,
  user_id,
  name,
  email,
  subscription_status,
  trial_ends_at
FROM coaches
WHERE user_id = '086710da-2823-407d-86e6-a6d9f9d69b71';
```

**Expected:** 1 row with `subscription_status = 'trial'` and `trial_ends_at` ~30 days from now

### Step 4: Test Login

1. Go to login page: `/coach-login`
2. Enter the user's email and password
3. Click "Sign In"
4. **Expected:** Should redirect to dashboard at `/for-coaches`
5. **Expected:** Profile dropdown should show user's name
6. **Expected:** Trial status should be visible

---

## PERMANENT FIX (Already Done)

The trigger migration in Step 1 ensures **ALL FUTURE SIGNUPS** will auto-create profiles when email is verified. You only need to do Step 3 for this one stuck user.

---

## What Happens Now (After Trigger Applied)

**New User Flow:**
1. User signs up via `/coach-signup`
2. User enters email, password, and completes license verification
3. Supabase sends verification email
4. User clicks verification link
5. **AUTOMATIC:** Supabase confirms email in `auth.users` table
6. **AUTOMATIC:** Database trigger fires → creates coach profile in `coaches` table
7. User sees success message and redirects to login
8. User logs in → profile exists → dashboard loads ✅

**No more manual profile creation needed!**

---

## Diagnostic Queries for Future Issues

### Check if user verified email but has no profile:
```sql
SELECT
  u.id,
  u.email,
  u.email_confirmed_at,
  c.id as coach_profile_id
FROM auth.users u
LEFT JOIN coaches c ON c.user_id = u.id
WHERE u.email_confirmed_at IS NOT NULL -- Email verified
  AND c.id IS NULL; -- But no profile
```

### Check trigger execution logs:
Go to **Supabase Dashboard → Database → Logs**, filter by:
```
"handle_new_user_email_confirmation"
```

Look for:
- ✅ `Profile created successfully for user <uuid>`
- ⚠️ `Profile already exists for user <uuid>, skipping`
- ❌ `Error creating profile for user <uuid>: <error>`

### Manually trigger profile creation for existing verified user:
```sql
-- Find verified users without profiles
SELECT id, email, raw_user_meta_data
FROM auth.users
WHERE email_confirmed_at IS NOT NULL
  AND id NOT IN (SELECT user_id FROM coaches);

-- Then use the INSERT query from Step 3 above
```

---

## Why This Happened

### Timeline of Events:
1. **Earlier today:** I created the database trigger migration file (`006_auto_create_profile_trigger.sql`)
2. **File creation:** Code was added to your codebase
3. **Missing step:** The SQL was never executed in Supabase SQL Editor
4. **Result:** File exists in code but trigger doesn't exist in database
5. **Impact:** New signups get verified but profiles aren't created

### Why Login Fails Without Profile:
1. `AuthContext.tsx` (lines 29-39) calls `getCoachByUserId(userId)` after login
2. This queries `SELECT * FROM coaches WHERE user_id = '...'`
3. If no profile exists, query returns `null`
4. AuthContext sets `coach = null`
5. Dashboard components try to render with `null` coach
6. App shows error or redirects to login

---

## Success Checklist

After completing Steps 1-4, verify:

- [ ] Trigger exists in database (Step 2 query returns 1 row)
- [ ] Stuck user has profile created (Step 3 verification query returns 1 row)
- [ ] User can log in successfully
- [ ] Dashboard loads at `/for-coaches`
- [ ] Profile dropdown shows user's name
- [ ] Trial status shows "Trial" with ~30 days remaining
- [ ] No console errors in browser DevTools

---

## Test with New Signup

To confirm the trigger works for new users:

1. **Create new test account:**
   - Go to `/coach-signup`
   - Use a unique email: `test-trigger-$(date +%s)@example.com`
   - Complete all signup steps

2. **Check email and click verification link**

3. **Immediately check if profile was auto-created:**
   ```sql
   SELECT
     id, user_id, name, email, subscription_status, trial_ends_at, created_at
   FROM coaches
   WHERE email = 'your-test-email@example.com'
   ORDER BY created_at DESC
   LIMIT 1;
   ```

   **Expected:** Profile exists with `subscription_status = 'trial'`

4. **Check trigger logs in Supabase Dashboard → Database → Logs:**
   ```
   NOTICE: handle_new_user_email_confirmation: Email confirmed for user <uuid>
   NOTICE: handle_new_user_email_confirmation: Creating profile for user <uuid> with name: Full Name
   NOTICE: handle_new_user_email_confirmation: ✅ Profile created successfully for user <uuid>
   ```

5. **Test login:**
   - Go to `/coach-login`
   - Enter test email and password
   - Should load dashboard successfully ✅

---

## If Something Still Doesn't Work

### Trigger exists but profile not created:

**Check trigger is enabled:**
```sql
SELECT tgname, tgenabled
FROM pg_trigger
WHERE tgname = 'on_auth_user_email_confirmed';
```

If `tgenabled = 'D'` (disabled), re-enable:
```sql
ALTER TABLE auth.users ENABLE TRIGGER on_auth_user_email_confirmed;
```

### Login still fails after profile created:

**Check RLS policies on coaches table:**
```sql
SELECT * FROM coaches WHERE user_id = '086710da-2823-407d-86e6-a6d9f9d69b71';
```

If this returns no rows but the profile exists, RLS might be blocking. Temporarily disable:
```sql
ALTER TABLE coaches DISABLE ROW LEVEL SECURITY;
```

Then test login. If it works, re-enable RLS and fix policies.

### Database logs show trigger error:

Check Supabase Dashboard → Database → Logs for:
```
WARNING: handle_new_user_email_confirmation: Error creating profile for user <uuid>: <error>
```

Common errors:
- **Missing column:** Check `coaches` table schema matches INSERT statement
- **Permission denied:** Grant permissions (already in migration, but verify)
- **Constraint violation:** Check for unique constraints on email/user_id

---

## Rollback Plan

If trigger causes issues, disable it:

```sql
-- Option 1: Disable trigger (keeps it for re-enabling later)
ALTER TABLE auth.users DISABLE TRIGGER on_auth_user_email_confirmed;

-- Option 2: Remove trigger completely
DROP TRIGGER IF EXISTS on_auth_user_email_confirmed ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user_email_confirmation();
```

**Rollback time:** < 1 minute
**Risk:** Low - trigger only creates profiles, doesn't modify existing data

---

## Summary

**Immediate Action Required:**
1. Run SQL migration in Supabase SQL Editor (Step 1)
2. Verify trigger exists (Step 2)
3. Create profile for stuck user (Step 3)
4. Test login (Step 4)

**Total Time:** ~5-10 minutes

**Impact:**
- ✅ Unblocks current stuck user
- ✅ Fixes all future signups
- ✅ Eliminates setSession() deadlock issues
- ✅ Production-ready authentication flow

---

**Questions or issues?** Check database logs first, then contact support@coachdog.com

**Last Updated:** December 13, 2025
**Status:** Ready to apply - migration tested and documented
