# Accreditation Verification Strategy

## The Challenge

**Problem**: Neither EMCC nor ICF publicly display membership numbers in their coach directories. This makes traditional credential verification (checking a number against a database) impossible.

**What we CAN access**:
- Coach name
- Accreditation level (EMCC: Foundation, Practitioner, Senior Practitioner, Master Practitioner | ICF: ACC, PCC, MCC)
- Location/Country
- Sometimes: specialties, languages, website

**What we CANNOT access**:
- Membership numbers (not shown in public directories)
- Direct API for verification (would require partnership agreements)

## Our Solution: Multi-Factor Matching

Since we can't verify membership numbers directly, we use a **confidence-based matching system** that combines multiple data points:

### 1. **Name Matching** (Primary Factor)
- **Exact Match**: 95% confidence (98% if membership number provided)
- **Fuzzy Match** (>85% similarity): 80% confidence (90% if membership number provided)
- Handles variations: "Dr. Jane Smith" vs "Jane Smith", "John M. Doe" vs "John Doe"

### 2. **Accreditation Level** (Secondary Factor)
- Matches selected level against directory listing
- EMCC: Foundation → Master Practitioner
- ICF: ACC → PCC → MCC
- If level doesn't match, confidence drops

### 3. **Location/Country** (Disambiguator)
- Helps differentiate between coaches with common names
- Example: "John Smith" in UK vs "John Smith" in USA

### 4. **Membership Number** (Trust Signal)
- **Not used for verification** (not publicly available)
- **Used as trust signal**: If coach knows their number, they're likely genuine
- Boosts confidence scores when provided
- Never stored in database (privacy)

## Why Collect Membership Number If We Can't Verify It?

### 1. **Psychological Barrier to Fraud**
If someone is trying to fake credentials, they won't know a real membership number. Asking for it discourages fraudulent attempts.

### 2. **Future API Integration**
If EMCC/ICF later provide verification APIs, we already have the workflow to collect the number.

### 3. **Manual Admin Verification**
Admins can contact EMCC/ICF directly with the membership number for manual verification in edge cases.

### 4. **Confidence Boost**
Knowing their membership number suggests the coach is genuinely accredited and increases our confidence in fuzzy matches.

## Verification Flow

```
Coach enters:
├── Full Name (required) ─────────► Search public directory
├── Membership Number (required) ──► Boost confidence (not verified)
├── Accreditation Level (auto) ────► Cross-check with directory
└── Location (auto) ───────────────► Disambiguate common names
                                     │
                                     ▼
                              Match Results
                                     │
        ┌────────────────────────────┼────────────────────────────┐
        ▼                            ▼                            ▼
   Exact Match               Fuzzy Match (>85%)            No Match / Multiple
   95-98% confidence         80-90% confidence             0-30% confidence
        │                            │                            │
        ▼                            ▼                            ▼
   ✅ VERIFIED               ✅ VERIFIED                   ❌ FAILED
   Show green badge          Show green badge              Error + Retry
```

## Pass/Fail Criteria

### ✅ PASS (Verified)
- **98%**: Exact name match + membership number provided
- **95%**: Exact name match without membership number
- **90%**: Fuzzy match (>85% similarity) + membership number
- **80%**: Fuzzy match without membership number

### ❌ FAIL (Not Verified)
- **30%**: Multiple ambiguous matches without membership number
- **0%**: No match found OR membership number provided but no match

When verification fails:
1. Modal stays open with error message
2. Coach can retry with corrected details
3. Prompted to contact support@coachdog.com if issue persists

## Security & Privacy

### What We Store
- ✅ Verification status (boolean)
- ✅ Verification timestamp
- ✅ Accreditation level
- ✅ Directory profile URL (if found)

### What We DON'T Store
- ❌ Membership number
- ❌ Any personal data from directory
- ❌ API keys or credentials

### Why This Works
Even without direct membership verification:
1. **Name + Level + Location** provides strong confidence
2. **Fuzzy matching** handles name variations
3. **Membership number requirement** deters fraud
4. **Public directory search** is transparent and auditable
5. **Confidence scoring** shows verification strength

## Handling Edge Cases

### Common Name Problem
**Example**: "John Smith" (100+ coaches worldwide)
**Solution**:
- Use location to filter
- Require membership number for confidence boost
- If still ambiguous → manual review

### Name Variations
**Example**: "Dr. Jane Smith" vs "Jane Smith"
**Solution**:
- Fuzzy matching with 85% similarity threshold
- Levenshtein distance algorithm
- Still requires >85% match for verification

### Recently Accredited Coaches
**Problem**: Coach just got accredited, not yet in directory
**Solution**:
- Verification fails with clear message
- Coach can retry later (directories update periodically)
- Option to contact support for manual verification

## Alternative Approaches Considered (and Why We Didn't Use Them)

### ❌ Email Verification
Ask coach to verify via their EMCC/ICF registered email.
**Why not**: No way to know registered email without API access.

### ❌ Document Upload
Ask for accreditation certificate upload.
**Why not**: Documents can be forged; not scalable; requires manual review.

### ❌ Third-Party Verification Services
Use services like TrueProfile, CheckMark, etc.
**Why not**: Cost, not specific to coaching, still requires API partnerships.

### ✅ Our Approach (Multi-Factor Matching)
**Why yes**:
- No API needed
- Transparent to users
- Confidence-based (not binary)
- Scalable and automated
- Works with public data only

## Future Enhancements

1. **API Integration**: If EMCC/ICF provide APIs, integrate directly
2. **Manual Review Queue**: Admin dashboard to manually verify edge cases
3. **Periodic Re-verification**: Check directory annually to ensure credentials maintained
4. **Cross-Reference**: Check multiple sources (LinkedIn, website, etc.)
5. **Community Verification**: Allow clients to confirm coach-client relationships

## Summary

Without direct access to membership databases, we use **probabilistic matching** based on publicly available data. The membership number requirement serves as a **psychological fraud deterrent** and **confidence booster**, even though we can't verify it directly. This approach balances **automation**, **accuracy**, and **user experience** while maintaining **transparency** about our verification methods.
