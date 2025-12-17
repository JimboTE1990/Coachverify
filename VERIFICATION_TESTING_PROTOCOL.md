# Email Verification Testing Protocol

## Current Status
**Date:** December 13, 2025 - COMPLETE REBUILD
**Critical Issue RESOLVED:** Email verification flow has been completely rebuilt using **database trigger approach** to eliminate `setSession()` deadlock permanently.

## ⚠️ IMPORTANT: Old Testing Protocol is OBSOLETE
The fire-and-forget pattern described below has been **completely replaced** with a database trigger approach.

**New documentation:** See [AUTH_REBUILD_GUIDE.md](AUTH_REBUILD_GUIDE.md) for complete testing protocol.

---

## DEPRECATED SECTION (For Historical Reference Only)

---

## Testing Steps for User c5c09394-b29c-4a41-b9b2-fd95b6a055c1

### Step 1: Clear Browser State
1. Open DevTools (F12)
2. Go to Application tab → Storage → Clear site data
3. Close and reopen browser
4. Navigate to `http://localhost:3000/verify-email#access_token=...` (use link from email)

### Step 2: Monitor Console Logs
You should see this exact sequence:

```
[VerifyEmail] ====== Starting verification process ======
[VerifyEmail] Calling supabase.auth.setSession()...
[AuthContext] Auth state changed: SIGNED_IN
[AuthContext] Fetching coach profile for user: c5c09394-b29c-4a41-b9b2-fd95b6a055c1
[VerifyEmail] ✅ Session check completed!               ← KEY: This should now appear
[VerifyEmail] sessionData.user: c5c09394-b29c-4a41-b9b2-fd95b6a055c1
[VerifyEmail] Creating coach profile...
[ProfileCreation] Attempt 1/3 to create profile...
[ProfileCreation] ✅ Profile created successfully
[VerifyEmail] ✅ Coach profile ready with trial activated
[VerifyEmail] Redirecting to dashboard...
```

### Step 3: What Each Log Means

| Log | Meaning | If Missing |
|-----|---------|-----------|
| `Session check completed!` | New fire-and-forget pattern worked | Old deadlock issue persists |
| `sessionData.user: [UUID]` | Session was successfully set | Session failed to set |
| `Creating coach profile...` | Proceeding to profile creation | Session check failed |
| `Profile created successfully` | Database insert worked | Database/RLS issue |
| `Redirecting to dashboard...` | Full flow complete! | Profile creation failed |

---

## Issue #1: Email Verification Not Working

### Root Cause History
1. **Original Issue:** `await supabase.auth.setSession()` hung indefinitely
2. **Why It Hung:** AuthContext's `onAuthStateChange` listener called `fetchCoachProfile()` which blocked the promise
3. **First Fix Attempt:** Made `fetchCoachProfile()` non-blocking
4. **Second Fix Attempt:** Added timeout to `fetchCoachProfile()`
5. **Third Fix Attempt:** Fixed table name mismatch (`coach_profiles` → `coaches`)
6. **FINAL FIX:** Fire-and-forget pattern - don't await `setSession()`, verify it worked via `getSession()`

### Current Implementation
**File:** `pages/VerifyEmail.tsx` lines 84-102

```typescript
// Fire off setSession in background - don't wait for it
supabase.auth.setSession({
  access_token: accessToken,
  refresh_token: refreshToken || '',
}).then(result => {
  console.log('[VerifyEmail] ✅ setSession completed in background:', result);
}).catch(err => {
  console.error('[VerifyEmail] setSession background error:', err);
});

// Wait 1 second for session to be set
await new Promise(resolve => setTimeout(resolve, 1000));

// Verify it worked
const { data: { session: currentSession }, error: sessionCheckError } = await supabase.auth.getSession();
```

### Expected Behavior
- `setSession()` fires in background
- AuthContext listeners can complete without blocking
- After 1 second, we check if session was set
- If session exists, proceed to profile creation
- If session is null, show error

---

## Issue #2: Resend Verification Email Not Arriving

### Implementation
**File:** `pages/VerifyEmail.tsx` lines 263-269

```typescript
const { data, error } = await supabase.auth.resend({
  type: 'signup',
  email: email,
  options: {
    emailRedirectTo: `${window.location.origin}/verify-email`
  }
});
```

### Possible Causes

1. **Rate Limiting**
   - Supabase limits resend to once every 60 seconds
   - Check console for "rate limit" error
   - **Solution:** Wait 1 minute between attempts

2. **Email Not Confirmed Yet**
   - If user's email isn't confirmed in Supabase database, resend might fail
   - Check Supabase dashboard: Authentication → Users → Find user by email
   - Look for "Email Confirmed" status

3. **Supabase Email Configuration**
   - Go to Supabase Dashboard → Project Settings → Auth → Email Templates
   - Ensure "Confirm signup" template is enabled
   - Check SMTP settings in Project Settings → Email

4. **User Already Confirmed**
   - If the user already clicked a verification link, resend won't work
   - The account is already verified
   - They should just try logging in

### Debug Steps for Resend

1. **Check Console Logs**
   ```javascript
   [VerifyEmail] Resending verification email to: user@example.com
   [VerifyEmail] Resend result: { data: {...}, error: null }
   ```

2. **Check for Errors**
   - `rate limit` → Wait 60 seconds
   - `not found` → Email doesn't exist in auth.users table
   - `invalid` → Email format is wrong

3. **Check Supabase Dashboard**
   - Go to Authentication → Users
   - Find user by email
   - Check "Email Confirmed" column
   - If already confirmed, resend won't send

### Testing Resend

1. Navigate to `/verify-email` (without hash params)
2. You should see "Link Expired" state with resend form
3. Enter email: `jfamarketingsolutions@gmail.com`
4. Click "Resend Verification Email"
5. Check console for logs
6. Wait 60 seconds if rate limited
7. Check email inbox (and spam folder)

---

## Database Verification

### Check if Profile Was Created

Run this in Supabase SQL Editor:

```sql
SELECT
  id,
  user_id,
  name,
  email,
  subscription_status,
  trial_ends_at,
  created_at
FROM coaches
WHERE user_id = 'c5c09394-b29c-4a41-b9b2-fd95b6a055c1';
```

**Expected Result:**
- Row exists with user_id matching
- subscription_status = 'trial'
- trial_ends_at = 30 days from now
- All required fields populated

### Check if User Email is Confirmed

```sql
SELECT
  id,
  email,
  email_confirmed_at,
  created_at
FROM auth.users
WHERE id = 'c5c09394-b29c-4a41-b9b2-fd95b6a055c1';
```

**Expected Result:**
- email_confirmed_at should have a timestamp (not NULL)
- If NULL, email verification didn't work

---

## Key Files Modified

1. **pages/VerifyEmail.tsx**
   - Line 84-102: Fire-and-forget `setSession()` pattern
   - Line 263-269: Resend functionality

2. **contexts/AuthContext.tsx**
   - Line 34-40: Timeout on `fetchCoachProfile()`
   - Line 65-68: Non-blocking profile fetch

3. **services/supabaseService.ts**
   - Line 61: Fixed table name `coaches` (was `coach_profiles`)

4. **utils/profileCreation.ts**
   - Line 37: Uses `coaches` table
   - Line 77: Sets `trial_ends_at` to 30 days

---

## Success Criteria

✅ **Email Verification Working:**
- User clicks verification link
- Sees "Verifying your email..." for ~1 second
- Sees "Verification Successful!" message
- Redirects to dashboard after 3 seconds
- Dashboard loads with trial active
- Profile dropdown shows user name

✅ **Resend Email Working:**
- User enters email on expired link page
- Clicks "Resend Verification Email"
- Sees success message
- Receives email within 1-2 minutes
- Can click new link and verify successfully

---

## If Still Not Working

### Fallback Option 1: Manual Database Update

If verification continues to fail, manually verify the user:

```sql
-- Confirm email in auth.users
UPDATE auth.users
SET email_confirmed_at = NOW()
WHERE id = 'c5c09394-b29c-4a41-b9b2-fd95b6a055c1';

-- Create coach profile manually
INSERT INTO coaches (
  user_id,
  name,
  email,
  subscription_status,
  trial_ends_at,
  trial_used,
  is_verified,
  -- ... all other required fields
)
VALUES (
  'c5c09394-b29c-4a41-b9b2-fd95b6a055c1',
  'Jane Doe',
  'jfamarketingsolutions@gmail.com',
  'trial',
  NOW() + INTERVAL '30 days',
  false,
  true
  -- ... all other values
);
```

Then user can log in directly.

### Fallback Option 2: Skip Email Verification

In Supabase Dashboard:
1. Go to Authentication → Settings
2. Find "Enable email confirmations"
3. **Temporarily disable it**
4. Users can sign up and access immediately
5. Re-enable after fixing the issue

---

## Next Steps

1. **Test the new verification approach** with user c5c09394-b29c-4a41-b9b2-fd95b6a055c1
2. **Share console logs** if it still fails
3. **Check Supabase email logs** in Dashboard → Logs → Email
4. **Test resend functionality** and report any errors
5. **Consider manual verification** if automation continues to fail

---

**Last Updated:** December 13, 2025
**Status:** Critical fixes applied, awaiting test results
