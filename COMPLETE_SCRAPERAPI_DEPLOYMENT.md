# Complete ScraperAPI Deployment Guide
## EMCC + ICF Verification with ScraperAPI

This guide will help you deploy both EMCC and ICF verification using your ScraperAPI account.

---

## Prerequisites

- ✅ ScraperAPI account created (free tier with 1,000 credits)
- ✅ API key from ScraperAPI dashboard
- ✅ Access to Supabase dashboard

---

## Step 1: Add ScraperAPI Key to Supabase

1. **Go to Supabase Secrets**:
   - https://supabase.com/dashboard/project/whhwvuugrzbyvobwfmce/settings/edge-functions

2. **Scroll to "Secrets" section**

3. **Click "Add new secret"**

4. **Enter**:
   - Name: `SCRAPER_API_KEY`
   - Value: `[your ScraperAPI key]`

5. **Click "Save"**

---

## Step 2: Run SQL Migration

**File**: [20260122_create_verified_credentials_cache.sql](supabase/migrations/20260122_create_verified_credentials_cache.sql)

1. **Go to Supabase SQL Editor**:
   - https://supabase.com/dashboard/project/whhwvuugrzbyvobwfmce/sql

2. **Click "New query"**

3. **Open the migration file** (link above) and copy ALL the SQL

4. **Paste into SQL Editor**

5. **Click "Run"**

6. **Verify success**: Should see "Success. No rows returned"

---

## Step 3: Deploy EMCC Verification Function

**File**: [SCRAPERAPI_VERSION.ts (EMCC)](supabase/functions/verify-emcc-accreditation/SCRAPERAPI_VERSION.ts)

1. **Go to Supabase Edge Functions**:
   - https://supabase.com/dashboard/project/whhwvuugrzbyvobwfmce/functions

2. **Click on**: `verify-emcc-accreditation`

3. **Delete ALL existing code** (Cmd+A, Delete)

4. **Open the file** (link above) and copy ALL the code (Cmd+A, Cmd+C)

5. **Paste into Supabase editor** (Cmd+V)

6. **Click "Deploy"**

7. **Wait for green checkmark**

---

## Step 4: Deploy ICF Verification Function

**File**: [SCRAPERAPI_VERSION.ts (ICF)](supabase/functions/verify-icf-accreditation/SCRAPERAPI_VERSION.ts)

1. **Still in Supabase Edge Functions**:
   - https://supabase.com/dashboard/project/whhwvuugrzbyvobwfmce/functions

2. **Click on**: `verify-icf-accreditation`

3. **Delete ALL existing code** (Cmd+A, Delete)

4. **Open the file** (link above) and copy ALL the code (Cmd+A, Cmd+C)

5. **Paste into Supabase editor** (Cmd+V)

6. **Click "Deploy"**

7. **Wait for green checkmark**

---

## Step 5: Test EMCC Verification

### Test 1: Cache Hit (Instant)
1. **Go to your signup page**

2. **Fill in**:
   - First Name: `Paul`
   - Last Name: `Smith`
   - Body: `EMCC`
   - EIA Number: `EIA20217053`

3. **Click "Verify Credentials"**

4. **Expected**: ✓ Instant verification (from cache)

### Test 2: Check Logs
1. **Go to**: [EMCC Function Logs](https://supabase.com/dashboard/project/whhwvuugrzbyvobwfmce/functions/verify-emcc-accreditation/logs)

2. **Should see**:
   ```
   [EMCC Verification] Checking internal cache for EIA: EIA20217053
   [EMCC Verification] Found in cache: Paul Smith
   [EMCC Verification] Cache hit - verified from internal database
   ```

### Test 3: Live Verification (Your Real EIA)
1. **Go to signup page**

2. **Enter YOUR real EMCC credentials**

3. **Click "Verify Credentials"**

4. **Wait ~5-10 seconds** (ScraperAPI is slower than direct)

5. **Check logs** - should see:
   ```
   [EMCC Verification] Not in cache, attempting live verification...
   [EMCC EIA Verification] Using ScraperAPI for: https://www...
   [EMCC EIA Verification] ScraperAPI response status: 200
   [EMCC Verification] Coach verified successfully (from live check) and added to cache
   ```

---

## Step 6: Test ICF Verification

### Test 1: Live Verification
1. **Go to signup page**

2. **Fill in**:
   - First Name: `[ICF Coach First Name]`
   - Last Name: `[ICF Coach Last Name]`
   - Body: `ICF`
   - Credential: `ACC` (or `PCC`, `MCC`)

3. **Click "Verify Credentials"**

4. **Wait ~5-10 seconds**

5. **Expected**: ✓ Verified!

### Test 2: Check Logs
1. **Go to**: [ICF Function Logs](https://supabase.com/dashboard/project/whhwvuugrzbyvobwfmce/functions/verify-icf-accreditation/logs)

2. **Should see**:
   ```
   [ICF Verification] Not in cache, attempting live verification...
   [ICF Directory Search] Using ScraperAPI for: https://apps.coachingfederation...
   [ICF Directory Search] ScraperAPI response status: 200
   [ICF Directory Search] Best match: { found: "Name", similarity: 0.95 }
   [ICF Verification] Coach verified successfully (from live check) and added to cache
   ```

---

## Step 7: Monitor ScraperAPI Usage

1. **Go to ScraperAPI Dashboard**:
   - https://dashboard.scraperapi.com/

2. **Check**:
   - **Requests Made**: Should show 1-5 requests
   - **Success Rate**: Should be >90%
   - **Credits Used**: Small number

---

## How It Works

### Request Flow (Both EMCC & ICF):
```
User enters credentials
  ↓
1. Check cache (instant if found)
  ↓
2. If not in cache:
   - Has SCRAPER_API_KEY? → Use ScraperAPI
   - No key? → Mark for manual review
  ↓
3. Parse result & verify name
  ↓
4. Add to cache for future
```

### Caching Strategy:
- **EMCC**: Cache by EIA number
- **ICF**: Cache by name + credential level
- **Result**: Second verification with same credentials = instant (0 credits)

---

## Troubleshooting

### Issue: "ScraperAPI key not configured"
**Solution**:
- Verify secret name is exactly: `SCRAPER_API_KEY`
- Check it's saved in Supabase secrets
- Redeploy both edge functions

### Issue: Still getting 403
**Solution**:
- Check ScraperAPI dashboard is accessible
- Verify API key is valid
- Check credits remaining (free tier = 1,000)

### Issue: Verification slow (>10 seconds)
**Solution**:
- Normal for ScraperAPI (uses residential proxies)
- First request is always slowest
- Subsequent requests faster

### Issue: "No record found"
**Solution**:
- Verify credentials are correct
- For EMCC: Check EIA number format (EIA12345)
- For ICF: Check name spelling exactly matches directory
- Test manually on official directories:
  - EMCC: https://www.emccglobal.org/directory
  - ICF: https://apps.coachingfederation.org/eweb/DynamicPage.aspx?WebCode=ICFDirectory&Site=ICFAppsR

---

## Cost Management

### Free Tier: 1,000 credits
- **Testing**: ~100-200 verifications
- **Cost**: $0

### Hobby Plan: $49/month
- **Credits**: 100,000
- **Verifications**: ~1,000+/month
- **With caching**: Effective cost much lower

### Cache Growth:
- Week 1: 10 verifications, 0% cache hit
- Week 2: 20 verifications, 20% cache hit
- Month 1: 100 verifications, 40% cache hit
- Month 3: 300 verifications, 60% cache hit

---

## Success Checklist

- ✅ ScraperAPI key added to Supabase
- ✅ SQL migration ran successfully
- ✅ EMCC edge function deployed
- ✅ ICF edge function deployed
- ✅ Paul Smith test works (EMCC cache hit)
- ✅ Your real EIA works (EMCC live)
- ✅ ICF test works (ICF live)
- ✅ ScraperAPI dashboard shows requests
- ✅ No 403 errors in logs
- ✅ Cache is building up

---

## File Reference

All files with clickable links:

**SQL Migration**:
- [20260122_create_verified_credentials_cache.sql](supabase/migrations/20260122_create_verified_credentials_cache.sql)

**EMCC Function**:
- [SCRAPERAPI_VERSION.ts](supabase/functions/verify-emcc-accreditation/SCRAPERAPI_VERSION.ts)

**ICF Function**:
- [SCRAPERAPI_VERSION.ts](supabase/functions/verify-icf-accreditation/SCRAPERAPI_VERSION.ts)

**Deployment Guides**:
- [SCRAPERAPI_DEPLOYMENT_STEPS.md](SCRAPERAPI_DEPLOYMENT_STEPS.md)
- [SCRAPERAPI_SETUP_GUIDE.md](SCRAPERAPI_SETUP_GUIDE.md)

**Implementation Summary**:
- [PLAN_B_IMPLEMENTATION_SUMMARY.md](PLAN_B_IMPLEMENTATION_SUMMARY.md)

---

## Next Steps

1. ✅ Complete all steps above
2. 📊 Monitor for 1 week
3. 💰 Upgrade to paid plan when ready
4. 🎉 Enjoy automated verification!

---

## Support

- **ScraperAPI**: support@scraperapi.com
- **ScraperAPI Docs**: https://www.scraperapi.com/documentation/
- **Status**: https://status.scraperapi.com/
