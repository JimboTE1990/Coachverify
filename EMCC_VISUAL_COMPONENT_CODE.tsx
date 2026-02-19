// ====================================================================
// EMCC VISUAL GUIDANCE COMPONENT
// Add this to CoachSignup.tsx in the EMCC verification section
// ====================================================================

// 1. ADD STATE AT TOP OF COMPONENT
const [showEmccGuide, setShowEmccGuide] = useState(false);

// 2. ADD THIS COMPONENT AFTER THE EMCC URL INPUT FIELD

{formData.body === 'EMCC' && (
  <>
    {/* Existing URL Input Field */}
    <input
      name="regNumber"
      type="url"
      value={formData.regNumber}
      onChange={handleChange}
      placeholder="Paste your EMCC profile URL here"
      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
    />

    {/* NEW: Visual Guide Toggle Button */}
    <div className="mt-3">
      <button
        type="button"
        onClick={() => setShowEmccGuide(!showEmccGuide)}
        className="flex items-center gap-2 text-brand-600 hover:text-brand-700 text-sm font-medium transition-colors"
      >
        <span className="text-lg">📸</span>
        <span>{showEmccGuide ? 'Hide Example' : 'Show Me an Example'}</span>
        <span className="text-xs transform transition-transform" style={{
          transform: showEmccGuide ? 'rotate(90deg)' : 'rotate(0deg)'
        }}>
          ▶
        </span>
      </button>

      {/* Visual Guide Content */}
      {showEmccGuide && (
        <div className="mt-4 border border-brand-200 rounded-lg overflow-hidden bg-gradient-to-b from-brand-50 to-white animate-fadeIn">
          {/* Example Screenshot */}
          <div className="p-4 md:p-6">
            <div className="mb-4">
              <p className="text-sm font-semibold text-brand-700 mb-2">
                Here's what the EMCC search results page looks like:
              </p>
            </div>

            {/* Image Container */}
            <div className="relative rounded-lg overflow-hidden shadow-lg border border-slate-200 bg-white">
              <img
                src="/images/emcc-example.png"
                alt="Example of EMCC directory search results showing where to copy the profile URL"
                className="w-full h-auto"
                loading="lazy"
              />

              {/* Optional: Overlay "EXAMPLE" watermark */}
              <div className="absolute top-4 right-4 bg-brand-600 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg opacity-90">
                EXAMPLE
              </div>
            </div>

            {/* Step-by-Step Instructions */}
            <div className="mt-4 bg-white rounded-lg border border-slate-200 p-4">
              <p className="text-sm font-semibold text-brand-700 mb-3 flex items-center gap-2">
                <span className="text-lg">✓</span>
                Follow these exact steps:
              </p>
              <ol className="text-sm text-slate-700 space-y-2 ml-6 list-decimal">
                <li>
                  <a
                    href="https://www.emccglobal.org/accreditation/eia/eia-awards/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-brand-600 hover:text-brand-700 underline font-medium"
                  >
                    Open the EMCC Directory
                  </a>
                </li>
                <li>Enter <strong className="text-slate-900">only your EIA number</strong> in the "Reference" field (e.g., EIA20230480)</li>
                <li>Leave <strong className="text-slate-900">First Name</strong> and <strong className="text-slate-900">Last Name</strong> fields blank</li>
                <li>Click the <strong className="text-slate-900">"Search"</strong> button</li>
                <li>Copy the <strong className="text-slate-900">complete URL</strong> from your browser's address bar</li>
                <li>Paste it into the field above</li>
              </ol>
            </div>

            {/* Correct URL Example */}
            <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-xs font-semibold text-green-800 mb-2 flex items-center gap-1">
                <span>✅</span>
                Your URL should look like this:
              </p>
              <code className="block text-xs bg-white px-3 py-2 rounded border border-green-300 text-green-700 font-mono break-all">
                https://www.emccglobal.org/accreditation/eia/eia-awards/?reference=EIA20230480&search=1
              </code>
            </div>

            {/* Warning About Name Search */}
            <div className="mt-3 bg-amber-50 border border-amber-200 rounded-lg p-3">
              <p className="text-xs text-amber-900 font-semibold flex items-start gap-2">
                <span className="text-sm flex-shrink-0">⚠️</span>
                <span>
                  <strong>Important:</strong> Don't search by name! Only use your EIA reference number for accurate verification.
                </span>
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  </>
)}

// ====================================================================
// 3. ADD THESE STYLES TO YOUR TAILWIND CONFIG OR GLOBAL CSS
// ====================================================================

// If using custom CSS, add this animation:
/*
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
  animation: fadeIn 0.3s ease-out;
}
*/

// Or extend Tailwind config:
/*
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        fadeIn: 'fadeIn 0.3s ease-out',
      },
    },
  },
}
*/

// ====================================================================
// 4. ALTERNATIVE: MODAL VERSION (More Dramatic)
// ====================================================================

// State:
const [showEmccGuideModal, setShowEmccGuideModal] = useState(false);

// Trigger button:
<button
  type="button"
  onClick={() => setShowEmccGuideModal(true)}
  className="text-sm text-brand-600 hover:text-brand-700 underline flex items-center gap-1"
>
  <span>📸</span>
  <span>Show Me an Example</span>
</button>

// Modal:
{showEmccGuideModal && (
  <div
    className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
    onClick={() => setShowEmccGuideModal(false)}
  >
    <div
      className="bg-white rounded-xl max-w-5xl w-full max-h-[90vh] overflow-auto shadow-2xl"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center">
        <h3 className="text-xl font-bold text-brand-700 flex items-center gap-2">
          <span>📋</span>
          How to Find Your EMCC Profile URL
        </h3>
        <button
          onClick={() => setShowEmccGuideModal(false)}
          className="text-slate-400 hover:text-slate-600 text-2xl leading-none transition-colors"
          aria-label="Close"
        >
          ×
        </button>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Screenshot */}
        <div className="rounded-lg overflow-hidden shadow-lg border border-slate-200 mb-6">
          <img
            src="/images/emcc-example.png"
            alt="Example of EMCC search results"
            className="w-full h-auto"
          />
        </div>

        {/* Instructions */}
        <div className="space-y-4">
          <div className="bg-brand-50 rounded-lg p-5 border border-brand-200">
            <p className="font-semibold text-brand-700 mb-3 text-lg">
              Step-by-Step Guide:
            </p>
            <ol className="space-y-3 ml-6 list-decimal text-slate-700">
              <li>Visit the <a href="https://www.emccglobal.org/accreditation/eia/eia-awards/" target="_blank" className="text-brand-600 hover:underline font-medium">EMCC Directory</a></li>
              <li>Enter <strong>only your EIA number</strong> (e.g., EIA20230480) in the "Reference" field</li>
              <li>Leave all other fields <strong>blank</strong></li>
              <li>Click <strong>"Search"</strong></li>
              <li>Copy the <strong>complete URL</strong> from your browser's address bar</li>
              <li>Paste it into the verification form</li>
            </ol>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="font-semibold text-green-800 mb-2">✅ Correct URL Format:</p>
            <code className="block text-sm bg-white px-4 py-3 rounded border border-green-300 text-green-700 font-mono break-all">
              https://www.emccglobal.org/accreditation/eia/eia-awards/?reference=EIA20230480&search=1
            </code>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <p className="font-semibold text-amber-800 mb-2">⚠️ Common Mistakes:</p>
            <ul className="text-sm text-amber-900 space-y-1 ml-4 list-disc">
              <li>Searching by name instead of EIA number</li>
              <li>Not copying the complete URL</li>
              <li>Using the directory landing page URL</li>
            </ul>
          </div>
        </div>

        {/* Close Button */}
        <div className="mt-6 text-center">
          <button
            onClick={() => setShowEmccGuideModal(false)}
            className="px-6 py-3 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors font-medium"
          >
            Got It, Thanks!
          </button>
        </div>
      </div>
    </div>
  </div>
)}

// ====================================================================
// 5. IMPLEMENTATION CHECKLIST
// ====================================================================

/*
[ ] 1. Create the example screenshot:
       - Take screenshot of EMCC search page with EIA20230480
       - Blur personal details (name, location)
       - Add annotations with arrows/highlights
       - Save as /public/images/emcc-example.png
       - Optimize file size (<200KB)

[ ] 2. Add state to CoachSignup.tsx:
       - const [showEmccGuide, setShowEmccGuide] = useState(false);

[ ] 3. Add the visual guide component after the URL input

[ ] 4. Add CSS animation (if not using Tailwind)

[ ] 5. Test on desktop and mobile

[ ] 6. Verify image loads correctly

[ ] 7. Check accessibility (keyboard navigation, screen readers)

[ ] 8. Deploy and monitor user feedback
*/

// ====================================================================
// 6. RECOMMENDED APPROACH
// ====================================================================

/*
RECOMMENDATION: Use the expandable section (not modal)

Why?
✅ Less intrusive - doesn't block the form
✅ Always accessible - users can toggle anytime
✅ Better mobile UX - no full-screen takeover
✅ Simpler implementation - no z-index/overlay issues
✅ Faster - no modal animation overhead

The modal is better for:
- Complex, multi-step tutorials
- When you want to force attention
- Detailed video walkthroughs

For a simple "here's what it looks like" guide, the expandable section is perfect.
*/
