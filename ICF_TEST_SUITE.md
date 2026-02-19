# ICF URL Verification Test Suite

## Test Scenarios

### ✅ Test 1: Valid URL with Single Result (PASS)

**Input:**
- Name: `Carole Adams`
- URL: `https://apps.coachingfederation.org/eweb/DynamicPage.aspx?webcode=ICFDirectory&firstname=carole&lastname=adams&sort=1`
- Location: `London, UK`
- Level: `PCC`

**Expected Result:** ✅ "Successfully verified via ICF directory"

**Why:** URL contains name search, location matches profile, credential found

---

### ❌ Test 2: Random Website URL (FAIL)

**Input:**
- Name: `Carole Adams`
- URL: `https://www.google.com`
- Location: `London, UK`
- Level: `PCC`

**Expected Result:** ❌ "URL must be from coachingfederation.org. Please copy the URL from the ICF directory search results."

**Why:** Wrong domain - not ICF website

---

### ❌ Test 3: Random Text Instead of URL (FAIL)

**Input:**
- Name: `Carole Adams`
- URL: `hello world this is not a url`
- Location: `London, UK`
- Level: `PCC`

**Expected Result:** ❌ "Invalid URL format. Please copy the complete URL from your browser address bar."

**Why:** Not a valid URL format

---

### ❌ Test 4: ICF Homepage (Not Directory) (FAIL)

**Input:**
- Name: `Carole Adams`
- URL: `https://coachingfederation.org/`
- Location: `London, UK`
- Level: `PCC`

**Expected Result:** ❌ "This is not an ICF directory search URL. Please search for your name on the ICF directory and copy the results URL."

**Why:** Wrong path - not the directory search page

---

### ❌ Test 5: Single Name Search (Last Name Only) (FAIL)

**Input:**
- Name: `Carole Adams`
- URL: `https://apps.coachingfederation.org/eweb/DynamicPage.aspx?webcode=ICFDirectory&firstname=&lastname=adams&sort=1`
- Location: `London, UK`
- Level: `PCC`

**Expected Result:** ❌ "Please search using both your first name and last name for accurate verification. Single name searches may return multiple results."

**Why:** Missing first name in URL parameters - too ambiguous

---

### ❌ Test 6: Single Name Search (First Name Only) (FAIL)

**Input:**
- Name: `Jerry`
- URL: `https://apps.coachingfederation.org/eweb/DynamicPage.aspx?webcode=ICFDirectory&firstname=jerry&lastname=&sort=1`
- Location: `New York, USA`
- Level: `ACC`

**Expected Result:** ❌ "Please search using both your first name and last name for accurate verification."

**Why:** Missing last name in URL parameters

---

### ❌ Test 7: Name Mismatch (FAIL)

**Input:**
- Name: `John Smith`
- URL: `https://apps.coachingfederation.org/eweb/DynamicPage.aspx?webcode=ICFDirectory&firstname=carole&lastname=adams&sort=1`
- Location: `London, UK`
- Level: `PCC`

**Expected Result:** ❌ "The name in the URL (carole adams) doesn't match the name you entered (John Smith). Please verify both are correct."

**Why:** Entered name doesn't match URL parameters

---

### ❌ Test 8: Wrong Location (FAIL)

**Input:**
- Name: `Carole Adams`
- URL: `https://apps.coachingfederation.org/eweb/DynamicPage.aspx?webcode=ICFDirectory&firstname=carole&lastname=adams&sort=1`
- Location: `Paris, France` (wrong location)
- Level: `PCC`

**Expected Result:** ❌ "Location 'Paris, France' not found in the results. Please verify your location matches your ICF profile exactly (City, Country)..."

**Why:** Location doesn't appear on the page with the name

---

### ❌ Test 9: Missing Location (FAIL)

**Input:**
- Name: `Carole Adams`
- URL: `https://apps.coachingfederation.org/eweb/DynamicPage.aspx?webcode=ICFDirectory&firstname=carole&lastname=adams&sort=1`
- Location: `` (empty)
- Level: `PCC`

**Expected Result:** ❌ "Missing required fields: coachId, fullName, profileUrl, location"

**Why:** Location is required for ICF verification

---

### ✅ Test 10: Multiple Results - Location Disambiguates (PASS)

**Input:**
- Name: `Carol Adams` (note: multiple coaches with this name)
- URL: `https://apps.coachingfederation.org/eweb/DynamicPage.aspx?webcode=ICFDirectory&firstname=carol&lastname=adams&sort=1`
- Location: `New York, USA`
- Level: `ACC`

**Expected Result:** ✅ Verified if one of the Carol Adams profiles has location "New York, USA"

**Why:** Location successfully disambiguates between multiple coaches with same name

---

## Test Execution Plan

### Setup
1. Deploy `verify-icf-url` Edge Function to Supabase
2. Update frontend with location field
3. Update service call to pass location parameter

### Execution
1. Go to your signup page
2. Select "ICF" as accrediting body
3. For each test:
   - Enter the test name
   - Paste the test URL
   - Enter the test location
   - Select credential level
   - Click "Verify Now"
   - Record the result

### Recording Results

Use this checklist:

```
[ ] Test 1: Valid single result - PASS
[ ] Test 2: Wrong domain - FAIL (correct error)
[ ] Test 3: Invalid text - FAIL (correct error)
[ ] Test 4: ICF homepage - FAIL (correct error)
[ ] Test 5: Last name only - FAIL (correct error)
[ ] Test 6: First name only - FAIL (correct error)
[ ] Test 7: Name mismatch - FAIL (correct error)
[ ] Test 8: Wrong location - FAIL (correct error)
[ ] Test 9: Missing location - FAIL (correct error)
[ ] Test 10: Multiple results + location - PASS
```

---

## Expected Error Messages Summary

| Test | Expected Message |
|------|------------------|
| 1 | ✅ "Successfully verified via ICF directory" |
| 2 | ❌ "URL must be from coachingfederation.org..." |
| 3 | ❌ "Invalid URL format. Please copy the complete URL..." |
| 4 | ❌ "This is not an ICF directory search URL..." |
| 5 | ❌ "Please search using both your first name and last name..." |
| 6 | ❌ "Please search using both your first name and last name..." |
| 7 | ❌ "The name in the URL (carole adams) doesn't match..." |
| 8 | ❌ "Location 'Paris, France' not found in the results..." |
| 9 | ❌ "Missing required fields: location" |
| 10 | ✅ "Successfully verified via ICF directory" |

---

## Additional Edge Cases

### Test 11: Partial Location Match

**Input:**
- Location: `London` (user enters just city)
- Profile shows: `London, United Kingdom`

**Expected:** ✅ Should still verify (partial match accepted)

---

### Test 12: Case Sensitivity

**Input:**
- Location: `london, uk` (lowercase)
- Profile shows: `London, UK` (title case)

**Expected:** ✅ Should verify (case-insensitive matching)

---

### Test 13: No Results Found

**Input:**
- URL that returns "No results found"

**Expected:** ❌ "The search returned no results. Please verify your name is spelled exactly..."

---

### Test 14: Duplicate URL

**Input:**
- Same URL already used by another coach

**Expected:** ❌ "This ICF profile URL is already registered to another coach..."

---

## Success Criteria

✅ All 10 main tests produce expected results
✅ Error messages are clear and helpful
✅ Valid URLs verify in <10 seconds
✅ No false positives (invalid URLs rejected)
✅ No false negatives (valid URLs accepted)
✅ Location successfully disambiguates multiple results

---

## Debugging Failed Tests

### If Test Fails Unexpectedly:

**1. Check Edge Function Logs**
- Go to: Supabase Dashboard → Functions → verify-icf-url → Logs
- Look for error messages or unexpected behavior

**2. Check Request Body**
- Verify all required fields sent: `coachId`, `fullName`, `profileUrl`, `location`
- Check location format is correct

**3. Check URL Validation**
- Test URL in browser manually
- Verify it's actually an ICF directory search page
- Check URL parameters are correct

**4. Check Content Verification**
- Copy the HTML output from logs
- Search for the name in HTML
- Search for the location in HTML
- Check if credential level appears

**5. Common Issues**
- Location spelling mismatch
- Name format differences (e.g., "Carole" vs "Carol")
- Missing query parameters in URL
- Cache issues (clear verified_credentials table entry)

---

## Comparison with EMCC Tests

| Aspect | EMCC | ICF |
|--------|------|-----|
| Number of Tests | 7 | 10 |
| Additional Tests | - | Location-related (3 extra) |
| Success Rate Target | 100% | 90% (location edge cases) |
| Average Test Time | 3-5 seconds | 5-10 seconds |
| Manual Review Cases | 0 | 1 (multiple results) |

---

## After Testing

### If All Tests Pass:
1. ✅ Mark system as production-ready
2. ✅ Monitor first 10-20 real verifications
3. ✅ Gather user feedback
4. ✅ Document any issues found

### If Tests Fail:
1. Debug using logs
2. Fix Edge Function or frontend
3. Redeploy
4. Retest failed scenarios
5. Don't proceed to production until all pass

---

## Monitoring in Production

**First Week:**
- Check logs daily
- Track verification success rate
- Monitor for common errors
- Respond to user feedback quickly

**Key Questions:**
- Is location disambiguating effectively?
- Are users entering location correctly?
- What's the manual review rate?
- Any unexpected error patterns?

---

## Notes

- ICF verification is inherently more complex than EMCC due to lack of unique identifiers
- Location field is **critical** for disambiguation
- Manual review (<5% of cases) is expected and acceptable
- Clear error messages guide users to fix issues themselves
