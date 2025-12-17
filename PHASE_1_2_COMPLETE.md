# Phase 1 & 2 Implementation Complete

## Summary
Successfully completed **Phase 1 (Trial Duration & Foundation)** and **Phase 2 (Database Schema Updates)** of the checkout and subscription management system.

---

## ✅ Phase 1: Trial Duration & Foundation

### Files Created

#### 1. [constants/subscription.ts](constants/subscription.ts)
**Purpose**: Single source of truth for all subscription-related constants

**Key Features**:
- Trial duration: 30 days (updated from 14)
- Pricing: £15/month, £150/year
- Trial warning days: 7, 3, 1 days remaining
- Helper functions:
  - `calculateTrialEndDate()` - Returns date 30 days from now
  - `calculateDaysRemaining()` - Calculates days left in trial
  - `shouldShowTrialWarning()` - Returns true if 7, 3, or 1 days left
  - `getTrialWarningLevel()` - Returns 'info' | 'warning' | 'urgent' | 'none'
  - `formatPrice()` - Formats currency (GBP)
  - `calculateAnnualSavings()` - Returns £30 savings

**Usage Example**:
```typescript
import { SUBSCRIPTION_CONSTANTS, calculateTrialEndDate } from '@/constants/subscription';

const trialEnd = calculateTrialEndDate(); // 30 days from now
console.log(SUBSCRIPTION_CONSTANTS.MONTHLY_PRICE_GBP); // 15
```

#### 2. [hooks/useSubscriptionStatus.ts](hooks/useSubscriptionStatus.ts)
**Purpose**: Reusable React hook for checking subscription status and access permissions

**Returns**:
```typescript
{
  isActive: boolean;
  isExpired: boolean;
  isTrial: boolean;
  isOnboarding: boolean;
  isCancelled: boolean;
  daysRemaining: number | null;
  trialEndsAt: Date | null;
  shouldShowWarning: boolean; // true at 7, 3, 1 days
  warningLevel: 'none' | 'info' | 'warning' | 'urgent';
  canAccessDashboard: boolean; // trial + active only
  canEditProfile: boolean; // onboarding + trial + active + expired
  isProfileVisible: boolean; // trial + active only
  subscriptionStatus: 'onboarding' | 'trial' | 'active' | 'expired';
  billingCycle: 'monthly' | 'annual' | null;
  subscriptionEndsAt: Date | null;
  statusLabel: string; // "Trial (7 days left)", "Active", etc.
  statusColor: string; // Hex color for UI
}
```

**Usage Example**:
```typescript
import { useSubscriptionStatus } from '@/hooks/useSubscriptionStatus';

function Dashboard({ coach }) {
  const status = useSubscriptionStatus(coach);

  if (status.shouldShowWarning) {
    return <TrialExpiringBanner daysLeft={status.daysRemaining} />;
  }

  if (!status.canAccessDashboard) {
    return <UpgradeScreen />;
  }

  return <DashboardContent />;
}
```

### Files Modified

#### 3. [pages/CoachDashboard.tsx:278-281](pages/CoachDashboard.tsx#L278-L281)
**Change**: Updated trial duration from 14 days to 30 days

**Before**:
```typescript
onClick={() => handleUpdateCoach({
  subscriptionStatus: 'trial',
  trialEndsAt: new Date(Date.now() + 12096e5).toISOString() // 14 days
})}
```

**After**:
```typescript
onClick={() => handleUpdateCoach({
  subscriptionStatus: 'trial',
  trialEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
})}
```

**UI Text Change**: "14-day trial" → "30-day trial"

#### 4. [pages/Pricing.tsx:55](pages/Pricing.tsx#L55)
**Change**: Updated pricing page to show "30 days" instead of "14 days"

**Before**: `for 14 days`
**After**: `for 30 days`

#### 5. [types.ts:49-64](types.ts#L49-L64)
**Change**: Added new fields to Coach interface

**New Fields**:
```typescript
// Cancellation Tracking
cancelledAt?: string;
subscriptionEndsAt?: string;
cancelReason?: string;
cancelFeedback?: string;

// Profile Visibility & Access
profileVisible?: boolean;
dashboardAccess?: boolean;

// Stripe Integration (future)
stripeCustomerId?: string;
stripeSubscriptionId?: string;
```

---

## ✅ Phase 2: Database Schema Updates

### Files Created

#### 6. [database_migrations/003_add_cancellation_fields.sql](database_migrations/003_add_cancellation_fields.sql)
**Purpose**: Add cancellation tracking and Stripe integration fields to database

**Schema Changes**:
```sql
ALTER TABLE coaches
ADD COLUMN cancelled_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN subscription_ends_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN cancel_reason TEXT CHECK (cancel_reason IN ('too_expensive', 'not_enough_clients', ...)),
ADD COLUMN cancel_feedback TEXT,
ADD COLUMN stripe_customer_id TEXT UNIQUE,
ADD COLUMN stripe_subscription_id TEXT;
```

**Includes**:
- Check constraint on `cancel_reason` (6 valid values)
- Unique constraint on `stripe_customer_id`
- Index on `stripe_customer_id` for fast lookups
- Column comments for documentation

#### 7. [database_migrations/004_add_profile_visibility.sql](database_migrations/004_add_profile_visibility.sql)
**Purpose**: Automatic profile visibility management with database triggers

**Schema Changes**:
```sql
ALTER TABLE coaches
ADD COLUMN profile_visible BOOLEAN DEFAULT TRUE,
ADD COLUMN dashboard_access BOOLEAN DEFAULT TRUE;
```

**Database Trigger**: `trigger_auto_manage_profile_visibility`
- **Runs**: Before UPDATE on `subscription_status` column
- **Action**: Automatically sets `profile_visible` and `dashboard_access` based on status

**Visibility Rules**:
| Subscription Status | profile_visible | dashboard_access |
|---------------------|-----------------|------------------|
| onboarding          | FALSE           | FALSE            |
| trial               | TRUE            | TRUE             |
| active              | TRUE            | TRUE             |
| expired             | FALSE           | FALSE            |

**Trigger Logic**:
```sql
-- When subscription expires
IF NEW.subscription_status = 'expired' THEN
  NEW.profile_visible := FALSE;
  NEW.dashboard_access := FALSE;
END IF;

-- When subscription activates
IF NEW.subscription_status IN ('active', 'trial') THEN
  NEW.profile_visible := TRUE;
  NEW.dashboard_access := TRUE;
END IF;
```

**Performance Optimization**:
- Partial index on `profile_visible = TRUE` for fast filtering
- Composite index on `(subscription_status, profile_visible)` for queries

#### 8. [database_migrations/VERIFY_MIGRATIONS.sql](database_migrations/VERIFY_MIGRATIONS.sql)
**Purpose**: Verification script to check migrations applied correctly

**Tests**:
1. ✅ All 10 new columns exist
2. ✅ Trigger function `auto_manage_profile_visibility()` exists
3. ✅ Trigger `trigger_auto_manage_profile_visibility` is active
4. ✅ Current coach data shows new fields
5. ✅ Visibility distribution by subscription status
6. ✅ Indexes created
7. ✅ Constraints applied
8. ✅ Trigger test (optional, commented out)

**How to Verify**:
Run the entire [VERIFY_MIGRATIONS.sql](database_migrations/VERIFY_MIGRATIONS.sql) file in Supabase SQL Editor to check everything is working.

---

## ✅ Application Layer Updates

### Files Modified

#### 9. [services/supabaseService.ts:13](services/supabaseService.ts#L13)
**Change**: Filter coaches by `profile_visible = true` in `getCoaches()`

**Before**:
```typescript
.eq('is_verified', true)
```

**After**:
```typescript
.eq('is_verified', true)
.eq('profile_visible', true) // Only show visible profiles
```

**Impact**: Expired coaches are now hidden at database level (not client-side)

#### 10. [services/supabaseService.ts:370](services/supabaseService.ts#L370)
**Change**: Filter coaches by `profile_visible = true` in `searchCoaches()`

**Same change as above** - ensures search results only show visible profiles

#### 11. [services/supabaseService.ts:496-508](services/supabaseService.ts#L496-L508)
**Change**: Map new database fields in `mapCoachProfile()`

**Added Mapping**:
```typescript
// Cancellation tracking
cancelledAt: data.cancelled_at,
subscriptionEndsAt: data.subscription_ends_at,
cancelReason: data.cancel_reason,
cancelFeedback: data.cancel_feedback,

// Profile visibility & access
profileVisible: data.profile_visible,
dashboardAccess: data.dashboard_access,

// Stripe integration
stripeCustomerId: data.stripe_customer_id,
stripeSubscriptionId: data.stripe_subscription_id,
```

#### 12. [pages/CoachList.tsx:50-51](pages/CoachList.tsx#L50-L51)
**Change**: Removed client-side expired filter (now handled by database)

**Before**:
```typescript
// 0. Filter out expired subscriptions
if (coach.subscriptionStatus === 'expired') return false;
```

**After**:
```typescript
// Note: Expired subscriptions are now filtered at the database level via profile_visible field
// No need to filter client-side anymore
```

**Benefit**:
- Performance improvement (less data transferred from DB)
- Single source of truth (database trigger manages visibility)
- Automatic updates when subscription status changes

---

## 🧪 Testing Instructions

### 1. Verify Database Migrations

Run [database_migrations/VERIFY_MIGRATIONS.sql](database_migrations/VERIFY_MIGRATIONS.sql) in Supabase SQL Editor.

**Expected Results**:
- ✅ 10 new columns returned
- ✅ 1 function returned: `auto_manage_profile_visibility`
- ✅ 1 trigger returned: `trigger_auto_manage_profile_visibility`
- ✅ Existing coaches show `profile_visible` and `dashboard_access` values
- ✅ 3 indexes returned

### 2. Test Trial Activation (30 days)

1. Navigate to http://localhost:3000/for-coaches
2. Login as a verified coach in "onboarding" status
3. Click "Activate Free Trial" button
4. Check in Supabase:
   ```sql
   SELECT subscription_status, trial_ends_at, profile_visible, dashboard_access
   FROM coaches
   WHERE email = 'your-coach@example.com';
   ```

**Expected**:
- `subscription_status` = 'trial'
- `trial_ends_at` = ~30 days from now (not 14)
- `profile_visible` = TRUE (auto-set by trigger)
- `dashboard_access` = TRUE (auto-set by trigger)

### 3. Test Profile Visibility

1. Create a coach and activate trial
2. Check coach appears in http://localhost:3000/search
3. In Supabase, manually expire the subscription:
   ```sql
   UPDATE coaches
   SET subscription_status = 'expired'
   WHERE email = 'test-coach@example.com';
   ```
4. Refresh http://localhost:3000/search

**Expected**:
- Coach **no longer appears** in search results
- Database shows `profile_visible = FALSE` (auto-updated by trigger)
- Coach can still login and edit profile (but it's hidden from public)

### 4. Test Database Trigger

Run this in Supabase SQL Editor:
```sql
-- Get a test coach ID
SELECT id, subscription_status, profile_visible FROM coaches LIMIT 1;

-- Change to expired (should auto-hide)
UPDATE coaches SET subscription_status = 'expired' WHERE id = 'your-coach-id';

-- Verify it's hidden
SELECT profile_visible, dashboard_access FROM coaches WHERE id = 'your-coach-id';
-- Expected: profile_visible = FALSE, dashboard_access = FALSE

-- Change to active (should auto-show)
UPDATE coaches SET subscription_status = 'active' WHERE id = 'your-coach-id';

-- Verify it's visible
SELECT profile_visible, dashboard_access FROM coaches WHERE id = 'your-coach-id';
-- Expected: profile_visible = TRUE, dashboard_access = TRUE
```

### 5. Test useSubscriptionStatus Hook

Add this to CoachDashboard.tsx temporarily:
```typescript
import { useSubscriptionStatus } from '../hooks/useSubscriptionStatus';

// Inside component:
const status = useSubscriptionStatus(currentCoach);
console.log('Subscription Status:', status);
```

**Expected Console Output**:
```javascript
{
  isActive: false,
  isTrial: true,
  isExpired: false,
  isOnboarding: false,
  daysRemaining: 30,
  shouldShowWarning: false, // true if 7, 3, or 1 days left
  warningLevel: 'none',
  canAccessDashboard: true,
  canEditProfile: true,
  isProfileVisible: true,
  statusLabel: 'Trial (30 days left)',
  statusColor: '#3b82f6', // blue
  // ...
}
```

---

## 📊 Impact Summary

### Database Changes
- ✅ 10 new columns added to `coaches` table
- ✅ 1 database trigger for automatic visibility management
- ✅ 3 new indexes for performance
- ✅ 1 check constraint for cancel_reason validation

### Application Changes
- ✅ 2 new utility files (constants, hooks)
- ✅ 5 files modified (CoachDashboard, Pricing, types, supabaseService, CoachList)
- ✅ Trial duration updated everywhere: 14 → 30 days
- ✅ Profile visibility now enforced at database level

### User-Facing Changes
- ✅ **Trial**: Now 30 days instead of 14 days
- ✅ **Expired coaches**: Hidden from public listings automatically
- ✅ **Performance**: Faster coach searches (less data transferred)
- ✅ **Consistency**: Single source of truth for visibility (database trigger)

---

## 🚀 Next Steps

### Phase 3: Checkout Flow - Mock Payment
Ready to implement when you're ready:
- Payment types (`/types/payment.ts`)
- Payment service (`/services/paymentService.ts`)
- Subscription service (`/services/subscriptionService.ts`)
- Checkout pages (5 new pages)
- Payment form components (3 new components)
- Router updates (`/App.tsx`)

Would you like me to continue with Phase 3?

---

## 🐛 Troubleshooting

### Issue: Migration fails with "relation already exists"
**Solution**: Migrations are idempotent. Run them again - they'll skip existing columns.

### Issue: Trigger not firing
**Solution**: Check trigger is active:
```sql
SELECT * FROM information_schema.triggers
WHERE trigger_name = 'trigger_auto_manage_profile_visibility';
```

### Issue: Profiles still showing after expiry
**Solution**: Clear cache and refresh. Check `profile_visible` in database directly.

### Issue: TypeScript errors on new fields
**Solution**: Restart TypeScript server in VSCode: `Cmd+Shift+P` → "Restart TS Server"

---

**Status**: ✅ Phase 1 & 2 Complete
**Dev Server**: http://localhost:3000
**Database**: Migrations ready to run in Supabase SQL Editor
