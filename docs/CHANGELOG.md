# CoachDog Changelog

Notable bug fixes and feature changes, most recent first.

---

## 2026-05-01

### Bug Fix — Review count mismatch on coach profiles
**Symptom:** The star rating header showed a lower review count than the "View All N Reviews" link at the bottom of the same page.

**Root cause:** The DB trigger that maintains the `total_reviews` aggregate column correctly excludes spam-flagged reviews (`is_flagged = FALSE`). However, the frontend was fetching *all* reviews with no filter, so flagged reviews inflated the displayed array length while not being counted in the DB aggregate. The two numbers fell out of sync whenever spam detection flagged a review.

**Fix:** Added `.eq('is_flagged', false)` to both review fetch queries in `supabaseService.ts`. Flagged reviews are now excluded from the public-facing fetch, matching the DB aggregate. A SQL backfill was also run to correct any coaches with stale counts.

**Files changed:** `services/supabaseService.ts`

---

## 2026-04-29

### Feature — "Where did you hear about CoachDog?" on signup
Added an optional dropdown to Step 1 of coach onboarding. Options: Google Search, Facebook, Instagram, LinkedIn, TikTok, YouTube, Coaching School Referral, Word of Mouth, Other. Stored in auth user metadata.

### Feature — Social media link on review form
Added an optional social media profile URL field to the client review form for identity verification purposes. Stored in DB (`reviewer_social_url` column) but not displayed publicly.

---

## 2026-04-25

### Bug Fix — Accreditation badges missing for verified coaches
**Symptom:** Coaches who verified via OCR had no EMCC badge on their profile despite completing verification successfully.

**Root cause (1):** Supabase auth metadata stores booleans as strings (`"true"`) when read back via the JS client. The `profileCreation.ts` code used strict `=== true` (boolean), so `"true" === true` evaluated to `false` — writing `emcc_verified: false` to the coaches table even for verified coaches.

**Root cause (2):** Coaches who signed up before the April 10 fix had `emcc_verified: null` in metadata (the field was never stored in the old signup flow).

**Fix:** Updated `profileCreation.ts` to accept both `=== true` and `=== 'true'`. Manually updated three affected coaches (Donna Burfield, Adele Jacobs, Lucy Packer) via SQL.

**Files changed:** `utils/profileCreation.ts`

---

## 2026-04-10

### Feature — CoachInfo page redesign
New sections: What is Accreditation, EMCC/ICF/AC body cards with logos and level badges, Coaching Minds partnership card.

### Feature — Partners strip on Home page
EMCC, ICF, Coaching Minds, and AC logos added to bottom of homepage.

### Bug Fix — Accreditation data not written at profile creation
**Symptom:** All coaches had `accreditation_body = null` in the coaches table after signup.

**Root cause:** `createCoachProfile()` never read accreditation fields from user metadata — they were captured during signup and stored in auth metadata, but never transferred to the coaches table row at creation time.

**Fix:** Added accreditation fields (`accreditation_body`, `accreditation_level`, `emcc_verified`, `icf_verified`, `ac_verified`, `verification_status`) to the `insertData` object in `profileCreation.ts`, reading from `userData.user_metadata`.

**Files changed:** `utils/profileCreation.ts`, `pages/CoachSignup.tsx`

---

## 2026-03-26

### Bug Fix — Review stats trigger targeting wrong table
**Symptom:** `total_reviews` and `average_rating` on coaches were never updated when reviews were added.

**Root cause:** The original trigger targeted `coach_profiles`, which is a VIEW not a table — triggers cannot fire on views.

**Fix:** Recreated the trigger targeting the `coaches` table directly. Ran a full backfill of all existing coach review stats.

**Files changed:** `supabase/migrations/20260326_fix_review_stats_trigger.sql`

---

## 2026-03-17

### Security — Multiple RLS and auth hardening fixes
- Blocked direct writes to `verified_credentials` table from non-service-role callers
- Fixed `review_comments` RLS gap
- Added OCR rate limiting
- Restricted sensitive coach column updates
- Scoped storage paths

See `docs/SECURITY_FIXES_2026_03_17.md` for full detail.
