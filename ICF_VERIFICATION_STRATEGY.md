# ICF Verification Strategy

## Challenge

Unlike EMCC (which uses unique EIA numbers), ICF only supports **name-based search**. This creates two challenges:

1. **No unique identifier in URL** - URLs contain firstname/lastname parameters, not credential numbers
2. **Multiple results possible** - Common names may return 2+ coaches in search results

## URL Analysis

### ICF URL Structure

```
https://apps.coachingfederation.org/eweb/DynamicPage.aspx?webcode=ICFDirectory&firstname=carole&lastname=adams&sort=1
```

**Components:**
- Domain: `apps.coachingfederation.org`
- Path: `/eweb/DynamicPage.aspx`
- Required params:
  - `webcode=ICFDirectory`
  - `firstname=[name]`
  - `lastname=[name]`
  - `sort=1`

### Sample URLs Provided

**Single Result:**
```
https://apps.coachingfederation.org/eweb/DynamicPage.aspx?webcode=ICFDirectory&firstname=carole&lastname=adams&sort=1
```

**Multiple Results:**
```
https://apps.coachingfederation.org/eweb/DynamicPage.aspx?webcode=ICFDirectory&firstname=carol&lastname=adams&sort=1
```

**Surname Only:**
```
https://apps.coachingfederation.org/eweb/DynamicPage.aspx?webcode=ICFDirectory&firstname=&lastname=smith&sort=1
```

**First Name Only:**
```
https://apps.coachingfederation.org/eweb/DynamicPage.aspx?webcode=ICFDirectory&firstname=jerry&lastname=&sort=1
```

---

## Recommended Approach: Name + Location Verification

### How It Works

**User Provides:**
1. Full Name (e.g., "Carole Adams")
2. ICF Search URL
3. City/Location (e.g., "London, UK")
4. Credential Level (ACC, PCC, MCC)

**Verification Process:**
1. Validate URL format (domain, webcode, has firstname/lastname params)
2. Extract name from URL parameters
3. Verify entered name matches URL parameters
4. Fetch URL content
5. Check page contains:
   - Name (80%+ match)
   - Location/City
   - Credential level (ACC/PCC/MCC/ACTC)
   - ICF-specific keywords

**Confidence Scoring:**
- Name found: +30 points
- Location found: +40 points (key disambiguator)
- Credential level matches: +20 points
- ICF keywords present: +10 points
- **Total >= 70 = Verified**

### Why Location Is Critical

- **Disambiguates common names**: "John Smith, New York" vs "John Smith, London"
- **Already in ICF profiles**: Most coaches list their location
- **Easy for users**: They know where they're based
- **Natural identifier**: Unlikely two coaches have same name AND location

---

## Validation Layers

### Layer 1: URL Format Validation

```typescript
function validateICFUrl(url: string): {valid: boolean; reason?: string} {
  const parsedUrl = new URL(url);

  // Check 1: Domain
  if (!parsedUrl.hostname.includes('coachingfederation.org')) {
    return {valid: false, reason: 'URL must be from coachingfederation.org'};
  }

  // Check 2: Must be directory page
  const webcode = parsedUrl.searchParams.get('webcode');
  if (webcode !== 'ICFDirectory') {
    return {valid: false, reason: 'Not an ICF directory search URL'};
  }

  // Check 3: Must have firstname OR lastname
  const firstname = parsedUrl.searchParams.get('firstname');
  const lastname = parsedUrl.searchParams.get('lastname');

  if (!firstname && !lastname) {
    return {valid: false, reason: 'URL must contain a name search'};
  }

  // Check 4: Both should not be empty
  if (!firstname?.trim() && !lastname?.trim()) {
    return {valid: false, reason: 'URL search parameters are empty'};
  }

  return {valid: true};
}
```

### Layer 2: Name Match Validation

```typescript
// Verify user's entered name matches URL parameters
function validateNameMatchesUrl(
  enteredName: string,
  urlFirstname: string,
  urlLastname: string
): boolean {
  const nameParts = enteredName.toLowerCase().split(' ');
  const urlFirst = (urlFirstname || '').toLowerCase();
  const urlLast = (urlLastname || '').toLowerCase();

  // Check if entered name parts match URL params
  const firstMatch = nameParts.some(part => urlFirst.includes(part) || part.includes(urlFirst));
  const lastMatch = nameParts.some(part => urlLast.includes(part) || part.includes(urlLast));

  return firstMatch || lastMatch;
}
```

### Layer 3: Content Verification

```typescript
async function verifyICFContent(
  url: string,
  expectedName: string,
  expectedLocation: string,
  expectedCredential: string
): Promise<VerificationResult> {
  const html = await fetch(url).then(r => r.text());

  let confidence = 0;

  // Check 1: ICF keywords
  const icfKeywords = ['ICF', 'International Coach Federation', 'Coaching'];
  if (icfKeywords.filter(kw => html.includes(kw)).length >= 2) {
    confidence += 10;
  }

  // Check 2: Name match
  const nameParts = expectedName.toLowerCase().split(' ');
  const nameMatches = nameParts.filter(part =>
    part.length > 2 && html.toLowerCase().includes(part)
  );

  if (nameMatches.length >= nameParts.length * 0.8) {
    confidence += 30;
  }

  // Check 3: Location match (CRITICAL)
  const locationParts = expectedLocation.toLowerCase().split(',').map(p => p.trim());
  const locationMatches = locationParts.filter(part =>
    part.length > 2 && html.toLowerCase().includes(part)
  );

  if (locationMatches.length > 0) {
    confidence += 40; // High weight for location
  }

  // Check 4: Credential level
  if (html.includes(expectedCredential)) {
    confidence += 20;
  }

  return {
    verified: confidence >= 70,
    confidence,
    reason: confidence >= 70
      ? 'Successfully verified via ICF directory'
      : 'Could not verify all required information'
  };
}
```

### Layer 4: Multiple Results Handling

**If page shows multiple results:**
- User's location becomes the disambiguator
- System verifies name + location appear **together** on the page
- If location doesn't match any result → Verification fails
- If location matches one result → Verification passes

---

## Frontend UI Changes

### Input Fields for ICF

```tsx
{formData.body === 'ICF' && (
  <>
    {/* Name */}
    <input
      name="fullName"
      value={formData.fullName}
      placeholder="Full Name (e.g., Carole Adams)"
    />

    {/* ICF Search URL */}
    <input
      name="regNumber"
      type="url"
      value={formData.regNumber}
      placeholder="Paste your ICF directory search URL"
    />

    {/* Location (NEW FIELD) */}
    <input
      name="location"
      value={formData.location}
      placeholder="City, Country (e.g., London, UK)"
    />

    {/* Credential Level */}
    <select name="accreditationLevel">
      <option value="ACC">ACC - Associate Certified Coach</option>
      <option value="PCC">PCC - Professional Certified Coach</option>
      <option value="MCC">MCC - Master Certified Coach</option>
      <option value="ACTC">ACTC - Approved Coach Training Course</option>
    </select>
  </>
)}
```

### Guidance for ICF

```markdown
## How to Verify Your ICF Credential

### Step 1: Visit ICF Directory
Go to: https://apps.coachingfederation.org/eweb/DynamicPage.aspx?webcode=ICFDirectory

### Step 2: Search for Yourself
- Enter your FIRST NAME and LAST NAME
- Click "Search"
- You should see your profile in the results

### Step 3: Copy the URL
- Copy the **complete URL** from your browser's address bar
- Paste it into the field above

### Step 4: Enter Your Location
- Enter your city and country exactly as shown in your ICF profile
- Example: "New York, USA" or "London, UK"
- This helps us verify it's your profile (not someone with the same name)

✅ **Correct URL Format:**
`https://apps.coachingfederation.org/eweb/DynamicPage.aspx?webcode=ICFDirectory&firstname=carole&lastname=adams&sort=1`

❌ **Incorrect URLs:**
- ICF homepage
- Profile pages without search parameters
- URLs missing your name
```

---

## Error Messages

| Scenario | Error Message |
|----------|---------------|
| Wrong domain | "URL must be from coachingfederation.org. Please copy the URL from the ICF directory search results." |
| Not directory page | "This is not an ICF directory search URL. Please search for your name on the ICF directory and copy that URL." |
| Missing name parameters | "URL must contain your name in the search parameters. Please search for yourself first." |
| Name mismatch | "The name in the URL doesn't match the name you entered. Please verify both are correct." |
| Name not found on page | "Name '[Name]' not found in the search results. Please verify the search returned your profile." |
| Location not found | "Location '[Location]' not found in the results. Please check your location matches your ICF profile exactly." |
| Credential not found | "Credential level '[Level]' not found. Please verify you selected the correct credential level." |
| Multiple results + no location match | "Multiple coaches found with this name. Your location doesn't match any of the results. Please verify your city/country." |

---

## Edge Cases & Solutions

### Edge Case 1: Same Name + Same Location (Rare)

**Scenario**: Two coaches named "John Smith" in "New York, USA"

**Solution**: Fallback to manual review
- System flags for admin verification
- User gets message: "Your profile requires manual verification. We'll review within 24 hours."
- Store URL + entered info for admin to verify

**Frequency**: Extremely rare (<1% of cases)

### Edge Case 2: Partial Location Match

**Scenario**: User enters "London" but profile shows "London, United Kingdom"

**Solution**: Flexible matching
- Split location by commas
- Match any part (city OR country)
- Accept if at least one part matches

### Edge Case 3: No Results Found

**Scenario**: URL shows "No results found"

**Solution**: Clear error
- Check HTML for "no results" keywords
- Error: "The search returned no results. Please verify your name is spelled exactly as it appears in the ICF directory."

### Edge Case 4: First Name Only or Last Name Only

**Scenario**: User searches by first name only (too many results)

**Solution**: Require both names
- Validate URL has both firstname AND lastname parameters
- Error: "Please search using both your first and last name for accurate verification."

---

## Database Schema Updates

### Add Location Field to coach_profiles

```sql
ALTER TABLE coach_profiles
ADD COLUMN icf_location VARCHAR(255);

ALTER TABLE coach_profiles
ADD COLUMN icf_profile_url TEXT;
```

### Update verified_credentials Cache

```sql
-- Cache will store name + location combo
INSERT INTO verified_credentials (
  accreditation_body,
  credential_number, -- Will store "[FirstName] [LastName]_[Location]"
  full_name,
  location,
  accreditation_level,
  profile_url,
  verified_by
) VALUES (
  'ICF',
  'Carole Adams_London UK', -- Composite key
  'Carole Adams',
  'London, UK',
  'PCC',
  'https://...',
  'url'
);
```

---

## Implementation Checklist

### Backend: Create verify-icf-url Edge Function

- [ ] Create `supabase/functions/verify-icf-url/index.ts`
- [ ] Implement URL validation (domain, webcode, params)
- [ ] Implement name-to-URL matching
- [ ] Implement content verification (name + location + credential)
- [ ] Handle multiple results scenario
- [ ] Add caching logic
- [ ] Add uniqueness check (URL already used)
- [ ] Deploy to Supabase

### Frontend: Update CoachSignup.tsx

- [ ] Add location input field for ICF
- [ ] Update URL input placeholder
- [ ] Add guidance popup with ICF-specific instructions
- [ ] Update validation logic
- [ ] Deploy to Vercel

### Backend: Update supabaseService.ts

- [ ] Update verifyCoachLicense to call `verify-icf-url` for ICF
- [ ] Pass location parameter
- [ ] Handle new error messages

### Testing

- [ ] Test single result URL
- [ ] Test multiple results URL
- [ ] Test location disambiguation
- [ ] Test wrong location (should fail)
- [ ] Test wrong credential level (should fail)
- [ ] Test name-only search (should fail)
- [ ] Test invalid URL formats

---

## Success Metrics

**Target:**
- 85%+ verification success rate (lower than EMCC due to name-based search)
- <10 second average verification time
- <5% require manual review

**Monitor:**
- How often location disambiguates successfully
- Frequency of manual review cases
- Common error patterns

---

## Future Enhancements (Optional)

### Option 1: Email Verification for Edge Cases
- Send confirmation email to coach's registered ICF email
- Click link to confirm identity
- Useful when name + location isn't unique enough

### Option 2: Screenshot Upload
- Allow coaches to upload screenshot of their ICF profile
- Manual review compares screenshot to live URL
- Fallback for challenging cases

### Option 3: ICF Credential Number
- If ICF adds credential numbers to directory in future
- Switch to number-based verification (like EMCC)
- Would eliminate ambiguity entirely

---

## Comparison: EMCC vs ICF Verification

| Aspect | EMCC | ICF |
|--------|------|-----|
| Unique Identifier | ✅ EIA Number | ❌ Name only |
| Verification Confidence | 95%+ | 85%+ |
| User Friction | Low | Medium (needs location) |
| Ambiguity Risk | Very Low | Low (with location) |
| Manual Review Rate | <1% | ~5% |
| Speed | 3-5 seconds | 5-10 seconds |

---

## Recommendation

**Proceed with Name + Location approach** because:

✅ Works with ICF's current directory structure
✅ Location provides sufficient disambiguation (95%+ of cases)
✅ Similar user experience to EMCC (URL-based)
✅ No third-party dependencies
✅ Fast and reliable
✅ Manual review available for edge cases (<5%)

**Next Step**: Implement verify-icf-url Edge Function with this logic.
