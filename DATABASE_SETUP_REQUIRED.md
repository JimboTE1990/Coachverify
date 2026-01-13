# 🚨 URGENT: Database Setup Required

## The Problem
Coach profiles are not saving changes. You're seeing this error:
```
Could not find the 'accreditation_level' column of 'coach_profiles' in the schema cache
```

## The Cause
The database is missing columns that the application expects. This happens when:
1. The currency column wasn't added yet
2. The enhanced profile fields (accreditation_level, coaching_hours, etc.) weren't added
3. The database schema is out of sync with the application code

## The Solution (2 Steps)

### Step 1: Add Missing Columns to Database

1. Go to **Supabase Dashboard** → **SQL Editor**
2. Click **"New query"**
3. Copy and paste **ALL** the contents of `supabase-add-missing-columns.sql`
4. Click **"Run"**
5. Wait for "Success. No rows returned"

### Step 2: Create Storage Bucket (if you haven't already)

1. Go to **Supabase Dashboard** → **Storage**
2. Click **"New Bucket"**
3. Name: `profile-photos`
4. Check **"Public bucket"** ✅
5. Click **"Create bucket"**
6. Go to **SQL Editor** and run `supabase-storage-policies.sql`

---

## What Gets Fixed

After running the SQL script:
- ✅ Currency selector will work (GBP, USD, EUR, etc.)
- ✅ Profile changes will save correctly
- ✅ No more "column not found" errors
- ✅ All enhanced fields will work:
  - Accreditation level
  - Coaching hours
  - Location radius
  - Qualifications
  - Acknowledgements
  - Coaching expertise
  - CPD qualifications
  - Coaching languages
  - Gender

## Verification

After running the script, check the verification queries at the bottom of `supabase-add-missing-columns.sql` to confirm all columns were added successfully.

---

## Files to Run (in order):

1. **supabase-add-missing-columns.sql** - CRITICAL - Run this first
2. **supabase-storage-policies.sql** - For profile photo uploads

## Need Help?

If you still see errors after running the SQL:
1. Check the Supabase logs for specific error messages
2. Verify all columns exist using the verification queries in the SQL file
3. Make sure you're running the SQL in the correct Supabase project
