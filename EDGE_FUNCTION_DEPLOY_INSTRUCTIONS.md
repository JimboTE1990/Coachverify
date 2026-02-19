# Edge Function Deployment Instructions

## Latest Version: Multi-Step Cookie-Aware Verification

This version implements a 3-step process that mimics human browsing to bypass anti-bot detection:
1. Visit homepage (get cookies)
2. Visit directory page (maintain session)
3. Perform search (with full cookie chain)

Total delay: ~6.5 seconds per verification

## Deployment Steps

### Option 1: Deploy via Supabase Dashboard (Recommended)

1. **Open Supabase Dashboard**
   - Go to: https://supabase.com/dashboard/project/whhwvuugrzbyvobwfmce
   - Navigate to: Edge Functions

2. **Open the Function**
   - Click on `verify-emcc-accreditation`
   - Click "Edit Function"

3. **Replace All Code**
   - Select all existing code (Cmd+A)
   - Delete it
   - Open this file: `supabase/functions/verify-emcc-accreditation/UPDATED_CODE_FOR_SUPABASE.ts`
   - Copy all code (Cmd+A, Cmd+C)
   - Paste into Supabase editor (Cmd+V)

4. **Deploy**
   - Click "Deploy" button
   - Wait for deployment to complete (green checkmark)

5. **Verify Deployment**
   - Check that version number increased
   - Status should show "Active"

### Option 2: Deploy via CLI

```bash
cd "/Users/jamiefletcher/Documents/Claude Projects/CoachDog/Coachverify"

# Set your access token (get from: https://supabase.com/dashboard/account/tokens)
export SUPABASE_ACCESS_TOKEN=your_token_here

# Deploy the function
npx supabase functions deploy verify-emcc-accreditation --project-ref whhwvuugrzbyvobwfmce
```

## Testing After Deployment

### Test 1: Check Function is Active
1. Go to: Edge Functions → verify-emcc-accreditation
2. Should show:
   - Status: Active
   - Latest version number
   - Recent deployment timestamp

### Test 2: Test with Wrong Credentials (Should Fail)
**Test Case**: Paul Jones using Paul Smith's EIA number

1. Go to onboarding: https://your-app.vercel.app/signup
2. Fill in:
   - First Name: Paul
   - Last Name: Jones
   - Body: EMCC
   - EIA Number: [Paul Smith's actual EIA number]
3. Click "Verify Credentials"

**Expected Result**:
- Should show error: "EIA [number] belongs to 'Paul Smith', which doesn't match the name you provided ('paul jones'). Please check that you're using YOUR OWN EIA number."
- Verification should NOT pass

### Test 3: Check Logs
1. Go to: Edge Functions → verify-emcc-accreditation → Logs
2. Should see detailed logs like:
   ```
   [EMCC EIA Verification] Step 1: Visiting homepage to establish session...
   [EMCC EIA Verification] Cookies stored: [cookie data]...
   [EMCC EIA Verification] Step 2: Visiting directory page...
   [EMCC EIA Verification] Step 3: Performing search...
   [EMCC EIA Verification] Comparing: {
     found: "Paul Smith",
     expected: "paul jones",
     similarity: 0.45,
     threshold: 0.7
   }
   [EMCC EIA Verification] Name mismatch detected
   ```

### Test 4: Test with Correct Credentials (Should Pass)
1. Use your own valid EMCC credentials
2. Should verify successfully

## What's New in This Version

### Previous Issues:
- ❌ Got 404 errors (function not deployed)
- ❌ Got 500 errors (temp UUID issue)
- ❌ Got 403 errors (anti-bot detection)

### Current Improvements:
- ✅ Fixed temp UUID issue (skips DB operations during onboarding)
- ✅ Multi-step browsing (homepage → directory → search)
- ✅ Cookie management (maintains session across requests)
- ✅ Proper delays (2.5s + 2.5s + 1.5s = 6.5s total)
- ✅ Realistic browser headers with Referer chain
- ✅ Name matching validation (70% similarity threshold)

## If Still Getting 403 Errors

If the EMCC website still blocks with HTTP 403, we'll need to implement Plan B:

### Plan B: Hybrid Verification (Manual + Automated)
1. Allow onboarding to continue even if verification fails
2. Mark account as "Pending Verification"
3. Admin manually verifies during off-peak hours
4. Cache verified EIA numbers for future instant verification

This means:
- First time EIA is used → Manual review
- Second time same EIA is used → Instant (already verified)
- You only manually verify each unique EIA once

## Code Location

**Latest Code**: `supabase/functions/verify-emcc-accreditation/UPDATED_CODE_FOR_SUPABASE.ts`

This file contains the complete, ready-to-deploy edge function code with all the latest improvements.

## Support

If you encounter issues:
1. Check Supabase Edge Function logs for errors
2. Check browser console for client-side errors
3. Verify the function is showing as "Active" in dashboard
4. Check that version number increased after deployment

## Next Steps After Successful Deployment

Once verification is working:
1. Test with multiple coaches
2. Monitor logs for any parsing issues
3. Consider implementing rate limiting (1 verification per coach per hour)
4. Plan for Plan B if 403 errors persist
