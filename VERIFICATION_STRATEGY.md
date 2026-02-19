# EMCC/ICF Verification Strategy

## Current Challenge
EMCC website blocks automated verification with HTTP 403 errors due to anti-bot protection.

## Solutions Overview

### Option 1: Multi-Step Human Simulation (IMPLEMENTED)
**Status**: Updated in edge function, ready to test

**How it works**:
1. Visit homepage first to establish session
2. Wait 2-3 seconds (simulate reading)
3. Visit directory page
4. Wait 2-3 seconds (simulate browsing)
5. Perform actual search
6. Wait 1-2 seconds (simulate typing)

**Total delay**: ~6-8 seconds per verification
**Success likelihood**: Medium (depends on EMCC's detection sophistication)

### Option 2: Internal Database (RECOMMENDED HYBRID)
**Status**: Not yet implemented, but highly recommended

**How it works**:
1. **Manual Initial Verification**:
   - Admin manually verifies first batch of coaches
   - Store verified EIA numbers in internal database
   - Include: EIA number, coach name, level, verification date

2. **Automated Verification**:
   - New coach enters EIA number
   - Check internal database first
   - If found and name matches → instant verification
   - If not found → manual review queue

3. **Periodic Refresh**:
   - Weekly/monthly batch update
   - Admin reviews new coaches manually
   - Could try automated scraping during off-peak hours
   - Refresh existing records annually (EMCC credentials expire every 5 years)

**Database Schema**:
```sql
CREATE TABLE verified_credentials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  accreditation_body TEXT NOT NULL, -- 'EMCC' or 'ICF'
  eia_number TEXT NOT NULL, -- e.g., 'EIA20260083'
  full_name TEXT NOT NULL,
  accreditation_level TEXT, -- e.g., 'Senior Practitioner'
  country TEXT,
  profile_url TEXT,
  verified_at TIMESTAMP NOT NULL DEFAULT NOW(),
  verified_by TEXT, -- 'auto' or admin user ID
  last_checked TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  notes TEXT
);

CREATE UNIQUE INDEX idx_verified_credentials_eia ON verified_credentials(accreditation_body, eia_number);
CREATE INDEX idx_verified_credentials_name ON verified_credentials(full_name);
```

**Benefits**:
- Fast verification (no external API call)
- No 403 errors
- Build up verified coach database over time
- Can detect duplicate EIA usage
- Reduces load on EMCC website
- Works even if EMCC website is down

**Implementation Steps**:
1. Create database table
2. Add manual verification UI for admin
3. Modify edge function to check internal DB first
4. Fall back to manual review if not found
5. Admin dashboard to review pending verifications

### Option 3: Third-Party Services
**Services**:
- ScraperAPI ($49-149/month for 100k requests)
- Bright Data (pay per GB)
- Apify (pay per usage)

**Pros**: Reliable bypass of anti-bot
**Cons**: Ongoing cost, still violates EMCC's terms

### Option 4: Official EMCC API
**Best long-term solution**: Contact EMCC for API access

Email template:
```
Subject: API Access Request for Coach Verification Platform

Dear EMCC Team,

We are developing CoachDog, a platform for connecting clients with
accredited coaches. We would like to verify coaches' EMCC credentials
automatically during onboarding.

Could you provide:
1. Official API access for credential verification
2. Permission to verify EIA numbers programmatically
3. Rate limits and usage guidelines

This would benefit EMCC by:
- Preventing fraudulent use of EIA numbers
- Promoting verified EMCC coaches
- Ensuring only legitimate credentials are displayed

Website: [your-domain]
Contact: [your-email]

Looking forward to collaborating.

Best regards,
[Your name]
```

## Recommended Immediate Action

**Implement Hybrid Approach**:

1. **Try automated verification** with multi-step simulation
2. **If 403 still occurs** → Show message:
   - "We couldn't automatically verify your credentials. Your application is pending manual review."
   - Store credentials for manual verification
   - Allow coach to complete onboarding
3. **Admin dashboard** showing pending verifications
4. **Manual approval** by admin
5. **Build internal database** of verified credentials over time

This balances automation with reliability while building toward a fully automated solution.

## Implementation Priority

1. ✅ Multi-step verification (implemented)
2. ⏳ Test if multi-step works
3. 🔜 If still 403 → Add "pending verification" flow
4. 🔜 Add admin verification dashboard
5. 🔜 Create internal verified_credentials table
6. 🔜 Update edge function to check internal DB first
7. 📧 Contact EMCC for official API access

## Cost Analysis

- **Option 1 (Multi-step)**: Free, but may not work
- **Option 2 (Internal DB)**: Free, requires manual work initially
- **Option 3 (Third-party)**: $50-150/month
- **Option 4 (Official API)**: Unknown, likely free or low cost

**Best combo**: Option 1 + 2 (try automated, fallback to internal DB)
