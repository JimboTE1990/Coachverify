# Matching Quiz Changes - Implementation Summary

## Changes Completed ✅

### 1. Updated Types ([types.ts](types.ts))
- ✅ Removed `'Hybrid'` from `Format` type (now only `'In-Person' | 'Online'`)
- ✅ Removed `sessionsPerMonth` from `QuestionnaireAnswers`
- ✅ Added `preferredLocation?: string` to `QuestionnaireAnswers`
- ✅ Changed `budgetRange: number` to `budgetMin: number` and `budgetMax: number`

### 2. Updated Questionnaire ([pages/Questionnaire.tsx](pages/Questionnaire.tsx))
- ✅ **Question 1**: Changed title to "What can we help you with?"
- ✅ **Question 1**: Simplified to show only top-level categories (no expandable drilldown)
- ✅ **Question 1**: Click to toggle entire category, checkmark shows when selected
- ✅ **Question 2**: REMOVED "How many sessions per month" completely
- ✅ **Question 3** (now Question 2): Removed Hybrid format option
- ✅ **Question 3**: Added optional "Preferred Location" dropdown (shows only if In-Person selected)
- ✅ **Question 3**: Added location prioritization note
- ✅ **Question 4** (now Question 3): Changed to min/max budget range with two sliders
- ✅ **Question 4**: Min starts at £30/hour instead of £50
- ✅ **Question 4**: Added logic to ensure min never exceeds max and vice versa
- ✅ Updated progress bar from "7 questions" to "6 questions"
- ✅ Updated all step numbers and percentage calculations (step / 6 instead of step / 7)
- ✅ Updated validation logic to remove sessionsPerMonth check

## Changes Still Needed ⚠️

### 3. Update Search Filters ([components/filters/FilterSidebar.tsx](components/filters/FilterSidebar.tsx))

**Required changes:**
- Remove Hybrid from format filter options
- Update price filter from single max to min/max range
- Ensure location filter remains intact (already exists)
- Update filter matching logic in CoachList.tsx

**Files to update:**
- `components/filters/FilterSidebar.tsx` - Remove Hybrid, add min budget slider
- `pages/CoachList.tsx` - Update budget matching logic from `maxPrice` to `budgetMin` and `budgetMax`

### 4. Update Coach Profiles/Dashboard ([pages/CoachDashboard.tsx](pages/CoachDashboard.tsx))

**Required changes:**
- Remove Hybrid from format options in profile editing
- Ensure coaches can't select Hybrid as an available format
- Update any display logic that shows "Hybrid" format

**Files to update:**
- `pages/CoachDashboard.tsx` - Profile editing section where formats are selected
- `pages/CoachDetails.tsx` - Coach public profile display (if showing formats)
- `pages/CoachSignup.tsx` - Signup form where coaches select formats

### 5. Update Search Matching Logic ([pages/CoachList.tsx](pages/CoachList.tsx))

**Required changes:**
- Update budget matching from single `budgetRange` to `budgetMin` and `budgetMax`
- Add location prioritization logic (coaches matching preferred location rank higher)
- Update questionnaire data mapping from old structure to new structure

**Current logic:**
```typescript
if (q.budgetRange) setMaxPrice(q.budgetRange); // OLD
```

**Should be:**
```typescript
if (q.budgetMin) setMinPrice(q.budgetMin); // NEW
if (q.budgetMax) setMaxPrice(q.budgetMax); // NEW
```

### 6. Update Home Page Copy

**Required changes:**
- Change any references to "7 questions" to "6 questions"
- Search for:
  - "7 quick questions" → "6 quick questions"
  - "7-question" → "6-question"
  - "in just 7 questions" → "in just 6 questions"

**Files to check:**
- `pages/Home.tsx`
- `pages/ClientInfo.tsx`
- Any landing page components

## Testing Checklist

Once all changes are complete, test:

### Questionnaire Flow
- [ ] Question 1: Categories show at top level only (no expandable dropdown)
- [ ] Question 1: Clicking category toggles selection with checkmark
- [ ] Question 1: Title shows "What can we help you with?"
- [ ] Question 2: Only shows In-Person and Online (no Hybrid)
- [ ] Question 2: Location dropdown appears when In-Person is selected
- [ ] Question 2: Location dropdown is optional
- [ ] Question 3: Shows min and max budget sliders
- [ ] Question 3: Min starts at £30
- [ ] Question 3: Min can't exceed max, max can't go below min
- [ ] Progress bar shows "Step X of 6"
- [ ] Progress percentage calculates correctly (step/6 * 100)
- [ ] Navigation works correctly through all 6 steps

### Search Filters
- [ ] Format filter only shows In-Person and Online
- [ ] Price filter has both min and max controls
- [ ] Min price starts at £30
- [ ] Location filter works (already implemented)

### Coach Dashboard
- [ ] Format selection only shows In-Person and Online
- [ ] Can't select Hybrid format
- [ ] Existing coaches with Hybrid format... (decision needed: convert to what?)

### Search Results
- [ ] Budget filtering works with min/max range
- [ ] Location prioritization works (coaches near preferred location rank higher)
- [ ] Format matching works without Hybrid

## Migration Considerations

### Existing Data
**Coaches with Hybrid format:**
- Need to decide what to do with existing coaches who have "Hybrid" selected
- Options:
  1. Convert all "Hybrid" to both "In-Person" AND "Online" in database
  2. Show migration notice to coaches asking them to update
  3. Leave as-is and hide in UI (not recommended)

**Recommended approach:** Create a migration script to convert Hybrid to both formats:
```sql
UPDATE coaches
SET available_formats = ARRAY['In-Person', 'Online']
WHERE 'Hybrid' = ANY(available_formats);
```

## Files Modified So Far

1. ✅ `/types.ts` - Updated types
2. ✅ `/pages/Questionnaire.tsx` - Completely rewritten with all changes

## Files That Need Updates

1. ⚠️ `/components/filters/FilterSidebar.tsx` - Remove Hybrid, add budget min
2. ⚠️ `/pages/CoachList.tsx` - Update budget logic and location prioritization
3. ⚠️ `/pages/CoachDashboard.tsx` - Remove Hybrid from profile editing
4. ⚠️ `/pages/CoachSignup.tsx` - Remove Hybrid from signup
5. ⚠️ `/pages/CoachDetails.tsx` - Update format display
6. ⚠️ `/pages/Home.tsx` - Update "7 questions" to "6 questions"
7. ⚠️ `/supabase/migrations/` - Create migration for existing Hybrid data

## Summary

**Completed:**
- Types updated
- Questionnaire completely rewritten with all 6 changes
- Progress tracking updated to 6 questions
- Budget changed to min/max range
- Location dropdown added
- Top-level categories only

**Remaining:**
- Update search filters to match
- Update coach profile editing to remove Hybrid
- Update search matching logic for budget min/max
- Add location prioritization in search results
- Update copy references to question count
- Migrate existing Hybrid format data

Total estimated time to complete remaining work: 2-3 hours
