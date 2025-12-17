# CoachVerify Subscription User Journeys - Complete Map

## Overview
This document maps ALL possible subscription states and user actions to ensure every edge case is handled gracefully.

---

## Core Subscription States

1. **`trial`** - User on 30-day free trial
2. **`active`** - Paying subscriber (Monthly or Annual)
3. **`expired`** - Trial/subscription ended, profile hidden
4. **`onboarding`** - Legacy state (no longer used)

---

## User Actions & State Transitions

### 🆕 Journey 1: New User Signup

**Initial State:** No account

**Flow:**
1. User signs up → Email verification
2. Email verified → **State: `trial`** (automatic, no activation needed)
3. `trial_ends_at` = now + 30 days
4. `trial_used` = false (not consumed until they pay)
5. User has full access to dashboard

**Edge Cases:**
- ✅ User tries to signup with existing email → Blocked at Step 1 with clear error
- ✅ User takes >30 min to verify email → Trial still activates from verification time
- ✅ User never verifies email → No trial, no access

---

### 💳 Journey 2: Trial User Upgrades to Paid Plan

**Initial State:** `trial`

**Scenario A: Upgrade During Trial**

**Flow:**
1. User on pricing page → selects Monthly or Annual
2. Goes to checkout → enters payment details
3. Payment processed → **State: `active`**
4. `billing_cycle` = 'monthly' or 'annual'
5. `last_payment_date` = `trial_ends_at` date (first charge happens AFTER trial)
6. `trial_used` = true (trial is now consumed)

**System Behavior:**
- ✅ First charge occurs on `trial_ends_at` date
- ✅ Billing calculations based on trial end date, not today
- ✅ Checkout shows: "Your trial continues. First charge on [trial end date]"

**Scenario B: Upgrade AFTER Trial Expires**

**Flow:**
1. Trial expires → **State: `expired`**
2. Profile hidden from directory
3. User visits dashboard → sees "Upgrade Required" message
4. Selects plan → Payment processed TODAY
5. **State: `active`** immediately
6. Profile becomes visible again

**System Behavior:**
- ✅ No trial extension - payment starts immediately
- ✅ `trial_used` = true
- ✅ Checkout shows: "Payment starts today"

---

### 🔄 Journey 3: Plan Change (Monthly ↔ Annual)

**Initial State:** `active` with `billing_cycle` = 'monthly' or 'annual'

**Flow:**
1. User clicks "Change Plan" in dashboard
2. **Step 1:** Plan comparison page (/subscription/change-plan?to=annual)
   - Shows side-by-side: Current plan vs New plan
   - Shows billing impact: "Current plan continues until [next billing date]. On [next billing date], you'll be charged £X"
3. **Step 2:** Confirmation page (/subscription/change-plan/confirm)
   - Final summary with payment method verification
   - Explicit "Confirm Plan Change" button
4. **Step 3:** Plan change scheduled
   - `pendingPlanChange` = { newBillingCycle: 'annual', effectiveDate: '...', scheduledAt: '...' }
   - **Current billing_cycle does NOT change yet**
5. **Step 4:** On effective date (next billing cycle)
   - `billing_cycle` = `pendingPlanChange.newBillingCycle`
   - `pendingPlanChange` = null
   - New pricing applied

**Dashboard Display:**
- ✅ Billing Cycle card shows: "Monthly" with "→ Changing to annual" below
- ✅ Blue banner: "Plan Change Scheduled: Monthly → Annual on [date]"
- ✅ "Cancel Change" button visible

**Edge Cases:**
- ✅ User changes Monthly → Annual, then changes Annual → Monthly before effective date
  - **System:** Overwrites `pendingPlanChange` with new change
- ✅ User has pending change from Monthly → Annual, then upgrades mid-cycle
  - **System:** Shows current plan with pending indicator, processes change on effective date
- ✅ User tries to change to same plan they're already on
  - **System:** Redirects to dashboard (no change needed)

---

### ❌ Journey 4: Cancellation (NowTV Style)

**Initial State:** `active`

**Scenario A: Simple Cancellation (No Pending Change)**

**Flow:**
1. User clicks "Cancel Subscription" in dashboard
2. **Step 1:** Confirmation modal
   - "What happens when you cancel:"
     - Profile visible until [billing period end]
     - After that, profile hidden
     - Can reactivate anytime before then
   - [Keep Subscription] [Continue to Cancel]
3. **Step 2:** Reason dropdown
   - Too expensive
   - Not getting enough clients
   - Switching to another platform
   - Technical issues
   - No longer coaching
   - Other (optional feedback box)
   - [Back] [Cancel Subscription]
4. **Step 3:** Cancellation confirmed
   - `cancelled_at` = now
   - `subscription_ends_at` = next billing date (end of current paid period)
   - `cancel_reason` = selected reason
   - `cancel_feedback` = optional text
   - **State: Still `active` until subscription_ends_at**
5. **On `subscription_ends_at` date:**
   - **State: `expired`**
   - Profile hidden from directory
   - User loses dashboard access

**Dashboard Display:**
- ✅ Yellow banner: "Subscription Scheduled for Cancellation. Access until [date]."
- ✅ "Reactivate" button visible
- ✅ "Cancel Subscription" button HIDDEN (already cancelled)

**Scenario B: Cancellation WITH Pending Plan Change** ⚠️ **CRITICAL EDGE CASE**

**Initial State:** `active` + `pendingPlanChange` exists

**Flow:**
1. User clicks "Cancel Subscription"
2. **Special Warning Displayed:**
   - Blue info box: "You have a pending plan change"
   - "Your plan is scheduled to change to Annual on [date]. If you cancel now, you'll lose access on [current billing end] before the plan change takes effect."
3. User proceeds with cancellation
4. `cancelled_at` = now
   - `subscription_ends_at` = CURRENT billing period end (NOT the new plan's date)
   - `pendingPlanChange` = **CLEARED** (plan change never happens)
5. User loses access before the upgraded plan would have started

**System Behavior:**
- ✅ Warning clearly explains the consequence
- ✅ Pending plan change is abandoned
- ✅ Cancellation uses CURRENT plan's billing period

**Example:**
- Current: Monthly £15/mo, renews Dec 20
- Pending Change: Switch to Annual £150/yr on Dec 20
- User cancels on Dec 10
- Result: Access ends Dec 20 (monthly end), Annual plan never activates

---

### 🔁 Journey 5: Reactivation (Cancel the Cancellation)

**Initial State:** `active` + `cancelled_at` exists

**Flow:**
1. User sees yellow banner in dashboard with "Reactivate" button
2. User clicks "Reactivate"
3. Confirmation modal: "Reactivate your subscription? Your billing will resume as normal."
4. User confirms
5. `cancelled_at` = **NULL**
   - `subscription_ends_at` = **NULL**
   - `cancel_reason` = **NULL**
   - `cancel_feedback` = **NULL**
   - **State: `active`** (fully restored)
6. Billing continues as if cancellation never happened

**Edge Cases:**
- ✅ User cancels, then reactivates 3 times in a row
  - **System:** Allows it (user prerogative)
- ✅ User reactivates AFTER `subscription_ends_at` passes
  - **System:** User is expired - must re-subscribe as new customer (pay today)
- ✅ User reactivates WITH a pending plan change that was active before cancellation
  - **System:** Pending plan change was cleared on cancellation, does NOT restore

---

### 🔄❌ Journey 6: Change Plan → Cancel → Reactivate (Complex Edge Case)

**Initial State:** `active`, Monthly £15/mo

**Flow:**
1. **Dec 1:** User changes Monthly → Annual (effective Dec 20)
   - `pendingPlanChange` = { newBillingCycle: 'annual', effectiveDate: 'Dec 20' }
2. **Dec 10:** User cancels subscription
   - Warning shown: "Pending change will be abandoned"
   - `cancelled_at` = Dec 10
   - `subscription_ends_at` = Dec 20 (current monthly end)
   - `pendingPlanChange` = **NULL** (cleared)
3. **Dec 15:** User reactivates
   - `cancelled_at` = **NULL**
   - `subscription_ends_at` = **NULL**
   - **State: `active`** on Monthly plan
   - Pending Annual change is GONE (user must re-schedule if wanted)

**Result:**
- User stays on Monthly plan
- Must manually change to Annual again if desired

---

### ❌🔄 Journey 7: Cancel → Change Plan (Blocked)

**Initial State:** `active` + `cancelled_at` exists

**Scenario:**
1. User cancels subscription (access until Dec 20)
2. User tries to click "Change Plan" button

**System Behavior:**
- ✅ "Change Plan" button is HIDDEN when `cancelled_at` exists
- ✅ Only "Reactivate" button shown
- ✅ User must reactivate first, then change plan

**Why:**
- Prevents confusing scenario where user upgrades to Annual while subscription is ending
- Forces explicit reactivation before making changes

---

### 💔 Journey 8: Expired User Returns

**Initial State:** `expired`

**Scenario A: User Returns Within Grace Period (e.g., 7 days)**

**Flow:**
1. User logs in → dashboard shows "Your subscription has expired"
2. Profile is hidden from directory
3. Pricing CTAs visible: "Reactivate with Monthly" or "Reactivate with Annual"
4. User selects plan → payment processed TODAY
5. **State: `active`**
6. Profile becomes visible again

**Scenario B: User Returns After Long Time (e.g., 6 months)**

**Flow:**
1. Same as Scenario A
2. No special "returning customer" pricing (yet - could be future feature)
3. Treated as new paying customer

**Edge Cases:**
- ✅ User's trial was consumed before expiry
  - `trial_used` = true → cannot get another trial
- ✅ User never paid (trial expired)
  - `trial_used` = false → CANNOT get another trial (only one per account)

---

## 🚨 Critical Edge Cases Summary

### Edge Case Matrix

| Current State | Pending Change | Cancelled | Action | Result |
|--------------|----------------|-----------|--------|--------|
| trial | No | No | Upgrade | active, trial ends, billing starts on trial_ends_at |
| trial | No | No | Let expire | expired, profile hidden |
| active | No | No | Change Plan | pendingPlanChange set, current plan continues |
| active | Yes | No | Cancel | cancelled_at set, pendingPlanChange CLEARED, ends on current period |
| active | Yes | No | Change Plan Again | Overwrites pendingPlanChange |
| active | No | Yes | Reactivate | cancelled_at cleared, billing resumes |
| active | No | Yes | Try to Change Plan | BLOCKED - must reactivate first |
| expired | No | No | Reactivate | Must pay TODAY, active immediately |

---

## 🎯 Implementation Checklist

### ✅ Completed Features
1. Login/Signup route guards (redirects logged-in users)
2. Automatic trial activation on email verification
3. Dynamic pricing page CTAs (trial status aware)
4. Plan change flow (3-step Amazon-style)
5. Cancellation flow (3-step NowTV-style)
6. Reactivation button
7. Pending plan change indicator in dashboard
8. Cancel plan change button
9. Warning when cancelling with pending change
10. "Change Plan" button hidden when cancelled

### ⏳ Future Enhancements (Not Required for MVP)
1. Email notifications (trial expiring, plan changed, cancellation confirmed)
2. Stripe webhook integration (automatic state updates)
3. Grace period for expired users (7-day window to reactivate without re-entering payment)
4. Win-back offers (e.g., "Come back for 20% off")
5. Billing history with downloadable invoices
6. Proration for mid-cycle plan changes
7. Pause subscription (3-month freeze option)

---

## 📊 Database State Reference

### Key Fields

```typescript
interface Coach {
  // Subscription
  subscriptionStatus: 'trial' | 'active' | 'expired' | 'onboarding';
  billingCycle: 'monthly' | 'annual';
  trialEndsAt?: string; // ISO date
  trialUsed?: boolean; // Has user consumed their one-time trial?
  lastPaymentDate?: string; // ISO date

  // Cancellation
  cancelledAt?: string; // When user requested cancellation
  subscriptionEndsAt?: string; // When access actually ends (billing period end)
  cancelReason?: string; // Dropdown value
  cancelFeedback?: string; // Optional text

  // Plan Changes
  pendingPlanChange?: {
    newBillingCycle: 'monthly' | 'annual';
    effectiveDate: string; // ISO date when change happens
    scheduledAt: string; // When user requested change
    previousBillingCycle?: string; // For rollback reference
  };
}
```

---

## 🧪 Testing Scenarios

### Test 1: Happy Path (Trial → Paid → Cancel → Reactivate)
1. Create account → verify email (trial active)
2. Upgrade to Monthly during trial
3. Access until trial end, billing starts
4. Cancel subscription
5. See yellow banner with reactivate button
6. Click reactivate → back to active

**Expected:** All transitions smooth, no errors

### Test 2: Plan Change Edge Case
1. Active Monthly user
2. Change to Annual (pending)
3. Cancel subscription before effective date
4. **Expected:** Warning shown, pending change cleared

### Test 3: Rapid State Changes
1. Change Monthly → Annual
2. Immediately change Annual → Monthly
3. **Expected:** pendingPlanChange overwritten, latest change wins

### Test 4: Expired User Return
1. Let trial expire (don't pay)
2. Wait 1 week
3. Log back in
4. **Expected:** Profile hidden, must pay TODAY to reactivate

### Test 5: Double Cancellation Prevention
1. Cancel subscription
2. Try to click "Cancel Subscription" again
3. **Expected:** Button hidden (already cancelled)

---

## 📞 Support Scenarios

### User: "I changed my plan but it still shows Monthly"
**Answer:** Your plan change is scheduled for your next billing date ([date]). You'll see "Monthly" with "→ Changing to annual" until then. This is correct behavior.

### User: "I cancelled but I'm still being charged"
**Answer:** Cancellation takes effect at the end of your current billing period ([date]). You have access until then. This is normal.

### User: "I changed to Annual and then cancelled - what happens?"
**Answer:** When you cancelled, your pending plan change was cleared. You'll lose access on your current Monthly billing end date. The Annual plan never activated.

### User: "Can I undo my cancellation?"
**Answer:** Yes! Click the "Reactivate" button in your dashboard. Your subscription will resume as if you never cancelled.

---

**Document Status:** ✅ Complete as of Dec 17, 2024
**Last Updated:** Implementation of all core subscription journeys
**Next Review:** After Stripe integration
