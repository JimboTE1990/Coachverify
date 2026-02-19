# URL-Based Verification Deployment Guide

## Overview

**New Approach**: Users provide their EMCC profile URL instead of EIA number only.

**Why This Works**:
- ✅ No Cloudflare blocking (user's browser handles the page load)
- ✅ Fast verification (~3-5 seconds)
- ✅ Reliable and auditable
- ✅ Clear error messages for incorrect URLs

---

## What Changed

### Frontend Changes (CoachSignup.tsx)

1. **Input Field**: Now accepts URL instead of just EIA number
   - Changed input type to `url` for EMCC
   - Updated placeholder: "Paste your EMCC profile URL here"
   - Updated label: "EMCC Profile URL"

2. **Updated Guidance** in info popup:
   - ✅ Step 1: Visit EMCC Directory
   - ✅ Step 2: Search by EIA number ONLY (not name)
   - ✅ Step 3: Copy the complete URL from browser
   - ⚠️ Warning: Don't search by name - creates wrong URL
   - ❌ Clear examples of incorrect URLs

3. **Error Handling**: Clear validation messages for:
   - Wrong domain
   - Missing EIA number in URL
   - Name search URLs (rejected)
   - Directory landing page (rejected)

### Backend Changes (New Edge Function)

**New file**: `supabase/functions/verify-emcc-url/index.ts`

**Validation Layers**:
1. URL format validation
2. Domain check (emccglobal.org only)
3. Path validation (`/eia-awards/` required)
4. EIA number extraction from URL
5. Content verification (name matching)
6. Uniqueness check (one URL per coach)

---

## URL Format Details

### Valid EMCC URL Format

```
https://www.emccglobal.org/accreditation/eia/eia-awards/?reference=EIA20230480&search=1
```

**Required Components**:
- Domain: `emccglobal.org`
- Path: `/accreditation/eia/eia-awards/`
- Query param: `reference=EIA[numbers]`
- Query param: `search=1`

### How to Get It

1. User goes to: https://www.emccglobal.org/accreditation/eia/eia-awards/
2. User enters **ONLY** their EIA number in the "Reference" field
3. User clicks "Search"
4. User copies the **complete URL** from browser address bar
5. User pastes URL into signup form

---

## Validation Flow

### Step 1: URL Format Validation (Client + Server)

```typescript
validateEMCCUrl(url) {
  ✓ Must be from emccglobal.org
  ✓ Must contain /eia-awards/
  ✓ Must have search=1 parameter
  ✓ Must have reference=EIA parameter
  ✓ EIA number must match pattern: EIA[numbers]
}
```

**Error Examples**:
- ❌ `https://www.emccglobal.org/directory` → Not a search results page
- ❌ `https://www.emccglobal.org/accreditation/eia/eia-awards/` → Missing search results
- ❌ `https://www.emccglobal.org/accreditation/eia/eia-awards/?first_name=paul&last_name=jones&search=1` → Name search (rejected)

### Step 2: Uniqueness Check

```typescript
// Check if URL already used by another coach
SELECT * FROM coach_profiles
WHERE emcc_profile_url = [url]
AND id != [current_coach_id]
```

**Error**: "This EMCC profile URL is already registered to another coach"

### Step 3: Cache Lookup

```typescript
// Check if EIA number already verified
SELECT * FROM verified_credentials
WHERE credential_number = [EIA_from_URL]
AND accreditation_body = 'EMCC'
```

**If found**: Instant verification (no fetch needed)

### Step 4: Content Verification

```typescript
fetch(url) → verify content:
  ✓ Contains EMCC keywords (3+ required)
  ✓ Contains the EIA number
  ✓ Contains expected name (80%+ match)
  ✓ Contains accreditation level keywords

Confidence score = sum of checks
Verified if confidence >= 70
```

---

## Deployment Steps

### 1. Deploy Frontend Changes

```bash
# From project root
git add pages/CoachSignup.tsx
git commit -m "feat: switch EMCC verification to URL-based approach"
git push origin main
```

**Vercel will auto-deploy** (if connected to GitHub)

### 2. Deploy Edge Function

1. Go to: https://supabase.com/dashboard/project/whhwvuugrzbyvobwfmce/functions
2. Click "Create Function"
3. Name: `verify-emcc-url`
4. Copy all code from `supabase/functions/verify-emcc-url/index.ts`
5. Paste into editor
6. Click "Deploy"

### 3. Update Frontend Service Call

Update `services/supabaseService.ts`:

```typescript
// In verifyCoachLicense function
if (body === 'EMCC') {
  const { data, error } = await supabase.functions.invoke('verify-emcc-url', {
    body: {
      coachId,
      fullName,
      profileUrl: regNumber, // regNumber now contains the URL
      accreditationLevel
    }
  });
  // ... handle response
}
```

---

## Testing

### Test Case 1: Valid URL with EIA20230480

**Input**:
```
Name: Paula Jones
URL: https://www.emccglobal.org/accreditation/eia/eia-awards/?reference=EIA20230480&search=1
```

**Expected**: ✅ Verified successfully

**Check**:
- Edge Function logs show "Successfully verified"
- Coach profile updated with `emcc_verified = true`
- URL stored in `emcc_profile_url`
- EIA cached in `verified_credentials`

### Test Case 2: Name Search URL (Should Reject)

**Input**:
```
URL: https://www.emccglobal.org/accreditation/eia/eia-awards/?first_name=paul&last_name=jones&search=1
```

**Expected**: ❌ Rejected with error
```
"URL must contain your EIA reference number. Please search by EIA number (not name) and copy that URL."
```

### Test Case 3: Directory Landing Page (Should Reject)

**Input**:
```
URL: https://www.emccglobal.org/accreditation/eia/eia-awards/
```

**Expected**: ❌ Rejected with error
```
"Please search for your EIA number on the EMCC directory first, then copy the results URL."
```

### Test Case 4: Wrong Domain (Should Reject)

**Input**:
```
URL: https://google.com
```

**Expected**: ❌ Rejected with error
```
"URL must be from emccglobal.org. Please copy the URL from the EMCC directory search results."
```

### Test Case 5: Duplicate URL (Should Reject)

**Input**: Same URL already used by another coach

**Expected**: ❌ Rejected with error
```
"This EMCC profile URL is already registered to another coach (Name). Please contact support if this is an error."
```

---

## Error Messages Summary

| Scenario | Error Message |
|----------|---------------|
| Wrong domain | "URL must be from emccglobal.org..." |
| Not search results page | "This is not an EMCC profile URL..." |
| Missing search parameter | "Please search for your EIA number first..." |
| No EIA in URL | "URL must contain your EIA reference number..." |
| Invalid EIA format | "Invalid EIA number format. EIA numbers should look like EIA20230480" |
| Name not found on page | "Name [Name] not found on the page..." |
| EIA not found on page | "EIA number [EIA] not found on the page..." |
| Duplicate URL | "This EMCC profile URL is already registered..." |
| Page inaccessible | "Could not access EMCC profile (HTTP [code])..." |

---

## Benefits of This Approach

### For Users
- ✅ Simple: Just search and copy URL
- ✅ Fast: 3-5 seconds verification
- ✅ Clear guidance: Step-by-step instructions
- ✅ Helpful errors: Specific error messages

### For System
- ✅ No Cloudflare issues
- ✅ No ScraperAPI costs
- ✅ No timeouts
- ✅ Reliable validation
- ✅ Auditable (URL stored as proof)
- ✅ Cacheable (verified EIAs cached)

### For Support
- ✅ Easy to debug (can see URL in database)
- ✅ Easy to verify manually (just visit URL)
- ✅ Clear error messages reduce support requests

---

## Migration Path

### Phase 1: Deploy URL Verification (NOW)
- Deploy new Edge Function
- Update frontend to collect URLs
- Test with sample URLs

### Phase 2: Deprecate Old Method (1 week)
- Monitor for any issues
- Update documentation
- Train support team

### Phase 3: Remove ScraperAPI (2 weeks)
- Remove old Edge Function
- Remove ScraperAPI dependency
- Clean up code

---

## Monitoring

### Key Metrics to Watch

1. **Verification Success Rate**
   - Target: >90%
   - Track: `SELECT COUNT(*) FROM coach_profiles WHERE verification_status = 'verified'`

2. **Common Errors**
   - Track which error messages appear most
   - Update guidance if needed

3. **Verification Speed**
   - Should be <5 seconds
   - Monitor Edge Function execution time

4. **Cache Hit Rate**
   - Track: `SELECT COUNT(*) FROM verified_credentials`
   - Higher = fewer API calls

---

## Next Steps for ICF

Once EMCC is stable, apply same approach to ICF:

1. **Analyze ICF URL structure** (need sample URLs)
2. **Create `verify-icf-url` Edge Function**
3. **Update frontend guidance** for ICF
4. **Test and deploy**

---

## Support Notes

### If User Says "Verification Failed"

**Ask for**:
1. The exact URL they pasted
2. Screenshot of the error message
3. The name they entered

**Common Issues**:
1. Used name search instead of EIA search
2. Typo in name
3. URL got truncated when copy/pasting
4. Tried to use directory landing page

**Resolution**:
1. Guide them to search by EIA only
2. Check name matches exactly
3. Verify complete URL was copied
4. Verify URL shows their search results

---

## Rollback Plan

If issues arise:

1. **Revert frontend** to EIA number input
2. **Keep old Edge Function** active
3. **Disable URL verification**
4. **Investigate and fix**
5. **Redeploy when ready**

All code is in Git - easy to rollback!

---

## Success Criteria

✅ 90%+ verification success rate
✅ <5 second average verification time
✅ <10% support requests related to verification
✅ Zero Cloudflare/timeout errors
✅ Cache hit rate >50% after 1 month

---

## Questions?

Contact the development team or check:
- Edge Function logs: Supabase Dashboard → Functions → verify-emcc-url → Logs
- Database: `coach_profiles` table → `verification_status` column
- Cache: `verified_credentials` table
