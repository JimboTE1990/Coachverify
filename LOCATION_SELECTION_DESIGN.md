# Structured Location Selection - Design Document

## Current Problem
- Coaches enter free-form text: "within 5 miles of London"
- Hard to search/filter
- Inconsistent formatting
- No structured data for future features (maps, radius search)

## Proposed Solution
Replace free-form text input with:
1. **City dropdown** (with "Other" option for custom entry)
2. **Radius dropdown** (5, 10, 25, 50 miles, nationwide, international)
3. **Format checkbox** (online/in-person/hybrid)

## Database Schema

### New Fields (add to coach_profiles table)
```sql
ALTER TABLE coach_profiles
ADD COLUMN location_city VARCHAR(100),  -- Selected city or custom entry
ADD COLUMN location_radius VARCHAR(50), -- '5', '10', '25', '50', 'nationwide', 'international'
ADD COLUMN location_is_custom BOOLEAN DEFAULT false; -- true if "Other" was selected

-- Keep existing location field for backward compatibility
-- Populate it automatically: "London (within 10 miles)"
```

## UI Design

### Option 1: Vertical Layout (Recommended)
```
┌──────────────────────────────────────────────────┐
│ Location & Availability                          │
├──────────────────────────────────────────────────┤
│                                                  │
│ Base Location *                                  │
│ ┌──────────────────────────────────────────────┐ │
│ │ London                                  ▼    │ │
│ └──────────────────────────────────────────────┘ │
│ 📍 Select your primary coaching location        │
│                                                  │
│ Search Radius (for in-person coaching)           │
│ ┌──────────────────────────────────────────────┐ │
│ │ Within 10 miles                         ▼    │ │
│ └──────────────────────────────────────────────┘ │
│ 📏 How far will you travel for sessions?        │
│                                                  │
│ Coaching Formats *                               │
│ ☑ In-Person Coaching                             │
│ ☑ Online Coaching (via Zoom, Teams, etc.)       │
│ ☐ Hybrid (both in-person and online)            │
│                                                  │
│ 💡 Tip: Offering online coaching increases your  │
│    reach to clients nationwide and globally      │
└──────────────────────────────────────────────────┘
```

### Option 2: Compact Side-by-Side
```
┌──────────────────────────────────────────────────┐
│ Location & Availability                          │
├──────────────────────────────────────────────────┤
│                                                  │
│ Base Location *           Radius *               │
│ ┌─────────────────────┐  ┌─────────────────────┐│
│ │ London          ▼   │  │ Within 10 miles ▼  ││
│ └─────────────────────┘  └─────────────────────┘│
│                                                  │
│ Coaching Formats *                               │
│ ☑ In-Person   ☑ Online   ☐ Hybrid               │
└──────────────────────────────────────────────────┘
```

## City Dropdown Implementation

### Cities List (50+ UK cities)
```typescript
const UK_CITIES = [
  'London',
  'Manchester',
  'Birmingham',
  'Leeds',
  'Glasgow',
  'Edinburgh',
  'Liverpool',
  'Bristol',
  'Sheffield',
  'Newcastle',
  'Nottingham',
  'Leicester',
  'Southampton',
  'Cardiff',
  'Belfast',
  'Brighton',
  // ... 30+ more cities
  'Other', // ← Custom entry option
];
```

### "Other" Option Behavior
```
When "Other" is selected:

┌──────────────────────────────────────────────────┐
│ Base Location *                                  │
│ ┌──────────────────────────────────────────────┐ │
│ │ Other                                   ▼    │ │
│ └──────────────────────────────────────────────┘ │
│                                                  │
│ ↓ Custom location field appears:                │
│                                                  │
│ Enter your location                              │
│ ┌──────────────────────────────────────────────┐ │
│ │ e.g., Cheltenham, Canterbury, St Albans     │ │
│ └──────────────────────────────────────────────┘ │
│ 💡 Enter your town or city name                 │
└──────────────────────────────────────────────────┘
```

## Radius Dropdown

### Options
```typescript
const RADIUS_OPTIONS = [
  { value: '5', label: 'Within 5 miles' },
  { value: '10', label: 'Within 10 miles' },
  { value: '25', label: 'Within 25 miles' },
  { value: '50', label: 'Within 50 miles' },
  { value: 'nationwide', label: 'Nationwide (UK)' },
  { value: 'international', label: 'International' },
];
```

### Display Logic
- If coach offers **only online**: radius not required, show "N/A (online only)"
- If coach offers **in-person** or **hybrid**: radius required

## Data Storage

### Example 1: Standard City
```json
{
  "location_city": "London",
  "location_radius": "10",
  "location_is_custom": false,
  "location": "London (within 10 miles)" // Auto-generated for display
}
```

### Example 2: Custom City
```json
{
  "location_city": "Cheltenham",
  "location_radius": "25",
  "location_is_custom": true,
  "location": "Cheltenham (within 25 miles)" // Auto-generated
}
```

### Example 3: Online Only
```json
{
  "location_city": "Remote",
  "location_radius": null,
  "location_is_custom": false,
  "location": "Remote" // For online-only coaches
}
```

## Benefits

### For Coaches
✅ **Faster setup** - Select from dropdown vs typing
✅ **No formatting confusion** - Clear options
✅ **Flexible** - Can still enter custom location if needed

### For Platform
✅ **Structured data** - Can filter by exact city
✅ **Radius search** - "Find coaches within 10 miles of me"
✅ **Data consistency** - No typos or variations
✅ **Future features** - Can add maps, distance calculation

### For Clients
✅ **Better search** - Filter by city and radius
✅ **Clear expectations** - Know exactly where coach operates
✅ **Accurate results** - No missing coaches due to typos

## Migration Strategy

### For Existing Coaches
1. **Parse existing `location` field**:
   - "London" → city: "London", radius: null
   - "within 5 miles of Manchester" → city: "Manchester", radius: "5"
   - "Cheltenham area" → city: "Cheltenham", radius: null, is_custom: true

2. **SQL Migration**:
```sql
-- Extract city from location string
UPDATE coach_profiles
SET location_city = CASE
  WHEN location LIKE '%London%' THEN 'London'
  WHEN location LIKE '%Manchester%' THEN 'Manchester'
  WHEN location LIKE '%Birmingham%' THEN 'Birmingham'
  -- ... for each major city
  ELSE location -- Custom location
END;

-- Extract radius if present
UPDATE coach_profiles
SET location_radius = CASE
  WHEN location ~* 'within 5 miles' THEN '5'
  WHEN location ~* 'within 10 miles' THEN '10'
  WHEN location ~* 'within 25 miles' THEN '25'
  WHEN location ~* 'within 50 miles' THEN '50'
  WHEN location ~* 'nationwide' THEN 'nationwide'
  ELSE NULL
END;

-- Mark as custom if not in UK_CITIES list
UPDATE coach_profiles
SET location_is_custom = CASE
  WHEN location_city NOT IN ('London', 'Manchester', ...) THEN true
  ELSE false
END;
```

3. **Regenerate display location**:
```sql
UPDATE coach_profiles
SET location = CASE
  WHEN location_radius IS NOT NULL THEN
    location_city || ' (within ' || location_radius || ' miles)'
  ELSE
    location_city
END;
```

## Advanced Features (Future)

### Radius Search
```typescript
// Find all coaches within 15 miles of user's location
function findCoachesNearby(userCity: string, maxRadius: number) {
  // For MVP: simple city match + radius filter
  // Later: use lat/long + Haversine distance calculation
}
```

### Map View
```typescript
// Show coaches on interactive map
// Group by city with count badges
// Click city → show coaches in that area
```

### Auto-Complete
```typescript
// As user types, suggest matching cities
// "Man" → Manchester, Mansfield
// "Bri" → Bristol, Brighton, Bridgend
```

## Implementation Steps

### Phase 1: Backend (Database)
1. Add new columns to `coach_profiles` table
2. Create migration script for existing data
3. Update TypeScript types

### Phase 2: Coach Dashboard UI
1. Replace location text input with dropdown
2. Add radius dropdown (conditional on format)
3. Add "Other" custom input option
4. Update form validation

### Phase 3: Coach Profile Display
1. Update profile to show structured location
2. Format display: "London (within 10 miles)"
3. Keep backward compatibility

### Phase 4: Search/Filter
1. Add city filter to search page
2. Add radius filter
3. Enable "coaches near me" feature

## Validation Rules

### Location City
- **Required**: Yes (unless online-only)
- **Max length**: 100 characters
- **Validation**: Must select from dropdown or enter custom

### Location Radius
- **Required**: If offers in-person or hybrid
- **Not required**: If online-only
- **Options**: Fixed list (5, 10, 25, 50 miles, nationwide, international)

### Custom Location
- **Required**: If "Other" selected
- **Max length**: 100 characters
- **Validation**: No special characters except spaces, hyphens, apostrophes

## Error Handling

### Missing Location
```
❌ Please select your base location
```

### Missing Radius (for in-person coaches)
```
❌ Please select how far you'll travel for in-person sessions
```

### Invalid Custom Location
```
❌ Please enter a valid town or city name
```

## Testing Checklist

- [ ] Dropdown shows all UK cities
- [ ] "Other" option reveals custom input field
- [ ] Radius dropdown shows all options
- [ ] Radius only required if offering in-person
- [ ] Location string auto-generated correctly
- [ ] Existing location data migrates successfully
- [ ] Search filters work with new structure
- [ ] Profile displays location correctly
- [ ] Mobile responsive design
- [ ] Validation errors show appropriately

## User Stories

### Story 1: London Coach
> As a coach in London, I want to select "London" and "Within 10 miles" so clients know I serve Central London and nearby areas.

**Steps**:
1. Select "London" from dropdown
2. Select "Within 10 miles" from radius
3. Check "In-Person" format
4. Profile shows: "London (within 10 miles)"

### Story 2: Small Town Coach
> As a coach in Cheltenham (not in dropdown), I want to enter my custom location so clients can find me.

**Steps**:
1. Select "Other" from dropdown
2. Enter "Cheltenham" in custom field
3. Select "Within 25 miles" radius
4. Profile shows: "Cheltenham (within 25 miles)"

### Story 3: Online-Only Coach
> As an online-only coach, I don't want to specify a location radius since I work remotely.

**Steps**:
1. Select "Remote" or any city
2. Check only "Online" format
3. Radius field hidden/not required
4. Profile shows: "Remote" or "London (online)"

## Summary

### What Changes
- ❌ Free-form text input
- ✅ Structured dropdown selection
- ✅ Separate radius field
- ✅ Custom entry option

### What Stays Same
- ✓ `location` field in database (auto-populated)
- ✓ Profile display format
- ✓ Backward compatibility

### Key Benefits
- 🎯 **Structured data** for better search
- 🚀 **Faster input** for coaches
- 🔍 **Better search** for clients
- 🗺️ **Future-proof** for maps/radius features

**Status**: 📝 Design complete, ready for implementation
