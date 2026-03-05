# Coach Profile Issues - Google Calendar & Random "0"

## Issue 1: Google Calendar Appointment Link Not Working

**Coach ID:** 31569637-7e24-41fe-96de-52c2bd5bcff9
**Problem:** Coach added Google Calendar appointment scheduling link, but clicking "Schedule a Call" shows "Appointment not found"

### Root Cause

The booking link detection code (line 545-557 in CoachDetails.tsx) checks for:
- 'calendly'
- 'cal.com'
- 'booking'
- 'appointment'
- 'schedule'

BUT it does NOT check for:
- `calendar.google.com`
- `calendar.app.google`
- `google` + `calendar`

### The Fix

Update the booking link detection to include Google Calendar URLs:

**File:** `/pages/CoachDetails.tsx` (line 545-557)

```typescript
// Find booking/appointment link for "Schedule a Call" button
const bookingLink = coach?.socialLinks?.find(link => {
  const platform = link.platform?.toLowerCase() || '';
  const url = link.url?.toLowerCase() || '';
  return (
    platform.includes('booking') ||
    platform.includes('appointment') ||
    platform.includes('schedule') ||
    platform.includes('calendly') ||
    platform.includes('cal.com') ||
    platform.includes('google') && platform.includes('calendar') ||  // ADD THIS
    url.includes('calendly.com') ||
    url.includes('cal.com') ||
    url.includes('calendar.google.com') ||  // ADD THIS
    url.includes('calendar.app.google')      // ADD THIS
  );
});
```

**Also update line 874 and line 936** (same detection logic appears 3 times in the file).

### Why the Coach Sees "Appointment not found"

The coach likely created a Google Calendar appointment schedule, but:
1. The link wasn't recognized as a booking link
2. So it was added as a regular social link (maybe under "Website" or "Other")
3. When clicked, it opens the Google Calendar link
4. But the specific appointment might be:
   - Deleted
   - Not public
   - Incorrectly configured
   - Expired

### Short-term Fix for This Coach

Ask the coach to:
1. Go to dashboard → Profile → Social Links
2. Find their Google Calendar link
3. Edit the platform name to include "Booking" or "Schedule" (e.g., "Google Calendar Booking")
4. OR delete and re-add with platform = "Booking Link"

This will make the existing code detect it.

### Long-term Fix

Deploy the code update above to detect Google Calendar links automatically.

---

## Issue 2: Random "0" Appearing on Profile

**Coach ID:** c1b5113a-0e4c-40b4-9d6f-9cd92b513e94
**Problem:** A "0" appears on the profile page between certifications and qualifications

### Root Cause

In React, when you use a conditional rendering pattern like:
```javascript
{someArray.length && <Component />}
```

If `someArray.length` is `0`, React renders the `0` instead of nothing.

### Where This Might Be

Looking at the code structure, the "0" likely appears from one of these patterns:

1. **Between certifications sections** (if coach has 0 of something)
2. **A debugging leftover** `{totalReviews}` or similar
3. **Conditional that returns 0** instead of null/false

### Common Culprits

```typescript
// BAD - renders 0 if array is empty
{coach.someArray.length && <div>...</div>}

// GOOD - renders nothing if array is empty
{coach.someArray && coach.someArray.length > 0 && <div>...</div>}
```

### The Fix

I couldn't find the exact source in the code review. To diagnose:

**Option 1: Inspect Element (Quick)**
1. Open the coach profile with the "0"
2. Right-click the "0" → Inspect Element
3. Look at the HTML to see what renders it
4. Search codebase for that class/structure

**Option 2: Search for Rendering Pattern**
```bash
# Find all instances of .length && pattern
grep -n "\.length &&" pages/CoachDetails.tsx
```

**Option 3: Add Defensive Checks**

Update all conditional renderings to use the safe pattern:
```typescript
// Instead of:
{coach.additionalCertifications.length && <Component />}

// Use:
{coach.additionalCertifications && coach.additionalCertifications.length > 0 && <Component />}
```

### Temporary Workaround

Since I can't pinpoint the exact line without seeing the actual rendered HTML:

1. **Check if coach has empty arrays** - The "0" might be from an array with length 0
2. **Look for `{totalReviews}` or `{0}`** accidentally left in code
3. **Check if it's from inline style/debug code**

---

## Deployment Steps

### For Google Calendar Fix:

1. Update CoachDetails.tsx at 3 locations (lines ~545, ~874, ~936)
2. Build: `npm run build`
3. Commit and push
4. Vercel auto-deploys

### For "0" Fix:

1. Use browser inspect to find exact location
2. Update that specific conditional
3. Build and deploy

---

## SQL to Check Coach Data

### Check Google Calendar Coach:
```sql
SELECT
  c.id,
  c.name,
  c.email,
  s.platform,
  s.url
FROM coaches c
LEFT JOIN social_links s ON s.coach_id = c.id
WHERE c.id = '31569637-7e24-41fe-96de-52c2bd5bcff9';
```

### Check "0" Coach:
```sql
SELECT
  id,
  name,
  additional_certifications,
  qualifications,
  specialties,
  total_reviews
FROM coaches
WHERE id = 'c1b5113a-0e4c-40b4-9d6f-9cd92b513e94';
```

Look for any fields that might be `0` or empty arrays.

---

## Testing

### Test Google Calendar Fix:
1. Add a Google Calendar appointment link to test coach
2. Set platform = "Google Calendar"
3. Click "Schedule a Call"
4. Should open the Google Calendar link directly

### Test "0" Fix:
1. View coach profile c1b5113a-0e4c-40b4-9d6f-9cd92b513e94
2. The "0" should be gone
3. Check other coach profiles to ensure no regressions

---

## Priority

- **Google Calendar:** MEDIUM - Affects booking functionality
- **Random "0":** LOW - Cosmetic issue, not breaking functionality

Both should be fixed before beta week to ensure professional appearance.
