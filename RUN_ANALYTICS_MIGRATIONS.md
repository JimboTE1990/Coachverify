# Analytics Tracking Setup Instructions

## Issue
Analytics is not tracking profile views because the database tables don't exist yet.

## Solution
Run the SQL migrations in your Supabase dashboard.

## Steps

### 1. Create Profile Views Table
Go to: [Supabase Dashboard → SQL Editor](https://supabase.com/dashboard)

**Copy this SQL and run it:**

[📄 supabase/migrations/20260221_create_profile_views.sql](supabase/migrations/20260221_create_profile_views.sql)

```sql
-- Create profile_views table for tracking profile visits
CREATE TABLE IF NOT EXISTS profile_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID NOT NULL REFERENCES coaches(id) ON DELETE CASCADE,
  viewed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  session_id TEXT NOT NULL,
  viewer_user_agent TEXT,
  referrer TEXT
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_profile_views_coach_id ON profile_views(coach_id);
CREATE INDEX IF NOT EXISTS idx_profile_views_viewed_at ON profile_views(viewed_at);
CREATE INDEX IF NOT EXISTS idx_profile_views_session_id ON profile_views(session_id);

-- Enable Row Level Security
ALTER TABLE profile_views ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can insert profile views (for tracking)
CREATE POLICY "Allow anonymous insert profile views"
  ON profile_views
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Policy: Coaches can view their own profile views
CREATE POLICY "Allow coaches to view own profile views"
  ON profile_views
  FOR SELECT
  TO authenticated
  USING (
    coach_id IN (
      SELECT id FROM coaches WHERE user_id::uuid = auth.uid()
    )
  );

-- Add comments for documentation
COMMENT ON TABLE profile_views IS 'Tracks profile page views with session-based deduplication';
COMMENT ON COLUMN profile_views.session_id IS 'Browser session ID for deduplication (30 min window)';
```

Click **RUN**

### 2. Create Contact Clicks Table
**Copy this SQL and run it:**

[📄 supabase/migrations/20260221_create_contact_clicks.sql](supabase/migrations/20260221_create_contact_clicks.sql)

```sql
-- Create contact_clicks table for tracking contact interactions
CREATE TABLE IF NOT EXISTS contact_clicks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID NOT NULL REFERENCES coaches(id) ON DELETE CASCADE,
  click_type TEXT NOT NULL, -- 'email', 'phone', 'booking', 'whatsapp'
  session_id TEXT NOT NULL,
  clicked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  referrer TEXT,
  user_agent TEXT
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_contact_clicks_coach_id ON contact_clicks(coach_id);
CREATE INDEX IF NOT EXISTS idx_contact_clicks_type ON contact_clicks(click_type);
CREATE INDEX IF NOT EXISTS idx_contact_clicks_clicked_at ON contact_clicks(clicked_at);

-- Enable Row Level Security
ALTER TABLE contact_clicks ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can insert contact clicks (for tracking)
CREATE POLICY "Allow anonymous insert contact clicks"
  ON contact_clicks
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Policy: Coaches can view their own contact clicks
CREATE POLICY "Allow coaches to view own contact clicks"
  ON contact_clicks
  FOR SELECT
  TO authenticated
  USING (
    coach_id IN (
      SELECT id FROM coaches WHERE user_id::uuid = auth.uid()
    )
  );

-- Add comments for documentation
COMMENT ON TABLE contact_clicks IS 'Tracks when visitors click on contact methods (email, phone, booking links)';
COMMENT ON COLUMN contact_clicks.click_type IS 'Type of contact: email, phone, booking, whatsapp';
```

Click **RUN**

### 3. Create Review Comments Table
**Copy this SQL and run it:**

[📄 supabase/migrations/20260221_create_review_comments.sql](supabase/migrations/20260221_create_review_comments.sql)

```sql
-- Create review_comments table for coach comments on reviews
CREATE TABLE IF NOT EXISTS review_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  author_id UUID NOT NULL,
  author_name TEXT NOT NULL,
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_review_comments_review_id ON review_comments(review_id);
CREATE INDEX IF NOT EXISTS idx_review_comments_author_id ON review_comments(author_id);
CREATE INDEX IF NOT EXISTS idx_review_comments_created_at ON review_comments(created_at);

-- Enable Row Level Security
ALTER TABLE review_comments ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read comments (they're public)
CREATE POLICY "Allow public read review comments"
  ON review_comments
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Policy: Only authenticated coaches can insert comments
CREATE POLICY "Allow coaches to insert review comments"
  ON review_comments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    author_id::text IN (
      SELECT id::text FROM coaches WHERE user_id::uuid = auth.uid()
    )
  );

-- Add comments for documentation
COMMENT ON TABLE review_comments IS 'Public comments coaches can add to reviews on their profile';
COMMENT ON COLUMN review_comments.review_id IS 'The review this comment is attached to';
```

Click **RUN**

### 4. Verify Tables Were Created
Run this query to check:
```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('profile_views', 'contact_clicks', 'review_comments');
```

You should see all three tables listed.

## Testing

1. Visit any coach profile page in incognito mode (to simulate a new visitor)
2. Check browser console for: `[Analytics] Profile view tracked successfully`
3. Go to coach dashboard → Analytics tab
4. You should see the profile view counted

## Notes

- Profile views are deduplicated by session (30 min window)
- Contact clicks (email, phone, booking, whatsapp) are tracked separately
- All tracking happens silently - errors don't break the user experience
- The tracking code is already in place and working, it just needs the database tables

## Files Modified
- `services/supabaseService.ts` - Added `trackProfileView()` and `getCoachAnalytics()`
- `pages/CoachDetails.tsx` - Calls `trackProfileView()` on page load
- `pages/CoachDashboard.tsx` - Shows analytics in Analytics tab
