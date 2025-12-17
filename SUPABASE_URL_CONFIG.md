# Supabase URL Configuration Guide

## Development Setup (Current)

### Site URL
```
http://localhost:3000
```

### Redirect URLs
Add these to your Supabase project:

```
http://localhost:3000/**
http://localhost:3000/verify-email
http://localhost:3000/reset-password
```

## How to Configure in Supabase

1. Go to your Supabase project: https://app.supabase.com/project/whhwvuugrzbyvobwfmce
2. Navigate to **Authentication → URL Configuration**
3. Set **Site URL** to `http://localhost:3000`
4. Add the redirect URLs listed above
5. Click **Save**

## Why These URLs?

- **Site URL**: The base URL where your app is hosted
- **`/**` wildcard**: Allows auth redirects to any path (flexible during development)
- **`/verify-email`**: Specific path for email verification after signup
- **`/reset-password`**: Specific path for password reset flow

## Production Setup (When You Deploy)

### Site URL (Production)
```
https://yourdomain.com
```

### Redirect URLs (Keep Both!)
```
# Development URLs - keep these so you can still develop locally
http://localhost:3000/**
http://localhost:3000/verify-email
http://localhost:3000/reset-password

# Production URLs - add these when deploying
https://yourdomain.com/**
https://yourdomain.com/verify-email
https://yourdomain.com/reset-password
```

## Important Notes

✅ **Do NOT remove localhost URLs when you deploy** - you want both environments to work

✅ **The Site URL should match your primary deployment** - change to production URL when live

✅ **Wildcards (`/**`) are useful during development** - they allow flexibility for testing

✅ **Specific paths are more secure** - consider removing wildcards in production and listing only exact paths

## Testing Your Configuration

After configuring:

1. **Test Signup**: http://localhost:3000/coach-signup
   - Complete the form
   - Check your email for verification link
   - Click the link - should redirect to `/verify-email`

2. **Test Password Reset**: http://localhost:3000/for-coaches
   - Click "Forgot password?"
   - Enter email
   - Check email for reset link
   - Click link - should redirect to `/reset-password`

3. **Test Login**: http://localhost:3000/for-coaches
   - Use verified credentials
   - Should successfully log in

## Troubleshooting

### "Invalid redirect URL" Error
- Check that the URL you're being redirected to is in your Redirect URLs list
- Make sure there are no typos or extra spaces
- Verify the protocol (http vs https) matches

### Email Links Not Working
- Check that SMTP is configured (see [SMTP_SETUP.md](SMTP_SETUP.md))
- Verify Site URL matches your current environment
- Check spam folder

### Can't Login After Email Verification
- Ensure email confirmation is enabled in Supabase Auth settings
- Check that the user's email_confirmed_at field is set in the database
- Try resending verification email

## Additional Security (Production)

When deploying to production, consider:

1. **Remove wildcards** - List only exact paths you need
2. **Use HTTPS only** - Remove all http:// URLs
3. **Add rate limiting** - Supabase has built-in rate limits for auth
4. **Enable email verification** - Require users to confirm email before access
5. **Set up custom domain** - Use your own domain for auth emails

## Environment-Specific Configurations

### Local Development
```
Site URL: http://localhost:3000
Redirects: http://localhost:3000/**
```

### Staging/Preview
```
Site URL: https://staging.yourdomain.com
Redirects: https://staging.yourdomain.com/**
```

### Production
```
Site URL: https://yourdomain.com
Redirects: https://yourdomain.com/** (remove wildcard, list specific paths)
```

---

For more information, see:
- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [SMTP_SETUP.md](SMTP_SETUP.md) - Email configuration guide
- [AUTH_IMPLEMENTATION.md](AUTH_IMPLEMENTATION.md) - Complete auth system docs
