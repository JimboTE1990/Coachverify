# Cache Troubleshooting - Accreditation Badges Not Showing

## Issue
SQL updates are successfully running and returning rows, but changes aren't appearing on the live website for specific profiles.

## Root Cause
This is almost always a **caching issue** - the database has the correct data, but the application is serving cached/stale data.

## Solutions (Try in Order)

### 1. Hard Refresh Browser (Client-Side Cache)
**Try first:** This clears your local browser cache
- **Mac**: Cmd + Shift + R
- **Windows/Linux**: Ctrl + Shift + R
- **Alternative**: Open in incognito/private window

### 2. Clear Application Cache (If Using Service Workers)
If your app uses service workers:
1. Open DevTools (F12)
2. Go to Application tab
3. Click "Clear storage" or "Clear site data"
4. Reload page

### 3. Redeploy Application (Server-Side Cache)
If the app is caching data on the server:

```bash
# Force a new deployment
git commit --allow-empty -m "chore: force redeploy to clear cache"
git push origin main
```

This triggers a fresh build and clears any server-side caches.

### 4. Check for Data Fetching Cache
The app might be caching Supabase queries. Check if there's a cache invalidation needed:

**In your app code**, look for:
- React Query cache (`queryClient.invalidateQueries()`)
- SWR cache (`mutate()`)
- Local storage cache
- IndexedDB cache

### 5. Verify Database Has Correct Data

Run this query in Supabase SQL Editor to confirm data is correct:

```sql
SELECT
  id,
  name,
  accreditation_body,
  accreditation_level,
  emcc_verified,
  emcc_verified_at,
  emcc_profile_url,
  icf_verified,
  icf_verified_at,
  icf_profile_url
FROM coach_profiles
WHERE id IN (
  '3df6bae3-c318-4e2c-b579-4dc506330bda',
  '354e2bae-8150-4b2f-80d5-9dc808c15b5b',
  '77f6a80f-817c-4b4c-96ca-a4e73833d844'
);
```

**Expected results:**
- `accreditation_body`: 'EMCC' or 'ICF'
- `emcc_verified` or `icf_verified`: `true`
- `emcc_profile_url` or `icf_profile_url`: Has a URL value
- `accreditation_level` or `icf_accreditation_level`: Has a value

If all these are correct in the database but not showing on the site, it's **definitely a cache issue**.

### 6. Check Browser Console for Errors

1. Open DevTools (F12)
2. Go to Console tab
3. Look for any errors when loading the profile
4. Check Network tab to see what data is being fetched

### 7. Test in Different Browser

Open the profile in a completely different browser (Chrome vs Firefox vs Safari) to rule out browser-specific caching.

### 8. Check for Conditional Rendering Issues

The badge only shows if **ALL** these conditions are met in the code:

```typescript
// For EMCC:
coach.accreditationBody === 'EMCC' &&
coach.emccVerified &&
coach.emccProfileUrl

// For ICF:
coach.accreditationBody === 'ICF' &&
coach.icfVerified &&
coach.icfProfileUrl
```

If ANY of these is falsy, the badge won't show.

### 9. Add Console Logging (Temporary Debug)

Temporarily add this to `pages/CoachDetails.tsx` to debug:

```typescript
// Add right before the badge rendering (around line 684)
console.log('Coach accreditation data:', {
  id: coach.id,
  name: coach.name,
  accreditationBody: coach.accreditationBody,
  emccVerified: coach.emccVerified,
  emccProfileUrl: coach.emccProfileUrl,
  icfVerified: coach.icfVerified,
  icfProfileUrl: coach.icfProfileUrl,
  willShowBadge: (
    (coach.accreditationBody === 'EMCC' && coach.emccVerified && coach.emccProfileUrl) ||
    (coach.accreditationBody === 'ICF' && coach.icfVerified && coach.icfProfileUrl)
  )
});
```

Then view the profile and check the console to see what data the app is actually receiving.

## Most Likely Solution

**95% of the time, this is solved by:**

1. **Hard refresh browser** (Cmd+Shift+R)
2. **Open in incognito window** (to bypass all cache)
3. **Redeploy application** if hard refresh doesn't work

## If Still Not Working

If none of the above works, the issue might be:

1. **Row Level Security (RLS)** - The user viewing the profile doesn't have permission to see the updated fields
2. **Old build deployed** - The latest code changes haven't been deployed to production
3. **Different database** - Dev database updated, but production database wasn't

### Check Which Database You're Connected To

In Supabase dashboard:
1. Check the project URL
2. Verify you're looking at the production database
3. Run the verification query in the **production** database

### Check Latest Deployment

Verify the latest code is deployed:
```bash
git log --oneline -5
# Should show recent commits including accreditation badge changes
```

Check your hosting platform (Vercel/Netlify/etc) to see when last deployment happened.

## Summary

**Most likely cause:** Browser cache or server-side cache serving stale data

**Quick fix:**
1. Hard refresh (Cmd+Shift+R)
2. Open in incognito window
3. If still not working: Force redeploy

**If that doesn't work:** Add console logging to debug what data the app is receiving
