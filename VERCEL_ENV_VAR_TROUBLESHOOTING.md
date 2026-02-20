# Vercel Environment Variable Troubleshooting Guide

## Problem: `VITE_STRIPE_LIFETIME_PRICE_ID` showing as empty string in production

## Root Cause
Vite environment variables (prefixed with `VITE_`) are **embedded into the JavaScript bundle at build time**, not loaded at runtime. This means:

- If the env var wasn't set when Vercel built your app, it will be an empty string forever in that deployment
- Setting the env var AFTER the build doesn't help - you must redeploy with a fresh build
- Build cache can cause old builds without the env var to persist

## Solution Steps

### Step 1: Verify Environment Variable in Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project: **Coachverify**
3. Click **Settings** → **Environment Variables**
4. Find `VITE_STRIPE_LIFETIME_PRICE_ID` in the list

### Step 2: Check Environment Scope ⚠️ CRITICAL

Click on the environment variable to edit it. You should see:

```
Name: VITE_STRIPE_LIFETIME_PRICE_ID
Value: price_1T2AhWDbNBAbZyHwbetn9Vsk

Environments:
  ✅ Production    ← MUST be checked
  ✅ Preview       ← MUST be checked
  ✅ Development   ← MUST be checked
```

**If "Production" is not checked, that's your problem!**

Click all three checkboxes and click **Save**.

### Step 3: Force Clean Redeploy

Setting or updating an environment variable does NOT automatically redeploy. You must manually trigger a deployment:

1. Go to **Deployments** tab
2. Find the most recent deployment in the list
3. Click the **"..." menu** (three dots) on the right
4. Select **"Redeploy"**
5. In the modal that appears:
   - **UNCHECK** the box that says "Use existing Build Cache"
   - This forces a completely fresh build with the new environment variables
6. Click **"Redeploy"**
7. Wait 2-3 minutes for the build to complete

### Step 4: Verify Production URL

After deployment completes:

1. Make sure you're visiting the **Production** URL, not a Preview URL
   - Production: `https://coachdog.vercel.app` or your custom domain
   - Preview (wrong): `https://coachdog-abc123xyz.vercel.app`

2. Open browser **Developer Console** (F12 or Cmd+Option+I)

3. Look for logs from `[Stripe Config]`:
   ```
   [Stripe Config] Environment variables loaded at build time:
     - VITE_STRIPE_MONTHLY_PRICE_ID: ✓ Set
     - VITE_STRIPE_ANNUAL_PRICE_ID: ✓ Set
     - VITE_STRIPE_LIFETIME_PRICE_ID: ✓ Set  ← Should say "✓ Set"
     Raw lifetime value: price_1T2AhWDbNBAbZyHwbetn9Vsk
   ```

4. If it still shows "✗ Missing", the build didn't pick up the env var

### Step 5: Hard Refresh Browser

Even after a successful deployment, your browser might cache the old JavaScript:

- **Chrome/Edge**: Press `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows)
- **Firefox**: Press `Cmd+Shift+R` (Mac) or `Ctrl+F5` (Windows)
- **Safari**: Press `Cmd+Option+R`

Or open an **Incognito/Private window** to bypass all cache.

## Common Mistakes

### ❌ Mistake 1: Setting env var without redeploying
**Wrong**: Add env var → visit site → expect it to work
**Right**: Add env var → redeploy with clean build → visit site

### ❌ Mistake 2: Using build cache
**Wrong**: Redeploy with "Use existing Build Cache" checked
**Right**: Redeploy with "Use existing Build Cache" **UNCHECKED**

### ❌ Mistake 3: Checking Preview deployment instead of Production
**Wrong**: Test on `your-app-git-main-username.vercel.app`
**Right**: Test on `your-app.vercel.app` (production domain)

### ❌ Mistake 4: Not selecting "Production" environment
**Wrong**: Only check "Preview" and "Development" when setting env var
**Right**: Check **all three**: Production, Preview, Development

### ❌ Mistake 5: Typo in environment variable name
**Wrong**: `VITE_STRIPE_LIFETIME_PRICE` (missing `_ID`)
**Right**: `VITE_STRIPE_LIFETIME_PRICE_ID` (exact match, case-sensitive)

## Verification Commands

### Local Development (should work)
```bash
# In project directory
cat .env | grep LIFETIME

# Should output:
# VITE_STRIPE_LIFETIME_PRICE_ID=price_1T2AhWDbNBAbZyHwbetn9Vsk
```

### Production Build Test (simulate Vercel)
```bash
# Build locally to test if env vars are embedded
npm run build

# Serve the build
npm run preview

# Visit http://localhost:4173 and check console logs
```

If the local build works but Vercel doesn't, it's definitely a Vercel env var configuration issue.

## Environment Variable Naming Rules for Vite

- Must start with `VITE_` to be exposed to browser
- Case-sensitive: `VITE_STRIPE_LIFETIME_PRICE_ID` ≠ `vite_stripe_lifetime_price_id`
- Loaded at **build time**, not runtime
- Embedded into compiled JavaScript bundle
- Cannot be changed without rebuilding

## Current Configuration

Based on your `.env` file:

```bash
# TEST MODE (for development and testing with Stripe test mode)
VITE_STRIPE_LIFETIME_PRICE_ID=price_1T2AhWDbNBAbZyHwbetn9Vsk
```

This should be set **identically** in Vercel for the TEST environment. When you're ready to go live:

```bash
# PRODUCTION MODE (for real payments)
VITE_STRIPE_LIFETIME_PRICE_ID=price_1T2x4mDbNBAbZyHwwaz9TVXw
```

## Still Not Working?

If you've followed all steps above and it's still not working:

1. **Screenshot the Vercel Environment Variables page** showing:
   - The variable name
   - That "Production" is checked
   - (You can blur the value for security)

2. **Screenshot the Vercel Deployment page** showing:
   - The deployment is marked as "Production"
   - The deployment time (to confirm it's recent)

3. **Screenshot the browser console** showing:
   - The `[Stripe Config]` logs
   - The error message

4. **Check the deployment URL** - copy/paste it to confirm it's the production URL

5. **Check Vercel build logs**:
   - Go to Deployments → Click on latest deployment → "Building" section
   - Look for any warnings about environment variables
   - Share screenshot if you see anything about VITE_ variables

## Emergency Workaround (Not Recommended)

If you need to get this working immediately for testing and Vercel env vars won't cooperate:

**Option A: Hardcode temporarily (ONLY FOR TESTING)**
```typescript
// lib/stripe.ts - TEMPORARY ONLY
export const STRIPE_PRICES = {
  monthly: import.meta.env.VITE_STRIPE_MONTHLY_PRICE_ID || '',
  annual: import.meta.env.VITE_STRIPE_ANNUAL_PRICE_ID || '',
  lifetime: import.meta.env.VITE_STRIPE_LIFETIME_PRICE_ID || 'price_1T2AhWDbNBAbZyHwbetn9Vsk' // ← Fallback
};
```

Then:
1. Commit and push
2. Vercel auto-deploys
3. Test your lifetime checkout
4. **REMOVE the hardcoded value afterwards** and fix the env var properly

This is NOT secure for production but works for immediate testing.

---

**Last Updated**: 2026-02-20
**Test Price ID**: `price_1T2AhWDbNBAbZyHwbetn9Vsk`
**Production Price ID**: TBD (create in Stripe LIVE mode when ready)
