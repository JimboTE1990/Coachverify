# ICF Verification Strategy

## ICF Database Structure

**ICF Directory URL:**
`https://apps.coachingfederation.org/eweb/DynamicPage.aspx?WebCode=ICFDirectory&Site=ICFAppsR`

**Search Form Fields:**
- `firstname` - First name search field
- `lastname` - Last name search field
- `sort` - Sort order (1 = Last Name A-Z)

**Available Data:**
- ICF Member: Yes/No
- ICF Credential: ACC, PCC, MCC (with validity dates)
- Format: "PCC 9/2019 - 9/2028", "ACC 12/2024 - 12/2027"
- First Name / Last Name search fields
- Country/Location filters

**NOT Available:**
- ❌ No public member ID numbers (unlike EMCC's EIA)
- ❌ No unique identifiers visible
- ❌ No "reference number" field

## Verification Approach for ICF

Since ICF doesn't provide public ID numbers (unlike EMCC's EIA), we use a **multi-factor matching system** combined with HTTP GET requests to mimic human search behavior:

### Verification Factors
1. **Name Matching** (Primary - fuzzy with 85%+ similarity)
2. **Credential Level** (Secondary - must match exactly)
3. **Country/Location** (Disambiguator - helps with common names)

**Note on Credential Expiry:**
- ICF credentials expire after 2 years
- EMCC credentials expire after 5 years
- **We verify credentials ONLY at onboarding** (not ongoing)
- This reduces friction and complexity for coaches
- Verification status is a snapshot at time of onboarding

### Confidence Scoring

| Scenario | Confidence | Verified? |
|----------|-----------|-----------|
| Exact name + credential + location | 95% | ✅ Yes |
| Exact name + credential | 90% | ✅ Yes |
| Fuzzy name (>90%) + credential | 85% | ✅ Yes |
| Fuzzy name (>85%) + credential | 80% | ✅ Yes |
| Name match but credential mismatch | 30% | ❌ No |
| No name match | 0% | ❌ No |

**Note:** Credential expiry dates are NOT checked. Verification is a one-time check at onboarding.

### Verification Flow

```
Coach Input:
├── Full Name (required)
├── ICF Credential Level (ACC/PCC/MCC) (required)
├── Country (optional - helps disambiguation)
└── Profile URL (optional - highest confidence)
                │
                ▼
      Search ICF Directory
                │
    ┌───────────┴───────────┐
    ▼                       ▼
Found Matches          No Matches
    │                       │
    ▼                       ▼
Check Name Similarity   Return Fail
    │                   (0% confidence)
    ▼
Calculate Confidence
    │
    ├─> 95%: Exact match + credential
    ├─> 90%: Exact match only
    ├─> 85%: Close match + credential
    └─> 80%: Close match only
```

## Key Differences: EMCC vs ICF

| Aspect | EMCC | ICF |
|--------|------|-----|
| **Public ID** | ✅ Yes (EIA Number) | ❌ No |
| **Verification Method** | EIA Number lookup | Name + Credential matching |
| **Max Confidence** | 100% (with EIA) | 95% (without ID) |
| **Ambiguity Risk** | Low (EIA is unique) | Medium (common names) |
| **Validity Dates** | ✅ Shows award date | ✅ Shows validity range |

## ICF Verification Implementation

### Required Fields
```typescript
interface ICFVerificationRequest {
  coachId: string;
  fullName: string;
  credentialLevel: 'ACC' | 'PCC' | 'MCC'; // Required for ICF
  country?: string;
}
```

### Search Request (Mimics Human Behavior)
```typescript
// Split full name into first and last name
const nameParts = fullName.trim().split(/\s+/);
const firstName = nameParts[0];
const lastName = nameParts.slice(1).join(' ');

// Build GET request exactly like the ICF form does
const searchUrl = 'https://apps.coachingfederation.org/eweb/DynamicPage.aspx';
const params = new URLSearchParams({
  'WebCode': 'ICFDirectory',
  'Site': 'ICFAppsR',
  'firstname': firstName,
  'lastname': lastName,
  'sort': '1'
});

// Make GET request: https://apps.coachingfederation.org/eweb/DynamicPage.aspx?WebCode=ICFDirectory&Site=ICFAppsR&firstname=Paul&lastname=Smith&sort=1
const response = await fetch(`${searchUrl}?${params.toString()}`);
```

### Verification Logic
```typescript
async function verifyICFCredential(
  fullName: string,
  credentialLevel: string,
  country?: string
): Promise<VerificationResult> {

  // Search ICF directory (no profile URL needed)
  const results = await searchICFDirectory(firstName, lastName, fullName, credentialLevel);

  // Find matches with correct credential
  const matches = results.filter(r =>
    r.credential?.includes(credentialLevel)
  );

  if (matches.length === 0) {
    return {
      verified: false,
      confidence: 0,
      reason: `No ${credentialLevel} credential found for ${fullName}`
    };
  }

  // Check name similarity
  const bestMatch = findBestNameMatch(matches, fullName);

  if (!bestMatch) {
    return {
      verified: false,
      confidence: 30,
      reason: 'Found possible matches but names do not match closely enough'
    };
  }

  // Check credential validity
  if (!isCredentialValid(bestMatch.credential)) {
    return {
      verified: false,
      confidence: 50,
      reason: 'Credential has expired'
    };
  }

  // Calculate confidence based on match quality
  const nameSimilarity = calculateSimilarity(bestMatch.name, fullName);
  let confidence = Math.round(nameSimilarity * 100);

  // Boost if credential matches exactly
  if (bestMatch.credential.includes(credentialLevel)) {
    confidence = Math.min(95, confidence + 5);
  }

  return {
    verified: confidence >= 80,
    confidence,
    matchDetails: bestMatch
  };
}
```

### Credential Validation
```typescript
function isCredentialValid(credential: string): boolean {
  // Extract expiry date from format "PCC 9/2019 - 9/2028"
  const expiryMatch = credential.match(/-\s*(\d{1,2})\/(\d{4})/);

  if (!expiryMatch) {
    return false; // No expiry date found
  }

  const expiryMonth = parseInt(expiryMatch[1]);
  const expiryYear = parseInt(expiryMatch[2]);
  const expiryDate = new Date(expiryYear, expiryMonth - 1);
  const now = new Date();

  return expiryDate > now; // Valid if not expired
}
```

## User Experience for ICF

### Verification Modal
```
┌────────────────────────────────────────────────────┐
│ Verify ICF Credential                              │
├────────────────────────────────────────────────────┤
│                                                    │
│ Full Name *                                        │
│ [__________] Dr Jane Smith                        │
│                                                    │
│ ICF Credential Level *                             │
│ [Dropdown: PCC ▼]                                 │
│ Options: ACC, PCC, MCC                            │
│                                                    │
│ ICF Profile URL (Recommended ⚡)                   │
│ [__________] https://coachfederation.org/...      │
│ → For instant verification, paste your profile URL │
│                                                    │
│ Country/Region (Optional)                          │
│ [__________] United States                        │
│ → Helps find you if you have a common name        │
│                                                    │
│ 🔒 Privacy: Data used for verification only       │
│                                                    │
│ [Cancel] [Verify Credential →]                    │
└────────────────────────────────────────────────────┘
```

### Success Messages
```
✅ ICF PCC credential verified!
   Found active credential: PCC 5/2025 - 5/2028
   Confidence: 95%
```

```
✅ ICF ACC credential verified!
   Matches directory listing
   Confidence: 85%
   💡 Add your profile URL for higher confidence
```

### Error Messages
```
❌ Could not verify ICF credential
   Credential may be expired or name mismatch
   Please double-check:
   - Your name matches your ICF directory listing
   - Your credential is current and active
   - You selected the correct credential level (ACC/PCC/MCC)

   Contact support@coachdog.com if you need help
```

## Summary

**ICF Verification**:
- No public ID numbers available
- Relies on name + credential + validity matching
- Maximum 95% confidence (vs 100% for EMCC with EIA)
- Profile URL provides highest confidence
- Credential expiry checking adds validation layer

**Best Practice**:
- Always ask for ICF profile URL when available
- Verify credential is current (not expired)
- Use location to disambiguate common names
- Clear error messages guide coaches to success
