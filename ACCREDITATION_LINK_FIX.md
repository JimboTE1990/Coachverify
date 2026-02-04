# Accreditation Link Fix - Missing ICF Field Mapping

## Issue
User successfully ran SQL to populate `icf_profile_url` and `emcc_profile_url` in the database for dummy coaches, but the accreditation links were not appearing on live coach profiles after hard refresh.

## Root Cause
The `mapCoachProfile` function in [services/supabaseService.ts:929-989](services/supabaseService.ts#L929-L989) was **missing ICF field mappings**.

While the function correctly mapped EMCC fields:
```typescript
emccVerified: data.emcc_verified,
emccVerifiedAt: data.emcc_verified_at,
emccProfileUrl: data.emcc_profile_url,
```

It was **NOT** mapping the corresponding ICF fields:
- `icfVerified`
- `icfVerifiedAt`
- `icfAccreditationLevel`
- `icfProfileUrl`

This meant that even though the database had the correct data, the application never read it into the Coach objects.

## The Fix

### 1. Updated `mapCoachProfile` Function (Line 957-967)
Added ICF field mappings:
```typescript
// Enhanced profile fields
accreditationBody: data.accreditation_body,
accreditationLevel: data.accreditation_level,
emccVerified: data.emcc_verified,
emccVerifiedAt: data.emcc_verified_at,
emccProfileUrl: data.emcc_profile_url,
icfVerified: data.icf_verified,           // ✅ ADDED
icfVerifiedAt: data.icf_verified_at,       // ✅ ADDED
icfAccreditationLevel: data.icf_accreditation_level, // ✅ ADDED
icfProfileUrl: data.icf_profile_url,       // ✅ ADDED
additionalCertifications: data.additional_certifications,
```

### 2. Updated `updateCoach` Function (Line 137-147)
Added ICF field updates:
```typescript
// Enhanced profile fields (only add if defined)
if (coach.accreditationBody !== undefined) updateData.accreditation_body = coach.accreditationBody;
if (coach.accreditationLevel !== undefined) updateData.accreditation_level = coach.accreditationLevel;
if (coach.emccVerified !== undefined) updateData.emcc_verified = coach.emccVerified;
if (coach.emccVerifiedAt !== undefined) updateData.emcc_verified_at = coach.emccVerifiedAt;
if (coach.emccProfileUrl !== undefined) updateData.emcc_profile_url = coach.emccProfileUrl;
if (coach.icfVerified !== undefined) updateData.icf_verified = coach.icfVerified;                     // ✅ ADDED
if (coach.icfVerifiedAt !== undefined) updateData.icf_verified_at = coach.icfVerifiedAt;             // ✅ ADDED
if (coach.icfAccreditationLevel !== undefined) updateData.icf_accreditation_level = coach.icfAccreditationLevel; // ✅ ADDED
if (coach.icfProfileUrl !== undefined) updateData.icf_profile_url = coach.icfProfileUrl;             // ✅ ADDED
if (coach.additionalCertifications !== undefined) updateData.additional_certifications = coach.additionalCertifications;
```

## Why This Happened
The EMCC fields were added first, and when ICF support was added later, the database schema was updated, the TypeScript types were updated, but the **service layer mapping** was not updated to include ICF fields.

This is a common issue when:
1. Database schema evolves
2. TypeScript types are updated
3. But the mapper functions are forgotten

## Verification

After this fix, ICF verified coaches with `icf_profile_url` populated will now show:

```
✅ ICF Verified

🔗 View my ICF accreditation profile
   (clickable link opens in new tab)
```

The link appears on the coach profile page ([pages/CoachDetails.tsx](pages/CoachDetails.tsx)) below the verification badge.

## Files Modified
- [services/supabaseService.ts](services/supabaseService.ts) - Added ICF field mappings to `mapCoachProfile` and `updateCoach`

## Related Files
- [types.ts:335-338](types.ts#L335-L338) - Coach interface with ICF fields
- [pages/CoachDetails.tsx:688-705](pages/CoachDetails.tsx#L688-L705) - Accreditation link display
- [update-dummy-coaches-clean.sql](update-dummy-coaches-clean.sql) - SQL to populate test data

## Testing Checklist
- [ ] Hard refresh page after deploying
- [ ] Check EMCC verified coach profiles - link should appear
- [ ] Check ICF verified coach profiles - link should appear
- [ ] Click links to verify they open in new tab
- [ ] Verify non-verified coaches don't show links
- [ ] Verify coaches without profile URLs don't show links

## Deployment
```bash
git add services/supabaseService.ts ACCREDITATION_LINK_FIX.md
git commit -m "fix: add missing ICF field mapping in supabase service

- Add icfVerified, icfVerifiedAt, icfAccreditationLevel, icfProfileUrl to mapCoachProfile
- Add ICF field updates to updateCoach function
- Fixes issue where ICF profile links weren't appearing despite database having correct data
- EMCC fields were already mapped, ICF fields were accidentally omitted"
git push origin main
```

---

## Summary
✅ **Fixed missing ICF field mapping in Supabase service**
✅ **ICF profile links will now appear on verified coach profiles**
✅ **Database already has correct data, just needed proper mapping**
