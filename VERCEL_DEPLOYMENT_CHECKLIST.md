# Vercel Deployment Checklist for Email Verification

## ✅ Completed

1. **vercel.json created** - Enables client-side routing on Vercel
   - All routes now rewrite to `/index.html`
   - Fixes 404 errors when accessing routes directly

## 🔧 Required: Supabase Configuration

### Step 1: Add Vercel URL to Supabase Redirect URLs

1. Go to: [Supabase Dashboard - URL Configuration](https://supabase.com/dashboard/project/whhwvuugrzbyvobwfmce/auth/url-configuration)

2. Find **"Redirect URLs"** section

3. Add these URLs (replace with your actual Vercel URL):
   ```
   https://your-vercel-app.vercel.app/**
   https://your-vercel-app.vercel.app/verify-email
   https://your-vercel-app.vercel.app/for-coaches
   ```

4. **Important:** Also add your custom domain if you have one:
   ```
   https://your-custom-domain.com/**
   https://your-custom-domain.com/verify-email
   https://your-custom-domain.com/for-coaches
   ```

### Step 2: Update Site URL

In the same Supabase URL Configuration page:

1. Set **"Site URL"** to your production URL:
   ```
   https://your-vercel-app.vercel.app
   ```
   OR
   ```
   https://your-custom-domain.com
   ```

2. **Save changes**

---

## 🧪 Testing on Vercel

### After Deploying to Vercel:

1. **Get your Vercel deployment URL**:
   - Example: `https://coachverify.vercel.app`
   - OR: `https://coachverify-git-main-yourname.vercel.app`

2. **Add to Supabase** (see Step 1 above)

3. **Test the full flow**:
   - Sign up with new email on Vercel URL
   - Check email arrives (via Brevo SMTP)
   - Click verification link
   - Should redirect to Vercel app at `/verify-email` (NO 404)
   - Should show "Verification Successful!"
   - Should redirect to `/for-coaches` dashboard

---

## 🚨 Troubleshooting Vercel 404 Errors

### Issue: Clicking verification link gives 404 on Vercel

**Cause 1: Missing vercel.json**
- ✅ **Fixed** - vercel.json now exists

**Cause 2: Vercel URL not whitelisted in Supabase**
- ❌ **Action Required** - Add your Vercel URL to Supabase Redirect URLs (see above)

**Cause 3: Wrong Vercel URL**
- Check the verification email link
- Ensure `redirect_to` parameter matches your Vercel URL

### How to Check Verification Email Link:

1. Sign up on Vercel
2. Receive verification email
3. **Don't click the link yet**
4. Right-click the verification button → Copy link address
5. Paste into text editor
6. Look for `redirect_to=` parameter
7. Verify it matches your Vercel URL

**Example correct link:**
```
https://whhwvuugrzbyvobwfmce.supabase.co/auth/v1/verify?
  token=abcd1234...
  &type=signup
  &redirect_to=https://your-vercel-app.vercel.app/verify-email
```

If `redirect_to` is wrong or missing, the Supabase redirect URL configuration is incorrect.

---

## 📋 Deployment Steps

### 1. Push to GitHub
```bash
git push origin main
```

### 2. Deploy to Vercel
- Vercel will auto-deploy from GitHub (if connected)
- OR manually trigger deploy in Vercel dashboard

### 3. Get Deployment URL
- Check Vercel dashboard for deployment URL
- Example: `https://coachverify-abc123.vercel.app`

### 4. Update Supabase
- Add deployment URL to Redirect URLs (see above)
- Update Site URL (see above)

### 5. Test
- Sign up with fresh email
- Verify email works end-to-end
- No 404 errors

---

## ✅ Expected Working Flow (Vercel)

1. User signs up at `https://your-app.vercel.app/coach-signup`
2. Supabase sends verification email via Brevo SMTP
3. Email contains link: `https://supabase.co/.../verify?redirect_to=https://your-app.vercel.app/verify-email`
4. User clicks link
5. Supabase verifies email → Redirects to `https://your-app.vercel.app/verify-email`
6. **vercel.json rewrites request to /index.html** (no 404!)
7. React Router loads VerifyEmail component
8. Shows "Verification Successful!"
9. After 2 seconds → Redirects to `/for-coaches`
10. Dashboard loads successfully

---

## 🔗 Important Links

- **Supabase URL Configuration**: https://supabase.com/dashboard/project/whhwvuugrzbyvobwfmce/auth/url-configuration
- **Supabase Auth Settings**: https://supabase.com/dashboard/project/whhwvuugrzbyvobwfmce/settings/auth
- **Vercel Dashboard**: https://vercel.com/dashboard
- **Brevo Dashboard**: https://app.brevo.com/

---

**Last Updated**: 2025-12-21
**Status**: vercel.json created ✅ | Supabase redirect URLs need configuration ⚠️
