# Quick Test Execution Guide

## Test Setup
1. Open your signup page in browser
2. Select "EMCC" as accrediting body
3. Keep browser DevTools open (F12) to see any console errors

---

## Test 1: ✅ VALID URL (Should PASS)
**Name:** `Paula Jones`
**URL:** `https://www.emccglobal.org/accreditation/eia/eia-awards/?reference=EIA20230480&search=1`
**Expected:** ✅ "Successfully verified via EMCC profile URL"

---

## Test 2: ❌ WRONG DOMAIN (Should FAIL)
**Name:** `Paula Jones`
**URL:** `https://www.google.com`
**Expected:** ❌ "URL must be from emccglobal.org"

---

## Test 3: ❌ INVALID TEXT (Should FAIL)
**Name:** `Paula Jones`
**URL:** `hello world this is not a url`
**Expected:** ❌ "Invalid URL format. Please copy the complete URL from your browser address bar."

---

## Test 4: ❌ LANDING PAGE (Should FAIL)
**Name:** `Paula Jones`
**URL:** `https://www.emccglobal.org/accreditation/eia/eia-awards/`
**Expected:** ❌ "Please search for your EIA number on the EMCC directory first, then copy the results URL."

---

## Test 5: ❌ NAME SEARCH (Should FAIL)
**Name:** `Paula Jones`
**URL:** `https://www.emccglobal.org/accreditation/eia/eia-awards/?first_name=paul&last_name=jones&search=1`
**Expected:** ❌ "URL must contain your EIA reference number. Please search by EIA number (not name) and copy that URL."

---

## Test 6: ❌ INVALID EIA FORMAT (Should FAIL)
**Name:** `Paula Jones`
**URL:** `https://www.emccglobal.org/accreditation/eia/eia-awards/?reference=12345&search=1`
**Expected:** ❌ "Invalid EIA number format in URL. EIA numbers should look like 'EIA20230480'."

---

## Test 7: ❌ NAME MISMATCH (Should FAIL)
**Name:** `John Smith`
**URL:** `https://www.emccglobal.org/accreditation/eia/eia-awards/?reference=EIA20230480&search=1`
**Expected:** ❌ "Name 'John Smith' not found on the page. Please verify the name matches your EMCC profile exactly."

---

## Recording Results

Create a simple checklist as you test:

```
[ ] Test 1: Valid URL - PASS
[ ] Test 2: Wrong Domain - FAIL (correct error)
[ ] Test 3: Invalid Text - FAIL (correct error)
[ ] Test 4: Landing Page - FAIL (correct error)
[ ] Test 5: Name Search - FAIL (correct error)
[ ] Test 6: Invalid EIA Format - FAIL (correct error)
[ ] Test 7: Name Mismatch - FAIL (correct error)
```

---

## If a Test Fails Unexpectedly

**Check:**
1. Supabase Dashboard → Functions → verify-emcc-url → Logs
2. Browser console for JavaScript errors
3. Network tab for the Edge Function request/response

**Share with me:**
- Which test number failed
- What error message appeared (or if no error)
- Screenshot of Supabase Edge Function logs
- Screenshot of browser console

---

## After All Tests Pass

✅ System is ready for production use
✅ Users can now verify their EMCC credentials via URL
✅ Clear error messages guide users when they make mistakes

**Next Steps:**
1. Monitor first 10-20 real verifications
2. Gather user feedback on the process
3. After 2-4 weeks of stability, apply same approach to ICF
