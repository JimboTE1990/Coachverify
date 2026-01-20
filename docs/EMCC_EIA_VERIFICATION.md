# EMCC Verification Strategy with EIA Number

## Discovery: Public EIA Number Database

**Game Changer**: EMCC has a publicly accessible database view that includes EIA (EMCC Individual Accreditation) numbers!

**Database View URL**: https://share.google/7G1L5jtD7ZVMNTt50

**Available Fields**:
- EIA Number (unique identifier - e.g., EIA12345)
- Full Name
- Accreditation Level (Foundation, Practitioner, Senior Practitioner, Master Practitioner)
- Country/Location
- Other profile details

## Why EIA Number is Perfect for Verification

### Before (Name-Only Matching)
- ❌ "John Smith" → 100+ ambiguous matches
- ❌ Fuzzy matching uncertainty
- ❌ Confidence: 80-95%

### After (EIA Number Matching)
- ✅ EIA number → **exactly one person**
- ✅ **Zero ambiguity**
- ✅ Confidence: **100%**

## Verification Method

### EIA Number (REQUIRED - 100% Confidence)
```
Coach provides EIA number + Name → Search EMCC database → Exact match
→ Verify name matches → VERIFIED ✅ (100% confidence)
```

**Why EIA Only?**
- EIA numbers are unique identifiers - no ambiguity
- Publicly available in EMCC directory
- Provides 100% confidence verification
- Simple for coaches to find (in "Reference" column)
- No need for fallback methods

**Verification Policy:**
- ✅ Verification happens ONCE at onboarding
- ❌ No ongoing credential expiry checking
- EMCC credentials expire after 5 years, but we don't re-verify
- Keeps UX simple and reduces complexity

## Implementation

### Verification Modal UI
Simplified to two required fields:
```
1. EIA Number (Required ✨)
2. Full Name (Required)
```

### Edge Function Logic
```typescript
// Simple: Only EIA number verification
const result = await verifyFromEIANumber(eiaNumber, fullName, level, country);
```

### EIA Verification Function
```typescript
async function verifyFromEIANumber(
  eiaNumber: string,
  expectedName: string,
  expectedLevel?: string,
  expectedCountry?: string
): Promise<VerificationResult> {
  // 1. Normalize and validate EIA format
  // 2. Query EMCC directory via HTTP GET request
  // 3. Parse HTML response for EIA number match
  // 4. Extract coach data (name, level, country)
  // 5. Verify name matches (fuzzy match with 70% threshold)
  // 6. Verify level matches (if provided)
  // 7. Return 100% confidence if all checks pass
}
```

## Confidence Scoring

| Verification Method | Confidence | Notes |
|---------------------|-----------|-------|
| **EIA Number + Name Match** | **100%** | EIA is unique identifier |
| EIA Number + Name Mismatch (< 70%) | 0% | Wrong EIA or typo |

## User Experience

### Verification Modal (Simplified)
```
┌────────────────────────────────────────────────────┐
│ Verify EMCC Accreditation                         │
├────────────────────────────────────────────────────┤
│                                                    │
│ EIA Number (Reference) *                           │
│ [__________] e.g., EIA20260083                    │
│ ⚡ Required for verification. Find this in your   │
│ EMCC directory "Reference" column                 │
│                                                    │
│ Full Name *                                        │
│ [__________] Dr Jane Smith                        │
│ Example: "Dr Jane Smith" or "John Michael Doe"    │
│                                                    │
│ 🔒 Privacy: EIA number used for verification      │
│    only, not stored in our system                 │
│                                                    │
│ [Cancel] [Verify Now →]                           │
└────────────────────────────────────────────────────┘
```

### Verification Messages

**Success**:
```
✅ EMCC accreditation verified!
   EIA20260083 matches Dr Jane Smith, Senior Practitioner
   Confidence: 100%
```

**Failure - Wrong EIA**:
```
❌ Could not verify EMCC accreditation
   No EMCC record found with EIA number EIA20260083.
   Please verify your EIA number is correct.
```

**Failure - Name Mismatch**:
```
❌ Could not verify EMCC accreditation
   EIA20260083 belongs to "John Smith", which doesn't match
   the name you provided ("Jane Doe"). Please check your EIA number.
```

## Database Integration Options

### Option A: Direct Google Sheets API (if available)
- Query the Google Sheet directly
- Fastest verification
- Requires Google Sheets API key

### Option B: Web Scraping the View URL
- Fetch the shared Google Sheet as HTML/CSV
- Parse results
- No API key needed

### Option C: Periodic Sync to Our Database
- Download EMCC database periodically (daily/weekly)
- Store in our Supabase
- Fast lookups, potential staleness

### Recommendation: **Option B** (Web Scraping)
- No API keys needed
- Always current data
- Can be implemented immediately

## Privacy & Compliance

### What We Store
- ✅ Verification status (boolean)
- ✅ Verification timestamp
- ✅ EIA number verification confidence
- ✅ Profile URL (if verified via URL)

### What We Don't Store
- ❌ EIA number itself (unless verified and stored separately)
- ❌ Full database dump
- ❌ Other coaches' data

### Legal Considerations
- EMCC database is publicly accessible
- Using for verification = legitimate interest
- Not storing personal data beyond verification result
- Complies with GDPR (public data, minimal storage)

## Migration Path

### Phase 1: Add EIA Field (Immediate)
- Update UI to include EIA number field
- Mark as "Recommended"
- Keep profile URL as optional

### Phase 2: Implement EIA Verification (Next)
- Build `verifyFromEIADatabase()` function
- Query public database view
- Return 100% confidence on match

### Phase 3: Deprecate Less Reliable Methods (Future)
- Make EIA number required for EMCC
- Profile URL becomes backup
- Name-only search becomes last resort

## Benefits of EIA Number Approach

1. **Zero Ambiguity**: EIA number is unique
2. **100% Confidence**: No fuzzy matching needed
3. **Faster Verification**: Direct database lookup
4. **Better UX**: Clear instructions ("Find your EIA number")
5. **Fraud Prevention**: Fake coaches won't know real EIA numbers
6. **Future-Proof**: EMCC unlikely to remove EIA numbers
7. **Scalable**: Can verify thousands of coaches quickly

## Summary

With EIA number access:
- **Best Case**: EIA Number → 100% confidence ✅
- **Good Case**: Profile URL → 95-98% confidence ✅
- **Fallback**: Name search → 80-95% confidence ✅

This three-tier approach ensures we can verify ALL coaches, with highest confidence for those who provide EIA numbers.
