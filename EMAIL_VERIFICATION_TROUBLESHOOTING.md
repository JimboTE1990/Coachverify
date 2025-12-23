# Email Verification Troubleshooting Guide

## Critical Issue Fixed: Infinite Redirect Loop

**Error:** `SecurityError: Attempt to use history.replaceState() more than 100 times per 10 seconds`

**Root Cause:** In [CoachSignup.tsx](pages/CoachSignup.tsx), the `useEffect` hook that checks authentication was creating an infinite loop:
- Every time `navigate()` was called, it triggered auth state changes
- Auth state changes triggered the useEffect again → infinite loop

**Fix Applied:**
- Added `useRef` to track if redirect has already happened
- Removed `navigate` from useEffect dependency array
- Added `hasRedirected.current` guard to prevent multiple redirects

**Files Fixed:**
- ✅ [CoachSignup.tsx:11-31](pages/CoachSignup.tsx#L11-L31)
- ✅ [CoachLogin.tsx:11-23](pages/CoachLogin.tsx#L11-L23) (already had this fix)

---

## Email Verification Not Arriving - Diagnosis

### Possible Causes

1. **Supabase Email Confirmation Settings**
2. **Email Provider Blocking**
3. **Incorrect Email Template Configuration**
4. **Rate Limiting**
5. **SMTP Configuration Issues**

### How to Diagnose

#### Step 1: Check Supabase Dashboard Email Settings

1. Go to: https://supabase.com/dashboard/project/whhwvuugrzbyvobwfmce/auth/url-configuration
2. Verify **Site URL** is set correctly:
   - Local: `http://localhost:5173`
   - Production: `https://coachverify.vercel.app`
3. Verify **Redirect URLs** include:
   - `http://localhost:5173/verify-email`
   - `https://coachverify.vercel.app/verify-email`

#### Step 2: Check Email Provider Settings

1. Go to: https://supabase.com/dashboard/project/whhwvuugrzbyvobwfmce/settings/auth
2. Scroll to **SMTP Settings**
3. Check:
   - ✅ Enable email confirmations: **ENABLED**
   - ✅ Confirm email: **ENABLED**
   - ✅ Secure email change: **ENABLED**

#### Step 3: Check Email Templates

1. Go to: https://supabase.com/dashboard/project/whhwvuugrzbyvobwfmce/auth/templates
2. Verify **Email Templates** → **Confirm signup** template exists
3. Check that `{{ .ConfirmationURL }}` is present in the template

#### Step 4: Test with Supabase Logs

1. Go to: https://supabase.com/dashboard/project/whhwvuugrzbyvobwfmce/logs/edge-logs
2. Filter by `auth` service
3. After triggering signup, check for:
   - ✅ `auth.signup` event
   - ✅ `mailer.send` event
   - ❌ Any error messages

#### Step 5: Check Your Email Provider (Gmail/Outlook)

1. **Check Spam Folder** - Supabase emails often land here
2. **Check Promotions Tab** (Gmail) - Check all tabs
3. **Search for sender:**
   - Search: `from:@noreply.mail.supabase.io`
   - OR: `from:@whhwvuugrzbyvobwfmce.supabase.co`
4. **Check email filters** - You may have a rule blocking Supabase

### Common Fixes

#### Fix 1: Use Custom SMTP (Recommended for Production)

Supabase's default email service has limits and deliverability issues. For production, configure custom SMTP:

1. Go to: https://supabase.com/dashboard/project/whhwvuugrzbyvobwfmce/settings/auth
2. Scroll to **SMTP Settings**
3. Enable **Custom SMTP** and configure:
   - **Provider:** SendGrid, Mailgun, AWS SES, or Gmail
   - **Host:** e.g., `smtp.sendgrid.net`
   - **Port:** `587` or `465`
   - **User:** Your SMTP username
   - **Password:** Your SMTP password
   - **Sender email:** `noreply@coachdog.com` (must be verified)
   - **Sender name:** `CoachDog`

#### Fix 2: Whitelist Supabase Email Addresses

Add these to your email whitelist:
- `noreply@mail.supabase.io`
- `noreply@whhwvuugrzbyvobwfmce.supabase.co`

#### Fix 3: Rate Limit Check

Supabase has email rate limits:
- **Max 4 emails per hour per user** (signup emails)
- **Max 1 resend per 60 seconds**

If you've been testing, you might have hit the limit. Wait 1 hour and try again.

#### Fix 4: Verify Email Redirect URL

The redirect URL in the email must match exactly. Check in Supabase logs that the email contains the correct link.

### Testing Email Delivery

#### Test 1: Direct Signup (No Frontend)

Use this script to test if Supabase can send emails at all:

```bash
# Replace with your Supabase URL and ANON KEY from .env
curl 'https://whhwvuugrzbyvobwfmce.supabase.co/auth/v1/signup' \
  -H 'apikey: YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "email": "test@example.com",
    "password": "TestPassword123!",
    "options": {
      "emailRedirectTo": "http://localhost:5173/verify-email"
    }
  }'
```

Expected response:
```json
{
  "user": { "id": "...", "email": "test@example.com" },
  "session": null
}
```

If `session` is `null`, email confirmation is required and email should be sent.

#### Test 2: Check Supabase Email Queue

1. Go to: https://supabase.com/dashboard/project/whhwvuugrzbyvobwfmce/logs/edge-logs
2. Filter by timestamp when you signed up
3. Look for `mailer` events
4. Check if email was queued but failed to send

#### Test 3: Try a Different Email Address

Some email providers (especially corporate/school emails) block automated emails:
- ✅ Try Gmail, Outlook, ProtonMail
- ❌ Avoid corporate domains, educational institutions

### Code Implementation Review

Our implementation is correct:

**Signup ([CoachSignup.tsx:167-183](pages/CoachSignup.tsx#L167-L183)):**
```typescript
const { data: authData, error: authError } = await supabase.auth.signUp({
  email: formData.email,
  password: formData.password,
  options: {
    emailRedirectTo: `${window.location.origin}/verify-email`,
    // ...
  },
});
```

**Resend ([ResendVerification.tsx:29-35](pages/ResendVerification.tsx#L29-L35)):**
```typescript
const { data, error } = await supabase.auth.resend({
  type: 'signup',
  email: email,
  options: {
    emailRedirectTo: `${window.location.origin}/verify-email`
  }
});
```

Both are using the correct Supabase API methods.

### Recommended Next Steps

1. **Check Supabase Dashboard** (Steps 1-4 above)
2. **Wait 1 hour** - You may have hit rate limits from testing
3. **Try a different email address** - Use a Gmail account
4. **Check spam folder thoroughly**
5. **Set up custom SMTP** - For reliable production delivery

### Still Not Working?

If emails still don't arrive after following all steps:

1. **Contact Supabase Support:**
   - Email: support@supabase.io
   - Dashboard: https://supabase.com/dashboard/support
   - Include your project ref: `whhwvuugrzbyvobwfmce`

2. **Temporary Workaround:**
   - Disable email confirmation temporarily:
     - Go to Auth settings
     - Uncheck "Enable email confirmations"
     - Users will be auto-confirmed (not recommended for production)

3. **Manual Email Verification:**
   - Get the confirmation token from Supabase logs
   - Manually construct the verification URL
   - Send to user via another channel

---

## Testing Checklist

- [ ] Fixed infinite redirect loop (CoachSignup.tsx)
- [ ] Checked Supabase email configuration
- [ ] Verified redirect URLs in Supabase
- [ ] Checked Supabase logs for email events
- [ ] Checked spam/promotions folders
- [ ] Waited 1 hour (rate limit reset)
- [ ] Tried different email address
- [ ] Whitelisted Supabase email addresses
- [ ] Considered custom SMTP setup

---

**Last Updated:** 2025-12-21
**Project:** CoachVerify
**Supabase Project:** whhwvuugrzbyvobwfmce
