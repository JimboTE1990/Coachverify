import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, HeartHandshake, ArrowRight, PawPrint, Mic, Award, Star, Link2, Users, HelpCircle, Briefcase } from 'lucide-react';
import { ProductReviewWidget } from '../components/ProductReviewWidget';

// ─── Horizontal rotary carousel section ──────────────────────────────────────

interface StackCard {
  cardCls:        string;
  iconCls?:       string;
  textCls:        string;
  mutedCls:       string;
  icon?:          React.ReactNode;   // lucide icon or <img> element
  imageSrc?:       string;            // optional card image shown at top
  imageContain?:   boolean;          // use object-contain instead of object-cover
  imageBg?:        string;           // bg class for contain-mode image area
  imageHeightPct?: number;           // % of card height the image takes (default 52)
  imagePosition?:  string;           // object-position value (default 'center')
  title:          string;
  body:           React.ReactNode;
}

const CarouselSection: React.FC<{
  id?:            string;
  sectionCls:     string;
  title:          string;
  subtitle?:      string;
  cards:          StackCard[];
  cardMaxWidth?:  string;
  cardMaxHeight?: string;
}> = ({ id, sectionCls, title, subtitle, cards, cardMaxWidth, cardMaxHeight }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);
  const n = cards.length;

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onScroll = () => {
      const rect = el.getBoundingClientRect();
      const scrollable = rect.height - window.innerHeight;
      if (scrollable <= 0) { setProgress(1); return; }
      setProgress(Math.max(0, Math.min(1, -rect.top / scrollable)));
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const currentPos  = progress * (n - 1);
  const activeIndex = Math.round(currentPos);

  const getTransform = (i: number): React.CSSProperties => {
    const rel    = i - currentPos;
    const absRel = Math.abs(rel);
    const tx      = rel * 88;
    const tz      = -absRel * 90;
    const rotY    = rel * -28;
    const rotZ    = rel * 4;
    const scale   = Math.max(0.72, 1 - absRel * 0.18);
    const opacity = Math.max(0.15, 1 - absRel * 0.65);
    return {
      transform: `perspective(1100px) translateX(${tx}%) translateZ(${tz}px) rotateY(${rotY}deg) rotateZ(${rotZ}deg) scale(${scale})`,
      opacity,
      zIndex: Math.round(10 - absRel * 4),
      pointerEvents: absRel < 0.4 ? 'auto' : 'none',
    };
  };

  return (
    <div ref={containerRef} id={id} style={{ height: `calc(100vh + ${(n - 1) * 70}vh)` }}>
      <div
        className={`${sectionCls}`}
        style={{ position: 'sticky', top: 0, height: '100vh', overflow: 'hidden' }}
      >
        <div className="flex flex-col items-center h-full px-4 pt-10 pb-6">

          {/* Heading */}
          <div className="text-center mb-6 flex-shrink-0">
            <h2 className="text-3xl font-display font-extrabold text-slate-900 sm:text-4xl">{title}</h2>
            {subtitle && <p className="mt-2 text-base text-slate-500 max-w-lg mx-auto">{subtitle}</p>}
          </div>

          {/* Carousel viewport */}
          <div className="relative flex-1 w-full min-h-0" style={{ maxWidth: cardMaxWidth ?? '620px', maxHeight: cardMaxHeight }}>
            {cards.map((card, i) => (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  inset: 0,
                  transformOrigin: 'center center',
                  willChange: 'transform, opacity',
                  ...getTransform(i),
                }}
                className={`rounded-3xl shadow-xl overflow-hidden flex flex-col ${card.cardCls}`}
              >
                {/* Image at top (when imageSrc provided) */}
                {card.imageSrc && (
                  card.imageContain ? (
                    // Natural proportions — fills full width, height flows from image
                    <img
                      src={card.imageSrc}
                      alt={card.title}
                      className={`w-full flex-shrink-0 object-contain ${card.imageBg ?? ''}`}
                      style={{ maxHeight: `${card.imageHeightPct ?? 55}%` }}
                    />
                  ) : (
                    // Fixed height with object-cover for photos
                    <div
                      className="w-full flex-shrink-0 overflow-hidden"
                      style={{ height: `${card.imageHeightPct ?? 52}%` }}
                    >
                      <img
                        src={card.imageSrc}
                        alt={card.title}
                        className="w-full h-full object-cover"
                        style={{ objectPosition: card.imagePosition ?? 'center' }}
                      />
                    </div>
                  )
                )}

                {/* Card content */}
                <div className={`flex flex-col items-center justify-center text-center flex-1 min-h-0 ${card.imageSrc ? 'px-7 py-5' : 'px-8 py-10'}`}>
                  {/* Icon circle (only when no photo) */}
                  {!card.imageSrc && card.icon && (
                    <div className={`h-16 w-16 rounded-2xl flex items-center justify-center shadow-md mb-5 ${card.iconCls ?? ''}`}>
                      {card.icon}
                    </div>
                  )}
                  <h3 className={`text-2xl font-bold mb-3 ${card.textCls}`}>{card.title}</h3>
                  <div className={`text-base leading-relaxed max-w-sm ${card.mutedCls}`}>{card.body}</div>
                  <span className={`mt-3 text-xs font-medium tabular-nums opacity-30 ${card.textCls}`}>
                    {i + 1} / {n}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Dots */}
          <div className="flex gap-2 mt-5 flex-shrink-0">
            {cards.map((_, i) => (
              <div
                key={i}
                className={`rounded-full transition-all duration-300 ${
                  i === activeIndex ? 'w-6 h-2 bg-brand-500' : 'w-2 h-2 bg-slate-300'
                }`}
              />
            ))}
          </div>

        </div>
      </div>
    </div>
  );
};

// ─── Home page ────────────────────────────────────────────────────────────────

export const Home: React.FC = () => {
  const navigate  = useNavigate();
  const [homeNlQuery, setHomeNlQuery] = useState('');
  const [isListening,  setIsListening]  = useState(false);
  const [voiceStatus,  setVoiceStatus]  = useState<'idle' | 'listening' | 'error'>('idle');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [activeReasonCard, setActiveReasonCard] = useState<number | null>(null);

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as any;
    setSpeechSupported(!!(w.SpeechRecognition || w.webkitSpeechRecognition));
  }, []);

  const handleVoiceSearch = () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w  = window as any;
    const SR = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!SR) return;
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      setVoiceStatus('idle');
      return;
    }
    try {
      const recognition = new SR();
      recognition.continuous     = false;
      recognition.interimResults = true;
      recognition.lang           = navigator.language || 'en-GB';
      recognition.onstart  = () => { setIsListening(true); setVoiceStatus('listening'); };
      recognition.onresult = (event: any) => {
        let interim = '', final = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const t = event.results[i][0].transcript;
          if (event.results[i].isFinal) final += t; else interim += t;
        }
        setHomeNlQuery(final || interim);
        if (final) { setIsListening(false); setVoiceStatus('idle'); }
      };
      recognition.onerror = () => {
        setIsListening(false);
        setVoiceStatus('error');
        setTimeout(() => setVoiceStatus('idle'), 2000);
      };
      recognition.onend = () => { setIsListening(false); setVoiceStatus('idle'); };
      recognitionRef.current = recognition;
      recognition.start();
    } catch {
      setVoiceStatus('error');
      setTimeout(() => setVoiceStatus('idle'), 2000);
    }
  };

  const handleHomeNlSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = homeNlQuery.trim();
    if (!q) return;
    navigate(`/search?nlQuery=${encodeURIComponent(q)}`);
  };

  return (
    <div className="flex flex-col">

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <div className="relative bg-gradient-to-br from-brand-50 via-indigo-50 to-purple-50 overflow-hidden">
        <img src="/coachdog-website-banner.png" alt="CoachDog" className="w-full object-cover block" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center z-10 pt-8 pb-16 lg:pb-20">

          {/* Updated subtitle */}
          <p className="mx-auto text-base font-bold text-slate-800 sm:text-lg md:text-xl sm:whitespace-nowrap">
            Find a life, career or executive coach you can trust, from the very first click.
          </p>
          <p className="mx-auto mt-2 text-base text-slate-600 sm:text-lg md:text-xl sm:whitespace-nowrap">
            Every coach is verified and accredited, so you're always barking up the right tree.
          </p>

          {/* Smart search */}
          <div className="mt-8 max-w-2xl mx-auto">
            <p className="text-base font-semibold text-slate-700 mb-3">
              In your own words, describe what type of coaching you are looking for?{' '}
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 align-middle">Beta</span>
            </p>
            <form onSubmit={handleHomeNlSearch}>
              <div className="flex items-center bg-white rounded-full shadow-2xl border-2 border-brand-200 focus-within:border-brand-500 transition-colors duration-200 px-3 sm:px-5 py-3 sm:py-4 gap-2 sm:gap-4">
                <PawPrint className="h-5 w-5 sm:h-6 sm:w-6 text-brand-500 flex-shrink-0" />
                <input
                  type="text"
                  className="flex-grow min-w-0 bg-transparent focus:outline-none text-slate-800 placeholder-slate-400 text-sm sm:text-base"
                  placeholder="e.g. Business coaching, support with a relationship…"
                  value={homeNlQuery}
                  onChange={e => setHomeNlQuery(e.target.value)}
                />
                {speechSupported && (
                  <button
                    type="button"
                    onClick={handleVoiceSearch}
                    title={isListening ? 'Stop listening' : 'Search by voice'}
                    className={`flex-shrink-0 flex items-center justify-center w-9 h-9 rounded-full transition-all duration-150 ${
                      isListening ? 'bg-red-100 text-red-500 animate-pulse' : 'text-slate-400 hover:text-brand-600 hover:bg-brand-50'
                    }`}
                  >
                    <Mic className="h-4 w-4" />
                  </button>
                )}
                <button
                  type="submit"
                  className="flex-shrink-0 bg-brand-600 hover:bg-brand-700 active:scale-95 text-white font-semibold px-3 sm:px-6 py-2 sm:py-2.5 rounded-full transition-all duration-150 shadow-md flex items-center gap-1"
                >
                  <span className="hidden sm:inline">Find Coaches</span>
                  <ArrowRight className="h-5 w-5 sm:hidden" />
                </button>
              </div>
            </form>
            {voiceStatus === 'listening' && (
              <p className="mt-2 text-xs text-center text-brand-600 animate-pulse">Listening… speak now</p>
            )}
            {voiceStatus === 'error' && (
              <p className="mt-2 text-xs text-center text-red-500">Couldn't hear anything — check microphone permissions</p>
            )}
          </div>

          {/* Divider */}
          <div className="mt-6 flex items-center gap-4 max-w-sm mx-auto">
            <div className="flex-1 h-px bg-slate-200" />
            <span className="text-xs text-slate-400 font-medium tracking-wide uppercase">or</span>
            <div className="flex-1 h-px bg-slate-200" />
          </div>

          {/* CTAs */}
          <div className="mt-5 max-w-lg mx-auto grid gap-4 sm:grid-cols-2">
            <Link to="/questionnaire" className="group flex flex-col items-center justify-center p-6 bg-white rounded-2xl shadow-xl border-2 border-transparent hover:border-brand-500 transition-all duration-300 transform hover:-translate-y-1">
              <div className="h-12 w-12 bg-brand-100 text-brand-600 rounded-full flex items-center justify-center mb-4 group-hover:bg-brand-600 group-hover:text-white transition-colors">
                <HeartHandshake className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-display font-bold text-slate-900">Fetch Your Coach</h3>
              <p className="text-sm text-slate-500 mt-2 text-center">Take a short quiz to get paired with your ideal coach.</p>
              <div className="mt-4 text-brand-600 font-semibold flex items-center text-sm">
                Start Questionnaire <ArrowRight className="ml-1 h-4 w-4" />
              </div>
            </Link>
            <Link to="/search" className="group flex flex-col items-center justify-center p-6 bg-white rounded-2xl shadow-xl border-2 border-transparent hover:border-slate-300 transition-all duration-300 transform hover:-translate-y-1">
              <div className="h-12 w-12 bg-slate-100 text-slate-600 rounded-full flex items-center justify-center mb-4 group-hover:bg-slate-800 group-hover:text-white transition-colors">
                <Search className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-display font-bold text-slate-900">Do Some Digging</h3>
              <p className="text-sm text-slate-500 mt-2 text-center">Browse our directory by name, specialty, or location.</p>
              <div className="mt-4 text-slate-700 font-semibold flex items-center text-sm">
                Browse Coaches <ArrowRight className="ml-1 h-4 w-4" />
              </div>
            </Link>
          </div>
        </div>

        <div className="absolute top-0 left-1/2 w-full -translate-x-1/2 h-full z-0 opacity-30 pointer-events-none">
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full bg-brand-200 blur-3xl animate-blob" />
          <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-indigo-200 blur-3xl animate-blob" style={{ animationDelay: '2s' }} />
        </div>
      </div>

      {/* ── What is CoachDog? — with photo cards ─────────────────────────── */}
      <CarouselSection
        sectionCls="bg-white"
        title="What is CoachDog?"
        cards={[
          {
            cardCls:  'bg-white border-2 border-slate-100',
            textCls:  'text-slate-900',
            mutedCls: 'text-slate-600',
            imageSrc: '/original-coachdog.jpg',
            title:    'The Original Coach Dog',
            body:     'Historically, coach dogs ran alongside or under horse-drawn carriages to guard the horses and carriage from thieves or other animals.',
          },
          {
            cardCls:        'bg-gradient-to-br from-brand-50 via-indigo-50 to-purple-50 border-2 border-brand-100',
            textCls:        'text-slate-900',
            mutedCls:       'text-slate-600',
            imageSrc:       '/coachdog-now.jpg',
            imageHeightPct: 52,
            imagePosition:  'center 35%',
            title:    'We Run Alongside You',
            body:     "CoachDog runs alongside you and your goals - guarding you from fraudulent coaches and unverified scams. You deserve to know exactly who you're working with.",
          },
          {
            cardCls:  'bg-gradient-to-br from-slate-800 to-brand-900',
            textCls:  'text-white',
            mutedCls: 'text-white/75',
            imageSrc: '/verified-platform.jpg',
            title:    'The Premier Verified Platform',
            body:     (
              <>
                <p>CoachDog connects you with accredited professionals to help you achieve your personal and professional goals.</p>
                <Link
                  to="/how-to-find-a-certified-verified-coach"
                  className="inline-flex items-center gap-1 mt-3 text-sm font-semibold text-white underline underline-offset-2 hover:text-white/80"
                >
                  How to Find a Certified Coach <ArrowRight className="h-4 w-4" />
                </Link>
              </>
            ),
          },
        ]}
      />

      {/* ── Why Use CoachDog? — with icon images ─────────────────────────── */}
      <CarouselSection
        id="why-use-coachdog"
        sectionCls="bg-slate-50"
        title="Why Use CoachDog?"
        subtitle="Simple, trustworthy, effective."
        cardMaxWidth="480px"
        cardMaxHeight="55vh"
        cards={[
          {
            cardCls:        'bg-gradient-to-br from-trust-50 to-green-50 border-2 border-trust-100',
            textCls:        'text-slate-900',
            mutedCls:       'text-slate-600',
            imageSrc:       '/verified-professionals-icon.png',
            imageContain:   true,
            imageBg:        'bg-white/60',
            imageHeightPct: 30,
            title:    'Verified Professionals',
            body:     "Every coach is vetted for certifications and experience. We verify EMCC and ICF credentials to ensure you're working with qualified professionals.",
          },
          {
            cardCls:        'bg-gradient-to-br from-brand-50 to-indigo-50 border-2 border-brand-100',
            textCls:        'text-slate-900',
            mutedCls:       'text-slate-600',
            imageSrc:       '/trusted-reviews-icon.png',
            imageContain:   true,
            imageBg:        'bg-white/60',
            imageHeightPct: 30,
            title:    'Trusted Reviews',
            body:     'Transparent feedback from verified clients. Read honest reviews and ratings to make informed decisions about your coaching journey.',
          },
          {
            cardCls:        'bg-gradient-to-br from-indigo-50 to-purple-50 border-2 border-indigo-100',
            textCls:        'text-slate-900',
            mutedCls:       'text-slate-600',
            imageSrc:       '/perfect-fit-icon-two-tone.png',
            imageContain:   true,
            imageBg:        'bg-white/60',
            imageHeightPct: 30,
            title:    'Perfect Fit',
            body:     'Our smart matching algorithm considers your goals, preferences, and coaching style to find coaches who truly align with your needs.',
          },
        ]}
      />

      {/* ── Are you an accredited coach? ─────────────────────────────────── */}
      <div className="bg-white py-16 lg:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Heading */}
          <div className="text-center mb-12">
            <p className="text-xs font-bold uppercase tracking-widest text-brand-500 mb-2">What sets CoachDog apart</p>
            <h2 className="text-3xl font-display font-extrabold text-slate-900 sm:text-4xl">
              Are you an accredited coach?
            </h2>
            <p className="mt-3 text-lg text-slate-500 max-w-2xl mx-auto">
              Six reasons why verified coaches choose CoachDog to build their practice.
            </p>
          </div>

          {/* 6-reason grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { icon: <Award    className="h-5 w-5" />, title: 'Verified accreditation', body: 'EMCC, ICF and AC credentials shown clearly on your profile.' },
              { icon: <Star     className="h-5 w-5" />, title: 'Transparent ratings',    body: 'Open client feedback, so good work speaks for itself.' },
              { icon: <Link2    className="h-5 w-5" />, title: 'A personal link',        body: 'coachdog.co.uk/yourname - ready to share anywhere.' },
              { icon: <Users    className="h-5 w-5" />, title: 'Collaboration space',    body: 'Post projects and invite other coaches in.' },
              { icon: <HelpCircle className="h-5 w-5" />, title: 'Client Q&A',           body: 'Show your expertise before anyone books a call.' },
              { icon: <Briefcase  className="h-5 w-5" />, title: 'Business tools',       body: 'Marketing and strategy tools from Coaching Minds.' },
            ].map((reason, i) => {
              const active = activeReasonCard === i;
              return (
                <div
                  key={i}
                  onClick={() => setActiveReasonCard(active ? null : i)}
                  className={`relative rounded-2xl p-6 cursor-pointer select-none transition-all duration-300 ease-out
                    hover:-translate-y-2 hover:scale-[1.03] hover:shadow-xl
                    ${active
                      ? 'bg-slate-900 border border-slate-900 shadow-lg'
                      : 'bg-white border border-slate-200 shadow-sm hover:border-brand-200'
                    }`}
                >
                  <div className={`inline-flex h-10 w-10 items-center justify-center rounded-xl mb-4 transition-colors duration-300
                    ${active ? 'bg-teal-900 text-teal-300' : 'bg-teal-50 text-teal-600'}`}>
                    {reason.icon}
                  </div>
                  <h3 className={`text-base font-bold mb-1.5 transition-colors duration-300 ${active ? 'text-white' : 'text-slate-900'}`}>
                    {reason.title}
                  </h3>
                  <p className={`text-sm leading-relaxed transition-colors duration-300 ${active ? 'text-slate-400' : 'text-slate-500'}`}>
                    {reason.body}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Founder 100 CTA */}
          <div className="mt-12 text-center">
            <p className="text-sm text-slate-500 mb-4">Founding places are limited - secure yours before they're gone.</p>
            <Link
              to="/checkout/lifetime"
              className="inline-flex items-center gap-2 bg-yellow-400 hover:bg-yellow-300 text-[#111c32] font-bold px-8 py-4 rounded-full shadow-lg transition-all duration-200 hover:shadow-xl hover:-translate-y-0.5 text-base"
            >
              Become a Founder 100 <ArrowRight className="h-5 w-5" />
            </Link>
          </div>

        </div>
      </div>

      {/* ── Partners ──────────────────────────────────────────────────────── */}
      <div className="bg-white border-t border-slate-100 py-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-slate-500 text-sm font-semibold uppercase tracking-widest mb-8">
            Our Partners &amp; Associated Organisations
          </p>
          <div className="flex flex-wrap items-center justify-center gap-10 md:gap-16">
            <a href="https://www.emccglobal.org" target="_blank" rel="noopener noreferrer" className="opacity-70 hover:opacity-100 transition-opacity">
              <img src="/assets/emcc-logo.png" alt="EMCC Global" className="h-12 w-auto object-contain" />
            </a>
            <a href="https://coachingfederation.org" target="_blank" rel="noopener noreferrer" className="opacity-70 hover:opacity-100 transition-opacity">
              <img src="/assets/icf-logo.png" alt="ICF International Coaching Federation" className="h-12 w-auto object-contain" />
            </a>
            <a href="https://coachingmindsglobal.com" target="_blank" rel="noopener noreferrer" className="opacity-70 hover:opacity-100 transition-opacity">
              <img src="/assets/cm-logo-3.png" alt="Coaching Minds" className="h-12 w-auto object-contain" />
            </a>
            <a href="https://www.associationforcoaching.com" target="_blank" rel="noopener noreferrer" className="opacity-70 hover:opacity-100 transition-opacity">
              <img src="/assets/ac-logo.png" alt="Association for Coaching" className="h-12 w-auto object-contain" />
            </a>
          </div>
        </div>
      </div>

      <ProductReviewWidget />
    </div>
  );
};
