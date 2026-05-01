Run a structured bug investigation and fix for CoachDog. Work through each step in order:

## Step 1: Understand the Symptom
Summarise the reported bug in one sentence. Identify:
- What the user sees (the symptom)
- What page / flow is affected
- Whether it's a frontend display issue, a data issue, or a backend/edge function issue

## Step 2: Check the Changelog
Read `docs/CHANGELOG.md`. Check if this bug or a related one has been seen before. If so, note the previous root cause — it may recur.

## Step 3: Locate the Code
Search the relevant files based on the affected area:
- **Display bugs** → `pages/` and `components/`
- **Data bugs** → `services/supabaseService.ts`, `utils/`
- **Auth / signup bugs** → `pages/CoachSignup.tsx`, `utils/profileCreation.ts`, `contexts/AuthContext.tsx`
- **Payment bugs** → `services/stripeService.ts`, `supabase/functions/create-checkout-session/`, `supabase/functions/stripe-webhook/`
- **Verification bugs** → `supabase/functions/verify-emcc-*`, `verify-icf-*`, `verify-ac-*`
- **DB / RLS bugs** → `supabase/migrations/`

Read the relevant files. Do not guess — read the actual code before forming a hypothesis.

## Step 4: Identify Root Cause
State the root cause precisely. Common CoachDog patterns to check:
- Supabase metadata booleans stored as strings (`"true"` vs `true`) — always use `=== true || === 'true'`
- DB aggregates (`total_reviews`, `average_rating`) out of sync with actual data — check triggers
- RLS policies blocking reads/writes unexpectedly — check `supabase/migrations/` for recent policy changes
- Edge functions called with `temp_coachId` during signup — DB updates silently fail
- `is_flagged` filter missing from review queries — flagged reviews leak into public views
- TypeScript `any` masking a type mismatch at runtime

## Step 5: Apply the Fix
Make the minimal code change that fixes the root cause. Do not refactor surrounding code.
- If a DB backfill is needed, write the SQL and present it clearly for manual execution in Supabase
- If a migration is needed, create it in `supabase/migrations/YYYYMMDD_description.sql`
- Run `npm run build` to confirm no TypeScript errors

## Step 6: Document and Ship
- Add an entry to `docs/CHANGELOG.md` describing the symptom, root cause, and fix
- Commit with a descriptive message starting with `fix:`
- Push to main (auto-deploys to Vercel)

## Step 7: Summary Report
Output a concise report:

```
BUG          [ one-line description ]
ROOT CAUSE   [ what was actually wrong ]
FIX          [ what was changed and where ]
DB ACTION    [ any SQL to run manually, or "none required" ]
SHIPPED      [ yes / pending manual SQL ]
```
