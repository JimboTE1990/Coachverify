# Account Access & Analytics Improvements Plan

## Issue 1: Expired Account Dashboard Access

### Current Behavior
When a subscription expires (cancelled or trial ended):
- ✅ Profile hidden from public search
- ✅ Red banner shows "Your subscription has ended"
- ❌ **PROBLEM**: Dashboard tab switching might be blocked
- ❌ **PROBLEM**: Can't access Account Settings or Subscription tabs

### Desired Behavior
Expired users should have access to:
- ✅ **Profile tab** - Edit details for when they reactivate
- ✅ **Account Settings tab** - Change email, password, delete account
- ✅ **Subscription tab** - Reactivate or manage billing
- ❌ **Analytics tab** - Disabled (no active subscription)

Expired users should NOT have:
- ❌ Public profile visibility
- ❌ Analytics data
- ❌ Client inquiries

### Implementation Plan

**File:** `pages/CoachDashboard.tsx`

**Change 1: Allow tab switching for expired users**
```typescript
// Current: Might be blocking tab switches
// Fix: Allow Profile, Account, Subscription tabs even when expired

const allowedTabsWhenExpired = ['profile', 'account', 'subscription'];
const isTabAllowed = (tab: string) => {
  if (trialStatus.isExpired) {
    return allowedTabsWhenExpired.includes(tab);
  }
  return true; // All tabs allowed for active users
};
```

**Change 2: Disable analytics tab visually**
```typescript
<button
  onClick={() => setActiveTab('analytics')}
  disabled={trialStatus.isExpired}
  className={`... ${trialStatus.isExpired ? 'opacity-50 cursor-not-allowed' : ''}`}
>
  Analytics
  {trialStatus.isExpired && (
    <span className="ml-2 text-xs bg-slate-200 px-2 py-1 rounded">
      Requires active subscription
    </span>
  )}
</button>
```

**Change 3: Show helpful message in disabled analytics tab**
```typescript
{activeTab === 'analytics' && trialStatus.isExpired && (
  <div className="bg-amber-50 border border-amber-200 rounded-2xl p-8 text-center">
    <h3 className="text-xl font-bold text-slate-900 mb-2">
      Analytics Unavailable
    </h3>
    <p className="text-slate-600 mb-4">
      Reactivate your subscription to view profile analytics and client engagement metrics.
    </p>
    <button
      onClick={() => setActiveTab('subscription')}
      className="bg-brand-600 text-white px-6 py-3 rounded-xl font-bold"
    >
      Reactivate Subscription
    </button>
  </div>
)}
```

---

## Issue 2: Analytics Tracking Issues

### Current Analytics Features

**File:** `services/supabaseService.ts`

Currently tracking:
1. **Profile Views** - Incremented via `increment_profile_views(coach_id)` function
2. **Total Reviews** - Counted from reviews table
3. **Average Rating** - Calculated from reviews

**File:** `pages/CoachDashboard.tsx` (Analytics Tab)

Displays:
- Total profile views (lifetime count)
- Total reviews
- Average rating
- Last 30 days chart (placeholder - NOT IMPLEMENTED)

### Problems Identified

❌ **Profile views not tracking properly**
- Views increment on page load, but might not fire correctly
- No view deduplication (same user = multiple views)
- No time-series data (can't chart views over time)

❌ **No engagement metrics**
- Can't see which features clients interact with
- No booking link click tracking
- No email/phone click tracking

❌ **No date-range analytics**
- Can't see "views this week" vs "views last week"
- No trending data

### Recommended Analytics Architecture

#### **Tier 1: Essential Metrics** (Implement Now)
1. **Profile Views with Deduplication**
   - Track unique visitors (via session ID)
   - Store view events with timestamps
   - Show daily/weekly/monthly breakdown

2. **Contact Engagement**
   - Track booking link clicks
   - Track email button clicks
   - Track phone button clicks

3. **Review Performance**
   - Total reviews
   - Average rating
   - Recent reviews (last 30 days)

#### **Tier 2: Advanced Metrics** (Future)
4. **Conversion Funnel**
   - Profile views → Contact clicks → Bookings

5. **Search Performance**
   - How often coach appears in search results
   - Click-through rate from search

6. **Time-based Trends**
   - View graphs (daily, weekly, monthly)
   - Rating trends over time

### Implementation Plan

#### **Step 1: Create Analytics Events Table**

```sql
CREATE TABLE analytics_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  coach_id UUID REFERENCES coaches(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL, -- 'profile_view', 'booking_click', 'email_click', 'phone_click'
  session_id TEXT, -- For deduplication
  user_agent TEXT,
  referrer TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for fast queries
CREATE INDEX idx_analytics_coach_date ON analytics_events(coach_id, created_at DESC);
CREATE INDEX idx_analytics_type_date ON analytics_events(event_type, created_at DESC);
CREATE INDEX idx_analytics_session ON analytics_events(session_id, coach_id, event_type);
```

#### **Step 2: Track Profile Views**

**File:** `pages/CoachDetails.tsx`

```typescript
useEffect(() => {
  if (coach?.id) {
    const trackView = async () => {
      const sessionId = sessionStorage.getItem('visitor_session') ||
                        crypto.randomUUID();
      sessionStorage.setItem('visitor_session', sessionId);

      await trackAnalyticsEvent({
        coachId: coach.id,
        eventType: 'profile_view',
        sessionId,
        userAgent: navigator.userAgent,
        referrer: document.referrer
      });
    };
    trackView();
  }
}, [coach?.id]);
```

#### **Step 3: Track Contact Clicks**

```typescript
// Booking link
<a
  href={bookingLink.url}
  onClick={() => trackAnalyticsEvent({
    coachId: coach.id,
    eventType: 'booking_click'
  })}
>

// Email
<a
  href={`mailto:${email}`}
  onClick={() => trackAnalyticsEvent({
    coachId: coach.id,
    eventType: 'email_click'
  })}
>

// Phone
<a
  href={`tel:${phone}`}
  onClick={() => trackAnalyticsEvent({
    coachId: coach.id,
    eventType: 'phone_click'
  })}
>
```

#### **Step 4: Analytics Dashboard**

**File:** `pages/CoachDashboard.tsx`

```typescript
// Fetch analytics
const analytics = await getCoachAnalytics(coachId);

// Returns:
{
  profileViews: {
    total: 145,
    last7Days: 23,
    last30Days: 78,
    daily: [{ date: '2026-02-21', count: 5 }, ...]
  },
  contactClicks: {
    booking: 12,
    email: 8,
    phone: 3
  },
  reviews: {
    total: 15,
    average: 4.8,
    recent: [...]
  }
}
```

#### **Step 5: Analytics UI**

```typescript
<div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
  {/* Profile Views Card */}
  <div className="bg-white rounded-2xl border-2 border-slate-200 p-6">
    <div className="flex items-center justify-between mb-2">
      <h3 className="text-sm font-bold text-slate-600 uppercase">Profile Views</h3>
      <Eye className="h-5 w-5 text-brand-600" />
    </div>
    <p className="text-3xl font-black text-slate-900">{analytics.profileViews.total}</p>
    <p className="text-sm text-slate-500 mt-1">
      +{analytics.profileViews.last7Days} this week
    </p>
  </div>

  {/* Contact Engagement Card */}
  <div className="bg-white rounded-2xl border-2 border-slate-200 p-6">
    <h3 className="text-sm font-bold text-slate-600 uppercase mb-3">Contact Clicks</h3>
    <div className="space-y-2">
      <div className="flex justify-between">
        <span className="text-sm text-slate-600">Booking Link</span>
        <span className="font-bold text-slate-900">{analytics.contactClicks.booking}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-sm text-slate-600">Email</span>
        <span className="font-bold text-slate-900">{analytics.contactClicks.email}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-sm text-slate-600">Phone</span>
        <span className="font-bold text-slate-900">{analytics.contactClicks.phone}</span>
      </div>
    </div>
  </div>

  {/* Reviews Card */}
  <div className="bg-white rounded-2xl border-2 border-slate-200 p-6">
    <h3 className="text-sm font-bold text-slate-600 uppercase mb-2">Reviews</h3>
    <div className="flex items-baseline gap-2 mb-1">
      <p className="text-3xl font-black text-slate-900">{analytics.reviews.average}</p>
      <p className="text-lg text-slate-500">/ 5.0</p>
    </div>
    <p className="text-sm text-slate-500">{analytics.reviews.total} total reviews</p>
  </div>
</div>

{/* Views Chart */}
<div className="bg-white rounded-2xl border-2 border-slate-200 p-6">
  <h3 className="text-lg font-bold text-slate-900 mb-4">Profile Views (Last 30 Days)</h3>
  <SimpleLineChart data={analytics.profileViews.daily} />
</div>
```

---

## Implementation Priority

### Phase 1: Fix Account Access (URGENT)
- [ ] Allow Profile, Account, Subscription tabs for expired users
- [ ] Disable Analytics tab with helpful message
- [ ] Test with expired account

### Phase 2: Analytics Foundation (HIGH PRIORITY)
- [ ] Create `analytics_events` table
- [ ] Implement view tracking with deduplication
- [ ] Implement contact click tracking
- [ ] Build analytics query service

### Phase 3: Analytics Dashboard (MEDIUM PRIORITY)
- [ ] Build metric cards UI
- [ ] Add daily views chart
- [ ] Add time range filters (7 days, 30 days, all time)
- [ ] Test with real data

### Phase 4: Advanced Analytics (FUTURE)
- [ ] Search appearance tracking
- [ ] Conversion funnel
- [ ] Email reports
- [ ] Competitor benchmarks

---

## Questions for User

1. **Account Access:** Should expired users be able to update their profile photo/bio, or should profile editing also be locked until reactivation?

2. **Analytics Priority:** Which metrics are most important to you?
   - Profile views (how many people saw the profile)
   - Contact engagement (booking/email/phone clicks)
   - Review performance (rating trends)
   - Search performance (how often they appear in results)

3. **Analytics Scope:** Do you want to implement Tier 1 (Essential Metrics) now, or plan for Tier 2 (Advanced) as well?

4. **Privacy:** Should coaches see any visitor information (location, referrer) or just aggregated counts?

---

**Next Steps:** Let me know your preferences and I'll implement the fixes!
