// ====================================================================
// EMCC STEP-BY-STEP VISUAL GUIDE
// Multi-step expandable guide with screenshots for each step
// ====================================================================

// 1. ADD STATE AT TOP OF COMPONENT
const [showEmccGuide, setShowEmccGuide] = useState(false);

// 2. ADD THIS COMPONENT IN THE EMCC SECTION

{formData.body === 'EMCC' && (
  <>
    {/* Existing URL Input Field */}
    <input
      name="regNumber"
      type="url"
      value={formData.regNumber}
      onChange={handleChange}
      placeholder="Paste your EMCC profile URL here"
      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500"
    />

    {/* NEW: Step-by-Step Visual Guide */}
    <div className="mt-4">
      <button
        type="button"
        onClick={() => setShowEmccGuide(!showEmccGuide)}
        className="w-full flex items-center justify-between px-4 py-3 bg-brand-50 hover:bg-brand-100 border border-brand-200 rounded-lg transition-colors group"
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">📸</span>
          <div className="text-left">
            <p className="font-semibold text-brand-700">
              {showEmccGuide ? 'Hide Step-by-Step Guide' : 'Show Step-by-Step Guide'}
            </p>
            <p className="text-xs text-brand-600">
              Visual walkthrough with screenshots
            </p>
          </div>
        </div>
        <span
          className="text-brand-600 text-xl transform transition-transform duration-200"
          style={{ transform: showEmccGuide ? 'rotate(90deg)' : 'rotate(0deg)' }}
        >
          ▶
        </span>
      </button>

      {/* Expandable Guide Content */}
      {showEmccGuide && (
        <div className="mt-4 border border-brand-200 rounded-lg overflow-hidden bg-white shadow-lg animate-fadeIn">
          <div className="bg-gradient-to-r from-brand-600 to-brand-700 px-6 py-4">
            <h4 className="text-white font-bold text-lg">
              How to Find Your EMCC Profile URL
            </h4>
            <p className="text-brand-100 text-sm mt-1">
              Follow these 3 simple steps to verify your EMCC accreditation
            </p>
          </div>

          <div className="p-6 space-y-8">
            {/* STEP 1: Search by Name */}
            <div className="relative">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-brand-600 text-white rounded-full flex items-center justify-center font-bold text-lg">
                  1
                </div>
                <div className="flex-1">
                  <h5 className="font-bold text-lg text-slate-800 mb-2">
                    Search by Your Name to Find Your EIA Number
                  </h5>
                  <p className="text-sm text-slate-600 mb-4">
                    First, you need to find your EIA reference number. Go to the EMCC directory and search using your name.
                  </p>

                  {/* Screenshot 1 */}
                  <div className="rounded-lg overflow-hidden border-2 border-slate-200 shadow-md bg-slate-50">
                    <img
                      src="/images/emcc-step-1-name-search.png"
                      alt="Step 1: Search EMCC directory by entering your first and last name"
                      className="w-full h-auto"
                      loading="lazy"
                    />
                  </div>

                  {/* Instructions for Step 1 */}
                  <div className="mt-3 bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm font-semibold text-blue-900 mb-2">What to do:</p>
                    <ul className="text-sm text-blue-800 space-y-1.5 ml-4 list-disc">
                      <li>
                        Visit{' '}
                        <a
                          href="https://www.emccglobal.org/accreditation/eia/eia-awards/"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline font-medium hover:text-blue-900"
                        >
                          EMCC Directory
                        </a>
                      </li>
                      <li>Enter your <strong>First Name</strong> and <strong>Last Name</strong></li>
                      <li>Click <strong>"Search"</strong></li>
                      <li>Look for your profile in the results</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t-2 border-dashed border-slate-200"></div>

            {/* STEP 2: Find EIA Number */}
            <div className="relative">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-brand-600 text-white rounded-full flex items-center justify-center font-bold text-lg">
                  2
                </div>
                <div className="flex-1">
                  <h5 className="font-bold text-lg text-slate-800 mb-2">
                    Copy Your EIA Reference Number
                  </h5>
                  <p className="text-sm text-slate-600 mb-4">
                    Once you find your profile, locate and copy your EIA reference number (it looks like "EIA20230480").
                  </p>

                  {/* Screenshot 2 */}
                  <div className="rounded-lg overflow-hidden border-2 border-slate-200 shadow-md bg-slate-50">
                    <img
                      src="/images/emcc-step-2-find-eia.png"
                      alt="Step 2: Locate and copy your EIA reference number from the search results"
                      className="w-full h-auto"
                      loading="lazy"
                    />
                  </div>

                  {/* Instructions for Step 2 */}
                  <div className="mt-3 bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <p className="text-sm font-semibold text-purple-900 mb-2">What to do:</p>
                    <ul className="text-sm text-purple-800 space-y-1.5 ml-4 list-disc">
                      <li>Find the <strong>"Reference"</strong> column in the results table</li>
                      <li>Your EIA number will be in the format: <code className="bg-white px-2 py-0.5 rounded border border-purple-300 font-mono text-xs">EIA20230480</code></li>
                      <li>Copy or write down this number</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t-2 border-dashed border-slate-200"></div>

            {/* STEP 3: Search by EIA and Copy URL */}
            <div className="relative">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-green-600 text-white rounded-full flex items-center justify-center font-bold text-lg">
                  3
                </div>
                <div className="flex-1">
                  <h5 className="font-bold text-lg text-slate-800 mb-2">
                    Search by EIA Number and Copy the URL
                  </h5>
                  <p className="text-sm text-slate-600 mb-4">
                    Now search again using ONLY your EIA number, then copy the complete URL from your browser.
                  </p>

                  {/* Screenshot 3 */}
                  <div className="rounded-lg overflow-hidden border-2 border-slate-200 shadow-md bg-slate-50">
                    <img
                      src="/images/emcc-step-3-eia-search.png"
                      alt="Step 3: Search by EIA number only and copy the complete URL from browser address bar"
                      className="w-full h-auto"
                      loading="lazy"
                    />
                  </div>

                  {/* Instructions for Step 3 */}
                  <div className="mt-3 bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="text-sm font-semibold text-green-900 mb-2">What to do:</p>
                    <ul className="text-sm text-green-800 space-y-1.5 ml-4 list-disc">
                      <li><strong>Clear the search form</strong> (remove first name and last name)</li>
                      <li>Enter <strong>ONLY your EIA number</strong> in the "Reference" field</li>
                      <li>Leave all other fields <strong>blank</strong></li>
                      <li>Click <strong>"Search"</strong></li>
                      <li>Copy the <strong>complete URL</strong> from your browser's address bar</li>
                      <li>Paste it into the field above</li>
                    </ul>
                  </div>

                  {/* Example URL */}
                  <div className="mt-3 bg-white border-2 border-green-300 rounded-lg p-4">
                    <p className="text-xs font-semibold text-green-800 mb-2 flex items-center gap-1">
                      <span>✅</span>
                      Your URL should look exactly like this:
                    </p>
                    <code className="block text-xs bg-green-50 px-3 py-2 rounded border border-green-200 text-green-700 font-mono break-all">
                      https://www.emccglobal.org/accreditation/eia/eia-awards/?reference=EIA20230480&search=1
                    </code>
                  </div>
                </div>
              </div>
            </div>

            {/* Important Warning */}
            <div className="bg-amber-50 border-2 border-amber-300 rounded-lg p-5">
              <div className="flex items-start gap-3">
                <span className="text-2xl flex-shrink-0">⚠️</span>
                <div>
                  <p className="font-bold text-amber-900 mb-2">
                    Critical: Why Step 3 Matters
                  </p>
                  <p className="text-sm text-amber-800 mb-3">
                    Searching by name creates a different URL that won't work for verification.
                    You <strong>must</strong> search by EIA number only to get the correct URL.
                  </p>
                  <div className="space-y-2">
                    <div>
                      <p className="text-xs font-semibold text-red-700 mb-1">❌ Wrong (name search):</p>
                      <code className="block text-xs bg-white px-2 py-1 rounded border border-red-300 text-red-700 font-mono break-all">
                        .../eia-awards/?first_name=paul&last_name=jones&search=1
                      </code>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-green-700 mb-1">✅ Correct (EIA search):</p>
                      <code className="block text-xs bg-white px-2 py-1 rounded border border-green-300 text-green-700 font-mono break-all">
                        .../eia-awards/?reference=EIA20230480&search=1
                      </code>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Summary */}
            <div className="bg-slate-100 rounded-lg p-5 border border-slate-300">
              <p className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                <span className="text-lg">📝</span>
                Quick Summary
              </p>
              <ol className="text-sm text-slate-700 space-y-2 ml-6 list-decimal">
                <li><strong>Search by name</strong> → Find your EIA number</li>
                <li><strong>Copy EIA number</strong> → e.g., EIA20230480</li>
                <li><strong>Search by EIA only</strong> → Copy URL → Paste above</li>
              </ol>
            </div>
          </div>
        </div>
      )}
    </div>
  </>
)}

// ====================================================================
// 3. SCREENSHOT REQUIREMENTS
// ====================================================================

/*
You'll need to create 3 screenshots:

📸 Screenshot 1: /public/images/emcc-step-1-name-search.png
- Show the EMCC search form
- First Name and Last Name fields filled in (use fake name like "Alex Johnson")
- Highlight or arrow pointing to the Search button
- Optional: Show search results below
- Blur any real personal data

📸 Screenshot 2: /public/images/emcc-step-2-find-eia.png
- Show the search results table
- Highlight the "Reference" column
- Show an EIA number (use EIA20240001 or blur a real one)
- Add arrow pointing to the EIA number with text "Copy this"
- Blur other personal details (name, location)

📸 Screenshot 3: /public/images/emcc-step-3-eia-search.png
- Show the search form with ONLY Reference field filled
- Show "EIA20230480" in the Reference field
- First Name and Last Name fields EMPTY
- Browser address bar visible showing the complete URL
- Add arrow pointing to URL bar with text "Copy this complete URL"
- Optional: Highlight the URL bar in green

Screenshot Tips:
- Use consistent fake data: "EIA20240001" or "EIA20230480"
- Resolution: 1200-1600px wide
- Add subtle annotations (arrows, highlights) in your image editor
- Compress to <200KB each using TinyPNG
- Consider adding "EXAMPLE" watermark in corner
*/

// ====================================================================
// 4. CSS ANIMATION (if needed)
// ====================================================================

/*
// Add to your global CSS or Tailwind config:

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fadeIn {
  animation: fadeIn 0.3s ease-out forwards;
}
*/

// ====================================================================
// 5. ALTERNATIVE: CAROUSEL/SLIDER VERSION
// ====================================================================

/*
For a more interactive experience, you could make this a carousel
where users click "Next" to see each step. This keeps the UI cleaner
and guides them through one step at a time.

Would need:
- State: const [currentStep, setCurrentStep] = useState(1);
- Previous/Next buttons
- Progress indicator (1 of 3)
- Could use libraries like Swiper or build custom

Let me know if you want me to create that version!
*/

// ====================================================================
// 6. MOBILE RESPONSIVE CONSIDERATIONS
// ====================================================================

/*
The current design is mobile-friendly:
- Screenshots scale down automatically (w-full)
- Step numbers are large and easy to tap
- Text is readable on small screens
- Collapsible design saves vertical space

On very small screens (<400px), consider:
- Reducing step number circle size
- Smaller font sizes for code blocks
- Stack step number above content on tiny screens
*/

// ====================================================================
// 7. TESTING CHECKLIST
// ====================================================================

/*
[ ] All 3 screenshots load correctly
[ ] Images are optimized (<200KB each)
[ ] Expandable section animates smoothly
[ ] Works on mobile (iOS Safari, Android Chrome)
[ ] Works on desktop (Chrome, Firefox, Safari)
[ ] Links open in new tabs correctly
[ ] Text is readable at all sizes
[ ] Color contrast meets accessibility standards
[ ] Keyboard navigation works (tab through, Enter to expand)
*/

// ====================================================================
// 8. USER BENEFITS
// ====================================================================

/*
This step-by-step approach:

✅ Removes ambiguity - Each step is crystal clear
✅ Handles the "but I found my name" issue - Shows WHY step 3 matters
✅ Visual confirmation - Users can compare their screen to screenshots
✅ Builds confidence - "I'm doing it right!"
✅ Reduces support - Users self-serve instead of asking for help
✅ Professional appearance - Shows you care about UX
✅ Scales well - Can reuse pattern for ICF, AC, etc.
*/

// ====================================================================
// 9. IMPLEMENTATION PRIORITY
// ====================================================================

/*
Phase 1 (Do Now):
1. Take the 3 screenshots
2. Add visual annotations/arrows
3. Blur personal data
4. Optimize file sizes
5. Add component to CoachSignup.tsx
6. Test on multiple devices

Phase 2 (Later):
- Add video tutorial as alternative
- Create similar guide for ICF
- Consider carousel version for more interactivity
- Add analytics to see if users open the guide
*/
