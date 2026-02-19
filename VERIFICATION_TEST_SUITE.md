# EMCC URL Verification Test Suite

## Test Scenarios

### ✅ Test 1: Valid URL with EIA Number (PASS)
**Input:**
- URL: `https://www.emccglobal.org/accreditation/eia/eia-awards/?reference=EIA20230480&search=1`
- Name: `Paula Jones`

**Expected Result:** ✅ Verified successfully
**Why:** URL contains reference parameter with valid EIA number

---

### ❌ Test 2: Random Website URL (FAIL)
**Input:**
- URL: `https://www.google.com`
- Name: `Paula Jones`

**Expected Result:** ❌ Error: "URL must be from emccglobal.org"
**Why:** Wrong domain - not EMCC website

---

### ❌ Test 3: Random Text Instead of URL (FAIL)
**Input:**
- URL: `hello world this is not a url`
- Name: `Paula Jones`

**Expected Result:** ❌ Error: "Invalid URL format. Please copy the complete URL from your browser address bar."
**Why:** Not a valid URL format

---

### ❌ Test 4: Directory Landing Page (FAIL)
**Input:**
- URL: `https://www.emccglobal.org/accreditation/eia/eia-awards/`
- Name: `Paula Jones`

**Expected Result:** ❌ Error: "Please search for your EIA number on the EMCC directory first, then copy the results URL."
**Why:** Missing search=1 parameter (not a search result)

---

### ❌ Test 5: Name Search URL (FAIL)
**Input:**
- URL: `https://www.emccglobal.org/accreditation/eia/eia-awards/?first_name=paul&last_name=jones&search=1`
- Name: `Paula Jones`

**Expected Result:** ❌ Error: "URL must contain your EIA reference number. Please search by EIA number (not name) and copy that URL."
**Why:** Name search instead of EIA reference search

---

### ❌ Test 6: Valid EMCC URL but Wrong EIA Format (FAIL)
**Input:**
- URL: `https://www.emccglobal.org/accreditation/eia/eia-awards/?reference=12345&search=1`
- Name: `Paula Jones`

**Expected Result:** ❌ Error: "Invalid EIA number format in URL. EIA numbers should look like 'EIA20230480'."
**Why:** Reference doesn't start with "EIA"

---

### ❌ Test 7: Valid URL but Name Mismatch (FAIL)
**Input:**
- URL: `https://www.emccglobal.org/accreditation/eia/eia-awards/?reference=EIA20230480&search=1`
- Name: `John Smith`

**Expected Result:** ❌ Error: "Name 'John Smith' not found on the page. Please verify the name matches your EMCC profile exactly."
**Why:** Name doesn't match the profile on that page (Paula Jones)

---

## Test Execution Plan

Run each test in order and record results:

1. Go to your signup page
2. Select "EMCC" as accrediting body
3. Enter the test URL and name
4. Click "Verify Now"
5. Record the result

---

## Expected Error Messages Summary

| Test | Error Message |
|------|---------------|
| 1 | ✅ "Successfully verified via EMCC profile URL" |
| 2 | ❌ "URL must be from emccglobal.org. Please copy the URL from the EMCC directory search results." |
| 3 | ❌ "Invalid URL format. Please copy the complete URL from your browser address bar." |
| 4 | ❌ "Please search for your EIA number on the EMCC directory first, then copy the results URL." |
| 5 | ❌ "URL must contain your EIA reference number. Please search by EIA number (not name) and copy that URL." |
| 6 | ❌ "Invalid EIA number format in URL. EIA numbers should look like 'EIA20230480'." |
| 7 | ❌ "Name 'John Smith' not found on the page. Please verify the name matches your EMCC profile exactly." |

---

## Additional Edge Cases

### Test 8: Empty URL
**Input:** `""` (empty string)
**Expected:** Error: "Invalid URL format"

### Test 9: URL with Only First Name in Search
**Input:** `https://www.emccglobal.org/accreditation/eia/eia-awards/?first_name=paul&search=1`
**Expected:** Error: "URL must contain your EIA reference number"

### Test 10: EMCC Homepage
**Input:** `https://www.emccglobal.org/`
**Expected:** Error: "This is not an EMCC profile URL"

---

## Success Criteria

✅ All 7 main tests produce expected results
✅ Error messages are clear and helpful
✅ Valid URL verifies in <5 seconds
✅ No false positives (invalid URLs rejected)
✅ No false negatives (valid URLs accepted)
