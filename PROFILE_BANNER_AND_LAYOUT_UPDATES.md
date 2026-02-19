# Profile Banner and Layout Updates - Implementation Complete ✅

## Summary

All requested profile enhancements have been successfully implemented, including banner images, layout reorganization, and accreditation badge placeholders.

---

## Changes Implemented

### 1. ✅ Banner Image Upload (Dashboard)

**Location:** [pages/CoachDashboard.tsx](pages/CoachDashboard.tsx) - Profile Settings Tab

**Changes:**
- Created new `BannerImageUpload` component
- Added banner upload functionality right below profile photo upload
- Banner specifications:
  - **Recommended size:** 1500 x 500px (3:1 ratio)
  - **Max file size:** 2MB
  - **Formats:** JPG, PNG, WebP
  - Uses base64 encoding (same as profile photo)

**New Component:** [components/BannerImageUpload.tsx](components/BannerImageUpload.tsx)
```typescript
<BannerImageUpload
  currentImageUrl={localProfile?.bannerImageUrl}
  onImageUpdate={(newUrl) => updateLocalProfile({ bannerImageUrl: newUrl })}
  coachId={currentCoach.id}
/>
```

---

### 2. ✅ Banner Display (Public Profile)

**Location:** [pages/CoachDetails.tsx](pages/CoachDetails.tsx) - Public Profile View

**Changes:**
- Banner displays at the very top of the profile card (like LinkedIn/X/Facebook)
- Full-width, spanning entire card width
- Height: 192px (mobile) / 256px (desktop)
- Only shows if coach has uploaded a banner image

**Implementation:**
```tsx
{coach.bannerImageUrl && (
  <div className="w-full h-48 md:h-64 bg-gradient-to-br from-slate-100 to-slate-200">
    <img
      src={coach.bannerImageUrl}
      alt={`${coach.name} - Profile Banner`}
      className="w-full h-full object-cover"
    />
  </div>
)}
```

---

### 3. ✅ Type Definition Update

**Location:** [types.ts](types.ts)

**Changes:**
```typescript
export interface Coach {
  // ... existing fields
  bannerImageUrl?: string; // Profile banner/cover image (like LinkedIn/X/Facebook)
  // ... rest of fields
}
```

---

### 4. ✅ Schedule Call Button

**Location:** [pages/CoachDetails.tsx](pages/CoachDetails.tsx) - Below Pricing Section

**Changes:**
- Button appears below the price badge
- Only shows if coach has a booking/scheduling link in their social links
- Detects Calendly, Cal.com, and other scheduling platforms
- Branded button with Calendar icon

**Detection Logic:**
- Checks `socialLinks` for platforms containing:
  - "booking", "appointment", "schedule"
  - "calendly", "cal.com"
  - URLs containing "calendly.com", "cal.com"

**UI:**
```tsx
<a
  href={bookingLink.url}
  className="inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-brand-600 to-brand-700 text-white font-bold rounded-full shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all"
>
  <Calendar className="h-5 w-5" />
  Schedule Call
</a>
```

---

### 5. ✅ Profile Section Reorganization

**Location:** [pages/CoachDetails.tsx](pages/CoachDetails.tsx) - Details Section

**New Order:**
1. **Coach Bio** (moved to top)
2. **Languages** (moved below bio)
3. Additional Certifications
4. Coaching Expertise
5. Coaching Hours
6. Qualifications
7. CPD Qualifications
8. Coaching Expertise (detailed)
9. Coaching Languages
10. Gender
11. Method of Coaching
12. Acknowledgements

**Before:**
- Bio was near the bottom (after many other sections)
- Languages were duplicated in multiple places
- Accreditation Level shown separately

**After:**
- Bio is first thing users see in details section
- Languages immediately follow bio
- No duplicate sections
- Cleaner, more logical flow

---

### 6. ✅ Removed Duplicate Sections

**Removed:**
- ❌ "Accreditation Level" standalone text section (lines 888-894)
  - Already shown in the accreditation badge boxes
  - Redundant information removed

- ❌ Duplicate Bio and Languages sections
  - These were appearing twice (once at top, once at bottom)
  - Removed the bottom duplicates

---

### 7. ✅ Accreditation Badge Placeholders

**Location:** [pages/CoachDetails.tsx](pages/CoachDetails.tsx) - Accreditation Boxes

**Changes:**
- Added badge image placeholders for each accreditation body
- Displays level-specific badge (currently placeholder icon)
- Ready for actual badge images to be added

**EMCC Badge Placeholder:**
```tsx
{coach.accreditationLevel && (
  <div className="flex flex-col items-center gap-2 mb-4">
    <p className="text-center text-xs text-slate-600">{coach.accreditationLevel}</p>
    {/* TODO: Add actual badge images for each EMCC level:
        - Foundation: /badges/emcc-foundation.png
        - Practitioner: /badges/emcc-practitioner.png
        - Senior Practitioner: /badges/emcc-senior-practitioner.png
        - Master Practitioner: /badges/emcc-master-practitioner.png
    */}
    <div className="w-16 h-16 bg-[#2B4170]/10 rounded-full flex items-center justify-center border-2 border-[#C9A961]">
      <Award className="h-8 w-8 text-[#2B4170]" />
    </div>
  </div>
)}
```

**ICF Badge Placeholder:**
```tsx
{coach.icfAccreditationLevel && (
  <div className="flex flex-col items-center gap-2 mb-4">
    <p className="text-center text-xs text-slate-600">{coach.icfAccreditationLevel}</p>
    {/* TODO: Add actual badge images for each ICF level:
        - ACC: /badges/icf-acc.png
        - PCC: /badges/icf-pcc.png
        - MCC: /badges/icf-mcc.png
    */}
    <div className="w-16 h-16 bg-[#2E5C8A]/10 rounded-full flex items-center justify-center border-2 border-[#4A90E2]">
      <Award className="h-8 w-8 text-[#2E5C8A]" />
    </div>
  </div>
)}
```

**Badge Images (To Be Added Later):**
- EMCC: Foundation, Practitioner, Senior Practitioner, Master Practitioner
- ICF: ACC, PCC, MCC

---

### 8. ✅ Share Button Update

**Location:** [pages/CoachDetails.tsx](pages/CoachDetails.tsx) - Top Right

**Changes:**
- Changed text from "Share" to "Tell the Pack"
- Playful dog-themed branding
- Two-line layout for better fit

**Before:**
```tsx
<span className="text-xs font-bold text-slate-600 mt-2">
  Share
</span>
```

**After:**
```tsx
<span className="text-xs font-bold text-slate-600 mt-2 text-center leading-tight">
  Tell the<br />Pack
</span>
```

---

## Files Modified

| File | Changes |
|------|---------|
| [types.ts](types.ts) | Added `bannerImageUrl?: string` to Coach interface |
| [components/BannerImageUpload.tsx](components/BannerImageUpload.tsx) | **NEW FILE** - Banner upload component |
| [pages/CoachDashboard.tsx](pages/CoachDashboard.tsx) | Added BannerImageUpload component import and usage |
| [pages/CoachDetails.tsx](pages/CoachDetails.tsx) | Major reorganization:<br>- Added banner display<br>- Added Schedule Call button<br>- Reordered sections (bio → top)<br>- Added badge placeholders<br>- Changed share text<br>- Removed duplicates<br>- Added Calendar, Award icons |

---

## Visual Changes Summary

### Dashboard (Coach View)
```
Profile Settings Tab
├── Profile Photo Upload
├── Banner Image Upload ⭐ NEW
│   └── 1500x500px recommended
│   └── 2MB max
│   └── Preview with remove option
├── Full Name
├── Bio
└── ... (rest of settings)
```

### Public Profile (Client View)
```
┌─────────────────────────────────────┐
│    BANNER IMAGE (full width) ⭐      │  ← NEW
├─────────────────────────────────────┤
│  [Recently] [Match + Photo] [Share] │  ← "Tell the Pack" ⭐
│                                      │
│  Name + Star Rating                 │
│  Social Links                       │
│                                      │
│  ┌─────────────────────────────┐   │
│  │ EMCC/ICF Verified Badge     │   │
│  │ [Level] + [Badge Icon] ⭐    │   │  ← Badge placeholder added
│  │ [Check accreditation URL]   │   │
│  └─────────────────────────────┘   │
│                                      │
│  Location                            │
│  £X/hour                            │
│  [Schedule Call] ⭐                   │  ← NEW (if booking link exists)
│                                      │
├─────────────────────────────────────┤
│  DETAILS SECTION                    │
│  1. Coach Bio ⭐ (MOVED TO TOP)      │
│  2. Languages ⭐ (MOVED BELOW BIO)   │
│  3. Additional Certifications       │
│  4. Coaching Expertise              │
│  5. Coaching Hours                  │
│  6. Qualifications                  │
│  7. CPD Qualifications              │
│  8. Method of Coaching              │
│  9. Acknowledgements                │
└─────────────────────────────────────┘
```

---

## Database Considerations

### Current Implementation
- Banner images stored as base64 strings (like profile photos)
- No database migration needed
- Field is optional (`bannerImageUrl?: string`)

### Future Enhancement (Optional)
If you want to use Supabase Storage instead of base64:

1. Create storage bucket: `profile-banners`
2. Update `BannerImageUpload.tsx` to use Supabase upload (similar to commented code in `ImageUpload.tsx`)
3. Store URLs instead of base64

**Pros of Supabase Storage:**
- Smaller database size
- Better performance
- CDN support
- Image transformations

**Pros of Base64 (Current):**
- No bucket setup needed
- Works immediately
- No external dependencies
- Simple implementation

---

## Testing Checklist

### Dashboard Banner Upload
- [ ] Upload banner image (JPG/PNG/WebP)
- [ ] Verify 2MB file size limit
- [ ] Preview shows correctly
- [ ] Remove banner works
- [ ] Banner persists after save
- [ ] Banner shows in public profile

### Public Profile Display
- [ ] Banner displays at top (full width)
- [ ] Banner only shows if uploaded
- [ ] Share button says "Tell the Pack"
- [ ] Schedule Call button appears (if booking link exists)
- [ ] Schedule Call button opens correct URL
- [ ] Bio is first section in details
- [ ] Languages appear right below bio
- [ ] No duplicate sections visible
- [ ] Badge placeholders show for verified coaches
- [ ] Badge shows correct level text

### Accreditation Badges
- [ ] EMCC badge shows level + placeholder icon
- [ ] ICF badge shows level + placeholder icon
- [ ] Link to accreditation profile works
- [ ] Badge styling matches body (EMCC: navy/gold, ICF: navy/blue)

---

## Adding Actual Badge Images (Future Task)

When ready to add real badge images:

1. **Get badge images from EMCC/ICF:**
   - EMCC: Foundation, Practitioner, Senior Practitioner, Master Practitioner
   - ICF: ACC, PCC, MCC

2. **Save to public folder:**
   ```
   public/badges/
   ├── emcc-foundation.png
   ├── emcc-practitioner.png
   ├── emcc-senior-practitioner.png
   ├── emcc-master-practitioner.png
   ├── icf-acc.png
   ├── icf-pcc.png
   └── icf-mcc.png
   ```

3. **Update CoachDetails.tsx:**
   Replace placeholder divs with actual images:
   ```tsx
   {/* EMCC Badge */}
   <img
     src={`/badges/emcc-${coach.accreditationLevel?.toLowerCase().replace(/\s+/g, '-')}.png`}
     alt={`EMCC ${coach.accreditationLevel} Badge`}
     className="w-16 h-16 object-contain"
   />

   {/* ICF Badge */}
   <img
     src={`/badges/icf-${coach.icfAccreditationLevel?.toLowerCase()}.png`}
     alt={`ICF ${coach.icfAccreditationLevel} Badge`}
     className="w-16 h-16 object-contain"
   />
   ```

---

## Migration Notes

### For Existing Coaches
- All coaches can now upload banner images via Dashboard → Profile Settings
- Banner is optional - profiles work fine without one
- No action required from existing coaches
- Banner will only appear once uploaded

### For New Coaches
- During onboarding, accreditation level is captured
- Level automatically displays in accreditation badge box
- Badge placeholder shows until real images are added
- Profile URL links to official EMCC/ICF directory

---

## Summary of Improvements

### User Experience
✅ **Banner Images**: Professional LinkedIn-style branding
✅ **Quick Scheduling**: One-click booking button
✅ **Better Layout**: Bio first = more engaging
✅ **Clear Hierarchy**: Important info at top
✅ **No Duplicates**: Cleaner, less cluttered
✅ **Brand Consistency**: "Tell the Pack" theme

### Technical
✅ **Type Safety**: New field in Coach interface
✅ **Reusable Component**: BannerImageUpload
✅ **Smart Detection**: Auto-finds booking links
✅ **Responsive Design**: Mobile + desktop optimized
✅ **Future-Ready**: Badge image placeholders
✅ **Clean Code**: Removed redundant sections

All requested changes have been successfully implemented! 🎉
