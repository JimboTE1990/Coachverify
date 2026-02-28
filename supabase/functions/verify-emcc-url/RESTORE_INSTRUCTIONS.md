# EMCC Verification - Restore Instructions

## Current Status (TEMPORARY)
The EMCC verification system is currently in **MANUAL REVIEW MODE** due to EMCC's website directory being unavailable.

**Date Modified:** 2026-02-28

## What Changed
The edge function now:
- Accepts plain EIA numbers (e.g., "EIA20230480") instead of requiring URLs
- **Automatically approves all EMCC signups with `pendingManualReview: true`**
- Skips URL fetching and content verification entirely
- Returns manual review message to all EMCC applicants

## Backup File
The original working code is saved in: `index.ts.ORIGINAL_BACKUP`

## How to Restore Original Functionality

When EMCC restores their directory (or you want to revert to URL-based verification):

### Option 1: Manual Restoration (Recommended)
1. Open `index.ts` in your editor
2. Find the TEMPORARY block (around line 148-160):
   ```typescript
   // STEP 4: TEMPORARY - Skip URL verification, auto-approve for manual review
   ```
3. Delete lines 148-160 (the temporary return statement)
4. Uncomment the original code block (currently lines 162-187 marked with `/* ORIGINAL CODE ... */`)
5. In the UI (`pages/CoachSignup.tsx`):
   - Change label back to "EMCC Profile URL"
   - Change input type back to `url`
   - Update placeholder to request URL
   - Show the "Need help finding your URL?" button for EMCC
   - Remove the blue disclaimer box

### Option 2: Quick File Replace
```bash
# From project root
cd supabase/functions/verify-emcc-url
cp index.ts.ORIGINAL_BACKUP index.ts
```

Then manually update the UI files:
- `/pages/CoachSignup.tsx` - revert EMCC input field changes

### Option 3: Git Revert
```bash
# From project root
git restore supabase/functions/verify-emcc-url/index.ts
git restore pages/CoachSignup.tsx
```

## After Restoration

### Test the Restored System
1. Go to coach signup page
2. Select EMCC as accreditation body
3. Visit https://www.emccglobal.org/accreditation/eia/eia-awards/
4. Search by your EIA number ONLY
5. Copy the complete URL from the results page
6. Paste URL into signup form
7. Click "Verify Now"
8. Should verify automatically if directory is working

### Verify Pending Coaches
If you have coaches with `verification_status = 'pending_review'`, you can batch verify them:

```sql
-- Get all pending EMCC coaches
SELECT id, name, emcc_profile_url, email
FROM coach_profiles
WHERE verification_status = 'pending_review'
AND accreditation_body = 'EMCC';
```

You can then:
1. Manually verify their certificates and update the database, OR
2. Use the restored edge function to re-verify their EIA numbers if they're stored in `emcc_profile_url`

## Files Modified During Temporary Fix
1. `/supabase/functions/verify-emcc-url/index.ts` - Edge function bypass
2. `/pages/CoachSignup.tsx` - UI changes for EIA number input
3. This file and `index.ts.ORIGINAL_BACKUP` - Documentation and backup

## Questions?
Refer to the implementation plan: `~/.claude/plans/swift-beaming-sky.md`
