# Delete Account System Redesign

## User Requirements

Based on the latest requirements, the new delete account system must:

1. **Password Protection**: Delete button moved to password-protected sub-page
2. **Restore Option**: Ability to restore accidentally deleted accounts
3. **Subscription Enforcement**: Only allow deletion if subscription is cancelled
4. **Billing Period Scheduling**: Deletion takes effect at end of membership period (month/annual)
5. **30-Day Security Delay**: Permanent deletion occurs 30 days after scheduled deletion date
6. **Supabase Restoration**: Confirm accounts can be restored via Supabase if requested

---

## Current Implementation vs New Requirements

### Current State ✅ Already Has:
- Soft deletion with `scheduled_deletion_at` field
- Subscription status check (blocks if active)
- 30-day deletion window
- Double confirmation (alert + typing "DELETE")

### What Needs to Change ❌:
- Delete button is in main Account tab → Move to separate password-protected page
- Deletion happens immediately on request → Should schedule for end of billing period
- No restore functionality → Add restore capability
- 30 days from deletion request → 30 days from billing period end

---

## New Database Schema

### Add to `coaches` table:

```sql
-- Deletion tracking
ALTER TABLE coaches
ADD COLUMN IF NOT EXISTS deletion_requested_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS deletion_effective_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS deletion_permanent_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS deletion_reason TEXT,
ADD COLUMN IF NOT EXISTS can_restore BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS restored_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS restored_by TEXT;

COMMENT ON COLUMN coaches.deletion_requested_at IS 'When user first requested account deletion';
COMMENT ON COLUMN coaches.deletion_effective_date IS 'When account will be hidden/locked (end of billing period)';
COMMENT ON COLUMN coaches.deletion_permanent_date IS 'When data will be permanently deleted (effective_date + 30 days)';
COMMENT ON COLUMN coaches.deletion_reason IS 'Optional reason provided by user';
COMMENT ON COLUMN coaches.can_restore IS 'Whether account can still be restored (false after permanent deletion)';
COMMENT ON COLUMN coaches.restored_at IS 'When account was restored from deletion';
COMMENT ON COLUMN coaches.restored_by IS 'Who restored the account (user_id or admin)';
```

---

## New User Flow

### Step 1: Navigate to Delete Account Page

**Current**: Account tab → Scroll to bottom → Delete Account section
**New**: Account tab → "Delete Account" link → Separate password-protected page

```
Dashboard → Account Settings → [Delete Account] button
                                       ↓
                        Password confirmation modal
                                       ↓
                        Delete Account Detail Page
```

### Step 2: Delete Account Detail Page

**URL**: `/dashboard/delete-account`

**Content**:
```
┌─────────────────────────────────────────────────────┐
│  🔒 Delete Account (Password Required)              │
├─────────────────────────────────────────────────────┤
│                                                      │
│  ⚠️ DANGER ZONE                                     │
│                                                      │
│  Before You Delete:                                 │
│  ☐ Your subscription must be cancelled first        │
│  ☐ Account will remain active until [END DATE]      │
│  ☐ Profile hidden from search on [END DATE]         │
│  ☐ Data permanently deleted 30 days after [END DATE]│
│  ☐ You can restore within 30 days by contacting us  │
│                                                      │
│  What Gets Deleted:                                 │
│  • Profile and all information                      │
│  • Reviews and ratings                              │
│  • Verification status                              │
│  • Analytics data                                   │
│                                                      │
│  Timeline:                                          │
│  1. Today: Request deletion                         │
│  2. [END DATE]: Profile hidden, dashboard locked    │
│  3. [END DATE + 30]: Data permanently deleted       │
│                                                      │
│  Restoration Window:                                │
│  Contact support@coachdog.com within 30 days to     │
│  restore your account. After permanent deletion,    │
│  restoration is not possible.                       │
│                                                      │
│  Optional: Why are you leaving?                     │
│  [___________________________________]              │
│                                                      │
│  [Cancel]              [Request Account Deletion]   │
│                                                      │
└─────────────────────────────────────────────────────┘
```

### Step 3: Deletion Timeline

```
Day 0 (Today): User requests deletion
    ↓
    subscription_status remains 'active' (or current status)
    deletion_requested_at = NOW()
    deletion_effective_date = subscription_ends_at (end of billing period)
    deletion_permanent_date = deletion_effective_date + 30 days
    can_restore = TRUE
    ↓
Dashboard shows banner: "Account scheduled for deletion on [DATE]"
    ↓
End of Billing Period (deletion_effective_date):
    ↓
    subscription_status = 'expired'
    profile_visible = FALSE (hidden from search)
    Dashboard locked (shows paywall with restore option)
    ↓
30 Days Later (deletion_permanent_date):
    ↓
    Permanent deletion (via cron job):
    - Delete all coach data
    - Delete from auth.users
    - can_restore = FALSE
```

---

## Restoration Flow

### User Requests Restoration (Within 30 Days)

**Method 1: Email Support**
1. User emails support@coachdog.com
2. Support verifies identity
3. Admin restores via Supabase SQL:

```sql
-- Restore account
UPDATE coaches
SET subscription_status = 'active', -- Or previous status
    profile_visible = TRUE,
    deletion_requested_at = NULL,
    deletion_effective_date = NULL,
    deletion_permanent_date = NULL,
    can_restore = TRUE,
    restored_at = NOW(),
    restored_by = 'admin:EMAIL'
WHERE id = 'USER_ID';
```

**Method 2: Self-Service Restoration (If Implemented)**

User visits locked dashboard → "Restore Account" button:
```
┌─────────────────────────────────────────────────────┐
│  Your account is scheduled for deletion             │
│                                                      │
│  Deletion Date: 2026-03-15                          │
│  Days Remaining: 18 days                            │
│                                                      │
│  Changed your mind?                                 │
│                                                      │
│  [Restore My Account]                               │
│                                                      │
└─────────────────────────────────────────────────────┘
```

Clicking "Restore My Account":
1. Requires password re-authentication
2. Clears all deletion fields
3. Re-enables subscription
4. Shows profile in search again
5. Sends confirmation email

---

## Implementation Plan

### Phase 1: Database Schema (30 minutes)

Create migration: `20260216_delete_account_redesign.sql`

```sql
-- Add deletion tracking columns
ALTER TABLE coaches
ADD COLUMN IF NOT EXISTS deletion_requested_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS deletion_effective_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS deletion_permanent_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS deletion_reason TEXT,
ADD COLUMN IF NOT EXISTS can_restore BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS restored_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS restored_by TEXT;

-- Add comments for documentation
-- (see schema section above)
```

### Phase 2: Delete Account Page Component (2 hours)

Create new file: `pages/DeleteAccount.tsx`

**Features**:
- Password gate (modal on entry)
- Subscription status check
- Deletion timeline calculator
- Reason for leaving (optional)
- Clear warnings and consequences
- Confirmation flow

**Route**: Add to App.tsx:
```typescript
<Route path="/dashboard/delete-account" element={
  <ProtectedRoute>
    <DeleteAccount />
  </ProtectedRoute>
} />
```

### Phase 3: Update CoachDashboard (30 minutes)

**Remove**: Current "Delete Account" section (lines 2664-2780)

**Add**: Link button in Account tab:
```tsx
<button
  onClick={() => navigate('/dashboard/delete-account')}
  className="text-red-600 hover:text-red-700 underline text-sm"
>
  Delete Account →
</button>
```

### Phase 4: Restoration UI (1 hour)

**Option A: Email-Only (Recommended for MVP)**
- No UI changes needed
- Document Supabase restoration SQL
- Train support team

**Option B: Self-Service Restore**
- Update `TrialExpiredModal.tsx` to show restore option
- Add restore endpoint to supabaseService.ts
- Password re-authentication required

### Phase 5: Backend Logic Updates (2 hours)

Update `supabaseService.ts`:

```typescript
// New function: Request deletion
export const requestAccountDeletion = async (
  coachId: string,
  reason?: string
): Promise<boolean> => {
  const supabase = createClient();

  // Get current subscription info
  const { data: coach } = await supabase
    .from('coaches')
    .select('subscription_ends_at, subscription_status')
    .eq('id', coachId)
    .single();

  if (!coach) return false;

  // Deletion only allowed if subscription is cancelled or expired
  if (coach.subscription_status === 'active' && !coach.subscription_ends_at) {
    throw new Error('Please cancel your subscription before deleting account');
  }

  // Calculate deletion dates
  const now = new Date();
  const effectiveDate = coach.subscription_ends_at
    ? new Date(coach.subscription_ends_at)
    : new Date(now.getTime() + (24 * 60 * 60 * 1000)); // Tomorrow if no subscription

  const permanentDate = new Date(effectiveDate.getTime() + (30 * 24 * 60 * 60 * 1000)); // +30 days

  // Schedule deletion
  const { error } = await supabase
    .from('coaches')
    .update({
      deletion_requested_at: now.toISOString(),
      deletion_effective_date: effectiveDate.toISOString(),
      deletion_permanent_date: permanentDate.toISOString(),
      deletion_reason: reason || null,
      can_restore: true,
    })
    .eq('id', coachId);

  return !error;
};

// New function: Restore account
export const restoreAccount = async (coachId: string): Promise<boolean> => {
  const supabase = createClient();

  const { data: coach } = await supabase
    .from('coaches')
    .select('deletion_permanent_date, can_restore')
    .eq('id', coachId)
    .single();

  if (!coach) return false;

  // Check if still within restoration window
  const now = new Date();
  const permanentDate = coach.deletion_permanent_date
    ? new Date(coach.deletion_permanent_date)
    : null;

  if (!permanentDate || now > permanentDate || !coach.can_restore) {
    throw new Error('Restoration window has expired');
  }

  // Restore account
  const { error } = await supabase
    .from('coaches')
    .update({
      subscription_status: 'active', // Or calculate correct status
      profile_visible: true,
      deletion_requested_at: null,
      deletion_effective_date: null,
      deletion_permanent_date: null,
      deletion_reason: null,
      restored_at: now.toISOString(),
      restored_by: coachId, // Self-restoration
    })
    .eq('id', coachId);

  return !error;
};
```

### Phase 6: Cron Job for Permanent Deletion (2 hours)

Create Supabase Edge Function: `supabase/functions/process-deletions/index.ts`

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  const now = new Date().toISOString();

  // Phase 1: Lock accounts at effective date
  const { data: toExpire } = await supabase
    .from('coaches')
    .select('id, name, email')
    .not('deletion_effective_date', 'is', null)
    .lt('deletion_effective_date', now)
    .neq('subscription_status', 'expired');

  for (const coach of toExpire || []) {
    await supabase
      .from('coaches')
      .update({
        subscription_status: 'expired',
        profile_visible: false,
      })
      .eq('id', coach.id);

    // Send email: "Your account has been hidden. Restore within 30 days."
  }

  // Phase 2: Permanently delete at permanent date
  const { data: toDelete } = await supabase
    .from('coaches')
    .select('id, name, email')
    .not('deletion_permanent_date', 'is', null)
    .lt('deletion_permanent_date', now)
    .eq('can_restore', true);

  for (const coach of toDelete || []) {
    // Hard delete (or use DELETE_USER_MANUAL.sql logic)
    // Delete all related data first
    await supabase.from('reviews').delete().eq('coach_id', coach.id);
    await supabase.from('social_links').delete().eq('coach_id', coach.id);
    // ... (all related tables)

    // Delete coach profile
    await supabase.from('coaches').delete().eq('id', coach.id);

    // Mark as permanently deleted (if using soft delete)
    // await supabase
    //   .from('coaches')
    //   .update({ can_restore: false })
    //   .eq('id', coach.id);

    // Send final email: "Your data has been permanently deleted"
  }

  return new Response(
    JSON.stringify({
      expired: toExpire?.length || 0,
      deleted: toDelete?.length || 0,
    }),
    { headers: { 'Content-Type': 'application/json' } }
  );
});
```

**Cron Schedule**: Daily at midnight
```
0 0 * * *
```

---

## Password Protection Implementation

### Method 1: Modal on Page Load (Recommended)

When user clicks "Delete Account" from dashboard:

```tsx
const [isPasswordVerified, setIsPasswordVerified] = useState(false);

useEffect(() => {
  // Show password modal immediately on page load
  if (!isPasswordVerified) {
    showPasswordModal();
  }
}, []);

const showPasswordModal = () => {
  // Modal with password input
  // On success: setIsPasswordVerified(true)
  // On cancel: navigate back to dashboard
};

if (!isPasswordVerified) {
  return <LoadingSpinner />;
}

return <DeleteAccountForm />;
```

### Method 2: Supabase RLS + Password Re-auth

Use Supabase's `auth.reauthenticate()` method:

```typescript
const verifyPassword = async (password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: currentCoach.email,
    password: password,
  });

  if (error) {
    throw new Error('Invalid password');
  }

  return true; // Password verified
};
```

---

## Email Notifications

### 1. Deletion Request Confirmation
**Sent**: Immediately when user requests deletion
**Subject**: Account Deletion Requested

```
Hi [NAME],

You've requested to delete your CoachDog account.

Timeline:
• Today: Deletion request received
• [EFFECTIVE_DATE]: Account will be hidden from search
• [PERMANENT_DATE]: Data will be permanently deleted

Changed your mind?
You can restore your account any time before [PERMANENT_DATE] by:
1. Logging into your dashboard
2. Clicking "Restore Account"
OR
3. Replying to this email

Questions? Contact support@coachdog.com

- The CoachDog Team
```

### 2. Account Locked (Effective Date)
**Sent**: On effective date
**Subject**: Your Account Has Been Deactivated

```
Hi [NAME],

Your CoachDog account is now hidden from search and your dashboard is locked.

You still have 30 days to restore your account.

Restore by: [PERMANENT_DATE]

To restore, log in and click "Restore Account" or reply to this email.

After [PERMANENT_DATE], all data will be permanently deleted and cannot be recovered.

- The CoachDog Team
```

### 3. Final Warning (7 Days Before Permanent)
**Sent**: 7 days before permanent deletion
**Subject**: Final Reminder: Account Will Be Deleted in 7 Days

```
Hi [NAME],

This is your final reminder that your CoachDog account will be permanently deleted in 7 days.

Deletion Date: [PERMANENT_DATE]

This is your last chance to restore your account. After this date, all your data will be gone forever.

To restore: [RESTORE_LINK]

- The CoachDog Team
```

### 4. Permanent Deletion Confirmation
**Sent**: After permanent deletion
**Subject**: Your Account Has Been Permanently Deleted

```
Hi [NAME],

Your CoachDog account has been permanently deleted as requested.

All your data has been removed from our systems and cannot be recovered.

Thank you for being part of CoachDog. If you change your mind in the future, you're welcome to create a new account.

- The CoachDog Team
```

### 5. Restoration Confirmation
**Sent**: When account is restored
**Subject**: Your Account Has Been Restored

```
Hi [NAME],

Great news! Your CoachDog account has been successfully restored.

Your profile is now visible again and you have full access to your dashboard.

Welcome back!

- The CoachDog Team
```

---

## Supabase Restoration Procedure

### For Support Team / Manual Restoration

**Scenario**: User emails support requesting restoration

**Steps**:

1. **Verify Identity**:
   - Check email matches account email
   - Ask security question or verify phone number

2. **Check Restoration Window**:
```sql
SELECT
  id,
  name,
  email,
  deletion_requested_at,
  deletion_effective_date,
  deletion_permanent_date,
  can_restore,
  NOW() < deletion_permanent_date AS within_window
FROM coaches
WHERE email = 'user@example.com'
  AND deletion_requested_at IS NOT NULL;
```

3. **Restore Account** (if within window):
```sql
UPDATE coaches
SET subscription_status = 'active', -- Or 'trial' depending on history
    profile_visible = TRUE,
    deletion_requested_at = NULL,
    deletion_effective_date = NULL,
    deletion_permanent_date = NULL,
    deletion_reason = NULL,
    can_restore = TRUE,
    restored_at = NOW(),
    restored_by = 'admin:your.email@coachdog.com'
WHERE id = 'USER_ID';
```

4. **Send Confirmation Email** to user

5. **Log the Restoration**:
```sql
-- If you have an audit log table
INSERT INTO audit_log (action, user_id, performed_by, details)
VALUES ('account_restored', 'USER_ID', 'ADMIN_ID', 'Restored via support request');
```

### If Past Permanent Deletion Date

```
Unfortunately, your account was permanently deleted on [DATE] and cannot be restored.

All data has been permanently removed from our systems per our data retention policy.

You're welcome to create a new account at coachdog.com/signup.

We apologize for any inconvenience.
```

---

## Testing Scenarios

### Test 1: Delete with Active Subscription (Should Block)
1. Login as coach with active subscription
2. Navigate to Delete Account page
3. Should see error: "Please cancel subscription first"
4. Delete button disabled

### Test 2: Delete with Cancelled Subscription (Should Schedule)
1. Login as coach with cancelled subscription (has subscription_ends_at)
2. Navigate to Delete Account page
3. Enter password → Verify
4. Request deletion
5. Verify:
   - `deletion_requested_at` = NOW
   - `deletion_effective_date` = `subscription_ends_at`
   - `deletion_permanent_date` = `subscription_ends_at` + 30 days
   - Dashboard shows banner: "Account scheduled for deletion"
   - Confirmation email sent

### Test 3: Restore Before Effective Date
1. Request deletion (as above)
2. Click "Restore Account" button
3. Re-authenticate with password
4. Verify:
   - All deletion fields cleared
   - `restored_at` = NOW
   - Profile visible again
   - Confirmation email sent

### Test 4: Account Locks at Effective Date (Automated)
1. Set `deletion_effective_date` to yesterday
2. Run cron job manually
3. Verify:
   - `subscription_status` = 'expired'
   - `profile_visible` = FALSE
   - Dashboard shows lockout screen with restore option
   - Email sent

### Test 5: Permanent Deletion After 30 Days (Automated)
1. Set `deletion_permanent_date` to yesterday
2. Run cron job manually
3. Verify:
   - Coach record deleted (or `can_restore` = FALSE)
   - All related data deleted
   - Final email sent

---

## Files to Create/Modify

### New Files:
1. `/supabase/migrations/20260216_delete_account_redesign.sql` - Database schema
2. `/pages/DeleteAccount.tsx` - Delete account page component
3. `/supabase/functions/process-deletions/index.ts` - Cron job for deletions
4. `/components/PasswordVerificationModal.tsx` - Password re-auth modal
5. `/components/RestoreAccountBanner.tsx` - Banner shown when deletion scheduled

### Modified Files:
1. `/pages/CoachDashboard.tsx` - Remove delete section, add link
2. `/services/supabaseService.ts` - Add requestAccountDeletion(), restoreAccount()
3. `/types.ts` - Add deletion tracking fields to Coach interface
4. `/App.tsx` - Add route for /dashboard/delete-account
5. `/components/subscription/TrialExpiredModal.tsx` - Add restore option

---

## Summary

### Key Improvements Over Current System:

| Feature | Current | New |
|---------|---------|-----|
| **Password Protection** | No | Yes - Modal gate |
| **Deletion Timing** | Immediate request | End of billing period |
| **Restoration** | Email support only | Self-service + support |
| **Grace Period** | 30 days from request | 30 days from effective date |
| **Subscription Check** | Blocks if active | Blocks until cancelled |
| **User Communication** | Minimal | Email at each stage |
| **Tracking** | Basic | Full audit trail |

### Timeline Example:

```
User has monthly subscription ending March 15, 2026

February 16: User requests deletion
    ↓ (subscription continues as normal)
March 15: Subscription ends → Account locked & hidden
    ↓ (30-day restoration window)
April 14: Data permanently deleted
```

This provides maximum flexibility while protecting users from accidental deletion and maintaining compliance with data retention policies.

---

## Next Steps

1. ✅ Review this design document
2. ⏳ Run banner_image_url migration
3. ⏳ Create database migration for deletion tracking
4. ⏳ Implement DeleteAccount.tsx page
5. ⏳ Add restoration UI (self-service or email-only)
6. ⏳ Create process-deletions cron job
7. ⏳ Test all scenarios
8. ⏳ Deploy to production

Estimated total implementation time: **8-10 hours**
