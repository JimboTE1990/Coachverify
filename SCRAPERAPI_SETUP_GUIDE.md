# ScraperAPI Setup Guide for EMCC Verification

## Overview
ScraperAPI will bypass EMCC's anti-bot 403 errors by routing requests through residential proxies with automatic rotation.

## Step 1: Sign Up for ScraperAPI Free Tier

1. **Go to**: https://www.scraperapi.com/
2. **Click**: "Start Free Trial" or "Sign Up"
3. **Free Tier Includes**:
   - 1,000 API credits (perfect for testing)
   - No credit card required
   - Ideal for ~100 verification tests

## Step 2: Get Your API Key

1. **After signup**, go to Dashboard: https://dashboard.scraperapi.com/
2. **Copy your API Key** (looks like: `abc123def456...`)
3. **Keep it secret!** Don't commit to git

## Step 3: Add API Key to Supabase Environment Variables

### Via Supabase Dashboard:
1. Go to: https://supabase.com/dashboard/project/whhwvuugrzbyvobwfmce
2. Click: **Settings** (left sidebar)
3. Click: **Edge Functions** (under Project Settings)
4. Scroll to: **Secrets**
5. Click: **Add new secret**
6. Enter:
   - **Name**: `SCRAPER_API_KEY`
   - **Value**: `[paste your ScraperAPI key here]`
7. Click: **Save**

### Via CLI (Alternative):
```bash
# Set the secret
supabase secrets set SCRAPER_API_KEY=your_scraperapi_key_here --project-ref whhwvuugrzbyvobwfmce

# Verify it's set
supabase secrets list --project-ref whhwvuugrzbyvobwfmce
```

## Step 4: Deploy Updated Edge Function

1. **Open Supabase Dashboard** → Edge Functions → `verify-emcc-accreditation`
2. **Copy code** from: `supabase/functions/verify-emcc-accreditation/UPDATED_CODE_FOR_SUPABASE.ts`
3. **Paste** into Supabase editor
4. **Click Deploy**

## Step 5: Test the Verification

### Test 1: Verify with ScraperAPI (Should Work!)
1. Go to your signup page
2. Enter:
   - **Name**: Your real name
   - **Body**: EMCC
   - **EIA Number**: Your real EIA number
3. Click **"Verify Credentials"**
4. **Expected**: ✓ Verification successful!

### Test 2: Check Logs
1. Go to: Supabase Dashboard → Edge Functions → `verify-emcc-accreditation` → **Logs**
2. Should see:
   ```
   [EMCC EIA Verification] Using ScraperAPI to bypass anti-bot detection
   [EMCC EIA Verification] ScraperAPI response status: 200
   [EMCC EIA Verification] Found match: { name: "Your Name", ... }
   [EMCC Verification] Coach verified successfully
   ```

### Test 3: Wrong Name (Should Reject)
1. Enter:
   - **Name**: Paul Jones
   - **EIA**: Paul Smith's EIA (EIA20217053)
2. **Expected**: Error about name mismatch

## How It Works

### Request Flow:
```
User enters credentials
  ↓
Check cache first (instant if found)
  ↓ (not in cache)
Check if SCRAPER_API_KEY exists
  ↓ YES → Use ScraperAPI proxy
  ↓ NO  → Direct request (will likely 403)
  ↓
Parse EMCC response
  ↓
Verify name match
  ↓
Return result + cache it
```

### ScraperAPI URL Format:
```
http://api.scraperapi.com
  ?api_key=YOUR_KEY
  &url=https://www.emccglobal.org/directory?search=EIA12345
  &render=false
  &country_code=gb
```

**Parameters explained**:
- `api_key`: Your ScraperAPI key
- `url`: Target URL (EMCC directory search)
- `render=false`: Don't use browser rendering (faster, cheaper)
- `country_code=gb`: Use UK residential IPs (closer to EMCC servers)

## Monitoring Usage

### Check ScraperAPI Dashboard:
1. Go to: https://dashboard.scraperapi.com/
2. See:
   - **API Credits Used**: How many requests made
   - **Success Rate**: Should be >95%
   - **Response Times**: Usually 2-5 seconds

### Free Tier Limits:
- **1,000 credits**: ~100-200 verifications
- **After free tier**: Upgrade or fall back to manual review

## Pricing Plans (When You're Ready to Upgrade)

### Hobby Plan: $49/month
- **Requests**: 100,000 API credits
- **Good for**: ~1,000 verifications/month
- **Cost per verification**: $0.049

### Startup Plan: $149/month
- **Requests**: 500,000 API credits
- **Good for**: ~5,000 verifications/month
- **Cost per verification**: $0.030

### Professional Plan: $299/month
- **Requests**: 2,000,000 API credits
- **Good for**: ~20,000 verifications/month
- **Cost per verification**: $0.015

## Fallback Behavior

The edge function has smart fallback logic:

1. **Cache hit** → Instant verification (FREE)
2. **Cache miss + ScraperAPI key** → Use ScraperAPI (PAID)
3. **Cache miss + No key** → Direct request (will likely 403)
4. **403 error** → Mark for manual review (FREE but requires time)

## Cost Optimization Tips

### 1. Build Cache First
- Manually verify your first 20-50 coaches
- Add their EIAs to `verified_credentials` table
- Future verifications with same EIAs are instant + free

### 2. Batch Verifications
- If multiple new coaches sign up, verify in batch
- Use ScraperAPI for new EIAs only
- Saves credits

### 3. Monitor Success Rate
- If ScraperAPI success rate drops below 90%, contact their support
- They may need to rotate proxy pool

### 4. Use Country Targeting
- We're using `country_code=gb` (UK proxies)
- This is closer to EMCC servers in Europe
- Faster response times + better success rate

## Testing Without ScraperAPI Key

If you don't set `SCRAPER_API_KEY`, the function will:
1. Check cache (works normally)
2. Attempt direct request (will get 403)
3. Mark as "pending manual review"
4. Allow user to complete signup

This lets you deploy and test the flow without ScraperAPI first.

## Troubleshooting

### Issue: Still getting 403 with ScraperAPI
**Solution**: Check ScraperAPI dashboard for:
- Account is active
- Credits remaining
- No service outages
- Try adding `&render=true` (uses headless browser, slower but more reliable)

### Issue: ScraperAPI returns "Invalid API Key"
**Solution**:
- Verify key is correct in Supabase secrets
- Redeploy edge function
- Check ScraperAPI dashboard is accessible

### Issue: Slow response times (>10 seconds)
**Solution**:
- Normal for first request (establishing proxy connection)
- Consider enabling `render=true` for JavaScript-heavy sites
- Contact ScraperAPI support if consistently slow

### Issue: Running out of free credits fast
**Solution**:
- Check logs for unnecessary duplicate requests
- Ensure cache is working (most verifications should hit cache)
- Consider upgrading to paid plan

## Advanced: Rendering JavaScript (If Needed)

If EMCC directory requires JavaScript to display results:

```typescript
// Change in UPDATED_CODE_FOR_SUPABASE.ts
const scraperUrl = `http://api.scraperapi.com?api_key=${scraperApiKey}&url=${encodeURIComponent(targetUrl)}&render=true&country_code=gb`;
```

**Note**:
- `render=true` uses more credits (5-10x)
- Only use if normal requests fail to return data

## Next Steps After Testing

1. ✅ Sign up for ScraperAPI free tier
2. ✅ Add API key to Supabase
3. ✅ Deploy updated edge function
4. ✅ Test verification with your EIA
5. ✅ Monitor ScraperAPI dashboard for success rate
6. 📊 After 100+ verifications, review cache hit rate
7. 💰 Decide on paid plan based on usage

## Support

- **ScraperAPI Docs**: https://www.scraperapi.com/documentation/
- **ScraperAPI Support**: support@scraperapi.com
- **Status Page**: https://status.scraperapi.com/

## Summary

**Without ScraperAPI**: EMCC blocks with 403 → Manual review needed
**With ScraperAPI**: Bypasses 403 → Automatic verification → Happy coaches! 🎉

The free tier gives you 1,000 credits to test thoroughly before committing to a paid plan.
