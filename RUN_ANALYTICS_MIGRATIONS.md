# Analytics Tracking Setup Instructions

## Issue
Analytics is not tracking profile views because the database tables don't exist yet.

## Solution
Run the SQL migrations in your Supabase dashboard.

## Steps

### 1. Create Profile Views Table
Go to: [Supabase Dashboard → SQL Editor](https://supabase.com/dashboard)

Copy and paste the contents of: `supabase/migrations/20260221_create_profile_views.sql`

Click **RUN**

### 2. Create Contact Clicks Table
Copy and paste the contents of: `supabase/migrations/20260221_create_contact_clicks.sql`

Click **RUN**

### 3. Verify Tables Were Created
Run this query to check:
```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('profile_views', 'contact_clicks');
```

You should see both tables listed.

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
