# URL Verification Deployment Checklist

## ✅ Pre-Deployment (Completed)

- [x] Created new Edge Function: `verify-emcc-url`
- [x] Updated frontend UI to collect URLs
- [x] Updated guidance with clear instructions
- [x] Added validation for URL format
- [x] Updated service call to use new function
- [x] Created deployment documentation

## 📋 Deployment Steps

### Step 1: Deploy New Edge Function (5 min)

1. Go to: https://supabase.com/dashboard/project/whhwvuugrzbyvobwfmce/functions
2. Click **"Create a new Function"**
3. Function name: `verify-emcc-url`
4. Copy code from: `supabase/functions/verify-emcc-url/index.ts`
5. Paste into editor
6. Click **"Deploy"**
7. ✅ Wait for green checkmark

### Step 2: Deploy Frontend (1 min)

```bash
# Commit changes
git add pages/CoachSignup.tsx services/supabaseService.ts
git commit -m "feat: switch to URL-based EMCC verification"
git push origin main
```

Vercel will auto-deploy (if connected to GitHub).

### Step 3: Test End-to-End (5 min) ✅ COMPLETED

**Test Case 1: Valid URL** ✅ PASSED
1. Go to signup page
2. Select "EMCC"
3. Enter name: `Paula Jones`
4. Paste URL: `https://www.emccglobal.org/accreditation/eia/eia-awards/?reference=EIA20230480&search=1`
5. Click "Verify Now"
6. ✅ Verified successfully

**Test Case 2: Invalid URL (Random Characters)** ✅ PASSED
1. Enter random characters
2. ✅ Showed error correctly

**Test Case 3: Invalid URL (Name Search)** ✅ PASSED
1. Paste URL: `https://www.emccglobal.org/accreditation/eia/eia-awards/?first_name=paul&last_name=jones&search=1`
2. ✅ Showed error: "URL must contain your EIA reference number..."

**Test Case 4: Name Mismatch** ✅ PASSED
1. Enter incorrect name with valid EIA URL
2. ✅ Showed error correctly

**All tests passed! System is production-ready.**

### Step 4: Monitor (First Week)

**Check Logs Daily**
- Supabase Dashboard → Functions → verify-emcc-url → Logs
- Look for errors or unexpected patterns

**Monitor Metrics**
- Verification success rate (target: >90%)
- Average response time (target: <5s)
- Error frequency

### Step 5: Archive Old Function (After 2-4 weeks)

**Once confident new system is stable:**

1. Go to Supabase Dashboard → Functions
2. Find: `verify-emcc-accreditation`
3. **Option A**: Rename to `verify-emcc-accreditation-ARCHIVED`
4. **Option B**: Delete (code is backed up in Git)

## 🔍 Verification

### How to Verify Deployment Worked

**1. Check Edge Function Exists**
- Supabase → Functions → See `verify-emcc-url` listed

**2. Check Frontend Updated**
- Visit signup page
- Select EMCC
- Label should say: "EMCC Profile URL"
- Placeholder: "Paste your EMCC profile URL here"

**3. Check Service Call Updated**
- File: `services/supabaseService.ts`
- Line 306: Should call `verify-emcc-url` (not `verify-emcc-accreditation`)

**4. Test Verification**
- Use Paula Jones URL
- Should complete in <5 seconds
- Check Supabase logs for success

## 🚨 Rollback Plan

**If issues arise:**

### Rollback Frontend
```bash
git revert HEAD
git push origin main
```

### Rollback Service Call
Edit `services/supabaseService.ts`:
```typescript
// Change back to:
await supabase.functions.invoke('verify-emcc-accreditation', {
  body: {
    coachId,
    fullName,
    accreditationLevel,
    country,
    eiaNumber: regNumber
  }
});
```

### Keep Old Edge Function Active
- Just don't delete `verify-emcc-accreditation`
- System will revert to old method

## 📊 Success Metrics

**After 1 Week:**
- [ ] 90%+ verification success rate
- [ ] <5 second average response time
- [ ] <5% user support requests about verification
- [ ] Zero Cloudflare/timeout errors

**After 1 Month:**
- [ ] 95%+ verification success rate
- [ ] 50%+ cache hit rate (fewer API calls)
- [ ] Positive user feedback

## 🗂️ File Changes Summary

### New Files
- ✅ `supabase/functions/verify-emcc-url/index.ts`
- ✅ `URL_VERIFICATION_DEPLOYMENT.md`
- ✅ `DEPLOYMENT_CHECKLIST.md` (this file)

### Modified Files
- ✅ `pages/CoachSignup.tsx` (UI updates)
- ✅ `services/supabaseService.ts` (service call update)

### Backup Files (Keep for Reference)
- ✅ `supabase/functions/verify-emcc-accreditation/SCRAPERAPI_VERSION.ts`
- ✅ All previous deployment guides (.md files)

## 💾 Backup Locations

**Code Backed Up In:**
1. **Local Git**: `.git/` folder
2. **GitHub**: `origin/main` branch
3. **Supabase**: Edge Functions dashboard
4. **Local Files**: All `supabase/functions/` folder

**To recover old code:**
```bash
# See all commits
git log --oneline

# View old version
git show <commit-hash>:supabase/functions/verify-emcc-accreditation/SCRAPERAPI_VERSION.ts

# Restore if needed
git checkout <commit-hash> -- supabase/functions/verify-emcc-accreditation/SCRAPERAPI_VERSION.ts
```

## 📞 Support

**If users report issues:**

1. **Get details**: URL they used, error message, screenshot
2. **Check Edge Function logs**: Supabase → Functions → Logs
3. **Verify URL format**: Should contain `reference=EIA`
4. **Test their URL**: Paste into browser - does it work?
5. **Manual review**: If unclear, mark for manual verification

**Common User Errors:**
- Used name search instead of EIA search
- Didn't copy complete URL
- Typo in name field
- Tried to use directory landing page

**Quick Fixes:**
- Guide to search by EIA only
- Show example URL format
- Verify complete URL copied
- Check name spelling

## ✅ Post-Deployment

**Day 1:**
- [ ] Monitor first 10 verifications
- [ ] Check logs for errors
- [ ] Respond to any user feedback

**Week 1:**
- [ ] Review success rate daily
- [ ] Check for common error patterns
- [ ] Update guidance if needed

**Month 1:**
- [ ] Analyze metrics
- [ ] Gather user feedback
- [ ] Consider archiving old function
- [ ] Apply same approach to ICF

## 🎯 Next Phase: ICF

Once EMCC is stable (2-4 weeks):

1. **Get ICF sample URLs** from user
2. **Create `verify-icf-url` Edge Function**
3. **Update frontend for ICF**
4. **Test and deploy**
5. **Archive old ICF function**

Same process, different accreditation body!

---

**Questions?** Check:
- [URL_VERIFICATION_DEPLOYMENT.md](URL_VERIFICATION_DEPLOYMENT.md) for detailed guide
- Edge Function logs in Supabase Dashboard
- `verified_credentials` table for cache data
