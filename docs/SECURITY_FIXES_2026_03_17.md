# CoachDog Security Fixes — 17 March 2026

Full audit conducted by Claude security-reviewer agent. All findings addressed in this session unless noted.

---

## Summary

| ID | Severity | Issue | Status |
|----|----------|-------|--------|
| C1 | Critical | Stripe webhook accepted forged events | ✅ Fixed |
| C2 | Critical | OCR function had no bot protection | ✅ Fixed |
| C3 | Critical | All verification functions unauthenticated | ⚠️ Partially mitigated |
| C4 | Critical | SSRF in AC verification | ✅ Fixed |
| H1 | High | Coaches could self-write subscription_status, is_verified | ✅ Fixed |
| H2 | High | STRIPE_SECRET_KEY in .env file | ✅ Fixed |
| H3 | High | verified_credentials RLS gap | ✅ Fixed |
| H4 | High | Storage bucket not path-scoped | ✅ Fixed |
| M1 | Medium | subscription_overview exposed to all users | ⏳ Your action needed |
| M2 | Medium | create-checkout-session unauthenticated | ✅ Fixed |
| M3 | Medium | review_comments permissive INSERT policy | ✅ Fixed |
| M4 | Medium | Raw error details returned to client | ✅ Fixed |
| M5 | Medium | Direct innerHTML in CoachDetails | ✅ Fixed |
| L1 | Low | No file size cap before OCR | ✅ Fixed |
| L2 | Low | CORS wildcard on all edge functions | ✅ Fixed |
| L3 | Low | Supabase Auth dashboard settings | ⏳ Your action needed |

---

## Critical Fixes

### C1 — Stripe Webhook Signature Verification

**Risk:** Any attacker could POST a forged `checkout.session.completed` event and grant free lifetime subscriptions to any account.

**What was wrong:** `verifyStripeSignature()` in `stripe-webhook/index.ts` simply called `JSON.parse(body)` with no cryptographic check. The `TODO` comment had been there since the function was written.

**Fix applied:**
- Implemented HMAC-SHA256 verification using `crypto.subtle` (native Deno Web Crypto API)
- Parses the `stripe-signature` header format: `t=<timestamp>,v1=<sig>`
- Checks all `v1` signatures (Stripe sends multiple during key rotation)
- Rejects webhooks older than 5 minutes (replay attack prevention)

**File changed:** `supabase/functions/stripe-webhook/index.ts`

**Your action required:**
1. Get your webhook signing secret: Stripe Dashboard → Developers → Webhooks → your endpoint → **Signing secret** (`whsec_...`)
2. Add to Supabase secrets via Mac Terminal:
   ```bash
   npx supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_your_secret_here --project-ref whhwvuugrzbyvobwfmce
   ```
3. Redeploy `stripe-webhook` via Supabase Dashboard → Edge Functions

---

### C2 — OCR Bot Protection (4-Layer Defence)

**Risk:** Anyone with the function URL could spam Claude Vision API calls, incurring unlimited Anthropic API costs at your expense.

**Fix applied (all in `verify-emcc-certificate-ocr/index.ts`):**

| Layer | What it does |
|-------|-------------|
| IP rate limit | Max 10 calls per IP per hour, tracked in `ocr_rate_limits` DB table. Returns 429 if exceeded. |
| Payload size cap | Rejects `imageBase64` > 5 MB before calling Claude. Returns 413. |
| EIA format validation | Rejects anything not matching `^(EIA|ESIA)\d+$` before calling Claude. Returns friendly error message. |
| Cache short-circuit | If same EIA was verified within 24 hours, returns cached result — Claude is never called. |

**New migration:** `supabase/migrations/20260317_ocr_rate_limits.sql`

**Your actions required:**
1. Run `20260317_ocr_rate_limits.sql` in Supabase SQL editor
2. Redeploy `verify-emcc-certificate-ocr` via Supabase Dashboard → Edge Functions

---

### C3 — Verification Functions (Partial Mitigation)

**Risk:** All 5 verification functions (EMCC, ICF, AC URL/accreditation) accept unauthenticated calls and can mark any coach as verified.

**Why not fully fixed:** These functions are called during the signup flow *before* a coach account exists, so JWT auth would break signup. Full fix requires moving verification post-signup (a larger flow redesign).

**Mitigations applied:**
- SSRF blocked on AC verification (see C4)
- CORS locked to production domain (see L2)
- Rate limiting on OCR (the most expensive call) (see C2)

**Recommended future fix (Option A):** Move EMCC/ICF verification from signup to the coach dashboard after account creation. This allows JWT auth on all verification endpoints. Complexity: medium.

---

### C4 — SSRF in AC Verification

**Risk:** The `profileUrl` field was passed directly to `fetch()` with no validation. An attacker could supply `http://169.254.169.254/` (AWS metadata) or other internal infrastructure URLs.

**Fix applied:** Added URL validation before `fetch()` in `verify-ac-accreditation/index.ts`:
- Parses URL with `new URL()` — rejects malformed URLs
- Requires `protocol === 'https:'`
- Requires `hostname.endsWith('associationforcoaching.com')`
- Returns 400 for anything else

**File changed:** `supabase/functions/verify-ac-accreditation/index.ts`

**Your action required:** Redeploy `verify-ac-accreditation` via Supabase Dashboard

---

## High Severity Fixes

### H1 — Coaches Self-Write Vulnerability (Subscription / Verification Status)

**Risk:** The coaches RLS UPDATE policy scopes to the owning user but doesn't restrict *which columns* can be written. A coach could call the Supabase REST API directly and set `subscription_status = 'lifetime'` or `emcc_verified = true` on their own row.

**Fix applied (2 layers):**

**Layer 1 — Service layer** (`services/supabaseService.ts`): Removed these fields from `updateCoach()`:
- `is_verified`
- `subscription_status`
- `billing_cycle`
- `emcc_verified`, `emcc_verified_at`
- `icf_verified`, `icf_verified_at`

These are now only writable by edge functions using the service role.

**Layer 2 — Database** (`supabase/migrations/20260317_restrict_sensitive_coach_columns.sql`): Column-level `REVOKE UPDATE` on sensitive columns from the `authenticated` role. Even if someone bypasses the service layer, the DB refuses the write.

**Columns protected at DB level:**
`is_verified`, `verification_status`, `subscription_status`, `billing_cycle`, `stripe_customer_id`, `stripe_subscription_id`, `emcc_verified`, `emcc_verified_at`, `icf_verified`, `icf_verified_at`, `ac_verified`, `ac_verified_at`, `trial_ends_at`, `scheduled_deletion_at`

**Your action required:** Run `20260317_restrict_sensitive_coach_columns.sql` in Supabase SQL editor

---

### H2 — STRIPE_SECRET_KEY in .env

**Risk:** Backend secret in a frontend project root. One accidental `git add .` away from being committed and exposed.

**Fix applied:** Removed from `.env`. The key only exists in Supabase secrets where it belongs.

**Your action required:**
1. ⚠️ Rotate the key as a precaution: Stripe Dashboard → Developers → API Keys → Secret key → **Roll key**
2. After rotating, update in Supabase: `npx supabase secrets set STRIPE_SECRET_KEY=sk_live_... --project-ref whhwvuugrzbyvobwfmce`

---

### H3 — verified_credentials RLS Gap

**Risk:** A migration replaced the original write policy with one referencing a non-existent `coach_id` column, potentially leaving writes unprotected for authenticated users.

**Fix applied** (`supabase/migrations/20260317_fix_verified_credentials_rls.sql`):
- Dropped all stale policies referencing `coach_id`
- Added explicit `WITH CHECK (false)` policies blocking INSERT/UPDATE/DELETE from `authenticated` and `anon` roles
- Service role (edge functions) bypasses RLS so all legitimate writes continue

**Your action required:** Run `20260317_fix_verified_credentials_rls.sql` in Supabase SQL editor

---

### H4 — Storage Bucket Not Path-Scoped

**Risk:** Any authenticated user could upload to another coach's path in `profile-photos`, overwriting their profile photo.

**Fix applied** (`supabase/migrations/20260317_storage_path_scoping.sql`):
- Dropped old unscoped INSERT/UPDATE/DELETE policies
- Re-created with `(storage.foldername(name))[1] = auth.uid()::text`
- Matches the actual upload path format: `{user.id}/{type}/{timestamp}.jpg`

**Your action required:** Run `20260317_storage_path_scoping.sql` in Supabase SQL editor

---

## Medium Severity Fixes

### M1 — subscription_overview View Exposed to All Users ⏳ YOUR ACTION

**Risk:** Any logged-in coach could query this view and read all other coaches' `stripe_customer_id`, `stripe_subscription_id`, `billing_cycle`, `email`.

**Fix:** Run this in Supabase SQL editor:
```sql
REVOKE SELECT ON public.subscription_overview FROM authenticated;
```

---

### M2 — create-checkout-session Unauthenticated

**Risk:** Anyone could create a Stripe checkout session attributed to another coach's account.

**Fix applied:**
- `supabase/functions/create-checkout-session/index.ts`: Added JWT verification using `supabase.auth.getUser()`
- `services/stripeService.ts`: Now passes `Authorization: Bearer <jwt>` header with every checkout request

**Your action required:** Redeploy `create-checkout-session` via Supabase Dashboard

---

### M3 — review_comments Permissive INSERT Policy

**Risk:** Older migration `20260121_fix_security_final.sql` created `WITH CHECK (true)` — any logged-in user could post comments on any coach's profile. The tighter replacement policy had a different name and may not have been active.

**Fix applied** (`supabase/migrations/20260317_fix_review_comments_rls.sql`):
- Explicitly drops the old `"Allow coaches to insert comments"` policy
- Idempotently re-creates `"Allow coaches to insert review comments"` with proper `author_id` scoping

**Your action required:** Run `20260317_fix_review_comments_rls.sql` in Supabase SQL editor

---

### M4 — Raw Error Details in Responses

**Risk:** `String(err)` in catch blocks could leak internal details (API endpoints, stack traces, Supabase internals) to clients.

**Fixes applied:**
- `stripe-webhook/index.ts`: catch block now returns `{ error: 'Webhook processing failed' }` instead of `error.message`
- `verify-emcc-certificate-ocr/index.ts`: already returning generic message; verified correct

---

### M5 — Direct innerHTML in CoachDetails

**Risk:** `successDiv.innerHTML = \`...\`` with hardcoded strings is safe now but establishes a dangerous pattern. If a future developer interpolates user data into that template, it becomes stored XSS.

**Fix applied** (`pages/CoachDetails.tsx`): Replaced with `document.createElement` / `textContent` / `appendChild` — no innerHTML anywhere in that block.

---

## Low Severity Fixes

### L1 — No File Size Cap Before OCR

**Fix applied** as part of C2: Server-side 5 MB check on `imageBase64` before calling Claude. Also added client-side note in UI.

---

### L2 — CORS Wildcard on All Edge Functions

**Fix applied:** Replaced `'Access-Control-Allow-Origin': '*'` with `Deno.env.get('APP_URL') ?? 'https://coachverify.vercel.app'` in all 7 non-webhook edge functions.

The `stripe-webhook` function is intentionally left with `*` since Stripe calls it server-to-server (CORS headers are irrelevant for non-browser requests).

**Your action required:**
- Set `APP_URL` in Supabase secrets if not already set:
  ```bash
  npx supabase secrets set APP_URL=https://coachverify.vercel.app --project-ref whhwvuugrzbyvobwfmce
  ```
- Redeploy all 7 edge functions

---

### L3 — Supabase Auth Dashboard Settings ⏳ YOUR ACTION

Two settings that can only be changed in the Supabase Dashboard UI (no migration equivalent):

1. **OTP Expiry**: Supabase Dashboard → Authentication → Settings → **Email OTP Expiry** → set to `3600` seconds
2. **Leaked Password Protection**: Supabase Dashboard → Authentication → Settings → **Enable Leaked Password Protection** → toggle on

---

## Your Full Action Checklist

### Supabase SQL Editor — run these migrations in order:
- [ ] `20260317_ocr_rate_limits.sql`
- [ ] `20260317_storage_path_scoping.sql`
- [ ] `20260317_fix_verified_credentials_rls.sql`
- [ ] `20260317_fix_review_comments_rls.sql`
- [ ] `20260317_restrict_sensitive_coach_columns.sql`
- [ ] Run M1 inline SQL: `REVOKE SELECT ON public.subscription_overview FROM authenticated;`

### Supabase Dashboard → Edge Functions — redeploy:
- [ ] `verify-emcc-certificate-ocr` (bot protection + CORS)
- [ ] `create-checkout-session` (JWT auth + CORS)
- [ ] `stripe-webhook` (signature verification)
- [ ] `verify-ac-accreditation` (SSRF fix + CORS)
- [ ] `verify-emcc-accreditation` (CORS)
- [ ] `verify-emcc-url` (CORS)
- [ ] `verify-icf-accreditation` (CORS)
- [ ] `verify-icf-url` (CORS)

### Supabase Secrets (via Mac Terminal):
- [ ] `npx supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_... --project-ref whhwvuugrzbyvobwfmce`
- [ ] `npx supabase secrets set APP_URL=https://coachverify.vercel.app --project-ref whhwvuugrzbyvobwfmce`

### Stripe Dashboard:
- [ ] Roll the test secret key (Dashboard → Developers → API Keys → Roll key)
- [ ] Update rolled key in Supabase secrets: `npx supabase secrets set STRIPE_SECRET_KEY=sk_test_new... --project-ref whhwvuugrzbyvobwfmce`

### Supabase Dashboard → Authentication → Settings:
- [ ] Set Email OTP Expiry to `3600`
- [ ] Enable Leaked Password Protection

---

## Remaining / Future Work

| Item | Description | Effort |
|------|-------------|--------|
| C3 full fix | Move verification post-signup to enable JWT auth on all verification endpoints | Medium |
| Cloudflare Turnstile | Add CAPTCHA to the OCR upload step — closes the rotating-IP bot gap | Medium |
| H1 full audit | Review all other direct Supabase REST calls from the client to confirm no other sensitive columns are reachable | Low |
