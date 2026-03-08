Run the CoachDog pre-deployment checklist before shipping any code. Work through each step and report pass/fail for each:

## Step 1: Build Check
Run `npm run build`. The build must succeed with no TypeScript errors. Note any warnings (large chunk size, etc.) but don't fail for warnings.

## Step 2: Git Diff Review
Run `git diff main..HEAD` (or `git diff HEAD~1` if on main). Review all changed files for:
- Obvious bugs or regressions
- Console.log statements left in
- TODO comments that should be resolved
- Hardcoded test data or IDs

## Step 3: QA Check on Changed Files
For each changed file, verify the change does what was intended. Check against these CoachDog-specific flows:
- **Coach signup flow**: EMCC/ICF/AC verification still works, verification states set correctly
- **Subscription flow**: Lifetime vs recurring copy correct, billing dates only shown for recurring
- **Coach directory**: Cards show correct review counts and ratings
- **Coach profile**: Dropdown menus not clipped, booking links detected for Calendly/Cal.com/Google Calendar
- **Image upload**: Profile and banner images upload and display correctly

## Step 4: Security Spot Check
For any changed files that touch auth, database queries, or user data:
- No hardcoded credentials
- User inputs validated before reaching Supabase
- RLS not bypassed unintentionally

## Step 5: Checklist Summary

Report results as:

```
BUILD        [ PASS / FAIL ]
GIT DIFF     [ PASS / FAIL — list any issues ]
QA CHECK     [ PASS / FAIL — list any issues ]
SECURITY     [ PASS / FAIL — list any issues ]

OVERALL: [ READY TO SHIP / NEEDS FIXES ]
```

If any step fails, list specific issues with file paths and what needs to be fixed before shipping.
