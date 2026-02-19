# ICF Frontend Updates - Complete ✅

## Changes Made

### 1. CoachSignup.tsx - Frontend Form ✅

**Added to Form State:**
```typescript
location: '', // For ICF verification (City, Country)
accreditationLevel: '', // For ICF credential level (ACC/PCC/MCC/ACTC)
```

**Updated Label:**
- Changed "ICF Credential Level" → "ICF Directory Search URL"

**Added New Fields for ICF:**

1. **Location Field** (appears only when ICF is selected):
   - Input type: text
   - Placeholder: "e.g., London, UK"
   - Required field
   - Helper text: "This helps us verify the correct profile if multiple coaches share your name"

2. **Credential Level Dropdown** (appears only when ICF is selected):
   - Options: ACC, PCC, MCC, ACTC
   - Required field

**Updated URL Input:**
- Type changed to `url` for both EMCC and ICF
- Placeholder updated: "Paste your ICF directory search URL here"

**Updated Guidance Text:**
- Step 1: Visit ICF Directory
- Step 2: Search by Your Full Name
- Step 3: Copy the URL
- Step 4: Enter Your Location
- Example URL shown
- Blue info box explaining why location is needed

---

### 2. supabaseService.ts - Service Call ✅

**Updated Function Signature:**
```typescript
export const verifyCoachLicense = async (
  body: string,
  regNumber: string,
  coachId: string,
  fullName: string,
  accreditationLevel?: string,
  country?: string,
  location?: string // NEW parameter
)
```

**Updated ICF Verification Call:**
```typescript
if (body === 'ICF') {
  const { data, error } = await supabase.functions.invoke('verify-icf-url', {
    body: {
      coachId,
      fullName,
      profileUrl: regNumber, // Now contains ICF URL (not credential level)
      location: location || '', // NEW: Required for disambiguation
      accreditationLevel: accreditationLevel || ''
    }
  });
}
```

**Changed:**
- Function name: `verify-icf-accreditation` → `verify-icf-url`
- Parameters sent: Now sends `profileUrl`, `location`, and `accreditationLevel`

---

### 3. Verification Flow Updated ✅

**Updated Call in handleVerification:**
```typescript
const result = await verifyCoachLicense(
  formData.body,
  formData.regNumber,
  tempCoachId,
  fullName,
  formData.accreditationLevel, // NEW: Pass credential level
  undefined, // country
  formData.location // NEW: Pass location
);
```

---

## What The User Now Sees (ICF)

### Step 1: Select ICF
User selects "ICF" from accreditation body dropdown

### Step 2: Three Input Fields Appear
1. **ICF Directory Search URL** (required)
   - URL input field
   - Placeholder: "Paste your ICF directory search URL here"
   - Info icon with guidance popup

2. **City, Country** (required)
   - Text input
   - Placeholder: "e.g., London, UK"
   - Helper text explaining why it's needed

3. **ICF Credential Level** (required)
   - Dropdown with options: ACC, PCC, MCC, ACTC

### Step 3: Click "Verify Now"
System calls `verify-icf-url` Edge Function with:
- Coach ID
- Full name
- Profile URL (from regNumber field)
- Location (from location field)
- Accreditation level (from dropdown)

---

## Files Modified

1. ✅ `pages/CoachSignup.tsx`
   - Added location field
   - Added credential level dropdown
   - Updated guidance text
   - Updated form state
   - Updated verifyCoachLicense call

2. ✅ `services/supabaseService.ts`
   - Added location parameter
   - Updated ICF verification to call `verify-icf-url`
   - Changed parameters sent to Edge Function

---

## Next Steps for You

### 1. Deploy Frontend Changes

```bash
# Commit and push
git add pages/CoachSignup.tsx services/supabaseService.ts
git commit -m "feat: add ICF URL-based verification with location field"
git push origin main
```

Vercel will auto-deploy (if connected to GitHub).

---

### 2. Test the Full Flow

Use the test cases from [ICF_TEST_SUITE.md](ICF_TEST_SUITE.md):

**Test 1: Valid ICF URL** ✅
- Name: `Carole Adams`
- URL: `https://apps.coachingfederation.org/eweb/DynamicPage.aspx?webcode=ICFDirectory&firstname=carole&lastname=adams&sort=1`
- Location: `London, UK`
- Level: `PCC`
- Expected: ✅ Verified

**Test 2: Wrong Location** ❌
- Name: `Carole Adams`
- URL: (same as above)
- Location: `Paris, France`
- Level: `PCC`
- Expected: ❌ Error: "Location 'Paris, France' not found..."

**Test 3: Missing Location** ❌
- Leave location field empty
- Expected: Browser validation error (field is required)

---

## Verification Flow Diagram

```
User Enters:
├─ ICF Directory URL
├─ Location (City, Country)
└─ Credential Level

         ↓

CoachSignup.tsx
└─ handleVerification()
   └─ verifyCoachLicense(..., location)

         ↓

supabaseService.ts
└─ supabase.functions.invoke('verify-icf-url')
   └─ Sends: { profileUrl, location, accreditationLevel }

         ↓

Edge Function: verify-icf-url
├─ Validates URL format
├─ Verifies name matches URL
├─ Fetches URL content
├─ Checks name + location + credential on page
└─ Returns: { verified, confidence, reason }

         ↓

User sees result:
├─ ✅ Verified → Can continue to next step
├─ ❌ Rejected → Error message shown
└─ 🔍 Manual Review → Can continue, pending review
```

---

## Key Differences: EMCC vs ICF

| Feature | EMCC | ICF |
|---------|------|-----|
| **Input Fields** | URL only | URL + Location + Level |
| **Unique ID** | EIA Number in URL | Name + Location combo |
| **Required Fields** | 1 (URL) | 3 (URL + Location + Level) |
| **Disambiguation** | Not needed | Location required |
| **Edge Function** | `verify-emcc-url` | `verify-icf-url` |

---

## Troubleshooting

### If ICF Fields Don't Appear:
1. Check `formData.body === 'ICF'` condition
2. Verify form state includes `location` and `accreditationLevel`
3. Check browser console for React errors

### If Verification Fails:
1. Check Supabase Edge Function logs
2. Verify location parameter is being sent
3. Test URL manually in browser
4. Check location format (should be "City, Country")

### If Service Call Fails:
1. Verify Edge Function `verify-icf-url` is deployed
2. Check Supabase logs for errors
3. Ensure all required fields are sent

---

## Summary

✅ Frontend updated to collect ICF URL + location + credential level
✅ Service call updated to pass location to Edge Function
✅ Edge Function ready to receive and verify ICF profiles
✅ Guidance text updated with clear instructions
✅ Form validation in place (required fields)

**System is ready for testing!**

Run the test suite from [ICF_TEST_SUITE.md](ICF_TEST_SUITE.md) to verify everything works.
