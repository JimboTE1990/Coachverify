# Offboarding System Design & Implementation Plan

## Current Problem

**Issue:** Trial expired on 8th February but coach still has access to dashboard with "0 days remaining" banner.

**Root Cause:** No automatic system to transition `subscriptionStatus` from `trial` to `expired` when `trial_ends_at` date passes.

---

## Current State Analysis

### What EXISTS ✅
1. **Trial expiry date stored:** `trial_ends_at` field in database
2. **Subscription status field:** `subscription_status` enum ('trial', 'active', 'expired', 'onboarding')
3. **Profile visibility trigger:** Database trigger hides profiles when status = 'expired'
4. **Lockout screen:** Dashboard shows paywall when status = 'expired' (CoachDashboard.tsx:804)
5. **Trial countdown banners:** Visual warnings at 7, 6, 3, 2, 1 days remaining

### What's MISSING ❌
1. **No automated status update:** Nothing changes `trial` → `expired` when date passes
2. **No cron job or scheduled function**
3. **No client-side check on login**
4. **No email notifications** for expiry
5. **No grace period logic**

---

## Proposed Offboarding System

### Design Principles
1. **Multiple safety nets:** Client-side + Server-side + Scheduled checks
2. **Graceful degradation:** Show warnings before hard lockout
3. **Clear communication:** Email notifications at key milestones
4. **Data protection:** Profile hidden but data retained for recovery window
5. **Easy reactivation:** Simple upgrade path

---

## Implementation Strategy

### Option A: Supabase Edge Function (Recommended) ⭐

**Advantages:**
- Runs on Supabase infrastructure (no external services)
- Can be triggered by cron or on-demand
- Direct database access
- Built-in authentication

**Implementation:**
```typescript
// supabase/functions/expire-trials/index.ts

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const supabase = createClient(supabaseUrl, supabaseKey)

  const now = new Date().toISOString()

  // Find all coaches with expired trials
  const { data: expiredCoaches, error } = await supabase
    .from('coach_profiles')
    .select('id, name, email, trial_ends_at')
    .eq('subscription_status', 'trial')
    .lt('trial_ends_at', now)

  if (error) {
    return new Response(JSON.stringify({ error }), { status: 500 })
  }

  // Update status to expired
  const updates = []
  for (const coach of expiredCoaches || []) {
    const { error: updateError } = await supabase
      .from('coach_profiles')
      .update({ subscription_status: 'expired' })
      .eq('id', coach.id)

    if (!updateError) {
      updates.push(coach.id)

      // TODO: Send email notification
      // await sendExpiryEmail(coach.email, coach.name)
    }
  }

  return new Response(
    JSON.stringify({
      message: `Expired ${updates.length} trials`,
      expiredCoaches: updates
    }),
    { headers: { 'Content-Type': 'application/json' } }
  )
})
```

**Scheduling:** Set up via Supabase Dashboard → Edge Functions → Cron Jobs
```
0 0 * * * // Run daily at midnight UTC
```

---

### Option B: Client-Side Check (Backup/Immediate)

**Purpose:** Immediate feedback on login, doesn't wait for cron

**Implementation Location:** `hooks/useAuth.ts` or `pages/CoachDashboard.tsx`

```typescript
// In useAuth or useEffect on Dashboard mount
useEffect(() => {
  const checkAndExpireTrial = async () => {
    if (!coach) return

    if (coach.subscriptionStatus === 'trial' && coach.trialEndsAt) {
      const now = new Date()
      const trialEnd = new Date(coach.trialEndsAt)

      if (now > trialEnd) {
        // Trial has expired - update status
        const updated = await updateCoach({
          ...coach,
          subscriptionStatus: 'expired'
        })

        if (updated) {
          // Force refresh to show lockout screen
          await refreshCoach()
        }
      }
    }
  }

  checkAndExpireTrial()
}, [coach])
```

**Advantages:**
- Immediate (doesn't wait for cron)
- Simple to implement
- Works even if cron fails

**Disadvantages:**
- Only runs when user logs in
- Doesn't hide profile from search until login
- Not ideal for data consistency

---

### Option C: Database Trigger (Real-time)

**Most robust but complex**

```sql
-- Create function to auto-expire trials
CREATE OR REPLACE FUNCTION auto_expire_trials()
RETURNS trigger AS $$
BEGIN
  IF NEW.subscription_status = 'trial'
     AND NEW.trial_ends_at IS NOT NULL
     AND NEW.trial_ends_at < NOW() THEN
    NEW.subscription_status = 'expired';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger on any UPDATE to coach_profiles
CREATE TRIGGER expire_trial_on_update
  BEFORE UPDATE ON coach_profiles
  FOR EACH ROW
  EXECUTE FUNCTION auto_expire_trials();
```

**Advantages:**
- Runs automatically on ANY profile update
- Database-level enforcement
- Can't be bypassed

**Disadvantages:**
- Only triggers on UPDATE, not on passage of time
- Won't expire if profile never updated
- Still need cron for proactive expiry

---

## Recommended Multi-Layered Approach

### Layer 1: Supabase Edge Function (Primary)
- Scheduled cron job runs daily at midnight
- Finds all expired trials
- Updates status to 'expired'
- Sends email notifications
- **Runs:** Daily, proactive

### Layer 2: Client-Side Check (Immediate Backup)
- Runs on dashboard mount
- Catches edge cases where cron hasn't run yet
- Provides instant feedback to user
- **Runs:** On every login/dashboard visit

### Layer 3: Database Trigger (Safety Net)
- Prevents status from reverting to 'trial' if expired
- Enforces business rules at DB level
- **Runs:** On any profile update

---

## Email Notification Strategy

### Notification Timeline

**7 Days Before Expiry:**
```
Subject: Your CoachDog trial ends in 7 days
- Reminder of trial end date
- Benefits of upgrading
- Discount code offer (optional)
- One-click upgrade link
```

**3 Days Before Expiry:**
```
Subject: Only 3 days left on your CoachDog trial
- Urgency: "Your profile will be hidden in 3 days"
- Feature comparison (Trial vs Premium)
- Testimonials from paying coaches
- Upgrade CTA
```

**1 Day Before Expiry:**
```
Subject: Final reminder: Your trial expires tomorrow
- Clear warning about lockout
- "Save 17% with annual plan" offer
- Direct link to checkout
- Support email for questions
```

**On Expiry Day:**
```
Subject: Your CoachDog trial has expired
- Profile is now hidden from search
- Dashboard is locked
- Data is safe for 30 days
- Easy upgrade to restore access
- "Upgrade now" button
```

**7 Days After Expiry (Recovery Email):**
```
Subject: We miss you! Reactivate your CoachDog profile
- Special comeback offer
- Reminder that data will be deleted in 23 days
- Testimonial/success story
- Upgrade link
```

**30 Days After Expiry (Final Warning):**
```
Subject: Final notice: Your data will be deleted in 7 days
- Last chance to reactivate
- Data deletion date
- Contact support if you have questions
```

---

## Profile Visibility Logic

### Current Database Trigger (EXISTS)
```sql
-- profile_visible is automatically set based on subscription_status
profile_visible = (subscription_status IN ('active', 'trial', 'onboarding'))
```

### Timeline:
1. **During Trial:** profile_visible = TRUE (shown in search)
2. **Trial Expires:** subscription_status → 'expired'
3. **Trigger Fires:** profile_visible → FALSE (hidden from search)
4. **Dashboard:** Shows lockout screen
5. **Upgrade:** subscription_status → 'active', profile_visible → TRUE

---

## Grace Period Consideration

### Option 1: No Grace Period (Recommended for SaaS)
- Hard cutoff at trial end date
- Clear, predictable
- Industry standard
- **Current approach**

### Option 2: 24-Hour Grace Period
- Allow 24 hours past expiry
- Prevents timezone confusion
- More forgiving
- Requires modification to expiry check:

```typescript
const graceHours = 24
const gracePeriodEnd = new Date(trialEnd.getTime() + (graceHours * 60 * 60 * 1000))
if (now > gracePeriodEnd) {
  // Expire now
}
```

### Option 3: "Soft Lock" Grace Period
- Profile hidden from search immediately
- Dashboard still accessible (read-only) for 48 hours
- Allows coaches to extract data, download records
- Then full lockout

**Recommendation:** Option 1 (No grace period) with clear warnings is cleanest.

---

## Data Retention & Deletion

### Current Status
- Data is NOT automatically deleted
- `scheduled_deletion_at` field exists but not used for trials
- Only used for manual account deletion

### Proposed Timeline

**Trial Expires:**
- `subscription_status` → 'expired'
- `profile_visible` → FALSE
- Dashboard locked
- Data retained

**30 Days After Expiry:**
- Email: "Data will be deleted in 7 days"

**37 Days After Expiry:**
- Automated data deletion
- Or: Archive to cold storage
- Or: "Zombie" status (data kept but inaccessible)

### Deletion Strategy Options

**Option A: Hard Delete (GDPR-friendly)**
```sql
DELETE FROM coach_profiles WHERE subscription_status = 'expired' AND trial_ends_at < NOW() - INTERVAL '37 days';
```

**Option B: Soft Delete (Recoverable)**
```sql
UPDATE coach_profiles
SET subscription_status = 'deleted',
    data_archived = TRUE,
    profile_visible = FALSE
WHERE subscription_status = 'expired'
AND trial_ends_at < NOW() - INTERVAL '37 days';
```

**Option C: No Deletion (Keep Forever)**
- Simplest
- Allows easy reactivation
- Storage costs low
- **Current approach**

**Recommendation:** Option C (no deletion) unless GDPR requires it.

---

## Implementation Checklist

### Phase 1: Immediate Fixes (Client-Side) - 30 minutes
- [ ] Add client-side expiry check to `CoachDashboard.tsx`
- [ ] Test with expired trial account
- [ ] Verify lockout screen appears
- [ ] Verify profile hidden from search

### Phase 2: Supabase Edge Function - 2 hours
- [ ] Create `supabase/functions/expire-trials/index.ts`
- [ ] Deploy function to Supabase
- [ ] Test function manually via API
- [ ] Set up cron schedule (daily at midnight)
- [ ] Monitor logs for 1 week

### Phase 3: Email Notifications - 4 hours
- [ ] Set up email service (SendGrid/Resend/Supabase)
- [ ] Create email templates (7 day, 3 day, 1 day, expired)
- [ ] Add email sending to edge function
- [ ] Test email delivery
- [ ] Add unsubscribe links

### Phase 4: Database Trigger (Optional) - 1 hour
- [ ] Create `auto_expire_trials()` function
- [ ] Create trigger on UPDATE
- [ ] Test trigger fires correctly
- [ ] Verify doesn't cause conflicts

### Phase 5: Data Retention (Optional) - 2 hours
- [ ] Create `archive-expired-coaches` edge function
- [ ] Set up cron for monthly run
- [ ] Test archival process
- [ ] Document recovery procedure

---

## Testing Scenarios

### Scenario 1: Trial Expires Today
1. Set coach `trial_ends_at` to yesterday
2. Run edge function manually
3. Verify status → 'expired'
4. Login as coach → See lockout screen
5. Verify profile hidden from search

### Scenario 2: Trial Expires in 3 Days
1. Set coach `trial_ends_at` to 3 days from now
2. Login as coach
3. Verify warning banner shows "3 days remaining"
4. Verify profile still visible in search

### Scenario 3: Upgrade After Expiry
1. Set coach to expired status
2. Simulate successful Stripe payment
3. Verify status → 'active'
4. Verify profile visible again
5. Verify dashboard accessible

---

## Monitoring & Alerts

### Metrics to Track
- Expired trials per day
- Conversion rate (trial → paid)
- Time to conversion
- Email open/click rates
- Reactivation rate (after expiry)

### Alerts to Set Up
- Edge function failures
- Email delivery failures
- Unexpected spike in expirations
- Zero expirations (function not running)

---

## Edge Cases & Considerations

### Edge Case 1: Timezone Confusion
**Issue:** Trial set to expire 2026-02-08, but coach in PST expects it to last until 2026-02-08 23:59 PST

**Solution:**
- Always use UTC in database
- Clearly communicate timezone in UI
- Add 23:59:59 to end date (end of day, not start)

```typescript
// When setting trial end date
const trialEnd = new Date(startDate)
trialEnd.setDate(trialEnd.getDate() + 14)
trialEnd.setHours(23, 59, 59, 999) // End of day
```

### Edge Case 2: Payment Processing Delay
**Issue:** User subscribes on last day, but Stripe webhook delayed

**Solution:**
- Extend trial by 24 hours on checkout start
- Or: Mark as 'processing' status
- Or: Give 48-hour grace for payment confirmation

### Edge Case 3: Refund After Expiry
**Issue:** User paid, got refunded, should revert to expired

**Solution:**
- Stripe webhook handles refund
- Sets status back to 'expired'
- Locks dashboard again

### Edge Case 4: Trial Already Used
**Issue:** User deletes account, signs up again for new trial

**Solution:**
- `trial_used` flag already exists
- Prevent signup with same email if trial_used = true
- Or: Allow but no free trial (immediate payment required)

---

## Rollout Plan

### Week 1: Deploy Client-Side Fix
- Immediate solution
- Low risk
- Test with small group

### Week 2: Deploy Edge Function
- Scheduled automation
- Monitor daily
- Fix any issues

### Week 3: Add Email Notifications
- Start with expiry email only
- Gradually add pre-expiry warnings
- Monitor unsubscribe rate

### Week 4: Optimize & Refine
- Analyze conversion data
- Adjust email timing/copy
- Consider grace period if needed

---

## Success Metrics

### Goals
- 100% of expired trials locked out within 24 hours
- 0% false positives (active trials incorrectly expired)
- Email delivery rate > 95%
- Conversion rate (trial → paid) > 20%
- Reactivation rate (post-expiry) > 5%

---

## Summary

### Recommended Immediate Action
1. **Deploy client-side check** (30 min) - Fixes current issue TODAY
2. **Create edge function** (2 hours) - Automates future expirations
3. **Add expiry email** (1 hour) - Clear communication

### Long-Term Improvements
- Pre-expiry email sequence (7 day, 3 day, 1 day)
- Recovery email campaign (7 days, 30 days post-expiry)
- Database trigger for extra safety
- Data archival after 37 days (optional)
- Monitoring dashboard for expiry metrics

This multi-layered approach ensures no coach slips through the cracks while maintaining a smooth user experience.
