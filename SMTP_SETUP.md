# SMTP Email Configuration for CoachDog

## Overview
CoachDog uses Brevo (formerly Sendinblue) as the SMTP provider for sending transactional emails through Supabase Auth.

## Email Features Implemented
✅ Email verification on signup
✅ Password reset emails
✅ Email change confirmation
✅ Re-send verification email functionality

## Supabase SMTP Configuration with Brevo

### Step 1: Get Brevo SMTP Credentials

1. Go to [Brevo](https://www.brevo.com) and login to your account
2. Navigate to **Settings → SMTP & API**
3. Copy your SMTP credentials:
   - **SMTP Server**: `smtp-relay.brevo.com`
   - **Port**: `587` (recommended) or `465` for SSL
   - **SMTP Login**: Your Brevo login email
   - **SMTP Key**: Generate a new SMTP key if needed

### Step 2: Configure Supabase Email Settings

1. Go to your Supabase project: https://app.supabase.com/project/whhwvuugrzbyvobwfmce
2. Navigate to **Authentication → Email Templates**
3. Click **Settings** tab
4. Under **SMTP Settings**, enable Custom SMTP
5. Enter your Brevo credentials:

```
SMTP Host: smtp-relay.brevo.com
SMTP Port: 587
SMTP User: <your-brevo-email>
SMTP Password: <your-brevo-smtp-key>
Sender Name: CoachDog
Sender Email: noreply@coachdog.com (or your verified domain)
```

6. **IMPORTANT**: Enable "Enable Custom SMTP" toggle
7. Click **Save**

### Step 3: Verify Domain (Optional but Recommended)

1. In Brevo, go to **Settings → Senders & IPs**
2. Add and verify your domain (e.g., coachdog.com)
3. Add the required DNS records (SPF, DKIM) to your domain
4. Once verified, update the sender email in Supabase to use your domain

### Step 4: Configure Email Templates

In Supabase, customize these email templates under **Authentication → Email Templates**:

#### 1. Confirm Signup Template
```html
<h2>Welcome to CoachDog!</h2>
<p>Thanks for signing up. Please confirm your email address by clicking the link below:</p>
<p><a href="{{ .ConfirmationURL }}">Verify Email Address</a></p>
<p>This link expires in 24 hours.</p>
<p>If you didn't create an account, you can safely ignore this email.</p>
```

#### 2. Reset Password Template
```html
<h2>Reset Your Password</h2>
<p>We received a request to reset your password for your CoachDog account.</p>
<p><a href="{{ .ConfirmationURL }}">Reset Password</a></p>
<p>This link expires in 10 minutes.</p>
<p>If you didn't request this, you can safely ignore this email.</p>
```

#### 3. Email Change Template
```html
<h2>Confirm Email Change</h2>
<p>Please confirm your new email address by clicking the link below:</p>
<p><a href="{{ .ConfirmationURL }}">Confirm New Email</a></p>
```

### Step 5: Configure URL Redirects

In Supabase **Authentication → URL Configuration**:

```
Site URL: http://localhost:3000 (development)
          https://coachdog.com (production)

Redirect URLs:
- http://localhost:3000/**
- https://coachdog.com/**
- http://localhost:3000/verify-email
- http://localhost:3000/reset-password
```

### Step 6: Enable Email Confirmation

In Supabase **Authentication → Providers → Email**:

1. Enable "Confirm email" toggle
2. Set "Email confirmation method" to "Link"
3. Save changes

## Testing the Email Flow

### Test Email Verification

1. Go to http://localhost:3000/coach-signup
2. Fill in the signup form with a real email address
3. Submit the form
4. Check your email inbox (and spam folder)
5. Click the verification link
6. You should be redirected to `/verify-email` showing success

### Test Password Reset

1. Go to http://localhost:3000/for-coaches
2. Click "Forgot password?"
3. Enter your email address
4. Check your email for the reset link
5. Click the link
6. Enter and confirm your new password
7. You should see a success message and be redirected to login

### Test Resend Verification

1. If verification email expires, go to `/verify-email?expired=true`
2. Enter your email address
3. Click "Resend Verification Email"
4. Check your inbox for a new verification link

## Troubleshooting

### Emails Not Sending

1. **Check Brevo Account Status**
   - Ensure your Brevo account is active
   - Check your sending quota (free plan has limits)

2. **Verify SMTP Credentials**
   - Double-check SMTP host, port, username, and password in Supabase
   - Ensure the SMTP key is active in Brevo

3. **Check Supabase Logs**
   - Go to Supabase **Logs → Auth Logs**
   - Look for email sending errors

4. **Sender Email Verification**
   - In Brevo, verify your sender email address
   - Use a verified domain for better deliverability

### Emails Going to Spam

1. **Verify Domain**
   - Add SPF and DKIM records to your domain
   - Verify your domain in Brevo

2. **Use Proper Sender Name**
   - Use "CoachDog" not "noreply@..."
   - Avoid spam trigger words in subject lines

3. **Warm Up IP**
   - Start with low sending volumes
   - Gradually increase as reputation builds

### Link Expiration Issues

- Email confirmation links expire after 24 hours
- Password reset links expire after 10 minutes (configurable)
- If expired, users can request a new link

## Email Monitoring

### View Email Statistics in Brevo

1. Go to Brevo Dashboard
2. Navigate to **Statistics → Email**
3. Monitor:
   - Delivery rate
   - Open rate
   - Bounce rate
   - Spam complaints

### View Auth Logs in Supabase

1. Go to Supabase **Logs → Auth Logs**
2. Filter by email events
3. Check for errors or failed attempts

## Production Checklist

Before going live:

- [ ] Verify custom domain in Brevo
- [ ] Add SPF and DKIM DNS records
- [ ] Update Site URL in Supabase to production domain
- [ ] Update redirect URLs to include production domain
- [ ] Test all email flows end-to-end
- [ ] Set up email monitoring alerts in Brevo
- [ ] Review and customize all email templates
- [ ] Test emails on different email clients (Gmail, Outlook, etc.)
- [ ] Check spam score using tools like Mail Tester

## Support

- **Brevo Support**: https://help.brevo.com
- **Supabase Auth Docs**: https://supabase.com/docs/guides/auth
- **CoachDog Support**: support@coachdog.com
