Run a full security audit of the CoachDog codebase. Work through each area systematically:

1. **RLS Policies** — Read the latest migration files in `supabase/migrations/`. List every table and confirm it has RLS enabled and policies for SELECT, INSERT, UPDATE, DELETE where appropriate. Flag any table missing RLS or with overly permissive policies.

2. **Views** — Search for any CREATE VIEW statements. Confirm none use SECURITY DEFINER. Flag any that do.

3. **Edge Functions** — Read each function in `supabase/functions/`. Check:
   - CORS applied to all response paths including errors
   - Service role key not exposed to client
   - Stripe webhook signature verified in stripe-webhook function
   - All env vars use `Deno.env.get()` not `process.env`

4. **Secrets scan** — Search the codebase (excluding node_modules, .env files) for hardcoded API keys, tokens, or passwords. Look for patterns like `sk_live_`, `sk_test_`, `service_role`, `eyJ` (JWT).

5. **Storage** — Note the `profile-photos` bucket is intentionally public. Flag any other buckets that appear unintentionally public.

6. **Frontend auth gates** — Scan `pages/` for routes or operations that should require authentication but may be missing auth checks.

7. **Input validation** — Check form submissions in `pages/CoachSignup.tsx` and `pages/CoachDashboard.tsx` for unvalidated user inputs reaching Supabase.

Report all findings grouped by severity: **Critical → High → Medium → Low**. If an area is clean, say so explicitly. End with a summary score and top 3 priorities to fix.
