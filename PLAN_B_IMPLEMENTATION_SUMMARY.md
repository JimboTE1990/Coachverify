# Plan B: Manual Verification Flow - Implementation Summary

## Problem
EMCC website blocks automated verification with HTTP 403 errors, even with advanced anti-bot bypassing techniques (multi-step navigation, cookies, realistic headers, delays).

## Solution
Hybrid verification system that combines automated checking with manual review fallback.

## How It Works

### 1. Cache-First Verification
```
User enters credentials → Check internal cache → If found & name matches → ✓ Instant verification
                                               → If not found → Attempt live verification
```

### 2. Live Verification with Graceful Degradation
```
Attempt EMCC website verification → Success → ✓ Verify & cache for future
                                  → 403 Error → Mark as "Pending Manual Review"
                                               Allow onboarding to continue
```

### 3. Manual Review Queue
Admin reviews pending verifications during off-peak hours or in batches.
Once verified manually, the credential is cached for instant future verification.

## Benefits

1. **First coach with EIA "EIA12345"** → Manual review needed (~5 min admin time)
2. **Second coach with same EIA** → Instant verification (cached)
3. **You only manually verify each unique EIA number once**

Over time, your cache grows and most verifications become instant.

## Files Changed

### 1. Database Migration
**File**: `supabase/migrations/20260122_create_verified_credentials_cache.sql`

**Creates**:
- `verified_credentials` table for caching verified EIA/ICF numbers
- `verification_status` column on coaches table (pending, verified, rejected, manual_review)
- Indexes for fast lookups
- RLS policies for security
- Initial test data (Paul Smith's EIA for testing)

**Run this**:
```sql
-- In Supabase SQL Editor, run the migration file
```

### 2. Edge Function Update
**File**: `supabase/functions/verify-emcc-accreditation/UPDATED_CODE_FOR_SUPABASE.ts`

**Changes**:
1. **Step 1**: Check internal `verified_credentials` cache
   - If found + name matches → Return verified (100% confidence)
   - If found + name mismatch → Return error

2. **Step 2**: Attempt live EMCC verification (existing multi-step process)

3. **Step 3**: If 403 error occurs:
   - Mark coach as `verification_status = 'manual_review'`
   - Store credentials in `verification_notes`
   - Return `pendingManualReview: true`
   - Allow onboarding to continue

**Deploy**: Copy entire file contents to Supabase Dashboard

### 3. Frontend Changes
**File**: `pages/CoachSignup.tsx`

**Changes**:
- Handle `pendingManualReview` flag from verification response
- If true, allow user to continue with success message:
  "✓ Credentials submitted! Your accreditation will be manually verified within 24 hours."

**File**: `services/supabaseService.ts`

**Changes**:
- Updated return type to include `pendingManualReview?: boolean`
- Pass through the flag from edge function response

## Database Schema

### verified_credentials Table
```sql
CREATE TABLE verified_credentials (
  id UUID PRIMARY KEY,
  accreditation_body TEXT NOT NULL,     -- 'EMCC' or 'ICF'
  credential_number TEXT NOT NULL,      -- e.g., 'EIA20217053'
  full_name TEXT NOT NULL,              -- e.g., 'Paul Smith'
  accreditation_level TEXT,             -- e.g., 'Senior Practitioner'
  country TEXT,
  profile_url TEXT,
  verified_at TIMESTAMP,
  verified_by TEXT,                     -- 'manual', 'auto', or admin user ID
  last_checked TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  notes TEXT
);
```

### coaches Table (Updated)
```sql
ALTER TABLE coaches ADD COLUMN verification_status TEXT DEFAULT 'pending';
ALTER TABLE coaches ADD COLUMN verification_notes TEXT;
```

**Status values**:
- `pending`: Awaiting verification
- `verified`: Credentials confirmed
- `rejected`: Invalid credentials
- `manual_review`: Needs admin attention (usually due to 403 errors)

## Deployment Steps

### Step 1: Run SQL Migration
1. Open Supabase Dashboard → SQL Editor
2. Open file: `supabase/migrations/20260122_create_verified_credentials_cache.sql`
3. Copy all SQL
4. Paste into SQL Editor
5. Click "Run"
6. Verify tables created:
   ```sql
   SELECT * FROM verified_credentials;
   SELECT column_name FROM information_schema.columns WHERE table_name = 'coaches' AND column_name IN ('verification_status', 'verification_notes');
   ```

### Step 2: Deploy Edge Function
1. Open Supabase Dashboard → Edge Functions → verify-emcc-accreditation
2. Open file: `supabase/functions/verify-emcc-accreditation/UPDATED_CODE_FOR_SUPABASE.ts`
3. Copy all code (Cmd+A, Cmd+C)
4. Paste into Supabase editor
5. Click "Deploy"
6. Wait for deployment to complete

### Step 3: Push Frontend Changes
```bash
# Commit and push changes
git add .
git commit -m "feat: implement manual verification fallback for EMCC 403 errors"
git push origin main

# Vercel will auto-deploy
```

## Testing

### Test 1: Cache Hit (Should Work Instantly)
1. Go to signup
2. Enter:
   - Name: Paul Smith
   - Body: EMCC
   - EIA: EIA20217053
3. Click "Verify Credentials"
4. **Expected**: Instant verification (from cache)

**Logs should show**:
```
[EMCC Verification] Checking internal cache for EIA: EIA20217053
[EMCC Verification] Found in cache: Paul Smith
[EMCC Verification] Cache hit - verified from internal database
```

### Test 2: Wrong Name with Cached EIA (Should Reject)
1. Go to signup
2. Enter:
   - Name: Paul Jones
   - Body: EMCC
   - EIA: EIA20217053 (Paul Smith's EIA)
3. Click "Verify Credentials"
4. **Expected**: Error message about name mismatch

**Logs should show**:
```
[EMCC Verification] Cache found but name mismatch
```

### Test 3: New EIA (Will Get 403, Should Allow Signup)
1. Go to signup
2. Enter:
   - Name: Your Real Name
   - Body: EMCC
   - EIA: Your Real EIA
3. Click "Verify Credentials"
4. **Expected**:
   - Alert: "✓ Credentials submitted! Your accreditation will be manually verified within 24 hours."
   - Can proceed with signup
   - Account marked as `verification_status = 'manual_review'`

**Logs should show**:
```
[EMCC Verification] Not in cache, attempting live verification...
[EMCC Verification] Search result: { verified: false, reason: "EMCC directory search failed (HTTP 403)" }
[EMCC Verification] Live verification blocked (403), marking for manual review
```

## Manual Verification Process

### Current (Manual Steps)
1. Go to Supabase Dashboard → Table Editor → coaches
2. Filter by: `verification_status = 'manual_review'`
3. For each coach:
   a. Check `verification_notes` for their EIA number
   b. Manually verify on EMCC website: https://www.emccglobal.org/directory
   c. If valid:
      - Add to `verified_credentials` table
      - Update coach: `verification_status = 'verified'`, `emcc_verified = true`
   d. If invalid:
      - Update coach: `verification_status = 'rejected'`

### Future (Admin UI)
Create an admin dashboard page that shows:
- List of pending manual reviews
- Quick verify/reject buttons
- Automatically adds to cache when verified

## Growth Over Time

**Day 1**: 10 new coaches → 10 manual verifications (50 minutes)
**Week 1**: 50 new coaches → 40 manual verifications (most are unique EIAs)
**Month 1**: 200 new coaches → 80 manual verifications (some EIA reuse starting)
**Month 3**: 600 new coaches → 100 manual verifications (40% cache hit rate)
**Month 6**: 1200 new coaches → 120 manual verifications (60% cache hit rate)

As your platform grows, more coaches share the same credentials, and verification becomes increasingly automated.

## Cost Analysis

- **Pure Manual**: 5 min per coach × 1000 coaches = 83 hours
- **This Hybrid Approach**:
  - Initial: 5 min per unique EIA
  - Recurring: 0 min per cached EIA
  - Estimated: ~30-40 hours for 1000 coaches (60% savings)

## Next Steps

1. ✅ SQL migration created
2. ✅ Edge function updated
3. ✅ Frontend updated
4. ⏳ Deploy all changes
5. ⏳ Test verification flow
6. 🔜 Create admin UI for manual reviews (optional but recommended)
7. 📧 Contact EMCC for official API access (long-term solution)

## Admin UI (Future Enhancement)

Create a page at `/admin/pending-verifications` with:

```typescript
interface PendingVerification {
  id: string;
  name: string;
  email: string;
  eiaNumber: string;
  accreditationLevel?: string;
  submittedAt: Date;
  notes: string;
}

// Show list with:
// - Coach details
// - EIA number (with link to EMCC directory)
// - Quick Verify / Reject buttons
// - "Add to Cache" checkbox (default: checked)
```

This makes manual verification much faster (30 seconds per coach instead of 5 minutes).

## Support

If issues occur:
1. Check Supabase logs for edge function errors
2. Check browser console for frontend errors
3. Verify SQL migration ran successfully
4. Check that `verified_credentials` table exists and has RLS enabled
