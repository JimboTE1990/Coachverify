# Fix Summary: Specialties & Formats Not Persisting

## Problem
User reported: "Changes I make in my profile are not sticking or viewable in the profile. Specifically around matching criteria / qualifications/ certifications etc."

Specifically, these fields were NOT persisting:
- ❌ Specializations (Career Growth, Stress Relief, Relationships, etc.)
- ❌ Coaching Formats (Online, In-Person, Hybrid)
- ❌ Certifications

## Root Cause Analysis

### The Issue
The application code was trying to save specialties, formats, and certifications to **junction tables** that don't exist in the database:
- `coach_specialties` table ❌ Does not exist
- `coach_formats` table ❌ Does not exist
- `coach_certifications` table ❌ Does not exist
- `specialties` table ❌ Does not exist
- `formats` table ❌ Does not exist
- `certifications` table ❌ Does not exist

### Why This Happened
The `supabaseService.ts` file had these function calls:
```typescript
// These were trying to write to non-existent junction tables:
await updateCoachSpecialties(coach.id, coach.specialties);
await updateCoachFormats(coach.id, coach.availableFormats);
await updateCoachCertifications(coach.id, coach.certifications);
```

These functions silently failed because the tables don't exist, so the data never saved to the database.

### The Correct Approach
Like other array fields (`coaching_expertise`, `cpd_qualifications`, `coaching_languages`), specialties and formats should be stored as **JSONB columns** directly in the `coaches` table.

## Solution Implemented

### 1. Database Changes (SQL)
Created `FIX_SPECIALTIES_FORMATS.sql` which:
- Adds `specialties` JSONB column to `coaches` table
- Adds `formats` JSONB column to `coaches` table
- Adds `certifications` JSONB column to `coaches` table (if missing)
- Creates GIN indexes for better query performance
- Refreshes the `coach_profiles` view to expose these columns

### 2. Application Code Changes
Updated `services/supabaseService.ts`:

**ADDED** - Direct column updates (lines 150-153):
```typescript
// Specialties and formats as JSONB columns
if (coach.specialties !== undefined) updateData.specialties = coach.specialties;
if (coach.availableFormats !== undefined) updateData.formats = coach.availableFormats;
if (coach.certifications !== undefined) updateData.certifications = coach.certifications;
```

**REMOVED** - Junction table function calls (lines 172-178):
```typescript
// ❌ DELETED - These tried to use non-existent junction tables:
await updateCoachSpecialties(coach.id, coach.specialties);
await updateCoachFormats(coach.id, coach.availableFormats);
await updateCoachCertifications(coach.id, coach.certifications);
```

### 3. Data Flow Verification
✅ **Save Logic**: Now saves directly to JSONB columns
✅ **Read Logic**: `mapCoachProfile()` already reads from `data.specialties` and `data.formats`
✅ **State Management**: `localProfile` already includes `specialties` and `availableFormats`
✅ **Display Logic**: CoachDetails.tsx already displays these fields

## Files Changed

### Created
- `FIX_SPECIALTIES_FORMATS.sql` - Database migration to add missing columns
- `DIAGNOSE_SPECIALTIES_FORMATS.sql` - Diagnostic queries to verify the fix
- `FIX_SUMMARY_SPECIALTIES_FORMATS.md` - This document

### Modified
- `services/supabaseService.ts`:
  - Added direct JSONB column updates for specialties, formats, certifications
  - Removed calls to non-existent junction table functions

## User Action Required

### Step 1: Run the SQL Migration
1. Open Supabase SQL Editor
2. Run `FIX_SPECIALTIES_FORMATS.sql`
3. Verify the output shows the columns were added and the view was refreshed

### Step 2: Test in Application
1. Deploy the code changes (commit: `fix: save specialties and formats directly to JSONB columns`)
2. Log into your coach dashboard
3. Select specializations (e.g., Career Growth, Stress Relief)
4. Select coaching formats (e.g., Online, Hybrid)
5. Click "Save Changes"
6. **Refresh the page** - selections should still be there ✅
7. View your public profile - specializations and formats should display ✅

### Step 3: Verify Data Persisted
Run this query in Supabase SQL Editor:
```sql
SELECT
  id,
  name,
  specialties,
  formats,
  certifications
FROM coaches
WHERE email = 'your-email@example.com';
```

You should see JSON arrays with your selections.

## Expected Outcome

### Before Fix
- ❌ Select specializations → Save → Refresh → **Selections gone**
- ❌ Select formats → Save → Refresh → **Selections gone**
- ❌ Data never saved to database (junction tables don't exist)

### After Fix
- ✅ Select specializations → Save → Refresh → **Selections persist**
- ✅ Select formats → Save → Refresh → **Selections persist**
- ✅ Data saves directly to JSONB columns in `coaches` table
- ✅ Public profile displays all selected specializations and formats
- ✅ Fully automated - no manual intervention needed

## Technical Details

### Database Schema
```sql
-- New columns in coaches table:
specialties JSONB DEFAULT '[]'::jsonb
formats JSONB DEFAULT '[]'::jsonb
certifications JSONB DEFAULT '[]'::jsonb

-- Example data:
specialties: ["Career Growth", "Stress Relief", "Relationships"]
formats: ["Online", "Hybrid"]
certifications: ["ICF Certified", "NLP Practitioner"]
```

### Column Mapping
| Application Field | Database Column | Data Type |
|------------------|----------------|-----------|
| `coach.specialties` | `specialties` | JSONB |
| `coach.availableFormats` | `formats` | JSONB |
| `coach.certifications` | `certifications` | JSONB |

### Why JSONB?
- ✅ No need for junction tables
- ✅ Simpler schema - fewer tables to maintain
- ✅ Better performance for read operations
- ✅ Consistent with other array fields (coaching_expertise, cpd_qualifications, etc.)
- ✅ PostgreSQL's JSONB has excellent query performance with GIN indexes

## Prevention

To prevent this issue in the future:
1. **Before writing save logic**, verify the database table structure
2. **Match the storage pattern** - if other array fields use JSONB, use JSONB
3. **Test the full cycle**: Save → Refresh → Verify data persists
4. **Add E2E tests** for profile data persistence

## Notes

- This fix does NOT require updating `CoachDashboard.tsx` - it already has the correct state management
- This fix does NOT require updating `CoachDetails.tsx` - it already displays specialties and formats
- The `mapCoachProfile()` function already maps `data.formats` → `availableFormats` correctly
- The old junction table functions (`updateCoachSpecialties`, etc.) can be deleted in a future cleanup

## Related Issues

This is part of the larger issue documented in ERROR_LOG.md as:
- ERROR-019: Profile Fields Not Persisting or Displaying

This fix resolves the specific subset related to specialties, formats, and certifications.
