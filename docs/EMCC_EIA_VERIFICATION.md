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

## Updated Verification Hierarchy

### Priority 1: EIA Number (BEST - 100% Confidence)
```
Coach provides EIA number → Search database → Exact match
→ Verify name matches → VERIFIED ✅
```

### Priority 2: Profile URL (EXCELLENT - 95-98% Confidence)
```
Coach provides profile URL → Fetch profile page → Extract data
→ Cross-check with input → VERIFIED ✅
```

### Priority 3: Name + Membership Number (GOOD - 90-95% Confidence)
```
Coach provides name + membership # → Search directory
→ Fuzzy match with confidence boost → VERIFIED ✅
```

### Priority 4: Name Only (FALLBACK - 80-90% Confidence)
```
Coach provides name only → Search directory
→ Fuzzy match → VERIFIED if close enough ✅
```

## Implementation Plan

### 1. Update Verification Modal UI
Add EIA Number field as PRIMARY option:
```
1. EIA Number (Recommended for instant verification ⚡)
2. Full Name (Required)
3. Profile URL (Optional - boosts confidence)
4. Membership Number (Optional - not publicly available)
```

### 2. Update Edge Function Logic
```typescript
if (eiaNumber) {
  // Priority 1: EIA Number lookup (100% confidence)
  return await verifyFromEIADatabase(eiaNumber, fullName, level);
} else if (profileUrl) {
  // Priority 2: Profile URL verification (95-98% confidence)
  return await verifyFromProfileUrl(profileUrl, fullName, level);
} else {
  // Priority 3/4: Name search (80-95% confidence)
  return await searchEMCCDirectory(fullName, level, country, membershipNumber);
}
```

### 3. EIA Database Search Function
```typescript
async function verifyFromEIADatabase(
  eiaNumber: string,
  expectedName: string,
  expectedLevel?: string
): Promise<VerificationResult> {
  // 1. Query public EIA database view
  // 2. Find record matching EIA number
  // 3. Verify name matches (fuzzy match OK - EIA number is unique)
  // 4. Verify level matches
  // 5. Return 100% confidence if all checks pass
}
```

## Confidence Scoring with EIA Number

| Verification Method | Confidence | Notes |
|---------------------|-----------|-------|
| **EIA Number + Name Match** | **100%** | EIA is unique identifier |
| EIA Number + Name Mismatch | 0% | Wrong EIA or typo |
| Profile URL + Exact Match | 98% | Direct profile verification |
| Profile URL + Close Match | 95% | URL is reliable |
| Name + Membership # + Exact | 95% | High confidence |
| Name + Membership # + Fuzzy | 90% | Good confidence |
| Name Only + Exact Match | 90% | Moderate confidence |
| Name Only + Fuzzy Match | 80% | Lower confidence |

## User Experience Updates

### Modal Field Order (Priority-Based)
```
┌────────────────────────────────────────────────────┐
│ Verify EMCC Accreditation                         │
├────────────────────────────────────────────────────┤
│                                                    │
│ [Info] For instant verification, provide your     │
│ EIA number from the EMCC database                 │
│                                                    │
│ EIA Number (Recommended ⚡)                        │
│ [__________] e.g., EIA12345                       │
│ → Find your EIA number in the EMCC database       │
│                                                    │
│ Full Name *                                        │
│ [__________] Dr Jane Smith                        │
│                                                    │
│ Profile URL (Optional - boosts confidence)         │
│ [__________] https://emccglobal.org/...           │
│                                                    │
│ Accreditation Level *                              │
│ [Dropdown: Senior Practitioner ▼]                 │
│                                                    │
│ 🔒 Privacy: EIA number used for verification      │
│    only, not stored in our system                 │
│                                                    │
│ [Cancel] [Verify Now →]                           │
└────────────────────────────────────────────────────┘
```

### Verification Flow Messages

**With EIA Number**:
```
✅ EMCC accreditation verified!
   EIA12345 matches Dr Jane Smith, Senior Practitioner
   Confidence: 100%
```

**Without EIA Number (Profile URL)**:
```
✅ EMCC accreditation verified!
   Profile data matches your details
   Confidence: 98%
```

**Without EIA Number (Name Only)**:
```
✅ EMCC accreditation verified!
   Found match in EMCC directory
   Confidence: 85%
   💡 Tip: Add your EIA number for instant verification next time
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
