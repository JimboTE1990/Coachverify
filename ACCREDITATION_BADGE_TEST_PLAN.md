# Accreditation Badge - End-to-End Test Plan

## Purpose
Validate that the accreditation badge feature works correctly for a **real coach** going through the full onboarding and verification process.

## Test Scenarios

### Scenario 1: New EMCC Coach Signs Up (Recommended First Test)

#### Step 1: Create Test Coach Profile
1. **Sign up as a new coach** (or use existing test account)
2. **Complete onboarding** until you reach credentials section
3. **Select EMCC** as accreditation body
4. **Enter a real EMCC profile URL** from their directory:
   - Go to: https://www.emccouncil.org/eu/en/directories/coaches
   - Find any real coach profile
   - Copy their profile URL (e.g., `https://www.emccouncil.org/eu/en/directories/coaches/john-smith`)
   - OR use search URL format: `https://www.emccouncil.org/eu/en/directories/coaches?search=Coach+Name`

#### Step 2: Manual Database Setup (Since Verification Flow May Not Be Complete)
Since the automated verification might not be fully implemented, manually set the fields:

```sql
-- Get your test coach's ID
SELECT id, name, email, accreditation_body
FROM coach_profiles
WHERE email = 'your-test-email@example.com';

-- Set EMCC verified with profile URL
UPDATE coach_profiles
SET
  accreditation_body = 'EMCC',
  accreditation_level = 'Practitioner',
  emcc_verified = true,
  emcc_verified_at = NOW(),
  emcc_profile_url = 'https://www.emccouncil.org/eu/en/directories/coaches?search=Test+Coach'
WHERE email = 'your-test-email@example.com';

-- Verify it was set correctly
SELECT
  name,
  accreditation_body,
  accreditation_level,
  emcc_verified,
  emcc_profile_url,
  CASE
    WHEN accreditation_body = 'EMCC' AND emcc_verified = true AND emcc_profile_url IS NOT NULL
    THEN '✅ BADGE WILL SHOW'
    ELSE '❌ MISSING DATA'
  END as badge_status
FROM coach_profiles
WHERE email = 'your-test-email@example.com';
```

#### Step 3: Verify Badge Displays
1. **Open the coach's public profile page**
   - Log out or use incognito window
   - Navigate to: `/coach/{coach-id}` or browse and click on the coach
2. **Check for the EMCC badge**:
   - ✅ Navy blue gradient background (navy → gold)
   - ✅ Gold decorative squares (◆◆◆)
   - ✅ "EMCC" text in bold navy
   - ✅ Green checkmark icon
   - ✅ "VERIFIED ACCREDITATION" heading
   - ✅ "Practitioner" level displayed
   - ✅ Link: "Check out my EMCC accreditation here"

#### Step 4: Test Verification Link
1. **Click the accreditation link**
2. **Verify it opens in a new tab**
3. **Check the URL** matches what you entered in the database
4. **Confirm it goes to EMCC directory** (or search page)

#### Expected Result
✅ Badge displays correctly with all elements
✅ Link opens EMCC directory in new tab
✅ Design blends with profile theme
✅ Badge appears below "EMCC Accredited" text

---

### Scenario 2: New ICF Coach Signs Up

#### Step 1: Create Test Coach Profile
1. **Sign up as a new coach** (or use different test account)
2. **Complete onboarding**
3. **Select ICF** as accreditation body
4. **Get a real ICF profile URL**:
   - Go to: https://coachfederation.org/find-a-coach
   - Find any real coach profile
   - Copy their profile URL
   - OR use search format: `https://coachfederation.org/find-a-coach?search=Coach+Name`

#### Step 2: Manual Database Setup

```sql
-- Set ICF verified with profile URL
UPDATE coach_profiles
SET
  accreditation_body = 'ICF',
  icf_accreditation_level = 'PCC',
  icf_verified = true,
  icf_verified_at = NOW(),
  icf_profile_url = 'https://coachfederation.org/find-a-coach?search=Test+Coach'
WHERE email = 'your-test-email@example.com';

-- Verify it was set
SELECT
  name,
  accreditation_body,
  icf_accreditation_level,
  icf_verified,
  icf_profile_url,
  CASE
    WHEN accreditation_body = 'ICF' AND icf_verified = true AND icf_profile_url IS NOT NULL
    THEN '✅ BADGE WILL SHOW'
    ELSE '❌ MISSING DATA'
  END as badge_status
FROM coach_profiles
WHERE email = 'your-test-email@example.com';
```

#### Step 3: Verify Badge Displays
1. **View the public profile page**
2. **Check for the ICF badge**:
   - ✅ Navy blue gradient background (ICF navy → light blue)
   - ✅ "ICF" text in bold uppercase
   - ✅ Green checkmark icon
   - ✅ "VERIFIED ACCREDITATION" heading
   - ✅ "International Coaching Federation" subtitle
   - ✅ "PCC" credential level
   - ✅ Link: "Check out my ICF accreditation here"

#### Step 4: Test Verification Link
1. **Click the accreditation link**
2. **Verify it opens ICF directory** in new tab

#### Expected Result
✅ ICF badge displays correctly
✅ Link opens ICF directory in new tab
✅ All text and styling correct

---

### Scenario 3: Test with Your Co-Founders (Real World Test)

When your co-founder coaches sign up:

#### Before They Sign Up
1. **Brief them on the process**:
   - They'll need their EMCC or ICF profile URL
   - Explain they'll be verifying their credentials
   - Let them know you might need to manually verify in database initially

#### During Signup
1. **Watch them go through onboarding**
2. **Note any issues** with the verification flow
3. **Check if accreditation fields are populated** correctly

#### After Signup
1. **Check the database**:
```sql
-- Find their profile
SELECT
  id,
  name,
  email,
  accreditation_body,
  emcc_verified,
  icf_verified,
  emcc_profile_url,
  icf_profile_url
FROM coach_profiles
WHERE email = 'cofounder-email@example.com';
```

2. **If verification didn't auto-complete**, manually set:
```sql
-- For EMCC co-founder
UPDATE coach_profiles
SET
  emcc_verified = true,
  emcc_verified_at = NOW()
WHERE email = 'cofounder-email@example.com'
  AND accreditation_body = 'EMCC';

-- For ICF co-founder
UPDATE coach_profiles
SET
  icf_verified = true,
  icf_verified_at = NOW()
WHERE email = 'cofounder-email@example.com'
  AND accreditation_body = 'ICF';
```

3. **View their public profile** and verify badge shows

#### Expected Result
✅ Badge displays on their public profile
✅ They can see and click their verification link
✅ Link goes to their actual EMCC/ICF directory page

---

## Quick Test (5 Minutes)

If you just want to quickly verify the feature works:

### Option A: Use Existing Working Profile

The easiest test is to view **Jennifer Martinez** or **Paul Smith** profiles that already work:
1. Browse coaches
2. Click on Jennifer Martinez or Paul Smith
3. Verify badge shows correctly
4. Click verification link
5. Confirm it opens EMCC directory

### Option B: Create Single Test Coach

```sql
-- Create or update a test coach
UPDATE coach_profiles
SET
  accreditation_body = 'EMCC',
  accreditation_level = 'Senior Practitioner',
  emcc_verified = true,
  emcc_verified_at = NOW(),
  emcc_profile_url = 'https://www.emccouncil.org/eu/en/directories/coaches?search=Test+Coach'
WHERE email = 'test@example.com';

-- Or create new:
INSERT INTO coach_profiles (
  name,
  email,
  accreditation_body,
  accreditation_level,
  emcc_verified,
  emcc_verified_at,
  emcc_profile_url,
  subscription_status,
  photo_url
) VALUES (
  'Test Coach',
  'testcoach@example.com',
  'EMCC',
  'Practitioner',
  true,
  NOW(),
  'https://www.emccouncil.org/eu/en/directories/coaches?search=Test+Coach',
  'trial',
  'https://picsum.photos/seed/testcoach/200/200'
);
```

Then view the profile at `/coach/{id}`.

---

## Test Checklist

### Visual Design
- [ ] Badge has gradient background (navy → gold for EMCC, navy → blue for ICF)
- [ ] Border is subtle (2px semi-transparent), not harsh black line
- [ ] EMCC shows gold decorative squares (◆◆◆)
- [ ] ICF text is uppercase "ICF" not lowercase
- [ ] Green checkmark appears next to organization name
- [ ] "VERIFIED ACCREDITATION" heading is bold
- [ ] Accreditation level displays correctly
- [ ] Divider line appears above link

### Functionality
- [ ] Badge only shows when all three conditions met (body, verified, URL)
- [ ] Badge does NOT show if any field is missing
- [ ] Link text says "Check out my [EMCC/ICF] accreditation here"
- [ ] Link opens in new tab (`target="_blank"`)
- [ ] Link goes to correct EMCC/ICF directory URL
- [ ] Badge appears below "EMCC Accredited" or "ICF Accredited" text

### Responsive Design
- [ ] Badge displays correctly on desktop
- [ ] Badge displays correctly on tablet
- [ ] Badge displays correctly on mobile
- [ ] All text is readable on small screens
- [ ] Link is tappable on mobile

### Edge Cases
- [ ] Badge does NOT show if `accreditation_body` is null
- [ ] Badge does NOT show if `emcc_verified`/`icf_verified` is false
- [ ] Badge does NOT show if profile URL is empty/null
- [ ] Badge works with different accreditation levels (Practitioner, Senior Practitioner, PCC, ACC, MCC)
- [ ] Badge works with real EMCC/ICF URLs (not just placeholders)

---

## What to Look For (Potential Issues)

### Badge Not Showing
If badge doesn't appear, check:
1. **Database has all three fields set** (body, verified, URL)
2. **Browser cache** - try hard refresh (Cmd+Shift+R) or incognito
3. **Correct table** - using `coach_profiles` not `coaches`
4. **Profile is visible** - `subscription_status` is 'trial' or 'active'

### Link Not Working
If link doesn't work, check:
1. **URL is valid** - starts with `https://`
2. **No typos** in EMCC/ICF domain
3. **Opens in new tab** - has `target="_blank"` and `rel="noopener noreferrer"`

### Wrong Badge Showing
If EMCC shows ICF badge or vice versa:
1. **Check `accreditation_body` value** - must be exactly 'EMCC' or 'ICF'
2. **Case sensitive** - must be uppercase
3. **No typos** - 'EMCC' not 'EMC' or 'EMCC '

---

## Success Criteria

✅ **Badge displays** for verified coaches with all three fields set
✅ **Badge does NOT display** if any field is missing
✅ **Link opens** correct EMCC or ICF directory in new tab
✅ **Design matches mockups** (gradient background, soft borders)
✅ **Works on all devices** (mobile, tablet, desktop)
✅ **Text is friendly** ("Check out my..." not "Verify on...")

---

## When Your Co-Founders Test

### What to Ask Them
1. "Can you see the accreditation badge on your profile?"
2. "Does the badge look professional and match EMCC/ICF branding?"
3. "When you click the verification link, does it go to the right place?"
4. "Does the link open in a new tab?"
5. "Is the wording friendly and clear?"

### What to Watch For
- Do they understand what the badge means?
- Do they feel proud to display it?
- Does it increase their trust in the platform?
- Would they want clients to click and verify?

---

## Final Validation

Once your co-founders test successfully, you'll have validated:
✅ Real coaches can sign up and get badges
✅ Real EMCC/ICF URLs work correctly
✅ Badge design meets expectations
✅ Links function properly for verification
✅ Feature is production-ready for all coaches

**The feature is ready - it just needs real-world validation from your co-founders!**
