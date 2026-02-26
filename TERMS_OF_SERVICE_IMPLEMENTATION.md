# Terms of Service Implementation Summary

## Overview
Implemented a comprehensive Terms of Service system with separate terms for coaches and clients, including mandatory acceptance during coach onboarding.

## Changes Made

### 1. TermsOfService.tsx - Added Tabbed Interface
**File:** `pages/TermsOfService.tsx`

**Changes:**
- Added tab system with two tabs: "For Coaches" and "For Visitors & Clients"
- Existing coach terms moved to "For Coaches" tab
- New "For Visitors & Clients" tab with comprehensive client terms
- Tabs support URL parameter `?tab=coaches` or `?tab=clients` for direct linking
- Icons added to tabs (UserCheck for coaches, Users for clients)

**Features:**
- Tab switching with visual indicators
- URL-based tab selection for deep linking
- Responsive design for mobile/desktop

### 2. CoachSignup.tsx - Terms Acceptance Modal
**File:** `pages/CoachSignup.tsx`

**Changes:**
- Added state variables: `showTermsModal`, `termsAccepted`
- Added terms acceptance checkbox before verification button in Step 2
- Verification button now disabled until terms are accepted
- Implemented full-screen modal for Coach Terms of Service

**Modal Features:**
- Scrollable content with key terms summary
- Checkbox to accept terms within the modal
- Link to full terms page opens in new tab
- "Continue" button only enabled after acceptance
- Clean, professional design matching site theme

**User Flow:**
1. User fills in accreditation details
2. Must check "I agree to Coach Terms of Service" checkbox
3. Clicking terms link opens modal with summary
4. User can read full terms via link to `/terms?tab=coaches`
5. User must accept in modal to enable "Continue" button
6. "Verify Now" button only enabled after terms acceptance

### 3. Questionnaire.tsx - Terms Link at Completion
**File:** `pages/Questionnaire.tsx`

**Changes:**
- Added import for `Link` from react-router-dom
- Added terms footer on final step (step 6) before "See Matches" button
- Links to `/terms?tab=clients` for Client Terms
- Also includes Privacy Policy link

**Display:**
- Small, unobtrusive footer text
- Only shows on final questionnaire step
- Follows standard "By using..." convention

### 4. CoachList.tsx - Terms Footer in Search Results
**File:** `pages/CoachList.tsx`

**Changes:**
- Added import for `Link` from react-router-dom
- Added terms footer after coach results
- Only displays when there are filtered coaches to show
- Links to `/terms?tab=clients` for Client Terms
- Also includes Privacy Policy link

**Display:**
- Appears at bottom of search results
- Bordered top section
- Small, professional footer text
- Matches site design language

## Client Terms Content

The new Client Terms of Use includes:

1. **Our Role** - Platform facilitator, not coaching provider
2. **Eligibility** - Age and capacity requirements
3. **Accreditation Information** - Verification process explanation
4. **No Medical Services** - Clear disclaimer about non-therapeutic nature
5. **Disputes** - Process for handling coach disputes
6. **Limitation of Liability** - Consumer Rights Act compliant limitations
7. **Platform Availability** - No guarantee disclaimers
8. **Data Protection** - GDPR/DPA 2018 compliance
9. **Governing Law** - England and Wales jurisdiction
10. **Severance** - Standard severability clause

## URLs and Navigation

### Direct Links:
- Coach Terms: `/terms?tab=coaches`
- Client Terms: `/terms?tab=clients`
- Default (no tab param): Shows Coach Terms

### Where Terms Links Appear:
1. **Coach Onboarding** - Mandatory modal during signup (Step 2)
2. **Questionnaire** - Footer on final step (Step 6)
3. **Search Directory** - Footer below coach results
4. **Footer** (existing) - Global navigation links

## Technical Details

### State Management:
```typescript
const [showTermsModal, setShowTermsModal] = useState(false);
const [termsAccepted, setTermsAccepted] = useState(false);
```

### Tab System:
```typescript
type TermsTab = 'coaches' | 'clients';
const [activeTab, setActiveTab] = useState<TermsTab>(defaultTab);
```

### Conditional Rendering:
- Terms modal only shows when `showTermsModal === true`
- Verify button disabled when `!termsAccepted`
- Terms footer in search only shows when `filteredCoaches.length > 0`
- Questionnaire terms only show on `step === 6`

## Testing Checklist

- [ ] Navigate to `/terms` - Should show Coach Terms tab by default
- [ ] Navigate to `/terms?tab=clients` - Should show Client Terms tab
- [ ] Click tab switching - Should work smoothly
- [ ] Start coach signup - Step 2 should show terms checkbox
- [ ] Try to verify without accepting - Button should be disabled
- [ ] Click terms link in signup - Modal should open
- [ ] Accept terms in modal - Checkbox should be checked
- [ ] Complete questionnaire - Terms should show on final step
- [ ] View search results - Terms footer should show at bottom
- [ ] Mobile responsive - All terms displays should work on mobile

## Accessibility

- Checkboxes use proper labels and ARIA attributes
- Modal can be closed with X button
- Links have descriptive text
- Color contrast meets WCAG standards
- Focus states on interactive elements

## Future Enhancements (Optional)

1. Store terms acceptance timestamp in database
2. Show "Terms updated" notification if terms change
3. Add version tracking for terms
4. Require re-acceptance after major updates
5. Add terms acceptance to user profile/dashboard

---

**Implementation Date:** 26 February 2026
**Status:** Complete
**Files Modified:** 4 (TermsOfService.tsx, CoachSignup.tsx, Questionnaire.tsx, CoachList.tsx)
