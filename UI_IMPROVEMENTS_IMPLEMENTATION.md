# UI Improvements Implementation Plan

## Changes Requested

### 1. Video Embed Functionality ✓ IN PROGRESS
- Add `introVideoUrl` field to Coach type
- Display embedded video on coach profile below schedule button
- Add video URL input in dashboard bio section with instructions
- Support YouTube and Vimeo embeds

### 2. Reduce EMCC/ICF/AC Badge Size
- Current badge is too large on coach profiles
- Reduce size while maintaining visibility and branding

### 3. Remove "Life" from Meta Descriptions ✓ DONE
- Changed title from "Find Your Life Coach" to "Find Your Coach"
- File: `index.html` line 6

### 4. Add Home Hero Image
- Place `home-hero.jpg` above "Top dog coaches" heading
- Blend seamlessly with gradient background
- Make page more inviting

### 5. Match Quiz Background to Home Page
- Quiz currently has different background color
- Should match home page gradient: `from-brand-50 via-indigo-50 to-purple-50`

## Files to Modify

| File | Changes |
|------|---------|
| `types.ts` | ✓ Add `introVideoUrl?: string` to Coach interface |
| `index.html` | ✓ Change title from "Life Coach" to "Coach" |
| `pages/Home.tsx` | Add hero image above heading |
| `pages/CoachDetails.tsx` | Add video embed display below schedule button, reduce badge size |
| `pages/CoachDashboard.tsx` | Add video URL input field in bio section |
| `pages/Questionnaire.tsx` | Match background gradient to home page |
| `services/supabaseService.ts` | Add `intro_video_url` to mapCoachProfile and updateCoach |
| `supabase/migrations/` | New migration to add `intro_video_url` column |

## Video Embed Format Examples

**YouTube:**
- Standard URL: `https://www.youtube.com/watch?v=VIDEO_ID`
- Embed URL: `https://www.youtube.com/embed/VIDEO_ID`
- Short URL: `https://youtu.be/VIDEO_ID`

**Vimeo:**
- Standard URL: `https://vimeo.com/VIDEO_ID`
- Embed URL: `https://player.vimeo.com/video/VIDEO_ID`

Helper function to convert any video URL to embed format:
```typescript
function getEmbedUrl(url: string): string | null {
  // YouTube
  const youtubeMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&?\/]+)/);
  if (youtubeMatch) return `https://www.youtube.com/embed/${youtubeMatch[1]}`;

  // Vimeo
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;

  // Already an embed URL
  if (url.includes('/embed/') || url.includes('player.vimeo.com')) return url;

  return null;
}
```

## Implementation Status

- [x] Add `intro

VideoUrl` to Coach type
- [x] Remove "life" from meta title
- [x] Move home-hero.jpg to public directory
- [ ] Add video embed display to coach profile
- [ ] Add video URL input to dashboard
- [ ] Add database migration for intro_video_url
- [ ] Update supabaseService mapping
- [ ] Add home hero image to Home.tsx
- [ ] Match quiz background gradient
- [ ] Reduce accreditation badge size

