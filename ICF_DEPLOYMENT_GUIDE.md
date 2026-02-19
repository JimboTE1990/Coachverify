# ICF URL Verification Deployment Guide

## Overview

ICF verification uses **Name + Location** approach since ICF only supports name-based search (no unique credential numbers in URLs).

**Key Difference from EMCC**: Users must provide their city/country to disambiguate coaches with the same name.

---

## Deployment Steps

### Step 1: Deploy Edge Function to Supabase

1. Go to: https://supabase.com/dashboard/project/whhwvuugrzbyvobwfmce/functions
2. Click **"Create a new Function"**
3. Function name: `verify-icf-url`
4. Copy code from: `supabase/functions/verify-icf-url/index.ts`
5. Paste into editor
6. Click **"Deploy"**
7. ✅ Wait for green checkmark

### Step 2: Update Database Schema (If Needed)

```sql
-- Add ICF location field to coach_profiles (if not exists)
ALTER TABLE coach_profiles
ADD COLUMN IF NOT EXISTS icf_location VARCHAR(255);

ALTER TABLE coach_profiles
ADD COLUMN IF NOT EXISTS icf_profile_url TEXT;

-- Update verified_credentials to support location
-- credential_number will store: "[Name]_[Location]" for ICF
-- Example: "Carole Adams_LONDON UK"
```

### Step 3: Update Frontend (CoachSignup.tsx)

Add location input field for ICF:

```tsx
{formData.body === 'ICF' && (
  <>
    {/* Full Name */}
    <label>Full Name</label>
    <input
      name="fullName"
      value={formData.fullName}
      onChange={handleChange}
      placeholder="e.g., Carole Adams"
    />

    {/* ICF Profile URL */}
    <label>ICF Directory Search URL</label>
    <input
      name="regNumber"
      type="url"
      value={formData.regNumber}
      onChange={handleChange}
      placeholder="Paste your ICF directory search URL"
    />

    {/* NEW: Location Field */}
    <label>City, Country</label>
    <input
      name="location"
      value={formData.location || ''}
      onChange={handleChange}
      placeholder="e.g., London, UK"
      required
    />
    <p className="text-xs text-slate-600 mt-1">
      This helps us verify the correct profile if multiple coaches share your name
    </p>

    {/* Credential Level */}
    <label>ICF Credential Level</label>
    <select
      name="accreditationLevel"
      value={formData.accreditationLevel}
      onChange={handleChange}
    >
      <option value="">Select Level</option>
      <option value="ACC">ACC - Associate Certified Coach</option>
      <option value="PCC">PCC - Professional Certified Coach</option>
      <option value="MCC">MCC - Master Certified Coach</option>
      <option value="ACTC">ACTC - Approved Coach Training Course</option>
    </select>
  </>
)}
```

### Step 4: Update Guidance for ICF

```tsx
{/* ICF Instructions */}
{formData.body === 'ICF' && (
  <div className="space-y-3 text-sm text-slate-700">
    <div>
      <p className="font-semibold text-brand-600 mb-1">📍 Step 1: Visit ICF Directory</p>
      <a
        href="https://apps.coachingfederation.org/eweb/DynamicPage.aspx?webcode=ICFDirectory"
        target="_blank"
        className="text-brand-600 underline"
      >
        Open ICF Member Directory
      </a>
    </div>

    <div>
      <p className="font-semibold text-brand-600 mb-1">🔍 Step 2: Search by Your Full Name</p>
      <p className="text-slate-600 mb-1">
        Enter your <strong>first name</strong> and <strong>last name</strong>, then click Search
      </p>
    </div>

    <div>
      <p className="font-semibold text-brand-600 mb-1">📋 Step 3: Copy the URL</p>
      <p className="text-slate-600">
        Copy the <strong>complete URL</strong> from your browser's address bar
      </p>
    </div>

    <div>
      <p className="font-semibold text-brand-600 mb-1">📍 Step 4: Enter Your Location</p>
      <p className="text-slate-600">
        Enter your city and country <strong>exactly as shown</strong> in your ICF profile
      </p>
    </div>

    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
      <p className="font-semibold text-green-800 mb-1">✅ Correct URL Format:</p>
      <code className="bg-white px-2 py-1 rounded border border-green-300 text-green-700 font-mono text-xs break-all">
        https://apps.coachingfederation.org/eweb/DynamicPage.aspx?webcode=ICFDirectory&firstname=carole&lastname=adams&sort=1
      </code>
    </div>

    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
      <p className="text-xs text-blue-800">
        💡 <strong>Why location?</strong> If multiple coaches share your name, your location helps us identify the correct profile.
      </p>
    </div>
  </div>
)}
```

### Step 5: Update Service Call (supabaseService.ts)

```typescript
// In verifyCoachLicense function
if (body === 'ICF') {
  const { data, error } = await supabase.functions.invoke('verify-icf-url', {
    body: {
      coachId,
      fullName,
      profileUrl: regNumber, // URL from the form
      location: formData.location, // NEW: Location field
      accreditationLevel
    }
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}
```

---

## Test Cases

### Test Case 1: Single Result ✅ PASS

**Input:**
- Name: `Carole Adams`
- URL: `https://apps.coachingfederation.org/eweb/DynamicPage.aspx?webcode=ICFDirectory&firstname=carole&lastname=adams&sort=1`
- Location: `London, UK`
- Level: `PCC`

**Expected:** ✅ Verified successfully

---

### Test Case 2: Multiple Results - Location Disambiguates ✅ PASS

**Input:**
- Name: `Carol Adams` (note: multiple results)
- URL: `https://apps.coachingfederation.org/eweb/DynamicPage.aspx?webcode=ICFDirectory&firstname=carol&lastname=adams&sort=1`
- Location: `New York, USA`
- Level: `ACC`

**Expected:** ✅ Verified if "New York, USA" appears with Carol Adams on the page

---

### Test Case 3: Wrong Location ❌ FAIL

**Input:**
- Name: `Carole Adams`
- URL: Valid ICF URL
- Location: `Paris, France` (wrong location)
- Level: `PCC`

**Expected:** ❌ Error: "Location 'Paris, France' not found in the results..."

---

### Test Case 4: Missing Location ❌ FAIL

**Input:**
- Name: `Carole Adams`
- URL: Valid ICF URL
- Location: `` (empty)
- Level: `PCC`

**Expected:** ❌ Error: "Missing required fields: location"

---

### Test Case 5: Wrong Domain ❌ FAIL

**Input:**
- URL: `https://www.google.com`

**Expected:** ❌ Error: "URL must be from coachingfederation.org"

---

### Test Case 6: Name Mismatch ❌ FAIL

**Input:**
- Name: `John Smith`
- URL: Carole Adams URL
- Location: `London, UK`

**Expected:** ❌ Error: "The name in the URL (carole adams) doesn't match..."

---

### Test Case 7: Single Name Search ❌ FAIL

**Input:**
- URL: `https://apps.coachingfederation.org/eweb/DynamicPage.aspx?webcode=ICFDirectory&firstname=&lastname=smith&sort=1`

**Expected:** ❌ Error: "Please search using both your first name and last name..."

---

## URL Validation Logic

### Valid URL Format:
```
https://apps.coachingfederation.org/eweb/DynamicPage.aspx?webcode=ICFDirectory&firstname=carole&lastname=adams&sort=1
```

**Required Components:**
- ✅ Domain: `coachingfederation.org`
- ✅ Path: `/eweb/DynamicPage.aspx`
- ✅ Query param: `webcode=ICFDirectory`
- ✅ Query param: `firstname=[name]` (not empty)
- ✅ Query param: `lastname=[name]` (not empty)

### Invalid URLs:
- ❌ Wrong domain
- ❌ Not a directory search page
- ❌ Missing firstname OR lastname
- ❌ Empty firstname/lastname parameters

---

## Verification Confidence Scoring

| Check | Points | Description |
|-------|--------|-------------|
| ICF keywords present | +10 | Page contains "ICF", "International Coach Federation", etc. |
| Name matches | +30 | 80%+ of name parts found on page |
| **Location matches** | **+40** | **City or country found on page (critical!)** |
| Credential level found | +10 | ACC/PCC/MCC/ACTC found on page |
| Credential matches expected | +10 | Found level matches what user selected |

**Threshold**: ≥70 points = Verified

---

## Error Messages

| Scenario | Error Message |
|----------|---------------|
| Wrong domain | "URL must be from coachingfederation.org..." |
| Not directory page | "This is not an ICF directory search URL..." |
| Wrong webcode | "This is not an ICF directory search page..." |
| Missing name in URL | "URL must contain your name in the search parameters..." |
| Only first or last name | "Please search using both your first name and last name..." |
| Name mismatch | "The name in the URL (X) doesn't match the name you entered (Y)..." |
| Name not found | "Name 'X' not found in the search results..." |
| **Location not found** | **"Location 'X' not found in the results..."** |
| No results | "The search returned no results..." |
| Duplicate URL | "This ICF profile URL is already registered..." |

---

## Edge Cases & Handling

### Edge Case 1: Same Name + Same Location (Rare)

**Scenario**: Two "John Smith" coaches in "New York, USA"

**Handling**:
- System flags for manual review (confidence 50-69)
- User sees: "Your profile requires manual verification. We'll review within 24 hours."
- Status set to: `pending_review`

**Frequency**: <1% of cases

---

### Edge Case 2: Partial Location Match

**Scenario**: User enters "London" but profile shows "London, United Kingdom"

**Handling**:
- Split location by commas: `["London", "United Kingdom"]`
- Match if ANY part found on page
- ✅ Accepts partial matches

---

### Edge Case 3: Multiple Results on Page

**Scenario**: URL shows 3 coaches named "Carol Adams"

**Handling**:
- Location becomes the disambiguator
- System verifies name + location appear **together** on page
- If location matches one of the results → ✅ Verified
- If location doesn't match any → ❌ Rejected

---

### Edge Case 4: No Results Found

**Scenario**: Search returns "No results found"

**Handling**:
- Check HTML for "no results" keywords
- ❌ Error: "The search returned no results..."

---

## Database Updates

### coach_profiles Table

New columns needed:
```sql
icf_profile_url TEXT
icf_location VARCHAR(255)
icf_verified BOOLEAN
icf_verified_at TIMESTAMP
```

### verified_credentials Cache

For ICF, `credential_number` stores name + location:
```sql
INSERT INTO verified_credentials (
  accreditation_body,
  credential_number, -- Format: "CAROLE ADAMS_LONDON UK"
  full_name,
  location,
  accreditation_level,
  profile_url,
  verified_by
) VALUES (
  'ICF',
  'CAROLE ADAMS_LONDON UK',
  'Carole Adams',
  'London, UK',
  'PCC',
  'https://...',
  'url'
);
```

---

## Monitoring

### Key Metrics

1. **Verification Success Rate**
   - Target: >85% (lower than EMCC due to name-based search)
   - Track: How many pass vs fail

2. **Manual Review Rate**
   - Target: <5%
   - Track: How many flagged for `pending_review`

3. **Common Errors**
   - Track: Which error messages appear most
   - Optimize guidance based on patterns

4. **Location Effectiveness**
   - Track: How often location disambiguates successfully
   - Measure: Confidence boost from location match

---

## Comparison: EMCC vs ICF

| Aspect | EMCC | ICF |
|--------|------|-----|
| Unique Identifier | ✅ EIA Number | ❌ Name only |
| Additional Field | None | Location required |
| Verification Confidence | 95%+ | 85%+ |
| Manual Review Rate | <1% | ~5% |
| Speed | 3-5 seconds | 5-10 seconds |
| User Friction | Low | Medium |

---

## Rollback Plan

If issues arise:

1. **Frontend**: Revert to old ICF verification method
2. **Keep old Edge Function active**: `verify-icf-accreditation`
3. **Switch service call** back to old function
4. **All code backed up in Git**

---

## Success Criteria

**After 1 Week:**
- [ ] 85%+ verification success rate
- [ ] <10 second average response time
- [ ] <5% manual review rate
- [ ] <10% support requests

**After 1 Month:**
- [ ] 90%+ verification success rate
- [ ] 40%+ cache hit rate
- [ ] Positive user feedback on process

---

## Next Steps

1. ✅ Deploy Edge Function to Supabase
2. ⏳ Update frontend to add location field
3. ⏳ Update service call to pass location
4. ⏳ Test all 7 test cases
5. ⏳ Monitor first 10-20 verifications
6. ⏳ Gather user feedback
7. ⏳ Adjust guidance if needed

---

## Questions?

Check:
- [ICF_VERIFICATION_STRATEGY.md](ICF_VERIFICATION_STRATEGY.md) for detailed design
- Edge Function logs in Supabase Dashboard
- `verified_credentials` table for cache data
