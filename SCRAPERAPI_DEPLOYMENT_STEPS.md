# ScraperAPI Deployment - Quick Start Guide

## What Changed
- **OLD**: Multi-step navigation (homepage → directory → search) - Always got 403
- **NEW**: ScraperAPI as primary method - Bypasses anti-bot detection
- **Fallback**: Manual review if ScraperAPI not configured

## Prerequisites
1. ScraperAPI free account (1,000 credits)
2. Supabase access

## Deployment Steps (5 minutes)

### Step 1: Get ScraperAPI Key (2 min)
1. Go to: https://www.scraperapi.com/signup
2. Sign up (no credit card needed for free tier)
3. Dashboard will show your API key
4. Copy it (looks like: `abc123...`)

### Step 2: Add to Supabase (1 min)
1. Go to: https://supabase.com/dashboard/project/whhwvuugrzbyvobwfmce/settings/edge-functions
2. Scroll to: **Secrets**
3. Click: **Add new secret**
4. Enter:
   - Name: `SCRAPER_API_KEY`
   - Value: `[your API key]`
5. Click: **Save**

### Step 3: Deploy Edge Function (2 min)
1. Open: Supabase Dashboard → Edge Functions → `verify-emcc-accreditation`
2. **Delete all existing code**
3. Open file: `supabase/functions/verify-emcc-accreditation/SCRAPERAPI_VERSION.ts`
4. Select all (Cmd+A), Copy (Cmd+C)
5. Paste into Supabase editor
6. Click: **Deploy**
7. Wait for green checkmark

## Test It

### Quick Test:
1. Go to your signup page
2. Enter:
   - Name: `Paul Smith`
   - Body: `EMCC`
   - EIA: `EIA20217053`
3. Click "Verify Credentials"
4. **Expected**: ✓ Verified! (from cache)

### Check Logs:
1. Supabase → Edge Functions → `verify-emcc-accreditation` → **Logs**
2. Should see:
   ```
   [EMCC Verification] Checking internal cache for EIA: EIA20217053
   [EMCC Verification] Found in cache: Paul Smith
   [EMCC Verification] Cache hit - verified from internal database
   ```

### Test with New EIA (uses ScraperAPI):
1. Enter your real EMCC credentials
2. Should see in logs:
   ```
   [EMCC Verification] Not in cache, attempting live verification...
   [EMCC EIA Verification] Using ScraperAPI for: https://www...
   [EMCC EIA Verification] ScraperAPI response status: 200
   [EMCC Verification] Coach verified successfully (from live check) and added to cache
   ```

## How It Works Now

```
User enters credentials
  ↓
1. Check cache (instant if found)
  ↓
2. If not in cache:
   - Has SCRAPER_API_KEY? → Use ScraperAPI (works!)
   - No key? → Mark for manual review
  ↓
3. Parse result & verify name
  ↓
4. Add to cache for future
```

## What Gets Cached

After successful verification:
- EIA number
- Coach name
- Accreditation level
- Profile URL

Next coach with same EIA = instant verification (no API call needed)

## Cost Breakdown

### Free Tier: 1,000 credits
- Good for: ~100-200 verifications (testing phase)
- Cost: $0

### After Free Tier: Hobby Plan ($49/month)
- Credits: 100,000
- Good for: ~1,000+ verifications/month
- Cost per verification: ~$0.05

### With Caching:
- First verification of EIA12345: Uses 1 API credit
- Next 10 coaches with EIA12345: 0 credits (cached)
- **Effective cost**: Much lower as cache grows

## Monitoring

### ScraperAPI Dashboard:
- https://dashboard.scraperapi.com/
- Shows:
  - Credits used
  - Success rate (should be >95%)
  - Response times

### Supabase Logs:
- Check for: `[EMCC EIA Verification] ScraperAPI response status: 200`
- If seeing 403 or errors, check ScraperAPI dashboard

## Troubleshooting

**Issue**: Still getting 403
→ Check ScraperAPI key is correct in Supabase secrets
→ Check ScraperAPI dashboard shows active account
→ Try adding `&render=true` to ScraperAPI URL (slower but more reliable)

**Issue**: "ScraperAPI key not configured"
→ Verify secret name is exactly: `SCRAPER_API_KEY`
→ Redeploy edge function
→ Check Supabase logs for errors

**Issue**: Slow (>10 seconds)
→ Normal for first request
→ Subsequent requests faster
→ ScraperAPI routes through residential proxies (takes time)

## Migration Path

**Phase 1** (Now): Test with free tier
- 1,000 credits = plenty for testing
- Build up cache organically
- Monitor success rate

**Phase 2** (At launch): Upgrade to Hobby plan
- $49/month
- 100,000 credits
- Supports ~1,000 verifications

**Phase 3** (Growth): Scale up as needed
- More coaches = more cache hits = lower costs
- Only pay for new EIA verifications

## Success Metrics

After deployment, you should see:
- ✅ Cache hit rate increasing over time
- ✅ ScraperAPI success rate >95%
- ✅ No more 403 errors
- ✅ Coaches can complete onboarding
- ✅ Manual review queue stays small

## Next Steps

1. ✅ Sign up for ScraperAPI (free)
2. ✅ Add API key to Supabase
3. ✅ Deploy SCRAPERAPI_VERSION.ts
4. ✅ Test with Paul Smith EIA (cached)
5. ✅ Test with your real EIA (live verification)
6. 📊 Monitor for 1 week
7. 💰 Upgrade to paid plan when ready

## Summary

**Before**: Direct requests → 403 errors → Manual review required
**After**: ScraperAPI → Success! → Automatic caching → Profit! 🎉

The free tier gives you enough credits to test thoroughly and build initial cache before committing to a paid plan.
