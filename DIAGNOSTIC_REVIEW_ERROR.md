# Diagnostic Guide - Review Submission 400 Error

The 400 error persists after running RLS policies, which means there's a different issue. Let's diagnose it.

## 🔍 Step 1: Check the Actual Error Message

### In Chrome/Edge:
1. Open DevTools (F12)
2. Go to **Network** tab
3. Try submitting a review
4. Look for the failed request to `reviews` (will be red)
5. Click on it
6. Go to **Response** tab
7. Copy the error message and send it to me

### What to look for:
The response should show something like:
```json
{
  "code": "23502",
  "details": "Failing row contains (uuid, null, ...)",
  "hint": "...",
  "message": "null value in column \"some_column\" violates not-null constraint"
}
```

---

## 🗄️ Step 2: Check Your Database Schema

Run this SQL in Supabase to see what columns exist:

```sql
-- Check reviews table schema
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'reviews'
ORDER BY ordinal_position;
```

**Expected columns for reviews:**
- `id` (uuid, not null, auto-generated)
- `coach_id` (uuid, not null)
- `author_name` (text, not null)
- `rating` (integer, not null)
- `review_text` (text, not null)
- `coaching_period` (text, not null)
- `reviewer_location` (text, nullable)
- `review_token` (text, nullable)
- `created_at` (timestamptz, auto-generated)
- `updated_at` (timestamptz, auto-generated)

---

## 🔧 Step 3: Possible Issues & Fixes

### Issue A: Missing NOT NULL columns

If the error says something like "null value in column X violates not-null constraint", it means:
- The code is not sending a required field
- OR a new required column was added to the table

**Fix**: Make the column nullable:

```sql
-- Example: If 'some_column' is causing issues
ALTER TABLE reviews ALTER COLUMN some_column DROP NOT NULL;
```

---

### Issue B: Foreign Key Constraint

If the error mentions "foreign key constraint", it means:
- The `coach_id` doesn't exist in the `coaches` table
- OR there's a mismatch between the ID being sent and what exists

**Check**:
```sql
-- Verify the coach exists
SELECT id, name, email FROM coaches WHERE id = 'YOUR_COACH_ID_HERE';
```

**Fix**: Make sure you're using a valid coach ID when testing.

---

### Issue C: Check Constraint Violation

If the error mentions "check constraint", it means:
- A value violates a CHECK constraint (e.g., rating must be 1-5)

**Check all constraints**:
```sql
SELECT
  conname AS constraint_name,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'reviews'::regclass;
```

---

### Issue D: Data Type Mismatch

If the error mentions "invalid input syntax for type X", it means:
- The code is sending the wrong data type

**Example**: Sending a string when an integer is expected.

---

## 🧪 Step 4: Test Insert Directly

Try inserting a review directly in SQL to isolate the issue:

```sql
-- Test insert (replace YOUR_COACH_ID with a real coach ID)
INSERT INTO reviews (
  coach_id,
  author_name,
  rating,
  review_text,
  coaching_period,
  reviewer_location,
  review_token
) VALUES (
  'YOUR_COACH_ID',
  'Test User',
  5,
  'Great coach!',
  'December 2025',
  'London, UK',
  'test-token-123'
);
```

### If this works:
- The database schema is fine
- The issue is in the application code

### If this fails:
- You'll see the exact error
- Send me that error message

---

## 🚨 Step 5: Common Fixes

### Fix 1: Review Token Column Missing

If you haven't run the review_token migration:

```sql
-- Add review_token column
ALTER TABLE reviews
ADD COLUMN IF NOT EXISTS review_token TEXT UNIQUE;

CREATE INDEX IF NOT EXISTS idx_reviews_token ON reviews(review_token);
```

### Fix 2: Missing Created/Updated Timestamps

```sql
-- Add timestamp columns if missing
ALTER TABLE reviews
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
```

### Fix 3: Profile Views Schema

If profile_views is also failing:

```sql
-- Check profile_views schema
SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'profile_views'
ORDER BY ordinal_position;
```

Expected columns:
- `id` (uuid, auto-generated)
- `coach_id` (uuid, not null)
- `viewed_at` (timestamptz, not null)
- `viewer_user_agent` (text, nullable)
- `referrer` (text, nullable)
- `session_id` (text, nullable)

---

## 📊 Step 6: Check RLS Policies Were Applied

Verify policies exist:

```sql
-- List all policies on reviews table
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'reviews';

-- List all policies on profile_views table
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'profile_views';
```

You should see 4 policies for reviews and 2 for profile_views.

---

## 🎯 Next Steps

1. **Get the actual error message** from Network tab (Step 1)
2. **Run the schema check** SQL (Step 2)
3. **Try the test insert** (Step 4)
4. **Send me**:
   - The error message from Network tab
   - The results of the schema check
   - Whether the test insert worked

With this info, I can give you the exact fix!

---

## 💡 Alternative: Disable RLS Temporarily

If you need reviews working RIGHT NOW and can troubleshoot later:

```sql
-- TEMPORARY: Disable RLS on reviews (NOT RECOMMENDED FOR PRODUCTION)
ALTER TABLE reviews DISABLE ROW LEVEL SECURITY;

-- TEMPORARY: Disable RLS on profile_views
ALTER TABLE profile_views DISABLE ROW LEVEL SECURITY;
```

⚠️ **Warning**: This makes your tables accessible to anyone. Only do this for testing, then re-enable RLS and fix the root cause.
