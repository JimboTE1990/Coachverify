# CoachDog Supabase Backend Setup Guide

This guide will walk you through setting up the Supabase backend for CoachDog.

## Prerequisites

- A Supabase account (sign up at https://supabase.com)
- Your Supabase project: `whhwvuugrzbyvobwfmce`

## Step 1: Run the Database Schema

1. Go to your Supabase project: https://app.supabase.com/project/whhwvuugrzbyvobwfmce
2. Navigate to **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy the entire contents of `supabase-schema.sql` and paste it into the editor
5. Click **Run** to execute the schema

This will create:
- All necessary tables (coaches, reviews, social_links, analytics, etc.)
- Row Level Security policies for data protection
- Indexes for performance
- Helpful views and triggers

## Step 2: Get Your API Keys

1. Go to **Project Settings** → **API** in your Supabase dashboard
2. Copy your **Project URL** (should be: `https://whhwvuugrzbyvobwfmce.supabase.co`)
3. Copy your **anon/public** API key

## Step 3: Configure Environment Variables

1. Open `.env.local` in your project root
2. Replace the placeholder values with your actual keys:

```env
VITE_SUPABASE_URL=https://whhwvuugrzbyvobwfmce.supabase.co
VITE_SUPABASE_ANON_KEY=your_actual_anon_key_here
```

3. Save the file

## Step 4: Enable Authentication

1. In Supabase dashboard, go to **Authentication** → **Providers**
2. Enable **Email** provider (for coach/client sign-up)
3. Configure email templates if desired
4. (Optional) Enable social providers like Google, LinkedIn

## Step 5: Switch from Mock Data to Supabase

To use the Supabase backend instead of mock data, update your imports:

### Before (Mock Data):
```typescript
import { getCoaches, getCoachById } from './services/mockData';
```

### After (Supabase):
```typescript
import { getCoaches, getCoachById } from './services/supabaseService';
```

You'll need to update imports in these files:
- `pages/CoachList.tsx`
- `pages/CoachDetails.tsx`
- `pages/CoachDashboard.tsx`
- `pages/Admin.tsx`

## Step 6: Test the Connection

1. Restart your dev server: `npm run dev`
2. Open your browser console
3. Navigate to the coaches page
4. You should see data being fetched from Supabase (or empty results if no data exists yet)

## Features Included

### For Coaches:
- **Profile Management**: Full control over bio, photo, specialties, certifications
- **Social Links**: Add LinkedIn, website, and other social media links
- **Analytics Dashboard**:
  - Track profile views over time
  - Monitor clicks on social media links
  - See which links drive the most traffic
- **Verification System**: Submit documents for EMCC/ICF verification
- **Subscription Management**: Trial, active, expired status tracking

### For Clients:
- **Search & Filter**: Find coaches by specialty, location, format, price
- **Matching Questionnaire**: Get personalized coach recommendations
- **Reviews**: Read and write verified reviews

### For Admins:
- **Verification Queue**: Approve/deny coach verifications
- **Review Moderation**: Flag inappropriate reviews
- **Analytics**: Platform-wide statistics

## Available API Functions

### Coach Services
```typescript
getCoaches(): Promise<Coach[]>
getCoachById(id: string): Promise<Coach | null>
updateCoach(coach: Coach): Promise<boolean>
registerCoach(email: string, password: string, name: string): Promise<Coach | null>
toggleVerifyCoach(coachId: string): Promise<boolean>
verifyCoachLicense(body: string, regNumber: string): Promise<boolean>
```

### Review Services
```typescript
addReview(coachId: string, authorName: string, rating: number, reviewText: string): Promise<Review | null>
toggleFlagReview(coachId: string, reviewId: string): Promise<boolean>
```

### Analytics Services
```typescript
trackProfileView(coachId: string, referrer?: string): Promise<void>
trackLinkClick(socialLinkId: string, coachId: string, referrer?: string): Promise<void>
getCoachAnalytics(coachId: string, startDate?: string, endDate?: string): Promise<Analytics>
```

### Search Services
```typescript
searchCoaches(filters: {
  specialty?: string;
  format?: string;
  minRate?: number;
  maxRate?: number;
  location?: string;
}): Promise<Coach[]>
```

## Analytics Integration

The analytics system automatically tracks:

1. **Profile Views**: Every time someone views a coach's profile
   - Timestamp
   - Referrer (where they came from)
   - User agent
   - Session ID

2. **Link Clicks**: When someone clicks a coach's social media links
   - Which link was clicked
   - Timestamp
   - Referrer
   - User agent

### Adding Analytics to Your Components

In `CoachDetails.tsx`, add this when the component loads:

```typescript
import { trackProfileView } from '../services/supabaseService';

useEffect(() => {
  if (coach) {
    trackProfileView(coach.id, document.referrer);
  }
}, [coach]);
```

For social links in the coach profile:

```typescript
import { trackLinkClick } from '../services/supabaseService';

const handleLinkClick = async (link: SocialLink, linkId: string) => {
  await trackLinkClick(linkId, coach.id, document.referrer);
  window.open(link.url, '_blank');
};
```

## Row Level Security (RLS)

The database uses RLS to protect data:

- **Public can**: View verified coaches, their profiles, reviews
- **Coaches can**: Update own profile, view own analytics, manage own content
- **Clients can**: Create reviews, submit questionnaires, view match results
- **Anonymous can**: Track views/clicks (for analytics)

## Future Enhancements

### EMCC/ICF API Integration
To connect to actual accreditation bodies:

1. Update `verifyCoachLicense()` in `supabaseService.ts`
2. Add API credentials to `.env.local`
3. Implement OAuth or API key authentication
4. Store verification results in `verification_body` and `verification_number` fields

### Google Analytics Integration
For coaches who want GA tracking on their links:

1. Add a `google_analytics_id` field to the coaches table
2. Modify the link click tracking to also send events to GA
3. Provide coaches with a GA dashboard widget in their profile

## Troubleshooting

### "Missing Supabase environment variables"
- Make sure `.env.local` exists and has the correct values
- Restart your dev server after updating `.env.local`

### "Failed to fetch coaches"
- Check browser console for specific errors
- Verify your API keys in Supabase dashboard
- Make sure the schema was run successfully

### "Unauthorized" errors
- Check RLS policies in Supabase dashboard
- Make sure users are authenticated before updating data
- Verify the user owns the resource they're trying to modify

## Support

For issues with:
- **Supabase**: Check the Supabase docs at https://supabase.com/docs
- **CoachDog**: Open an issue in the repository

## Next Steps

1. Run the schema in Supabase SQL Editor
2. Add your API keys to `.env.local`
3. Switch imports from `mockData` to `supabaseService`
4. Test the integration
5. (Optional) Seed some test data
6. Deploy to production!
