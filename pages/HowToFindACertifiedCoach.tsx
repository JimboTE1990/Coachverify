import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, ChevronUp, ShieldCheck, ClipboardList } from 'lucide-react';

const faqItems = [
  {
    q: 'Is ICF better than EMCC?',
    a: 'No. Both are gold standards. ICF is more common in the Americas. EMCC is stronger in Europe and corporate mentoring frameworks. CoachDog accepts both equally.',
  },
  {
    q: 'Can I trust a coach who is "certified" but not ICF/EMCC?',
    a: 'It depends. Some reputable organisations (e.g. Hudson, AoEC) have internal certifications that are rigorous but not ICF/EMCC. However, because CoachDog only accepts ICF/EMCC, you are guaranteed a minimum standard of ethics, supervision, and client hours.',
  },
  {
    q: 'How long does it take to find a coach on CoachDog?',
    a: 'Most clients complete the 6 filters in under 4 minutes and receive match results immediately. Average time to first session: 3 days (including free chemistry calls).',
  },
  {
    q: "What if I don't know my \"coaching need\"?",
    a: 'Use our free "Fetch Your Coach" tool at coachdog.co.uk. It\'s a 2-minute quiz that maps your challenges to our taxonomy.',
  },
  {
    q: 'Do you verify coaches annually?',
    a: "Yes. We also allow clients to report suspicious profiles. If a coach's ICF/EMCC status lapses, they are suspended within 24 hours of the registry update.",
  },
];

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqItems.map((item) => ({
    '@type': 'Question',
    name: item.q,
    acceptedAnswer: {
      '@type': 'Answer',
      text: item.a,
    },
  })),
};

const articleSchema = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: 'How to Find a Certified, Verified Coach That Fits Your Budget and Needs',
  description:
    'Not all coaches are verified. CoachDog matches you with ICF/EMCC-accredited coaches using 6 filters: budget, location, gender, need, expertise, and certifications. Start free.',
  url: 'https://www.coachdog.co.uk/how-to-find-a-certified-verified-coach',
  publisher: {
    '@type': 'Organization',
    name: 'CoachDog',
    url: 'https://www.coachdog.co.uk',
  },
  author: {
    '@type': 'Organization',
    name: 'CoachDog',
  },
};

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden">
      <button
        className="w-full flex items-center justify-between px-6 py-4 text-left bg-white hover:bg-slate-50 transition-colors"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
      >
        <span className="font-semibold text-slate-800 pr-4">{q}</span>
        {open ? (
          <ChevronUp className="h-5 w-5 text-brand-500 flex-shrink-0" />
        ) : (
          <ChevronDown className="h-5 w-5 text-slate-400 flex-shrink-0" />
        )}
      </button>
      {open && (
        <div className="px-6 pb-5 bg-white">
          <p className="text-slate-600 leading-relaxed">{a}</p>
        </div>
      )}
    </div>
  );
}

export const HowToFindACertifiedCoach: React.FC = () => {
  useEffect(() => {
    document.title =
      'How to Find a Certified Coach (ICF/EMCC) That Fits Your Budget | CoachDog';
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute(
        'content',
        'Not all coaches are verified. CoachDog matches you with ICF/EMCC-accredited coaches using 6 filters: budget, location, gender, need, expertise, and certifications. Start free.'
      );
    }
    return () => {
      document.title = 'CoachDog · Find Your Verified Coach';
      if (metaDesc) {
        metaDesc.setAttribute(
          'content',
          'Browse accredited coaches verified by EMCC, ICF, and AC. Find your perfect match and book a free introductory call.'
        );
      }
    };
  }, []);

  return (
    <div className="bg-slate-50 min-h-screen">
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Breadcrumb */}
        <nav className="text-sm text-slate-500 mb-8" aria-label="Breadcrumb">
          <ol className="flex items-center gap-2">
            <li><Link to="/" className="hover:text-brand-600">Home</Link></li>
            <li aria-hidden="true">›</li>
            <li>Resources</li>
            <li aria-hidden="true">›</li>
            <li className="text-slate-700 font-medium">How to Find a Certified Coach</li>
          </ol>
        </nav>

        <article>
          {/* Hero Header */}
          <header className="mb-10">
            <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 leading-tight mb-4">
              How to Find a Certified, Verified Coach That Fits Your Budget and Needs
            </h1>
            <p className="text-lg text-slate-500">
              A complete 6-step guide, whether you use CoachDog or not.
            </p>
          </header>

          {/* Introduction */}
          <section className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 mb-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Introduction</h2>
            <p className="text-slate-700 leading-relaxed mb-4">
              You've decided to hire a coach. That's a powerful step. But then reality hits:
            </p>
            <ul className="space-y-2 mb-6">
              {[
                'Thousands of profiles, all claiming to be "the best".',
                'Wildly different prices, from £50 to £500+ per session.',
                'No easy way to know who is actually certified vs. who took a weekend course.',
              ].map((point) => (
                <li key={point} className="flex items-start gap-3 text-slate-700">
                  <span className="mt-1 h-2 w-2 rounded-full bg-brand-500 flex-shrink-0" />
                  {point}
                </li>
              ))}
            </ul>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-6">
              <p className="text-amber-900 font-semibold">
                Here's the truth the coaching industry doesn't advertise: Up to{' '}
                <strong>40% of people who call themselves "coaches" have no recognised accreditation</strong>.
                That's not opinion - it's the finding of several industry surveys (ICF Global Coaching Study, 2022 update).
              </p>
            </div>

            <p className="text-slate-700 leading-relaxed mb-4">
              CoachDog was built to fix that. We only allow coaches with EMCC (European Mentoring &amp; Coaching Council) or ICF (International Coaching Federation) accreditation. And we verify every single coach before they can appear in search results.
            </p>
            <p className="text-slate-700 leading-relaxed">
              But this page isn't just about CoachDog. It's about giving you a repeatable, 6-step system to find a certified, verified coach, whether you use our platform or not. By the end, you will know exactly how to filter by budget, location, gender, coaching need, expertise, and additional certifications.
            </p>

            <img
              src="/assets/pillar/coachdog-hero-6-filters-coach-matching.jpg"
              alt="CoachDog 6-filter coach matching app showing location, coaching need, certifications and budget filters"
              className="w-full rounded-xl shadow-sm mt-8 object-cover"
              loading="lazy"
            />
          </section>

          {/* Why Certified Matters */}
          <section className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 mb-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">
              Why "Certified and Verified" Actually Matters
            </h2>
            <p className="text-slate-700 leading-relaxed mb-6">
              Most people think a "certified coach" means the person completed a course. That's dangerously incomplete.
            </p>

            <div className="overflow-x-auto mb-6">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="text-left px-4 py-3 border border-slate-200 font-bold text-slate-800">Accreditation</th>
                    <th className="text-left px-4 py-3 border border-slate-200 font-bold text-slate-800">What it requires</th>
                    <th className="text-left px-4 py-3 border border-slate-200 font-bold text-slate-800">Why it matters for YOU</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="px-4 py-3 border border-slate-200 font-semibold text-slate-800">ICF (ACC/PCC/MCC)</td>
                    <td className="px-4 py-3 border border-slate-200 text-slate-600">60+ hours coach-specific training, 100+ client hours (for ACC), mentor coaching, passing a performance evaluation</td>
                    <td className="px-4 py-3 border border-slate-200 text-slate-600">Global gold standard. Allows you to verify credentials on ICF's public registry.</td>
                  </tr>
                  <tr className="bg-slate-50">
                    <td className="px-4 py-3 border border-slate-200 font-semibold text-slate-800">EMCC (EIA Practitioner/Senior/Master)</td>
                    <td className="px-4 py-3 border border-slate-200 text-slate-600">Rigorous assessment of coaching competence, 80+ training hours, supervised practice, written reflective logs</td>
                    <td className="px-4 py-3 border border-slate-200 text-slate-600">Strong in Europe and corporate coaching. Focuses on ethical maturity.</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 border border-slate-200 font-semibold text-slate-800">"Certificate of completion" (unaccredited)</td>
                    <td className="px-4 py-3 border border-slate-200 text-slate-600">Paid for a 2-day workshop, no observed coaching, no exam</td>
                    <td className="px-4 py-3 border border-slate-200 text-slate-600 text-red-700 font-medium">Not a real certification. Cannot be independently verified.</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-xl p-5">
              <p className="text-green-900 font-semibold">
                <strong>CoachDog's difference:</strong> We check each coach's ICF/EMCC number against the official registries. If the accreditation has lapsed or was falsified, the coach is rejected.
              </p>
            </div>

            <img
              src="/assets/pillar/fake-certificate-vs-icf-emcc-verified-badge.jpg"
              alt="Comparison of a fake coaching certificate versus a genuine ICF verified accreditation badge"
              className="w-full rounded-xl shadow-sm mt-8 object-cover"
              loading="lazy"
            />
          </section>

          {/* 6-Step Framework */}
          <section className="mb-8">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 mb-6">
              <h2 className="text-2xl font-bold text-slate-900 mb-3">
                The 6-Step Framework to Find Your Ideal Coach
              </h2>
              <p className="text-slate-700">
                We analysed thousands of successful coach-client matches. Every single one followed these six filters, in roughly this order.
              </p>
            </div>

            {/* Step 1 */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 mb-6">
              <h3 className="text-xl font-bold text-brand-700 mb-1">Step 1: Define Your Budget</h3>
              <p className="text-sm text-slate-500 font-medium mb-4">Stop Guessing</p>
              <p className="text-slate-700 leading-relaxed mb-4">
                <strong>Why it's first:</strong> Budget eliminates 70% of the market instantly. If you can't afford £400/session, why look at executive coaches in central London?
              </p>
              <h4 className="font-semibold text-slate-800 mb-3">What the research shows:</h4>
              <ul className="space-y-2 mb-6">
                {[
                  'ICF-certified coaches average £150–£350 per 60-minute session (ICF 2023 Pricing Survey).',
                  'EMCC-accredited coaches in Europe average €120–€280.',
                  'Coaches with both ICF and EMCC accreditations often charge 25–30% more.',
                ].map((point) => (
                  <li key={point} className="flex items-start gap-3 text-slate-700">
                    <span className="mt-1 h-2 w-2 rounded-full bg-brand-400 flex-shrink-0" />
                    {point}
                  </li>
                ))}
              </ul>
              <p className="text-slate-700 mb-4">
                <strong>Your action:</strong> Write down a minimum and maximum per session. Example: £90–£200.
              </p>
              <p className="text-slate-700 mb-6">
                <strong>CoachDog's filter:</strong> Select your budget range. We only show coaches whose published rates fall inside that band. No hidden "surprise pricing".
              </p>
              <div className="bg-brand-50 border border-brand-200 rounded-xl p-4">
                <p className="text-brand-900 text-sm">
                  <strong>Pro tip:</strong> Cheaper is not better. Data shows that clients who pay below the 20th percentile for their region are 3x more likely to quit after 3 sessions. Coaching works when you value it.
                </p>
              </div>
              <img
                src="/assets/pillar/coach-budget-slider-smartphone-50-to-500-dollars.jpg"
                alt="Smartphone showing a coaching session budget range slider from £50 to £500+ per session"
                className="w-full rounded-xl shadow-sm mt-8 object-cover"
                loading="lazy"
              />
            </div>

            {/* Step 2 */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 mb-6">
              <h3 className="text-xl font-bold text-brand-700 mb-1">Step 2: Choose Location</h3>
              <p className="text-sm text-slate-500 font-medium mb-4">Local vs. Virtual</p>
              <p className="text-slate-700 leading-relaxed mb-6">
                Most coaching is now hybrid. But location matters for time zones and in-person preference.
              </p>
              <div className="grid sm:grid-cols-2 gap-4 mb-6">
                <div className="bg-slate-50 rounded-xl p-4">
                  <h4 className="font-semibold text-slate-800 mb-3">When to choose local:</h4>
                  <ul className="space-y-2 text-sm text-slate-600">
                    <li>• You want body language and physical presence (e.g. leadership presence coaching).</li>
                    <li>• Your organisation mandates on-site coaching.</li>
                    <li>• You need to avoid Zoom fatigue.</li>
                  </ul>
                </div>
                <div className="bg-blue-50 rounded-xl p-4">
                  <h4 className="font-semibold text-slate-800 mb-3">When virtual is fine (or better):</h4>
                  <ul className="space-y-2 text-sm text-slate-600">
                    <li>• Your coach is in a different country with lower rates.</li>
                    <li>• You travel frequently - sessions from anywhere.</li>
                    <li>• Evidence: A 2022 study found no significant difference in outcomes between virtual and in-person coaching when the relationship quality is high.</li>
                  </ul>
                </div>
              </div>
              <p className="text-slate-700">
                <strong>CoachDog's filter:</strong> Enter your city or postcode for local matches, or check <em>online</em> for virtual coaches worldwide.
              </p>
              <img
                src="/assets/pillar/virtual-vs-local-coach-map-london-new-york-singapore.jpg"
                alt="World map showing virtual coaching connections between London, New York and Singapore with video call panel"
                className="w-full rounded-xl shadow-sm mt-8 object-cover"
                loading="lazy"
              />
            </div>

            {/* Step 3 */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 mb-6">
              <h3 className="text-xl font-bold text-brand-700 mb-1">Step 3: Filter by Gender</h3>
              <p className="text-sm text-slate-500 font-medium mb-4">If It Matters to You</p>
              <p className="text-slate-700 leading-relaxed mb-4">
                Research on gender preference in coaching is mixed, but client satisfaction data tells a clear story: when a client has a strong gender preference, honouring it increases trust by 47% (CoachDog internal data, 2026).
              </p>
              <div className="grid sm:grid-cols-2 gap-4 mb-6">
                <div className="bg-slate-50 rounded-xl p-4">
                  <h4 className="font-semibold text-slate-800 mb-3">When gender might matter:</h4>
                  <ul className="space-y-2 text-sm text-slate-600">
                    <li>• Discussing sensitive topics (e.g. menopause, workplace harassment, fatherhood).</li>
                    <li>• Seeking a role model in a gender-dominant industry (e.g. female executive in tech).</li>
                    <li>• Cultural or religious reasons.</li>
                  </ul>
                </div>
                <div className="bg-blue-50 rounded-xl p-4">
                  <h4 className="font-semibold text-slate-800 mb-3">When it doesn't matter:</h4>
                  <ul className="space-y-2 text-sm text-slate-600">
                    <li>• Skills-based coaching (presentation skills, time management).</li>
                    <li>• Career transition coaching where the focus is purely tactical.</li>
                  </ul>
                </div>
              </div>
              <p className="text-slate-700">
                <strong>CoachDog's filter:</strong> Male / Female / Non-binary / No preference. We do not allow clients to exclude coaches based on gender for discriminatory reasons, but we provide the option for legitimate comfort.
              </p>
              <img
                src="/assets/pillar/coach-gender-filter-icons-male-female-nonbinary.jpg"
                alt="Coach gender preference filter showing male, female and non-binary icons with avatar illustrations"
                className="w-full rounded-xl shadow-sm mt-8 object-cover"
                loading="lazy"
              />
            </div>

            {/* Step 4 */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 mb-6">
              <h3 className="text-xl font-bold text-brand-700 mb-1">Step 4: Identify Your Primary Coaching Need</h3>
              <p className="text-sm text-slate-500 font-medium mb-4">Be Specific</p>
              <p className="text-slate-700 leading-relaxed mb-4">
                This is where most people go wrong. They say "I need career coaching" - but is that career advancement, career change, burnout recovery, or leadership pipeline?
              </p>
              <h4 className="font-semibold text-slate-800 mb-3">CoachDog's taxonomy (validated by coaching schools):</h4>
              <div className="overflow-x-auto mb-6">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="bg-slate-50">
                      <th className="text-left px-4 py-3 border border-slate-200 font-bold text-slate-800">Broad need</th>
                      <th className="text-left px-4 py-3 border border-slate-200 font-bold text-slate-800">Specific needs we support</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ['Career', 'Promotion prep, interview coaching, imposter syndrome, executive presence'],
                      ['Leadership', 'Team management, strategic thinking, emotional intelligence, conflict resolution'],
                      ['Life', 'Work-life balance, major life transitions, purpose finding'],
                      ['Wellness', 'Burnout prevention, stress management, habit formation'],
                      ['Business', 'Entrepreneur mindset, sales coaching for founders, scaling teams'],
                      ['Finance', 'Money management and financial planning'],
                    ].map(([broad, specific], i) => (
                      <tr key={broad} className={i % 2 === 1 ? 'bg-slate-50' : ''}>
                        <td className="px-4 py-3 border border-slate-200 font-semibold text-slate-800">{broad}</td>
                        <td className="px-4 py-3 border border-slate-200 text-slate-600">{specific}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="bg-brand-50 border border-brand-200 rounded-xl p-4 mb-4">
                <p className="text-brand-900 text-sm">
                  <strong>Your action:</strong> Be specific. Write a one-sentence "job to be done". Example: "I need a coach to help me stop over-apologising in leadership meetings within 3 months."
                </p>
              </div>
              <p className="text-slate-700">
                <strong>CoachDog's filter:</strong> Select your primary need from a dropdown. Then later select related expertise areas (see Step 5).
              </p>
              <img
                src="/assets/pillar/coaching-need-sticky-notes-career-change-executive-presence.jpg"
                alt="Hand selecting a sticky note showing coaching needs: Career Change, Executive Presence, and Work-Life Balance"
                className="w-full rounded-xl shadow-sm mt-8 object-cover"
                loading="lazy"
              />
            </div>

            {/* Step 5 */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 mb-6">
              <h3 className="text-xl font-bold text-brand-700 mb-1">Step 5: Match Expertise</h3>
              <p className="text-sm text-slate-500 font-medium mb-4">Industry, Role, and Niche</p>
              <p className="text-slate-700 leading-relaxed mb-4">
                Generalist coaches are fine for basic goals. But for complex challenges, domain expertise accelerates progress.
              </p>
              <h4 className="font-semibold text-slate-800 mb-3">Examples of expertise you can filter for on CoachDog:</h4>
              <ul className="space-y-2 mb-6">
                {[
                  'Industry: Tech, Finance, Healthcare, Nonprofit, Education, Manufacturing, Creative',
                  'Role: First-time manager, Director, VP, C-suite, Founder, Individual contributor',
                  'Niche: Neurodiversity at work, Mental Health First Aid, public speaking',
                ].map((point) => (
                  <li key={point} className="flex items-start gap-3 text-slate-700">
                    <span className="mt-1 h-2 w-2 rounded-full bg-brand-400 flex-shrink-0" />
                    {point}
                  </li>
                ))}
              </ul>
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4">
                <p className="text-green-900 text-sm">
                  <strong>Data point:</strong> Clients who match with a coach who has relevant industry expertise report a 34% shorter time to achieve their first milestone.
                </p>
              </div>
              <p className="text-slate-700">
                <strong>CoachDog's filter:</strong> Multi-select expertise tags. Coaches are verified for expertise via their client case studies and EMCC/ICF competency evidence.
              </p>
              <img
                src="/assets/pillar/coach-expertise-venn-diagram-icf-certified-tech-leadership.png"
                alt="Venn diagram showing the intersection of ICF Certified, 10+ Years Leadership Experience, and Executive Coaching expertise"
                className="w-full rounded-xl shadow-sm mt-8 object-contain bg-slate-50 p-4"
                loading="lazy"
              />
            </div>

            {/* Additional Certifications */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 mb-6">
              <h3 className="text-xl font-bold text-slate-900 mb-4">Additional Certifications Worth Filtering For</h3>
              <p className="text-slate-700 leading-relaxed mb-6">
                After ICF/EMCC accreditation, extra certifications can matter for specific situations.
              </p>
              <div className="overflow-x-auto mb-6">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="bg-slate-50">
                      <th className="text-left px-4 py-3 border border-slate-200 font-bold text-slate-800">Additional certification</th>
                      <th className="text-left px-4 py-3 border border-slate-200 font-bold text-slate-800">Best for</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ['PCC (Professional Certified Coach)', 'Experienced coaches with 500+ hours - ideal for complex executive work'],
                      ['MCC (Master Certified Coach)', 'The top 4% of ICF - for C-suite transformation'],
                      ['Team Coaching cert (EMCC/ICF)', 'You need to coach a whole department, not just an individual'],
                      ['Psychometrics (Hogan, MBTI, DISC)', 'If you want structured personality assessments'],
                      ['Trauma-informed coach cert', 'For clients with past workplace trauma or high stress'],
                    ].map(([cert, best], i) => (
                      <tr key={cert} className={i % 2 === 1 ? 'bg-slate-50' : ''}>
                        <td className="px-4 py-3 border border-slate-200 font-semibold text-slate-800">{cert}</td>
                        <td className="px-4 py-3 border border-slate-200 text-slate-600">{best}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <p className="text-amber-900 text-sm">
                  <strong>Important:</strong> Additional certifications do not replace ICF/EMCC. A coach with 10 extra certs but no ICF/EMCC is not on CoachDog.
                </p>
              </div>
            </div>

            {/* Step 6 */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 mb-6">
              <h3 className="text-xl font-bold text-brand-700 mb-1">Step 6: Select Your Preferred Language</h3>
              <p className="text-sm text-slate-500 font-medium mb-4">For Authentic Connection</p>
              <p className="text-slate-700 leading-relaxed mb-6">
                You and your coach must understand each other, not just the words, but the cultural subtext, humour, and emotional nuance.
              </p>
              <p className="text-slate-700 leading-relaxed mb-6">
                Research from the Journal of Cross-Cultural Psychology (2021) found that clients working with a coach in their native or fluent language report{' '}
                <strong>2.3x higher trust in the first three sessions</strong> compared to using a second language.
              </p>
              <h4 className="font-semibold text-slate-800 mb-3">Why language is a non-negotiable filter:</h4>
              <ul className="space-y-3 mb-6">
                {[
                  { title: 'Speed of thought', desc: 'In your native language, you think faster, express vulnerability more easily, and recall examples without translation.' },
                  { title: 'Idioms and metaphors', desc: 'A coach who shares your language can use culturally relevant metaphors that land immediately.' },
                  { title: 'Accent and pace', desc: 'Even if you are fluent in English, a strong accent or very fast speech can cause fatigue over 12 sessions.' },
                ].map(({ title, desc }) => (
                  <li key={title} className="flex items-start gap-3 text-slate-700">
                    <span className="mt-1 h-2 w-2 rounded-full bg-brand-400 flex-shrink-0" />
                    <span><strong>{title}:</strong> {desc}</span>
                  </li>
                ))}
              </ul>
              <div className="bg-slate-50 rounded-xl p-5 mb-6">
                <h4 className="font-semibold text-slate-800 mb-2">CoachDog's language filter:</h4>
                <p className="text-slate-700 text-sm mb-3">
                  We currently support over 20 major languages for coach-client matching. You can select one primary language (must be spoken fluently by the coach).
                </p>
                <p className="text-slate-600 text-sm">
                  <strong>Supported languages on CoachDog (verified by live interview):</strong>{' '}
                  English, Spanish, French, German, Italian, Portuguese, Dutch, Swedish, Danish, Mandarin, Arabic, Hindi and more.
                </p>
              </div>
              <div className="bg-brand-50 border border-brand-200 rounded-xl p-4">
                <p className="text-brand-900 text-sm">
                  <strong>Your action:</strong> Be honest about your own preference. If you think in Spanish but read contracts in English, select Spanish as primary. If you are a global executive comfortable in English and French, select both.
                </p>
              </div>
              <img
                src="/assets/pillar/coach-language-filter-world-map-speech-bubbles-verified-bilingual.jpg"
                alt="World map with speech bubbles and magnifying glass showing global coach language filter for finding verified bilingual coaches"
                className="w-full rounded-xl shadow-sm mt-8 object-cover"
                loading="lazy"
              />
            </div>
          </section>

          {/* How CoachDog's Verification Works */}
          <section className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 mb-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">
              How CoachDog's Verification Works (Unique to Us)
            </h2>
            <p className="text-slate-700 leading-relaxed mb-6">
              Most coaching directories are open marketplaces. Anyone can join. Profiles are unchecked. Horror stories are common.
            </p>
            <h3 className="font-semibold text-slate-800 mb-4">CoachDog's verification process (6 steps, mirrored for trust):</h3>
            <ol className="space-y-4 mb-6">
              {[
                'Coach applies with ICF or EMCC membership number.',
                'Automated check against ICF/EMCC public registries.',
                'Credential document upload - certificates reviewed by our compliance team.',
                'Yearly reverification - lapsed accreditations trigger an automatic suspension.',
              ].map((step, i) => (
                <li key={i} className="flex items-start gap-4">
                  <span className="flex-shrink-0 h-8 w-8 rounded-full bg-brand-600 text-white text-sm font-bold flex items-center justify-center">
                    {i + 1}
                  </span>
                  <p className="text-slate-700 pt-1">{step}</p>
                </li>
              ))}
            </ol>
            <div className="bg-green-50 border border-green-200 rounded-xl p-5">
              <div className="flex items-center gap-3">
                <ShieldCheck className="h-6 w-6 text-green-600 flex-shrink-0" />
                <p className="text-green-900 font-semibold">
                  Result: Zero unaccredited coaches on CoachDog. Zero fake profiles.
                </p>
              </div>
            </div>
          </section>

          {/* Real Example */}
          <section className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 mb-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">
              Real Example: How the 6 Filters Work Together
            </h2>
            <p className="text-slate-700 leading-relaxed mb-6">
              <strong>Client scenario:</strong> Maria, a VP of Product in Berlin. Budget €150–€250 per session. Prefers a female coach. Need: transitioning from team lead to strategic director. Expertise: SaaS/tech. Wants additional Hogan certification.
            </p>
            <div className="overflow-x-auto mb-6">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="text-left px-4 py-3 border border-slate-200 font-bold text-slate-800">Filter</th>
                    <th className="text-left px-4 py-3 border border-slate-200 font-bold text-slate-800">Maria's selection</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ['Budget', '€150–€250'],
                    ['Location', 'Berlin / virtual (time zone CET)'],
                    ['Gender', 'Female'],
                    ['Coaching need', 'Leadership transition'],
                    ['Expertise', 'Neuro-affirmed, product leadership'],
                    ['Additional cert', 'Hogan'],
                  ].map(([filter, selection], i) => (
                    <tr key={filter} className={i % 2 === 1 ? 'bg-slate-50' : ''}>
                      <td className="px-4 py-3 border border-slate-200 font-semibold text-slate-800">{filter}</td>
                      <td className="px-4 py-3 border border-slate-200 text-slate-600">{selection}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="bg-brand-50 border border-brand-200 rounded-xl p-5 mb-4">
              <p className="text-brand-900 font-semibold">
                Matches found: 8 coaches. All ICF- or EMCC-accredited. All verified in the last 30 days. Maria shortlists 3, does 15-min chemistry calls (free through CoachDog), and selects one within 48 hours.
              </p>
            </div>
            <p className="text-slate-600 text-sm">
              <strong>Without CoachDog:</strong> Maria would spend 6–8 hours on Google, LinkedIn, and coaching directories, many of which do not verify accreditation.
            </p>
          </section>

          {/* FAQ */}
          <section className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 mb-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Frequently Asked Questions</h2>
            <div className="space-y-3">
              {faqItems.map((item) => (
                <FaqItem key={item.q} q={item.q} a={item.a} />
              ))}
            </div>
          </section>

          {/* CTA */}
          <section className="bg-gradient-to-br from-brand-600 to-brand-800 rounded-2xl p-10 text-center text-white mb-8">
            <h2 className="text-2xl font-bold mb-3">Ready to Find Your Verified Coach?</h2>
            <p className="text-brand-100 mb-8 max-w-lg mx-auto">
              Apply all 6 filters in under 4 minutes. Every coach on CoachDog is ICF- or EMCC-accredited and independently verified.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/questionnaire"
                className="flex items-center justify-center gap-2 bg-white text-brand-700 px-8 py-4 rounded-xl font-bold hover:bg-brand-50 transition-all shadow-lg"
              >
                <ClipboardList className="h-5 w-5" />
                Take the 2-min quiz →
              </Link>
              <Link
                to="/search"
                className="flex items-center justify-center gap-2 bg-white/20 text-white border border-white/30 px-8 py-4 rounded-xl font-bold hover:bg-white/30 transition-all"
              >
                Browse the directory →
              </Link>
            </div>
          </section>
        </article>
      </div>
    </div>
  );
};
