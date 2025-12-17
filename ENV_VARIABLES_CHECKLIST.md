# Environment Variables Setup Checklist

## Local Development (.env file)

✅ File created at: `/Coachverify/.env`

Now replace the placeholder values with your actual keys:

1. **VITE_SUPABASE_URL** - Get from Supabase Dashboard → Settings → API
2. **VITE_SUPABASE_ANON_KEY** - Get from Supabase Dashboard → Settings → API
3. **VITE_STRIPE_PUBLISHABLE_KEY** - Get from Stripe Dashboard → Developers → API Keys (starts with `pk_test_`)
4. **VITE_STRIPE_MONTHLY_PRICE_ID** - Get from Stripe Dashboard → Products → Monthly Product → Price ID (starts with `price_`)
5. **VITE_STRIPE_ANNUAL_PRICE_ID** - Get from Stripe Dashboard → Products → Annual Product → Price ID (starts with `price_`)
6. **VITE_APP_URL** - Keep as `http://localhost:5173` for local dev

---

## Vercel Environment Variables

Go to your Vercel project → Settings → Environment Variables

Add these **6 variables** (for Production, Preview, and Development):

### 1. VITE_SUPABASE_URL
```
Value: https://your-project.supabase.co
Environments: ✅ Production ✅ Preview ✅ Development
```

### 2. VITE_SUPABASE_ANON_KEY
```
Value: your_supabase_anon_key_here
Environments: ✅ Production ✅ Preview ✅ Development
```

### 3. VITE_STRIPE_PUBLISHABLE_KEY
```
Value: pk_test_YOUR_PUBLISHABLE_KEY
Environments: ✅ Production ✅ Preview ✅ Development
```

### 4. VITE_STRIPE_MONTHLY_PRICE_ID
```
Value: price_YOUR_MONTHLY_PRICE_ID
Environments: ✅ Production ✅ Preview ✅ Development
```

### 5. VITE_STRIPE_ANNUAL_PRICE_ID
```
Value: price_YOUR_ANNUAL_PRICE_ID
Environments: ✅ Production ✅ Preview ✅ Development
```

### 6. VITE_APP_URL
```
Value: https://your-domain.vercel.app
Environments: ✅ Production ✅ Preview ✅ Development
```

---

## Copy-Paste Format for Vercel

Here's the format you can copy-paste into Vercel (one at a time):

**Variable Name:** `VITE_SUPABASE_URL`
**Value:** `https://your-project.supabase.co`

**Variable Name:** `VITE_SUPABASE_ANON_KEY`
**Value:** `your_supabase_anon_key`

**Variable Name:** `VITE_STRIPE_PUBLISHABLE_KEY`
**Value:** `pk_test_your_key`

**Variable Name:** `VITE_STRIPE_MONTHLY_PRICE_ID`
**Value:** `price_monthly_id`

**Variable Name:** `VITE_STRIPE_ANNUAL_PRICE_ID`
**Value:** `price_annual_id`

**Variable Name:** `VITE_APP_URL`
**Value:** `https://your-domain.vercel.app`

---

## After Adding Variables

1. **Redeploy** your Vercel project for changes to take effect
2. **Test locally** by running `npm run dev`
3. **Verify** Stripe integration works with test cards

---

## Quick Test Commands

```bash
# Test that .env is loaded
npm run dev

# Check if Stripe is configured (open browser console)
# You should see: [Stripe] Configuration loaded
```

---

## Security Notes

- ✅ `.env` is in `.gitignore` - won't be committed
- ✅ Never share your secret keys (sk_test_...)
- ✅ Publishable keys (pk_test_...) are safe for frontend
- ✅ Use test keys until ready for production

---

## Troubleshooting

**Issue:** Variables not working after adding to Vercel
**Fix:** Redeploy your project (Settings → Deployments → Redeploy)

**Issue:** "Stripe is not configured" warning in console
**Fix:** Check all 3 Stripe variables are set correctly

**Issue:** Payment form not loading
**Fix:** Verify VITE_STRIPE_PUBLISHABLE_KEY starts with `pk_test_`
