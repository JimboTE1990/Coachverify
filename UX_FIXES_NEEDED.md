# Dashboard UX Fixes Needed

**Date:** December 14, 2025
**Priority:** HIGH - User experience issues affecting usability

---

## 🔴 Critical UX Issues

### Issue 1: Profile Auto-Saves on Every Keystroke
**Current Behavior:**
- Typing in "Name" field triggers save on every letter
- Shows "Changes saved!" toast after each keystroke
- Very janky user experience

**Location:** [CoachDashboard.tsx:233](pages/CoachDashboard.tsx#L233)
```tsx
<input
  value={currentCoach.name || ''}
  onChange={(e) => handleUpdateCoach({name: e.target.value})} // ❌ Saves on every keystroke!
/>
```

**Fix Options:**
1. **Debounce** - Wait 500ms after user stops typing before saving
2. **Explicit Save Button** - Remove auto-save, require clicking "Save Changes" button (already exists on line 226)
3. **Local State** - Store changes in component state, only save when user clicks Save

**Recommended:** Option 3 (local state + explicit save) - Most user-friendly and predictable

---

### Issue 2: Billing Cycle Changes Instantly Without Confirmation Flow
**Current Behavior:**
- Click "Switch" on billing cycle
- Shows basic `window.confirm()` dialog
- Changes immediately to new cycle
- No details about what will happen or when

**Location:** [CoachDashboard.tsx:408-414](pages/CoachDashboard.tsx#L408-L414)
```tsx
onClick={() => {
  const newCycle = currentCoach.billingCycle === 'monthly' ? 'annual' : 'monthly';
  if(window.confirm(`Switch to ${newCycle} billing? Changes apply next cycle.`)) {
    handleUpdateCoach({ billingCycle: newCycle }); // ❌ Changes immediately!
  }
}}
```

**Problems:**
- No payment details shown (amount, date, card)
- No way to undo once confirmed
- Changes apply immediately (should be pending until next billing cycle)
- Generic browser confirm dialog (unprofessional)

**Recommended Fix:**
Implement **Amazon Prime-style** multi-step confirmation flow (from existing plan):

**Step 1:** Plan Comparison Page (`/subscription/change-plan`)
- Show current plan vs new plan side-by-side
- Display billing impact: "Your next charge will be £150 on December 20, 2025"
- Show payment method: "Charged to VISA •••• 4242"
- Button: "Continue to Confirm"

**Step 2:** Final Confirmation (`/subscription/change-plan/confirm`)
- Summary of change
- Explicit confirmation: "I understand I will be charged £150 on December 20, 2025"
- Buttons: "Confirm Change" | "Cancel"

**Step 3:** Success (`/subscription/change-plan/success`)
- "Your plan change is scheduled"
- Show pending change in dashboard
- Allow cancelling the pending change before it takes effect

---

### Issue 3: No Payment Details in Confirmation
**Current Behavior:**
- Billing cycle change shows no payment information
- User doesn't know:
  - When they'll be charged
  - How much they'll be charged
  - Which card will be charged

**Required Information to Display:**
1. **Next Charge Date** - Calculate from current billing cycle end
2. **Charge Amount** - £15/month or £150/year
3. **Payment Method** - "VISA •••• 4242"
4. **Effective Date** - When the change takes effect

**Example:**
```
Change to Annual Billing

Current Plan: Monthly £15/mo
New Plan: Annual £150/yr

Billing Impact:
✓ Your current monthly plan continues until: December 20, 2025
✓ On December 20, 2025, you'll be charged: £150 (annual)
✓ Payment method: VISA •••• 4242
✓ Next renewal after that: December 20, 2026

[Cancel] [Confirm Change to Annual]
```

---

### Issue 4: No Way to Cancel Pending Changes
**Current Behavior:**
- Once user confirms billing cycle change, it's permanent
- No UI to show "pending change"
- No way to revert before it takes effect

**Recommended Fix:**
1. Add `pendingPlanChange` field to Coach profile:
   ```typescript
   pendingPlanChange?: {
     newBillingCycle: 'monthly' | 'annual';
     effectiveDate: string; // ISO date
     scheduledAt: string; // When user requested change
   }
   ```

2. Show pending change banner in subscription tab:
   ```
   [!] Pending Change
   Your billing will change to Annual on December 20, 2025.
   [Cancel This Change] [View Details]
   ```

3. Allow cancelling before effective date:
   ```tsx
   <button onClick={() => handleCancelPendingChange()}>
     Cancel Scheduled Change
   </button>
   ```

---

## 🔧 Implementation Plan

### Phase 1: Fix Profile Auto-Save (Quick Win - 30 mins)

**Files to Modify:**
- `pages/CoachDashboard.tsx`

**Changes:**
1. Add local state for form fields:
   ```tsx
   const [formData, setFormData] = useState({
     name: currentCoach.name || '',
     bio: currentCoach.bio || '',
     hourlyRate: currentCoach.hourlyRate || 0,
     // ... other fields
   });
   ```

2. Update inputs to use local state:
   ```tsx
   <input
     value={formData.name}
     onChange={(e) => setFormData({...formData, name: e.target.value})}
   />
   ```

3. Wire up existing "Save Changes" button:
   ```tsx
   <button onClick={() => handleUpdateCoach(formData)}>
     Save Changes
   </button>
   ```

4. Show unsaved changes indicator:
   ```tsx
   {hasUnsavedChanges && (
     <span className="text-amber-600 text-sm">• Unsaved changes</span>
   )}
   ```

---

### Phase 2: Amazon-Style Plan Change Flow (2-3 hours)

**Files to Create:**
1. `pages/subscription/ChangePlan.tsx` - Side-by-side comparison
2. `pages/subscription/ChangePlanConfirm.tsx` - Final confirmation
3. `pages/subscription/ChangePlanSuccess.tsx` - Success message
4. `components/subscription/PlanComparisonCard.tsx` - Reusable comparison UI
5. `components/subscription/BillingImpactCard.tsx` - Shows charge details

**Files to Modify:**
1. `pages/CoachDashboard.tsx` - Replace "Switch" button with navigation to `/subscription/change-plan`
2. `App.tsx` - Add new routes
3. `types.ts` - Add `pendingPlanChange` field to Coach interface

**Flow:**
```
Click "Switch Billing Cycle"
  → Navigate to /subscription/change-plan
    → Shows comparison + billing impact
    → Click "Continue to Confirm"
  → Navigate to /subscription/change-plan/confirm
    → Final review
    → Click "Confirm Plan Change"
  → Navigate to /subscription/change-plan/success
    → Success message
    → Shows pending change banner
    → Can cancel until effective date
```

---

### Phase 3: Database Schema Update (10 mins)

**File to Create:**
- `database_migrations/007_add_pending_plan_change.sql`

```sql
ALTER TABLE coaches
ADD COLUMN pending_plan_change JSONB DEFAULT NULL;

COMMENT ON COLUMN coaches.pending_plan_change IS
'Stores scheduled plan changes: { newBillingCycle, effectiveDate, scheduledAt }';
```

---

## 📋 Testing Checklist

### Profile Auto-Save Fix:
- [ ] Type in name field - no saves until button click
- [ ] Click "Save Changes" - saves successfully
- [ ] Unsaved changes indicator appears when editing
- [ ] Refresh page - changes not saved unless button clicked
- [ ] Click "Save Changes" - indicator disappears

### Billing Cycle Change:
- [ ] Click "Switch" - navigates to comparison page (not instant dialog)
- [ ] Comparison page shows current vs new plan
- [ ] Billing impact shows exact date and amount
- [ ] Payment method displayed correctly
- [ ] Click "Cancel" - returns to dashboard, no changes
- [ ] Click "Confirm" - schedules change for next billing date
- [ ] Dashboard shows "Pending Change" banner
- [ ] Click "Cancel Scheduled Change" - reverts to original plan

---

## 🎯 Priority Order

**Do First (Today):**
1. ✅ Fix profile auto-save - Most annoying to users

**Do Next (This Week):**
2. ⏳ Implement Amazon-style plan change flow - Professional UX

**Do Later (Before Launch):**
3. ⏳ Add pending change cancellation - Nice to have

---

## 💡 Quick vs. Proper Fix

### Quick Fix (30 mins):
- Add local state to profile form
- Wire up "Save Changes" button
- Debounce billing cycle toggle
- Add basic confirmation with payment details

### Proper Fix (3-4 hours):
- Everything above PLUS:
- Multi-step plan change flow
- Pending changes system
- Cancel scheduled changes
- Professional UI matching Amazon Prime

**Recommendation:** Do the quick fix now for immediate relief, then proper fix before launch.

---

**Need Help Implementing?** Let me know which phase you want to tackle first!
