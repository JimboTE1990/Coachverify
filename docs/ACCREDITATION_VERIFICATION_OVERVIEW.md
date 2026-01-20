# Accreditation Verification System Overview

## System Summary

CoachDog automatically verifies coaching accreditations at onboarding using HTTP GET requests to mimic human search behavior on public directories. **No screen scraping** - we interact with search forms exactly as a human would.

## Verification Policy

### ⏰ One-Time Verification
- ✅ Verification happens **ONCE at onboarding only**
- ❌ **NO ongoing re-verification** or expiry checking
- Verification status is a snapshot at time of onboarding
- This reduces friction and complexity for coaches

### 📅 Credential Expiry (Not Checked)
- **EMCC**: Credentials expire after 5 years
- **ICF**: Credentials expire after 2 years
- We **do not** check expiry dates to keep UX simple
- Coaches are responsible for maintaining current credentials

## Supported Accreditation Bodies

### 1. EMCC (European Mentoring & Coaching Council)

**Verification Method:** EIA Number + Name Matching

**Confidence:** 100% (unique identifier)

**How It Works:**
1. Coach provides **EIA number** (e.g., "EIA20260083") from EMCC directory "Reference" column
2. Coach provides **full name**
3. System makes GET request: `https://www.emccglobal.org/directory?search=EIA20260083&reference=EIA20260083`
4. Parses HTML response to find matching EIA number
5. Verifies name matches (fuzzy match with 70% threshold)
6. Returns 100% confidence on successful match

**Required Fields:**
- EIA Number (REQUIRED)
- Full Name (REQUIRED)

**Database URL:** [EMCC Directory](https://www.emccglobal.org/directory)

---

### 2. ICF (International Coaching Federation)

**Verification Method:** Name Matching + Credential Level

**Confidence:** Up to 95% (no unique ID available)

**How It Works:**
1. Coach provides **full name** (e.g., "Paul Smith")
2. Coach provides **credential level** (ACC, PCC, or MCC)
3. System splits name into first/last: `firstname=Paul&lastname=Smith`
4. System makes GET request: `https://apps.coachingfederation.org/eweb/DynamicPage.aspx?WebCode=ICFDirectory&Site=ICFAppsR&firstname=Paul&lastname=Smith&sort=1`
5. Parses HTML response to find matching coaches
6. Uses multi-factor matching:
   - Name similarity (85%+ threshold using Levenshtein distance)
   - Credential level (must match ACC/PCC/MCC)
   - Country/location (if provided, helps with common names)
7. Returns up to 95% confidence on successful match

**Required Fields:**
- Full Name (REQUIRED)
- Credential Level: ACC/PCC/MCC (REQUIRED)

**Optional Fields:**
- Country/Location (helps with disambiguation)

**Database URL:** [ICF Directory](https://apps.coachingfederation.org/eweb/DynamicPage.aspx?WebCode=ICFDirectory&Site=ICFAppsR)

---

## Technical Implementation

### Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Coach Dashboard                       │
│                (CoachDashboard.tsx)                      │
└─────────────┬───────────────────────────────────────────┘
              │
              │ Calls client service
              ▼
┌─────────────────────────────────────────────────────────┐
│           Client-Side Services                           │
│   - emccVerificationService.ts                          │
│   - icfVerificationService.ts                           │
└─────────────┬───────────────────────────────────────────┘
              │
              │ Invokes Supabase Edge Function
              ▼
┌─────────────────────────────────────────────────────────┐
│           Supabase Edge Functions (Deno)                │
│   - verify-emcc-accreditation/index.ts                  │
│   - verify-icf-accreditation/index.ts                   │
└─────────────┬───────────────────────────────────────────┘
              │
              │ HTTP GET requests
              ▼
┌─────────────────────────────────────────────────────────┐
│           Public Directories                             │
│   - EMCC Directory (emccglobal.org)                     │
│   - ICF Directory (coachingfederation.org)              │
└─────────────────────────────────────────────────────────┘
```

### Database Schema

**EMCC Verification Fields:**
```sql
emcc_verified BOOLEAN DEFAULT FALSE
emcc_verified_at TIMESTAMPTZ
emcc_profile_url TEXT
```

**ICF Verification Fields:**
```sql
icf_verified BOOLEAN DEFAULT FALSE
icf_verified_at TIMESTAMPTZ
icf_accreditation_level TEXT CHECK (icf_accreditation_level IN ('', 'ACC', 'PCC', 'MCC'))
icf_profile_url TEXT
```

### Privacy & Security

**What We Store:**
- ✅ Verification status (boolean)
- ✅ Verification timestamp
- ✅ Accreditation level
- ✅ Profile URL (if found)

**What We DON'T Store:**
- ❌ EIA numbers (EMCC)
- ❌ Membership numbers
- ❌ Any other sensitive identifiers
- ❌ Raw HTML from directories

**Compliance:**
- Uses publicly accessible data only
- Minimal data retention (verification status only)
- GDPR compliant (legitimate interest, public data)
- No personal data beyond what coach provides

---

## Confidence Scoring

### EMCC Confidence Matrix

| Scenario | Confidence | Verified? |
|----------|-----------|-----------|
| EIA + exact name match | 100% | ✅ Yes |
| EIA + fuzzy name (>70%) | 100% | ✅ Yes |
| EIA + name mismatch (<70%) | 0% | ❌ No |
| No EIA number found | 0% | ❌ No |

### ICF Confidence Matrix

| Scenario | Confidence | Verified? |
|----------|-----------|-----------|
| Exact name + credential + location | 95% | ✅ Yes |
| Exact name + credential | 90% | ✅ Yes |
| Fuzzy name (>90%) + credential | 85% | ✅ Yes |
| Fuzzy name (>85%) + credential | 80% | ✅ Yes |
| Name match but credential mismatch | 30% | ❌ No |
| No name match | 0% | ❌ No |

**Verification Threshold:** 80% minimum confidence required for successful verification

---

## User Experience

### EMCC Verification Modal

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

### ICF Verification Modal

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
│ Country/Region (Optional)                          │
│ [__________] United States                        │
│ → Helps find you if you have a common name        │
│                                                    │
│ 🔒 Privacy: Data used for verification only       │
│                                                    │
│ [Cancel] [Verify Credential →]                    │
└────────────────────────────────────────────────────┘
```

---

## Key Differences: EMCC vs ICF

| Aspect | EMCC | ICF |
|--------|------|-----|
| **Public ID** | ✅ Yes (EIA Number) | ❌ No |
| **Verification Method** | EIA Number lookup | Name + Credential matching |
| **Max Confidence** | 100% (with EIA) | 95% (without ID) |
| **Ambiguity Risk** | None (EIA is unique) | Medium (common names) |
| **Required Fields** | EIA + Name | Name + Credential Level |
| **Search Approach** | GET request with EIA | GET request with first/last name |

---

## Deployment

### Prerequisites
1. Supabase project configured
2. Database migrations run
3. Edge function environment variables set

### Deploy Commands

**EMCC Verification:**
```bash
supabase functions deploy verify-emcc-accreditation
```

**ICF Verification:**
```bash
supabase functions deploy verify-icf-accreditation
```

**Frontend:**
```bash
git add .
git commit -m "feat: add EMCC and ICF credential verification"
git push  # Auto-deploys to Vercel
```

---

## Testing

### EMCC Test Cases
1. ✅ Valid EIA + matching name → 100% confidence
2. ✅ Valid EIA + slightly different name → 100% confidence (fuzzy match)
3. ❌ Invalid EIA number → 0% confidence
4. ❌ Valid EIA + completely different name → 0% confidence

### ICF Test Cases
1. ✅ Exact name + correct credential → 90-95% confidence
2. ✅ Close name + correct credential → 80-85% confidence
3. ❌ Name match + wrong credential → 30% confidence
4. ❌ No name match → 0% confidence

---

## Future Enhancements (Optional)

### Potential Improvements
- Add more accreditation bodies (AC, WABC, etc.)
- Batch verification for importing coaches
- Admin dashboard for manual verification overrides
- Webhook notifications on verification completion
- Integration with other coach databases

### Out of Scope (By Design)
- ❌ Ongoing re-verification (one-time only)
- ❌ Credential expiry monitoring
- ❌ Automated renewal reminders
- ❌ Storing sensitive identifiers (EIA, membership numbers)

---

## Support & Troubleshooting

### Common Issues

**EMCC: "No record found with EIA number"**
- Coach entered wrong EIA number
- EIA number format incorrect (should be like "EIA20260083")
- Coach not in EMCC directory (may have lapsed membership)

**ICF: "Could not verify credential"**
- Name doesn't match ICF directory listing closely enough
- Wrong credential level selected
- Coach not in ICF directory
- Common name requires country/location for disambiguation

### Contact
For verification issues: support@coachdog.com
