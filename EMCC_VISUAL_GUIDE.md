# EMCC Visual Guidance Implementation

## Overview

Add a visual example of the EMCC search results page to help users understand exactly what URL to copy.

## Implementation Plan

### 1. Create Example Screenshot

**Option A: Annotated Screenshot (Recommended)**
- Take screenshot of EMCC search results page
- Blur personal details (name, location, etc.)
- Add annotations/arrows pointing to:
  1. The EIA reference number in "Reference" field
  2. The "Search" button
  3. The URL bar with the correct URL
  4. The search results showing the profile

**Option B: Mockup with Fake Data**
- Create mockup using real EMCC page structure
- Use fake name: "Alex Johnson"
- Use fake EIA: "EIA20240001"
- Clearly labeled as example

**Recommended**: Option A (real screenshot with blur) - looks more authentic

### 2. Image Specifications

**File Format**: PNG or WebP
**Resolution**: 1200px wide (will scale down responsively)
**File Size**: <200KB (optimize for web)
**Location**: `/public/images/emcc-example.png`

**What to Show:**
1. EMCC search form with only "Reference" field filled
2. EIA number visible in Reference field
3. URL bar showing complete URL with parameters
4. Search results table with blurred personal info
5. Annotations/highlights on key areas

### 3. UI Implementation

**Two Guidance Options:**

#### Option 1: Expandable Section (Recommended)
```tsx
{formData.body === 'EMCC' && (
  <div className="mt-4 border border-brand-200 rounded-lg overflow-hidden">
    <button
      onClick={() => setShowEmccGuide(!showEmccGuide)}
      className="w-full px-4 py-3 bg-brand-50 flex items-center justify-between"
    >
      <span className="font-semibold text-brand-700">
        📸 Show Me an Example
      </span>
      <span>{showEmccGuide ? '▼' : '▶'}</span>
    </button>

    {showEmccGuide && (
      <div className="p-4 bg-white">
        <img
          src="/images/emcc-example.png"
          alt="Example of EMCC search results page"
          className="w-full rounded-lg shadow-md mb-3"
        />
        <div className="text-sm text-slate-600 space-y-2">
          <p className="font-semibold text-brand-600">Follow these steps:</p>
          <ol className="list-decimal ml-5 space-y-1">
            <li>Enter ONLY your EIA number in the "Reference" field</li>
            <li>Click "Search"</li>
            <li>Copy the complete URL from your browser's address bar</li>
            <li>Paste it into the field above</li>
          </ol>
        </div>
      </div>
    )}
  </div>
)}
```

#### Option 2: Modal Popup
```tsx
{showEmccGuideModal && (
  <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
    <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-auto">
      <div className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-brand-700">
            How to Find Your EMCC Profile URL
          </h3>
          <button
            onClick={() => setShowEmccGuideModal(false)}
            className="text-slate-400 hover:text-slate-600"
          >
            ✕
          </button>
        </div>

        <img
          src="/images/emcc-example.png"
          alt="Example of EMCC search results"
          className="w-full rounded-lg shadow-lg mb-4"
        />

        <div className="space-y-4">
          <div className="bg-brand-50 p-4 rounded-lg">
            <p className="font-semibold text-brand-700 mb-2">Step-by-Step Guide:</p>
            <ol className="list-decimal ml-5 space-y-2 text-sm">
              <li>Visit the EMCC Directory</li>
              <li>Enter ONLY your EIA number (e.g., EIA20230480)</li>
              <li>Leave all other fields blank</li>
              <li>Click "Search"</li>
              <li>Copy the complete URL from your browser's address bar</li>
            </ol>
          </div>

          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <p className="font-semibold text-green-800 mb-1">✅ Your URL should look like:</p>
            <code className="text-xs bg-white px-2 py-1 rounded border border-green-300 text-green-700 break-all">
              https://www.emccglobal.org/accreditation/eia/eia-awards/?reference=EIA20230480&search=1
            </code>
          </div>
        </div>
      </div>
    </div>
  </div>
)}
```

### 4. Updated CoachSignup.tsx Structure

```tsx
const [showEmccGuide, setShowEmccGuide] = useState(false);

// ... in the EMCC section ...

{/* Existing input field */}
<input
  name="regNumber"
  type="url"
  value={formData.regNumber}
  placeholder="Paste your EMCC profile URL here"
  className="..."
/>

{/* NEW: Visual Guide Expandable Section */}
<div className="mt-3">
  <button
    type="button"
    onClick={() => setShowEmccGuide(!showEmccGuide)}
    className="flex items-center gap-2 text-brand-600 hover:text-brand-700 text-sm font-medium"
  >
    <span>📸</span>
    <span>{showEmccGuide ? 'Hide Example' : 'Show Me an Example'}</span>
    <span className="text-xs">{showEmccGuide ? '▼' : '▶'}</span>
  </button>

  {showEmccGuide && (
    <div className="mt-3 border border-brand-200 rounded-lg overflow-hidden bg-brand-50 p-4">
      <img
        src="/images/emcc-example.png"
        alt="Example of EMCC search results page showing where to find your profile URL"
        className="w-full rounded-lg shadow-md mb-3"
      />

      <div className="bg-white p-3 rounded-lg">
        <p className="text-sm font-semibold text-brand-700 mb-2">
          Follow these exact steps:
        </p>
        <ol className="text-sm text-slate-700 space-y-1.5 ml-5 list-decimal">
          <li>Go to the EMCC Directory (link in info icon above)</li>
          <li>Enter <strong>only your EIA number</strong> in the "Reference" field</li>
          <li>Leave First Name and Last Name blank</li>
          <li>Click "Search"</li>
          <li>Copy the <strong>complete URL</strong> from your browser's address bar</li>
          <li>Paste it into the field above</li>
        </ol>
      </div>

      <div className="mt-3 bg-amber-50 border border-amber-200 rounded p-2">
        <p className="text-xs text-amber-800 font-semibold">
          ⚠️ Don't search by name! Only use the EIA number for accurate verification.
        </p>
      </div>
    </div>
  )}
</div>
```

## 5. Image Creation Instructions

### Tools Needed:
- Screenshot tool (macOS: Cmd+Shift+4)
- Image editor (Figma, Photoshop, or online tool like Photopea)

### Steps to Create the Example Image:

1. **Take Screenshot**
   - Navigate to: https://www.emccglobal.org/accreditation/eia/eia-awards/
   - Search with EIA20230480 (Paula Jones)
   - Take full-page screenshot showing:
     - Search form at top
     - URL bar (important!)
     - Search results table

2. **Edit Screenshot**
   - **Blur**: Name, location, any personal details
   - **Keep visible**: EIA number, credential level, table structure
   - **Add annotations**:
     - Arrow pointing to Reference field: "1. Enter your EIA number here"
     - Arrow pointing to Search button: "2. Click Search"
     - Arrow pointing to URL bar: "3. Copy this complete URL"
     - Highlight the search results row

3. **Optimize**
   - Export as PNG
   - Compress using TinyPNG or similar
   - Aim for <200KB file size

4. **Alternative: Use Design Tool**
   - Recreate the EMCC interface
   - Use fake data: "Alex Johnson", "EIA20240001"
   - Match EMCC's color scheme and layout
   - Add "EXAMPLE" watermark

## 6. Mobile Responsive Considerations

```tsx
<img
  src="/images/emcc-example.png"
  alt="Example of EMCC search results"
  className="w-full rounded-lg shadow-md mb-3
             md:max-w-3xl md:mx-auto" // Center on desktop, constrain width
  loading="lazy" // Lazy load to improve page speed
/>
```

## 7. Accessibility

```tsx
<button
  onClick={() => setShowEmccGuide(!showEmccGuide)}
  aria-expanded={showEmccGuide}
  aria-controls="emcc-visual-guide"
>
  Show Me an Example
</button>

<div
  id="emcc-visual-guide"
  role="region"
  aria-label="Visual guide for finding EMCC profile URL"
  className={showEmccGuide ? 'block' : 'hidden'}
>
  {/* Guide content */}
</div>
```

## 8. Testing Checklist

- [ ] Image loads correctly on desktop
- [ ] Image loads correctly on mobile
- [ ] Expand/collapse animation smooth
- [ ] Image is readable when scaled down
- [ ] Alt text is descriptive
- [ ] File size is optimized (<200KB)
- [ ] Works in all major browsers
- [ ] Doesn't interfere with form submission

## 9. Benefits

✅ **Reduced confusion** - Users see exactly what to do
✅ **Lower support requests** - Visual > text instructions
✅ **Faster verification** - Users get it right first time
✅ **Professional appearance** - Shows attention to detail
✅ **Scalable** - Can add similar guides for ICF, AC, etc.

## 10. Future Enhancements

### Video Tutorial (Optional)
- 30-second screen recording showing the process
- Hosted on Loom or embedded YouTube
- Even more effective than static image

### Interactive Demo (Advanced)
- Embedded iframe or interactive component
- User can see search form in action
- Most helpful but requires more development

---

## Implementation Priority

**Phase 1** (Do Now):
- Create annotated screenshot
- Add expandable section to CoachSignup.tsx
- Test on multiple devices

**Phase 2** (Later):
- Add modal option for larger view
- Create ICF visual guide
- Consider video tutorial

---

## Recommendation

Start with **expandable section** approach (Option 1):
- Less intrusive than modal
- Always visible/available
- Simple to implement
- Mobile-friendly

The "Show Me an Example" button feels more helpful than forcing users to read long text instructions.
