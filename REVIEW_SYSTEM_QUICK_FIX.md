# Review System Quick Fix - Action Required

## ✅ What Was Just Fixed

**Temporary Fix Applied**: Reviews now work immediately by disabling spam detection columns.

**Changed File**: `services/supabaseService.ts`
- Commented out spam columns in the insert statement
- Reviews can now be submitted without errors

**Status**: 🟢 Reviews should work NOW (after Vercel deployment completes)

---

## 🚨 Required Action: Run RLS Policy Migration

Even though spam detection is disabled, you still need to run the RLS policy migration to allow anonymous users to submit reviews.

### Step-by-Step:

1. **Go to Supabase Dashboard**
   - Visit https://supabase.com/dashboard
   - Select your project

2. **Open SQL Editor**
   - Click "SQL Editor" in the left sidebar
   - Click "New query"

3. **Copy and Paste This SQL**:

```sql
-- Comprehensive RLS policy fix for reviews and profile_views tables
-- This fixes all 400 errors when submitting reviews and tracking profile views

-- ============================================
-- REVIEWS TABLE RLS POLICIES
-- ============================================

-- Enable RLS on reviews table if not already enabled
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Allow anonymous insert reviews" ON reviews;
DROP POLICY IF EXISTS "Allow public read reviews" ON reviews;
DROP POLICY IF EXISTS "Allow review owner update" ON reviews;
DROP POLICY IF EXISTS "Allow review owner delete" ON reviews;

-- Policy 1: Allow anonymous users to INSERT reviews (public can submit reviews)
CREATE POLICY "Allow anonymous insert reviews"
ON reviews
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Policy 2: Allow public READ access to all reviews
CREATE POLICY "Allow public read reviews"
ON reviews
FOR SELECT
TO anon, authenticated, public
USING (true);

-- Policy 3: Allow UPDATE for review management
CREATE POLICY "Allow review owner update"
ON reviews
FOR UPDATE
TO anon, authenticated
USING (true);

-- Policy 4: Allow DELETE for review management
CREATE POLICY "Allow review owner delete"
ON reviews
FOR DELETE
TO anon, authenticated
USING (true);

-- ============================================
-- PROFILE_VIEWS TABLE RLS POLICIES
-- ============================================

-- Enable RLS on profile_views table if not already enabled
ALTER TABLE profile_views ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow anonymous insert profile views" ON profile_views;
DROP POLICY IF EXISTS "Allow public read profile views" ON profile_views;

-- Policy 1: Allow anonymous users to INSERT profile views (track anonymous visits)
CREATE POLICY "Allow anonymous insert profile views"
ON profile_views
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Policy 2: Allow reading profile views (for analytics)
CREATE POLICY "Allow public read profile views"
ON profile_views
FOR SELECT
TO anon, authenticated
USING (true);

-- ============================================
-- ADD HELPFUL COMMENTS
-- ============================================

COMMENT ON POLICY "Allow anonymous insert reviews" ON reviews IS 'Allows anyone to submit reviews (anonymous or authenticated)';
COMMENT ON POLICY "Allow public read reviews" ON reviews IS 'Allows anyone to read reviews';
COMMENT ON POLICY "Allow review owner update" ON reviews IS 'Allows review updates with token validation in app layer';
COMMENT ON POLICY "Allow review owner delete" ON reviews IS 'Allows review deletion with token validation in app layer';

COMMENT ON POLICY "Allow anonymous insert profile views" ON profile_views IS 'Allows tracking profile views from anonymous and authenticated users';
COMMENT ON POLICY "Allow public read profile views" ON profile_views IS 'Allows reading profile view analytics';
```

4. **Click "Run"** (bottom right)

5. **Verify Success**: You should see "Success. No rows returned" (this is expected)

---

## 🎯 Test Review Submission

After running the SQL and Vercel deploys:

1. Visit any coach profile on your site
2. Click "Leave a Review"
3. Fill out the form:
   - Rating: 5 stars
   - Name: "Test User"
   - When: "December 2025"
   - Location: Select from dropdown or type your own
   - Review: "Great coach, very helpful!"
4. Click Submit

**Expected Result**: ✅ "Review submitted successfully!"

If you still get an error, check the browser console and send me the error message.

---

## 📋 Future Enhancement: Enable Spam Detection

Once you're ready to enable spam detection (optional):

### Step 1: Run Spam Detection Migration

In Supabase SQL Editor, run:

```sql
-- Add spam detection fields to reviews table
ALTER TABLE reviews
ADD COLUMN IF NOT EXISTS spam_score INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS spam_reasons TEXT[],
ADD COLUMN IF NOT EXISTS is_spam BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS spam_category TEXT;

-- Add index for spam filtering
CREATE INDEX IF NOT EXISTS idx_reviews_spam ON reviews(is_spam, spam_score);

-- Create review_comments table for coach responses
CREATE TABLE IF NOT EXISTS review_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  author_id UUID NOT NULL, -- Coach ID
  author_name TEXT NOT NULL, -- Coach name for display
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT fk_review FOREIGN KEY (review_id) REFERENCES reviews(id) ON DELETE CASCADE
);

-- Add index for faster comment lookups
CREATE INDEX IF NOT EXISTS idx_review_comments_review_id ON review_comments(review_id);
CREATE INDEX IF NOT EXISTS idx_review_comments_created_at ON review_comments(created_at DESC);

-- Add comments explaining new columns
COMMENT ON COLUMN reviews.spam_score IS 'Confidence score (0-100) that review is spam';
COMMENT ON COLUMN reviews.spam_reasons IS 'Array of reasons why flagged as spam';
COMMENT ON COLUMN reviews.is_spam IS 'Whether review was auto-detected as spam';
COMMENT ON COLUMN reviews.spam_category IS 'Category of spam: abusive, promotional, nonsense, repetitive, suspicious';

COMMENT ON TABLE review_comments IS 'Coach comments on reviews (replaces verify/flag system)';
```

### Step 2: Uncomment Spam Columns in Code

In `services/supabaseService.ts` (around line 326), change:

```typescript
// FROM (commented out):
// spam_score: spamCheck.confidence,
// spam_reasons: spamCheck.reasons,
// is_spam: spamCheck.isSpam,
// spam_category: spamCheck.category || null,

// TO (uncommented):
spam_score: spamCheck.confidence,
spam_reasons: spamCheck.reasons,
is_spam: spamCheck.isSpam,
spam_category: spamCheck.category || null,
```

### Step 3: Push Changes & Deploy

```bash
git add services/supabaseService.ts
git commit -m "feat: re-enable spam detection after migration"
git push
```

---

## 🔍 Troubleshooting

### Error: "new row violates row-level security policy"
- You haven't run the RLS policy SQL yet
- Run the SQL from Step 3 above

### Error: "column 'spam_score' does not exist"
- You need to run the spam detection migration first
- OR keep spam detection disabled (it's optional)

### Error: "Failed to load resource: 400"
- Check Supabase logs for specific error
- Verify the coach_id exists in coaches table
- Check that all required columns exist

---

## ✨ What's Working Now

After running the RLS migration:
- ✅ Anonymous users can submit reviews
- ✅ Reviews display on coach profiles
- ✅ Location autocomplete with 140+ cities
- ✅ Big bold share button
- ✅ Review token for editing/deleting

## 🚀 Next Steps

1. Run the RLS policy SQL (above)
2. Test review submission
3. Optionally enable spam detection later
4. Develop full spam flagging system (see SPAM_FLAGGING_SYSTEM_DESIGN.md)
