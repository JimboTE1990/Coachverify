# Vercel Deployment Guide for CoachVerify

## Quick Start Deployment

### Step 1: Push to GitHub
```bash
# Authenticate with GitHub (choose one method):

# Option A: Using GitHub CLI
gh auth login

# Option B: Using SSH (if you have SSH keys set up)
git remote set-url origin git@github.com:JimboTE1990/Coachverify.git

# Then push
git push origin main
```

### Step 2: Import to Vercel
1. Go to https://vercel.com
2. Click **"Add New..."** → **"Project"**
3. Import **JimboTE1990/Coachverify** repository
4. Click **"Import"**

### Step 3: Configure Build Settings
Vercel should auto-detect Vite settings, but verify:

- **Framework Preset**: Vite
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

### Step 4: Add Environment Variables
Click **"Environment Variables"** and add:

```
VITE_SUPABASE_URL = https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY = your_supabase_anon_key_here
VITE_APP_URL = https://your-domain.vercel.app
```

**Optional (for Stripe integration):**
```
VITE_STRIPE_PUBLISHABLE_KEY = pk_test_your_key_here
VITE_STRIPE_MONTHLY_PRICE_ID = price_monthly_id
VITE_STRIPE_ANNUAL_PRICE_ID = price_annual_id
```

### Step 5: Deploy
1. Click **"Deploy"**
2. Wait 2-3 minutes for build to complete
3. Your app will be live at `https://your-project.vercel.app`

---

## Post-Deployment Checklist

### Update Supabase Configuration
1. Go to Supabase Dashboard → **Authentication** → **URL Configuration**
2. Add your Vercel domain to:
   - **Site URL**: `https://your-domain.vercel.app`
   - **Redirect URLs**: Add:
     - `https://your-domain.vercel.app/verify-email`
     - `https://your-domain.vercel.app/reset-password`
     - `https://your-domain.vercel.app/for-coaches`

### Update Environment Variables
1. In Vercel, update `VITE_APP_URL` to your actual domain:
   ```
   VITE_APP_URL = https://your-domain.vercel.app
   ```
2. Redeploy for changes to take effect

### Test Key Features
- ✅ Coach signup flow
- ✅ Email verification links work
- ✅ Login/logout
- ✅ Dashboard access
- ✅ Coach search
- ✅ Profile views

---

## Custom Domain Setup (Optional)

### Add Custom Domain
1. In Vercel project → **Settings** → **Domains**
2. Add your domain (e.g., `coachverify.com`)
3. Follow DNS configuration instructions
4. Vercel will automatically provision SSL certificate

### Update Supabase URLs
After adding custom domain, update Supabase redirect URLs to use your custom domain instead of `.vercel.app`.

---

## Continuous Deployment

Every time you push to `main` branch, Vercel will automatically:
1. Build your app
2. Run any checks
3. Deploy to production

### Preview Deployments
- Every pull request gets a unique preview URL
- Test changes before merging to main

---

## Monitoring & Debugging

### View Logs
1. Go to Vercel Dashboard → Your Project
2. Click **"Deployments"**
3. Click any deployment → **"View Function Logs"**

### Common Issues

**Issue: Build fails with "Module not found"**
Fix: Run `npm install` locally and commit `package-lock.json`

**Issue: Environment variables not working**
Fix: Make sure variables start with `VITE_` prefix for Vite apps

**Issue: 404 on page refresh**
Fix: Vercel should handle this automatically for Vite, but if not, add `vercel.json`:
```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

---

## Performance Optimization

### Enable Caching
Vercel automatically caches static assets. No additional configuration needed.

### Edge Functions (Optional)
For webhook handlers or API routes, use Vercel Edge Functions in `/api` folder.

---

## Security

### Protect Sensitive Routes
If you want to add password protection to admin routes:
1. Use Vercel's Password Protection (Settings → General)
2. Or implement middleware (requires Vercel Pro plan)

### HTTPS
Vercel automatically provisions SSL certificates. All traffic is HTTPS by default.

---

## Costs

- **Hobby Plan (Free)**:
  - Unlimited deployments
  - 100GB bandwidth/month
  - Perfect for development and low-traffic production

- **Pro Plan ($20/month)**:
  - Unlimited bandwidth
  - Team collaboration
  - Advanced analytics

---

## Summary

1. ✅ Push code to GitHub
2. ✅ Import to Vercel
3. ✅ Add environment variables
4. ✅ Deploy
5. ✅ Update Supabase redirect URLs
6. ✅ Test the app

Your app should now be live! 🚀
