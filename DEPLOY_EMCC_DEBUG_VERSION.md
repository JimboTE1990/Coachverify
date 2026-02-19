# Deploy EMCC Debug Version - Step by Step

## What's Changed
- Enabled JavaScript rendering (`render=true`) to capture dynamic content
- Added comprehensive debugging logs to diagnose HTML parsing issues
- Enhanced logging shows: HTML length, presence of tables, full URLs, and first 2000 chars when EIA not found

---

## Step 1: Go to Supabase Edge Functions Dashboard

**Direct link to your project's Edge Functions**:
https://supabase.com/dashboard/project/whhwvuugrzbyvobwfmce/functions

**Official Supabase Documentation**:
- [Edge Functions Overview](https://supabase.com/docs/guides/functions)
- [Deploying Edge Functions](https://supabase.com/docs/guides/functions/deploy)

---

## Step 2: Open the EMCC Verification Function

1. Click on: **`verify-emcc-accreditation`**
2. You'll see the current function code in the editor

---

## Step 3: Replace the Code

### Option A: Via Supabase Dashboard (Easiest)

1. **Select ALL existing code** (Cmd+A / Ctrl+A)
2. **Delete it** (Backspace/Delete)
3. **Open this file**: [SCRAPERAPI_VERSION.ts](supabase/functions/verify-emcc-accreditation/SCRAPERAPI_VERSION.ts)
4. **Select ALL code** in that file (Cmd+A / Ctrl+A)
5. **Copy** (Cmd+C / Ctrl+C)
6. **Paste** into Supabase editor (Cmd+V / Ctrl+V)
7. **Click "Deploy"** button (top right)
8. **Wait for green checkmark** ✓

### Option B: Via Supabase CLI (Advanced)

```bash
# Navigate to your project directory
cd /Users/jamiefletcher/Documents/Claude\ Projects/CoachDog/Coachverify

# Deploy the function
supabase functions deploy verify-emcc-accreditation --project-ref whhwvuugrzbyvobwfmce

# Check deployment status
supabase functions list --project-ref whhwvuugrzbyvobwfmce
```

**CLI Documentation**:
- [Supabase CLI Installation](https://supabase.com/docs/guides/cli)
- [Deploy Functions with CLI](https://supabase.com/docs/guides/functions/deploy#deploying-with-the-cli)

---

## Step 4: Verify Deployment

**Check Edge Function Logs**:
https://supabase.com/dashboard/project/whhwvuugrzbyvobwfmce/functions/verify-emcc-accreditation/logs

You should see a new deployment timestamp at the top.

---

## Step 5: Test with Paula Jones

1. **Go to your signup page**: https://yourapp.com/coach-signup (replace with your actual URL)

2. **Fill in the form**:
   - First Name: `Paula` (or `Graham` - either should work)
   - Last Name: `Jones` (or `Johnson`)
   - Email: Use a test email
   - Password: Create a strong password
   - Body: **EMCC**
   - EIA Number: **EIA20230480**

3. **Click "Verify Credentials"**

4. **Wait**: The process will now take **30-60 seconds** (with `render=true` it's slower but should work)

---

## Step 6: Check Debug Logs

**Go to Edge Function Logs**:
https://supabase.com/dashboard/project/whhwvuugrzbyvobwfmce/functions/verify-emcc-accreditation/logs

**Look for these new debug messages**:

```
[EMCC EIA Verification] Target URL: https://www.emccglobal.org/directory?reference=EIA20230480
[EMCC EIA Verification] HTML length: [number]
[EMCC EIA Verification] HTML snippet (search for "table"): Contains table tag
[EMCC EIA Verification] HTML snippet (search for "result"): Contains result
[EMCC EIA Verification] HTML contains EIA?: true
```

**If EIA not found, you'll see**:
```
[EMCC EIA Verification] EIA not found - logging first 2000 chars: [HTML content]
```

This will help us understand what HTML is actually being returned.

---

## What to Expect

### ✅ Success Case:
- Logs show: "HTML contains EIA?: true"
- Logs show: "[EMCC Parse] Found X table cells"
- Logs show: "[EMCC Parse] Extracted: { country: 'United Kingdom', name: 'Paula Jones', level: 'Senior Practitioner', reference: 'EIA20230480' }"
- UI shows: "Verification Successful!"

### ❌ Still Failing:
- If you see: "EIA not found - logging first 2000 chars"
- Copy the HTML content from logs and share it
- This will tell us if:
  - The page requires different parameters
  - The page structure is completely different
  - JavaScript rendering isn't working

---

## Key Changes in This Version

### 1. JavaScript Rendering Enabled
**Before**:
```typescript
render=false  // Just fetches static HTML
```

**After**:
```typescript
render=true  // Executes JavaScript, waits for dynamic content
```

### 2. Enhanced Debug Logging
**New logs**:
- Target URLs being requested
- HTML length (to verify we got a full page)
- Presence of `<table>` tags
- First 2000 characters when EIA not found (instead of just 500)

### 3. Both Search Strategies Use Rendering
- Reference search: `render=true`
- Name search fallback: `render=true`

---

## Troubleshooting

### Issue: "ScraperAPI returned HTTP [non-200]"
**Solution**:
- Check ScraperAPI dashboard: https://dashboard.scraperapi.com/
- Verify you have credits remaining
- Check for service outages

### Issue: Timeout (takes >60 seconds)
**Solution**:
- This is expected with `render=true` on slower connections
- Wait the full 60 seconds
- Check if ScraperAPI is experiencing delays

### Issue: Still getting "No EMCC record found"
**Solution**:
1. Check the debug logs for "EIA not found - logging first 2000 chars"
2. Copy that HTML output
3. Share it so we can see what's actually being returned
4. We may need to adjust search parameters or parsing logic

---

## Documentation References

**Supabase Edge Functions**:
- [Functions Overview](https://supabase.com/docs/guides/functions)
- [Deploy Functions](https://supabase.com/docs/guides/functions/deploy)
- [Function Logs](https://supabase.com/docs/guides/functions/logs)
- [Function Secrets](https://supabase.com/docs/guides/functions/secrets)

**Supabase Dashboard**:
- [Your Project Dashboard](https://supabase.com/dashboard/project/whhwvuugrzbyvobwfmce)
- [Edge Functions](https://supabase.com/dashboard/project/whhwvuugrzbyvobwfmce/functions)
- [Function Logs](https://supabase.com/dashboard/project/whhwvuugrzbyvobwfmce/functions/verify-emcc-accreditation/logs)

**ScraperAPI**:
- [Dashboard](https://dashboard.scraperapi.com/)
- [Documentation](https://www.scraperapi.com/documentation/)
- [JavaScript Rendering Guide](https://www.scraperapi.com/documentation/render)

---

## Next Steps After Deployment

1. ✅ Deploy updated function via Supabase dashboard
2. 🧪 Test with Paula Jones (EIA20230480)
3. 📊 Review debug logs to see what HTML is returned
4. 🔍 If still failing, share the "first 2000 chars" log output
5. 🎯 Adjust parsing logic based on actual HTML structure

---

## Summary

**Problem**: EMCC directory returns no results because JavaScript isn't being executed

**Solution**: Enable `render=true` in ScraperAPI to execute JavaScript

**Trade-off**: Slower (30-60s) but should actually work

**Fallback**: If this still doesn't work, the debug logs will show us the actual HTML so we can adjust our approach
