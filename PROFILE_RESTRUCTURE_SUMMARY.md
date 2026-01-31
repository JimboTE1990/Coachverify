# Coach Profile Restructure Summary

## Changes Made

### ✅ Consolidated Coach Bio Section

**Before**: Profile photo, name, bio, languages, and location radius were scattered across multiple sections

**After**: Everything consolidated into ONE "Coach Bio" collapsible section

#### New Coach Bio Section Includes:
1. **Profile Photo Upload** - Image upload component
2. **Full Name** - Editable text field
3. **Bio** - Textarea for coach biography
4. **Coaching Languages** - Multi-select dropdown with searchable language list
5. **Location Radius** - For in-person coaching (e.g., "within 5 miles of London")

---

## New Section Order

The profile sections are now organized in a more logical flow:

### 1. 📝 Coach Bio (Collapsible, Default Open)
- Profile photo, name, bio, languages, location radius
- **Everything about the coach's identity in one place**

### 2. 🔗 Social & Web Links (Collapsible, Default Closed)
- Website, social media, email, phone
- Includes booking calendar integration guide (Calendly, Cal.com)
- **Moved up for better visibility**

### 3. ⭐ Matching Criteria (Collapsible, Default Open, **MANDATORY**)
- Specializations, coaching formats, currency, hourly rate, gender
- **Now collapsible and marked as REQUIRED**
- **Essential for client matching**

### 4. 🏆 Professional Credentials (Collapsible, Default Closed)
- Coaching accreditation (auto-populated from signup)
- Additional coaching certifications
- CPD qualifications
- Academic & professional qualifications
- **Note**: Location Radius removed from here (now in Coach Bio)

### 5. ✨ Coaching Areas of Expertise (Collapsible, Default Closed)
- Specialized coaching areas by category

### 6. 🏅 Acknowledgements & Awards (Collapsible, Default Closed)
- Professional recognition and achievements

---

## Key Changes

### ✅ Coach Bio Section Created
- **New consolidated section** combining:
  - Profile photo (previously standalone)
  - Full name (previously standalone)
  - Bio (previously standalone)
  - Languages (previously separate collapsible section)
  - Location radius (previously in Professional Credentials)

### ✅ Social & Web Links Moved Up
- **Before**: Near the bottom of the page
- **After**: Second section, right after Coach Bio
- **Rationale**: More important for visibility and contact

### ✅ Matching Criteria Made Collapsible & Mandatory
- **Before**: Non-collapsible, standalone section
- **After**: Collapsible section with "REQUIRED" label in subtitle
- **Rationale**: Better organization while emphasizing importance

### ✅ Location Radius Moved
- **Before**: Inside Professional Credentials section
- **After**: Inside Coach Bio section
- **Rationale**: More relevant to bio/location than to credentials

### ✅ Languages Section Removed
- **Before**: Separate "Coaching Languages" collapsible section
- **After**: Integrated into Coach Bio section
- **Rationale**: Part of basic coach information, not a separate category

---

## Benefits

### For Coaches:
1. **Simpler Navigation**: Everything about basic profile info in one place
2. **Logical Flow**: Sections ordered by importance (Bio → Links → Matching → Credentials)
3. **Less Scrolling**: Related fields grouped together
4. **Clearer Structure**: Collapsible sections make the page less overwhelming

### For Users/Clients:
1. **Better Profile Display**: All basic information together
2. **Easier Contact**: Social links moved higher up
3. **Matching Focus**: Matching criteria clearly marked as mandatory

---

## Technical Details

### Sections Removed:
1. **Standalone Profile Photo** - Now inside Coach Bio
2. **Standalone Full Name field** - Now inside Coach Bio
3. **Standalone Bio field** - Now inside Coach Bio
4. **Separate "Coaching Languages" CollapsibleSection** - Now inside Coach Bio
5. **Duplicate Social Links section** - Was appearing twice, removed duplicate

### Data Mapping:
All data fields remain the same:
- `photoUrl` - Coach profile photo
- `name` - Full name
- `bio` - Biography text
- `coachingLanguages` - Array of languages
- `locationRadius` - String for in-person coaching area
- `socialLinks` - Array of social/web links
- (All other fields unchanged)

---

## User Flow

### Editing Profile (Coach Dashboard → Profile Tab):

1. **Expand "Coach Bio"** (open by default)
   - Upload/change profile photo
   - Update full name
   - Edit bio text
   - Select coaching languages from dropdown
   - Set location radius for in-person coaching
   - Click "Save Changes"

2. **Expand "Social & Web Links"**
   - Add website, LinkedIn, email, phone, Calendly, etc.
   - Use booking label (e.g., "Calendly Booking") to show "Schedule a Call" button on profile

3. **Expand "Matching Criteria"** (open by default, **REQUIRED**)
   - Select specializations
   - Choose coaching formats (online, in-person, hybrid)
   - Set currency and hourly rate
   - Select gender

4. **Expand "Professional Credentials"**
   - View accreditation (auto-populated, read-only)
   - Add additional certifications
   - Add CPD qualifications
   - Add academic qualifications

5. **Expand "Coaching Areas of Expertise"**
   - Select specialized coaching areas by category

6. **Expand "Acknowledgements & Awards"**
   - Add professional recognition and achievements

7. **Click "Save Changes"** at bottom of page

---

## Before vs After Comparison

| Aspect | Before | After |
|--------|--------|-------|
| **Profile Photo** | Standalone at top | Inside Coach Bio section |
| **Full Name** | Standalone field | Inside Coach Bio section |
| **Bio** | Standalone field | Inside Coach Bio section |
| **Languages** | Separate collapsible section | Inside Coach Bio section |
| **Location Radius** | Inside Professional Credentials | Inside Coach Bio section |
| **Social Links Position** | Near bottom | Second section (after Coach Bio) |
| **Matching Criteria** | Non-collapsible | Collapsible & marked REQUIRED |
| **Number of Sections** | 8 sections + standalone fields | 6 organized collapsible sections |
| **Organization** | Scattered | Streamlined & logical |

---

## Testing Checklist

### 1. Coach Bio Section
- [ ] Expand "Coach Bio" section (should be open by default)
- [ ] Upload/change profile photo
- [ ] Edit full name
- [ ] Update bio text
- [ ] Select multiple languages from dropdown
- [ ] Set location radius
- [ ] Click "Save Changes" and verify all fields saved

### 2. Social & Web Links Section
- [ ] Verify section appears second (after Coach Bio)
- [ ] Add a social link (e.g., LinkedIn)
- [ ] Add a booking calendar link (e.g., Calendly)
- [ ] Save and check public profile shows links

### 3. Matching Criteria Section
- [ ] Verify section is collapsible
- [ ] Verify subtitle says "(REQUIRED)"
- [ ] Select specializations
- [ ] Choose formats, currency, rate, gender
- [ ] Save and verify

### 4. Professional Credentials Section
- [ ] Verify Location Radius is NOT in this section anymore
- [ ] Verify accreditation data shows from signup
- [ ] Add certifications and qualifications
- [ ] Save and verify

### 5. Overall Flow
- [ ] Verify section order: Coach Bio → Social Links → Matching → Credentials → Expertise → Acknowledgements
- [ ] Verify no duplicate sections
- [ ] Verify all fields save correctly
- [ ] Check public profile displays all information

---

## Files Modified

1. **pages/CoachDashboard.tsx**
   - Created new "Coach Bio" CollapsibleSection (lines ~1111-1182)
   - Moved Social & Web Links section up (lines ~1184-1276)
   - Made Matching Criteria collapsible with REQUIRED label (lines ~1278-1405)
   - Removed Location Radius from Professional Credentials
   - Removed standalone Languages section
   - Removed duplicate Social Links section
   - Net change: Better organization, clearer structure, more logical flow

---

## Deployment

Frontend-only changes. To deploy:

```bash
git add pages/CoachDashboard.tsx PROFILE_RESTRUCTURE_SUMMARY.md
git commit -m "ui: restructure coach profile sections for better UX

- Create consolidated Coach Bio section (photo, name, bio, languages, location radius)
- Move Social & Web Links up (2nd section after Coach Bio)
- Make Matching Criteria collapsible and mark as REQUIRED
- Remove Location Radius from Professional Credentials (now in Coach Bio)
- Remove standalone Languages section (now in Coach Bio)
- New logical order: Bio → Links → Matching → Credentials → Expertise → Awards
- Improve UX with streamlined, organized sections"
git push origin main
```

---

## Summary

✅ **Coach Bio consolidated** - profile photo, name, bio, languages, location radius in ONE section
✅ **Social Links moved up** - better visibility right after bio
✅ **Matching Criteria collapsible** - organized while emphasizing it's required
✅ **Location Radius moved** - from credentials to bio (more logical)
✅ **Languages integrated** - part of bio, not separate section
✅ **Logical flow** - Bio → Links → Matching → Credentials → Expertise → Awards
✅ **No data loss** - all existing data preserved
