# Email Verification Not Sending - Debug Guide

## Current Issue
After switching from HashRouter to BrowserRouter, verification emails are no longer being sent to new users during signup.

## Potential Root Causes

### 1. **Supabase Redirect URL Validation** (MOST LIKELY)
**Problem**: Supabase validates the `emailRedirectTo` parameter against allowed redirect URLs in dashboard settings. If the URL doesn't match exactly, Supabase **silently fails** to send the email (user is still created, but no email is sent).

**Why this might be happening**:
- The signup code uses: `${window.location.origin}/verify-email` → `http://localhost:3000/verify-email`
- Supabase might require exact match or specific wildcard patterns
- After BrowserRouter change, URL format changed from `/#/verify-email` to `/verify-email`

**Solution**: Verify and update Supabase redirect URL configuration

### 2. **Existing User Conflict**
**Problem**: If you're testing with the same email repeatedly, Supabase won't resend verification emails to already-registered users

**Solution**: Delete test users between tests or use new email addresses

### 3. **SMTP Configuration Issue**
**Problem**: SMTP settings might have been changed or credentials expired

**Solution**: Re-verify SMTP configuration in Supabase dashboard

### 4. **Email Confirmation Disabled**
**Problem**: "Confirm email" setting might have been toggled off in Supabase

**Solution**: Re-enable email confirmation

## Step-by-Step Debugging Process

### Step 1: Verify Supabase Redirect URL Configuration

Go to: https://app.supabase.com/project/whhwvuugrzbyvobwfmce/auth/url-configuration

**Required Settings**:

**Site URL**:
```
http://localhost:3000
```

**Redirect URLs** (add ALL of these):
```
http://localhost:3000/**
http://localhost:3000/verify-email
http://localhost:3000/reset-password
http://localhost:3000/debug-auth
```

**CRITICAL**: Make sure there are:
- ✅ NO hash symbols (#) in any URLs
- ✅ NO trailing slashes
- ✅ The wildcard `/**` pattern is included
- ✅ Click **SAVE** after making changes

### Step 2: Verify Email Provider Settings

Go to: https://app.supabase.com/project/whhwvuugrzbyvobwfmce/auth/providers

**Check Email Provider**:
1. Email provider should be **ENABLED** (toggle on)
2. **Confirm email** should be **ENABLED** (✅ checked)
3. **Secure email change** should be **ENABLED** (✅ checked)

### Step 3: Verify SMTP Configuration

Go to: https://app.supabase.com/project/whhwvuugrzbyvobwfmce/auth/templates

Click **Settings** tab at the top

**SMTP Settings**:
- **Enable Custom SMTP**: ✅ ON
- **SMTP Host**: `smtp-relay.brevo.com`
- **SMTP Port**: `587`
- **SMTP User**: Your Brevo email
- **SMTP Password**: Your Brevo SMTP key (NOT your Brevo login password)
- **Sender email**: Must be verified in Brevo
- **Sender name**: CoachDog (or whatever you prefer)

**Test SMTP**: Click "Send test email" to verify SMTP is working

### Step 4: Delete Existing Test Users

Go to: https://app.supabase.com/project/whhwvuugrzbyvobwfmce/auth/users

**Delete any test users**:
1. Find users you created during testing
2. Click the three dots (⋮) next to the user
3. Click "Delete user"
4. Confirm deletion

**Also delete from coaches table**:
Go to: https://app.supabase.com/project/whhwvuugrzbyvobwfmce/editor
1. Select `coaches` table
2. Find and delete corresponding rows

### Step 5: Test Signup with Debug Logging

1. **Open browser console**: Press F12 → Console tab
2. **Navigate to**: http://localhost:3000/coach-signup
3. **Fill out the form** with a FRESH email address (one that's never been used)
4. **Complete all steps** including license verification
5. **Click "Complete Signup"**
6. **Watch the console** for logs starting with `[CoachSignup]`

**Expected console output**:
```
[CoachSignup] Starting signup process...
[CoachSignup] Email: your-email@example.com
[CoachSignup] Redirect URL: http://localhost:3000/verify-email
[CoachSignup] Signup response: { user: "some-uuid", email_confirmed: null, error: null }
```

**What to report**:
- Does signup reach Step 3 ("Check Your Email" screen)? YES / NO
- What appears in the console logs?
- Any errors in the console?
- Do you receive an email? YES / NO

### Step 6: Check Supabase Logs

Go to: https://app.supabase.com/project/whhwvuugrzbyvobwfmce/logs/auth-logs

**Look for**:
1. Recent signup events
2. Any errors related to email sending
3. Any "invalid redirect URL" errors

**Filter by**:
- Event type: `user.signup`
- Time: Last 1 hour

## Quick Fix Attempts

### Fix 1: Add Explicit Redirect URL Option

If the issue is redirect URL validation, we can try being more explicit. Edit [pages/CoachSignup.tsx](pages/CoachSignup.tsx#L98):

**Current**:
```typescript
emailRedirectTo: `${window.location.origin}/verify-email`,
```

**Try changing to**:
```typescript
emailRedirectTo: 'http://localhost:3000/verify-email',
```

This hardcodes the URL instead of using `window.location.origin`.

### Fix 2: Temporarily Disable Email Confirmation

**FOR TESTING ONLY** - to confirm the issue is email-related:

Go to: https://app.supabase.com/project/whhwvuugrzbyvobwfmce/auth/providers
1. Temporarily disable "Confirm email"
2. Try signup again
3. If signup succeeds and you can login immediately, we know the issue is with email sending
4. **DON'T FORGET TO RE-ENABLE** after testing

### Fix 3: Check for Double Signup Prevention

Supabase has a feature called "Double Signup Prevention" that might interfere:

Go to: https://app.supabase.com/project/whhwvuugrzbyvobwfmce/settings/auth
- Look for "Double Signup Prevention"
- If enabled, try disabling it temporarily

## Testing Checklist

After making any changes, test the complete flow:

- [ ] Supabase redirect URLs configured correctly (no hashes, with wildcard)
- [ ] Email confirmation is enabled in Supabase
- [ ] SMTP settings are correct and test email works
- [ ] Deleted all test users from both `auth.users` and `coaches` table
- [ ] Used a fresh email address for testing
- [ ] Browser console is open (F12 → Console)
- [ ] Filled out signup form completely
- [ ] Watched console for `[CoachSignup]` logs
- [ ] Reached Step 3 ("Check Your Email" screen)
- [ ] Received verification email (check spam folder)
- [ ] Clicked verification link
- [ ] Successfully redirected and logged in

## Additional Diagnostic Tool

Visit: http://localhost:3000/debug-auth

This page shows:
- Current URL and hash parameters
- Session status
- User authentication state
- Coach profile status

Use this to verify authentication state after any step.

## What to Report Back

Please provide:
1. **Screenshot of Supabase redirect URL configuration**
2. **Screenshot or copy of browser console logs** during signup (the `[CoachSignup]` logs)
3. **Whether you reached Step 3** ("Check Your Email" screen)
4. **Whether you received an email** (check spam)
5. **Any errors in Supabase Auth Logs**

## Known Working Configuration

For reference, here's what should work:

**Supabase URL Config**:
- Site URL: `http://localhost:3000`
- Redirect URLs: `http://localhost:3000/**` + specific paths

**Signup Flow**:
1. User fills form → License verification → Signup API call
2. Supabase creates user with `email_confirmed_at = null`
3. Supabase sends verification email via Brevo SMTP
4. User sees Step 3 screen
5. User clicks link in email
6. Link redirects to `/verify-email` with hash fragments
7. Page sets session and creates coach profile
8. User redirected to dashboard

---

**Current Status**: Awaiting diagnostic information from Steps 1-6 above
**Dev Server**: Running at http://localhost:3000/
**Debug Panel**: http://localhost:3000/debug-auth
