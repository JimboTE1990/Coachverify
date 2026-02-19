# Screenshot Creation Guide for EMCC Verification

## Overview

You need to create **3 annotated screenshots** showing the step-by-step process of finding and copying an EMCC profile URL.

---

## Screenshot 1: Name Search

**Filename:** `/public/images/emcc-step-1-name-search.png`

**What to Capture:**
1. Go to: https://www.emccglobal.org/accreditation/eia/eia-awards/
2. Fill in:
   - First Name: `Alex` (or use a fake name)
   - Last Name: `Johnson`
3. Take screenshot showing:
   - The search form with fields filled
   - The "Search" button
   - Optional: Search results below

**Annotations to Add:**
- Arrow pointing to "First Name" field: "1. Enter your first name"
- Arrow pointing to "Last Name" field: "2. Enter your last name"
- Arrow pointing to "Search" button: "3. Click Search"
- Optional: Circle the search results

**What to Blur:**
- Any real names if you use actual results
- Real locations or contact info

**Recommended Tool:** Figma, Photopea, or Screenshot annotation tool

---

## Screenshot 2: Find EIA Number

**Filename:** `/public/images/emcc-step-2-find-eia.png`

**What to Capture:**
1. Show the search results table
2. Focus on the "Reference" column
3. Show an EIA number (use fake: `EIA20240001` or blur a real one)

**Your existing screenshot is perfect for this!** Just need to:
- **Blur**: Paula Jones name → "Alex Johnson" or blur completely
- **Blur**: Location details
- **Keep visible**:
  - EIA20230480 (or change to EIA20240001)
  - Table structure
  - Column headers
  - "Senior Practitioner" level

**Annotations to Add:**
- Large arrow pointing to EIA number: "Copy this EIA number"
- Highlight the entire "Reference" column in yellow/green
- Add text box: "Your EIA number is in this column"

**Example:**
```
Country/Region | Name         | Current Award Level    | Reference      | ...
---------------|--------------|------------------------|----------------|----
United Kingdom | [BLURRED]    | Senior Practitioner    | EIA20230480 ← COPY THIS | ...
```

---

## Screenshot 3: EIA Search & URL Copy

**Filename:** `/public/images/emcc-step-3-eia-search.png`

**What to Capture:**
1. Go to EMCC directory again
2. **Clear** First Name and Last Name
3. **Enter ONLY** EIA number in "Reference" field: `EIA20230480`
4. Take screenshot showing:
   - Search form with ONLY Reference filled
   - First Name: EMPTY ← Important!
   - Last Name: EMPTY ← Important!
   - Browser address bar at the top showing the URL

**This is the MOST IMPORTANT screenshot!**

**Annotations to Add:**
- Arrow pointing to Reference field: "1. Enter ONLY your EIA number"
- Red X or "LEAVE BLANK" on First Name field
- Red X or "LEAVE BLANK" on Last Name field
- Large green arrow pointing to browser URL bar: "2. Copy this complete URL"
- Highlight the entire URL in the address bar in green
- Optional: Add text "This URL contains ?reference=EIA20230480"

**Example Layout:**
```
┌─────────────────────────────────────────────────────────────┐
│ Browser Address Bar:                                         │
│ https://www.emccglobal.org/.../eia-awards/?reference=EIA... │ ← COPY THIS!
└─────────────────────────────────────────────────────────────┘

Search Form:
First Name: [           ] ← LEAVE BLANK (X)
Last Name:  [           ] ← LEAVE BLANK (X)
Reference:  [EIA20230480] ← ENTER EIA HERE (✓)
Country:    [Select Here▼]
Award Level:[None       ▼]

              [Search]
```

---

## Tools for Creating Screenshots

### Option 1: Basic (Free)
1. **Take Screenshot**:
   - macOS: Cmd + Shift + 4
   - Windows: Win + Shift + S
2. **Annotate**: Use Preview (Mac) or Paint 3D (Windows)
3. **Blur**: Pixelate tool or manual overlay
4. **Compress**: TinyPNG.com

### Option 2: Professional (Recommended)
1. **Take Screenshot**: Same as above
2. **Edit in Figma** (free):
   - Import screenshot
   - Add shapes (arrows, rectangles, circles)
   - Add text labels
   - Use blur effect for personal data
   - Export as PNG
3. **Compress**: TinyPNG.com

### Option 3: Online Tools
- **Photopea.com** - Free Photoshop alternative
- **Annotely.com** - Screenshot annotation tool
- **Markup.io** - Quick annotations

---

## Annotation Style Guide

**Colors:**
- Arrows: Brand blue (#3B82F6) or bright green (#10B981)
- Highlights: Yellow (#FEF08A) with 50% opacity
- Text boxes: White background, brand color border
- Blur: Gaussian blur or solid color rectangle

**Arrow Style:**
- Thick (3-5px)
- Rounded ends
- Shadow for depth

**Text:**
- Font: Sans-serif (Arial, Helvetica)
- Size: 16-20px
- Bold for emphasis
- Drop shadow for readability

**Example Color Palette:**
```
Success Green: #10B981
Warning Yellow: #FCD34D
Error Red: #EF4444
Info Blue: #3B82F6
Neutral Gray: #6B7280
```

---

## Quality Checklist

### Before Exporting:
- [ ] Resolution: 1200-1600px wide
- [ ] All personal data blurred
- [ ] Annotations are clear and readable
- [ ] Arrows point to correct elements
- [ ] Text has good contrast
- [ ] No typos in labels
- [ ] Consistent style across all 3 screenshots

### After Exporting:
- [ ] Format: PNG (supports transparency)
- [ ] File size: <200KB each (compress if needed)
- [ ] Test at different zoom levels
- [ ] View on mobile to ensure readability
- [ ] Check color contrast (use WebAIM Contrast Checker)

---

## Quick Template for Each Screenshot

### Template Structure:
```
┌─────────────────────────────────────────┐
│                                         │
│   [Screenshot with annotations]         │
│                                         │
│   ↑ Arrows pointing to key elements     │
│   □ Highlights on important areas       │
│   ▢ Text boxes with instructions        │
│                                         │
└─────────────────────────────────────────┘
```

---

## Alternative: Use Loom Video

If screenshots feel like too much work, consider recording a **30-second Loom video** showing all 3 steps:

**Script:**
1. "First, search by your name to find your EIA number" → show typing name
2. "Copy your EIA number from the results" → show copying EIA20230480
3. "Now search again using ONLY the EIA number" → show clearing name fields
4. "Copy this complete URL from your browser" → show highlighting URL bar

**Benefits:**
- Even clearer than screenshots
- Shows exact mouse movements
- Easier to create than 3 annotated screenshots
- Can narrate with voice-over

**Embed code:**
```tsx
<iframe
  src="https://www.loom.com/embed/YOUR_VIDEO_ID"
  frameborder="0"
  allowfullscreen
  className="w-full aspect-video rounded-lg"
></iframe>
```

---

## Mockup Alternative

If you can't use real EMCC pages, create mockups:

**Use Figma/Sketch:**
1. Recreate EMCC's search form layout
2. Use placeholder text: "Alex Johnson", "EIA20240001"
3. Add "EXAMPLE - FOR DEMONSTRATION ONLY" watermark
4. Maintain EMCC's color scheme for authenticity

**Pros:**
- No blurring needed
- Full control over content
- Can make it clearer than real screenshots

**Cons:**
- Takes longer to create
- Might look less authentic

---

## Testing Your Screenshots

1. **Upload to `/public/images/` folder**
2. **Add to component** (use the code from EMCC_STEP_BY_STEP_GUIDE.tsx)
3. **Test on:**
   - Desktop Chrome
   - Desktop Safari
   - Mobile iOS Safari
   - Mobile Android Chrome
4. **Ask someone**: "Can you follow these steps?" → User testing!

---

## Need Help?

If you need help creating these screenshots:
1. Take raw screenshots → I can guide you on annotations
2. Share the images → I can advise on improvements
3. Or just use simple, clean screenshots without heavy annotations

The key is **clarity** > **perfection**. Even basic screenshots are infinitely better than text-only instructions!
