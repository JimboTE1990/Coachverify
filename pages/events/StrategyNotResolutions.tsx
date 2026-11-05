import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  CheckCircle, Calendar, Clock, Monitor, ChevronDown, ChevronUp, ArrowRight,
  FileText, Eye, Zap, PlayCircle, Users, TrendingUp, Compass, Briefcase, X,
} from 'lucide-react';
import { registerForEvent } from '../../services/supabaseService';

const CAMPAIGN_ID = 'strategy-not-resolutions-jan-2027';

// ── Scroll-reveal hook ─────────────────────────────────────────────────────────

const useScrollReveal = (threshold = 0.12) => {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setVisible(true); obs.disconnect(); }
    }, { threshold });
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, visible };
};

// ── Register interest form — collects name + email, checkout comes later ──────

const RegisterForm: React.FC<{ source: string; dark?: boolean }> = ({ source, dark = false }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;
    setLoading(true);
    await registerForEvent(name.trim(), email.trim(), CAMPAIGN_ID, source);
    setLoading(false);
    setSubmitted(true);
  };

  const inputCls = dark
    ? 'w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-yellow-400 text-sm'
    : 'w-full px-4 py-3 rounded-xl bg-white border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm';

  if (submitted) {
    return (
      <div className={`rounded-2xl p-6 text-center ${dark ? 'bg-white/10 border border-white/20' : 'bg-brand-50 border border-brand-100'}`}>
        <CheckCircle className={`h-8 w-8 mx-auto mb-3 ${dark ? 'text-yellow-400' : 'text-brand-600'}`} />
        <p className={`font-bold text-base mb-1 ${dark ? 'text-white' : 'text-slate-900'}`}>Thanks for registering your interest!</p>
        <p className={`text-sm ${dark ? 'text-white/70' : 'text-slate-500'}`}>
          We'll be in touch with booking details as soon as they're ready.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <input type="text" required placeholder="Your name" value={name}
        onChange={e => setName(e.target.value)} className={inputCls} />
      <input type="email" required placeholder="Your email address" value={email}
        onChange={e => setEmail(e.target.value)} className={inputCls} />
      <button type="submit" disabled={loading}
        className="w-full flex items-center justify-center gap-2 bg-yellow-400 hover:bg-yellow-300 text-[#111c32] font-bold px-6 py-3.5 rounded-xl shadow-lg transition-all hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed text-sm">
        {loading ? 'Registering…' : <>Register Interest <ArrowRight className="h-4 w-4" /></>}
      </button>
    </form>
  );
};

// ── FAQ accordion ──────────────────────────────────────────────────────────────

const FaqItem: React.FC<{ q: string; a: string }> = ({ q, a }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-slate-200 rounded-2xl overflow-hidden">
      <button onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-slate-50 transition-colors">
        <span className="font-semibold text-slate-800 text-sm pr-4">{q}</span>
        {open ? <ChevronUp className="h-4 w-4 text-slate-400 flex-shrink-0" /> : <ChevronDown className="h-4 w-4 text-slate-400 flex-shrink-0" />}
      </button>
      {open && <div className="px-6 pb-5 text-sm text-slate-600 leading-relaxed border-t border-slate-100">{a}</div>}
    </div>
  );
};

// ── Sticky-scroll carousel (same mechanism as homepage) ───────────────────────

type TakeawayCard = {
  icon: React.ElementType;
  num: string;
  title: string;
  text: string;
  gradient: string;   // inline style gradient
  iconBg: string;     // tw class
  iconColor: string;  // tw class
};

const TakeawayCarousel: React.FC<{ cards: TakeawayCard[] }> = ({ cards }) => {
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

  const currentPos = progress * (n - 1);

  const getTransform = (i: number): React.CSSProperties => {
    const rel    = i - currentPos;
    const absRel = Math.abs(rel);
    const tx     = rel * 88;
    const tz     = -absRel * 90;
    const rotY   = rel * -28;
    const rotZ   = rel * 4;
    const scale  = Math.max(0.72, 1 - absRel * 0.18);
    const opacity = Math.max(0.15, 1 - absRel * 0.65);
    return {
      transform: `perspective(1100px) translateX(${tx}%) translateZ(${tz}px) rotateY(${rotY}deg) rotateZ(${rotZ}deg) scale(${scale})`,
      opacity,
      zIndex: Math.round(10 - absRel * 4),
      pointerEvents: absRel < 0.4 ? 'auto' : 'none',
    };
  };

  const activeIndex = Math.round(currentPos);

  return (
    // Outer container — tall enough to provide scroll travel
    <div ref={containerRef} style={{ height: `calc(100vh + ${(n - 1) * 40}vh)` }}>
      <div style={{ position: 'sticky', top: 0, height: 560, overflow: 'hidden' }}
        className="flex flex-col items-center justify-start bg-white">
        {/* Section header */}
        <div className="text-center pt-16 pb-6 flex-shrink-0 px-4">
          <span className="text-xs font-bold uppercase tracking-widest text-brand-500 mb-3 block">What you'll take away</span>
          <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-slate-900">You'll leave with</h2>
        </div>

        {/* Card viewport */}
        <div className="relative flex-1 w-full min-h-0 mx-auto" style={{ maxWidth: 340, maxHeight: 340 }}>
          {cards.map((card, i) => {
            const { icon: Icon, num, title, text, gradient, iconBg, iconColor } = card;
            return (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  inset: '8px 12px',
                  transformOrigin: 'center center',
                  willChange: 'transform, opacity',
                  ...getTransform(i),
                }}
                className="rounded-2xl shadow-xl overflow-hidden flex flex-col"
              >
                {/* Coloured gradient top band */}
                <div className="flex-shrink-0 flex items-end px-5 pt-5 pb-4" style={{ background: gradient, minHeight: 88 }}>
                  <div className="flex items-center gap-3">
                    <div className={`flex-shrink-0 h-9 w-9 flex items-center justify-center rounded-xl ${iconBg}`}>
                      <Icon className={`h-4 w-4 ${iconColor}`} />
                    </div>
                    <span className="font-display font-extrabold text-white/25 text-5xl leading-none select-none">{num}</span>
                  </div>
                </div>
                {/* White content area */}
                <div className="flex-1 bg-white px-5 py-4 flex flex-col justify-center">
                  <p className="font-display font-extrabold text-base text-slate-900 mb-1.5 leading-snug">{title}</p>
                  <p className="text-slate-500 text-xs leading-relaxed">{text}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Dot indicators */}
        <div className="flex-shrink-0 flex gap-2 pb-8 pt-2">
          {cards.map((_, i) => (
            <div key={i}
              className={`rounded-full transition-all duration-300 ${i === activeIndex ? 'w-5 h-2 bg-brand-600' : 'w-2 h-2 bg-slate-300'}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

// ── Page ───────────────────────────────────────────────────────────────────────

const StrategyNotResolutions: React.FC = () => {
  const [activePersona, setActivePersona] = useState<number | null>(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const ticketIncludes = useScrollReveal();

  const personas = [
    { icon: Users, label: 'Building a client base', text: 'An accredited or training coach who wants a steadier flow of the right clients' },
    { icon: TrendingUp, label: 'Tired of stalling plans', text: 'Tired of plans that start strong in January and stall by spring' },
    { icon: Compass, label: 'Unsure where to focus', text: 'Unsure where to focus your marketing time and energy' },
    { icon: Briefcase, label: 'Practice as a business', text: 'Ready to treat your coaching practice like the business it is' },
  ];

  const takeaways: TakeawayCard[] = [
    {
      icon: FileText, num: '01',
      title: 'Your one-page strategy',
      text: 'A clear, practical plan for your coaching practice in 2027 - built live during the session, not at home on your own afterwards.',
      gradient: 'linear-gradient(135deg, #0d9488 0%, #0891b2 100%)',
      iconBg: 'bg-white/20', iconColor: 'text-white',
    },
    {
      icon: Eye, num: '02',
      title: 'Clarity on who you serve',
      text: 'Know exactly who you help best, and how to describe it in a single sentence clients actually respond to.',
      gradient: 'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)',
      iconBg: 'bg-white/20', iconColor: 'text-white',
    },
    {
      icon: Compass, num: '03',
      title: 'A simple visibility plan',
      text: 'A practical approach to being found by the right clients - without burning out on content or chasing every platform.',
      gradient: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
      iconBg: 'bg-white/20', iconColor: 'text-white',
    },
    {
      icon: Zap, num: '04',
      title: 'Your first three actions',
      text: 'Not a long to-do list - just the three specific things to do first, so you can start the next morning.',
      gradient: 'linear-gradient(135deg, #d97706 0%, #f59e0b 100%)',
      iconBg: 'bg-white/20', iconColor: 'text-white',
    },
    {
      icon: PlayCircle, num: '05',
      title: 'The workbook and replay',
      text: 'Everything from the session to keep: the workbook to revisit, and the full replay to watch again whenever you need it.',
      gradient: 'linear-gradient(135deg, #2563eb 0%, #6366f1 100%)',
      iconBg: 'bg-white/20', iconColor: 'text-white',
    },
  ];

  const ticketItems = [
    { icon: Monitor, text: 'The full two-hour live workshop on Zoom' },
    { icon: FileText, text: 'The Strategy, Not Resolutions workbook' },
    { icon: PlayCircle, text: "The replay, so you can watch again or catch up if you can't make it live" },
    { icon: CheckCircle, text: 'An attendee-only CoachDog offer, with your £19 credited against membership if you join within 72 hours' },
  ];

  return (
    <div className="bg-slate-50 min-h-screen">

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden" style={{ background: '#111c32' }}>
        <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full opacity-10" style={{ background: '#0d9488', filter: 'blur(80px)' }} />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 rounded-full opacity-10" style={{ background: '#6366f1', filter: 'blur(80px)' }} />
        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 pt-20 pb-16 text-center z-10">
          <span className="inline-flex items-center bg-white/10 border border-white/20 text-white/90 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest mb-6">
            Live online workshop for coaches
          </span>
          <h1 className="font-display font-extrabold text-4xl sm:text-5xl text-white tracking-tight mb-5 leading-tight">
            Strategy, not resolutions.
          </h1>
          <p className="text-white/80 text-lg sm:text-xl leading-relaxed mb-8 max-w-2xl mx-auto">
            In two focused hours, build a clear, practical strategy for your coaching practice in 2027, so this is the year the right clients find you.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 mb-10 text-sm text-white/70">
            <span className="flex items-center gap-1.5"><Calendar className="h-4 w-4 text-yellow-400" /> Wednesday 13 January 2027</span>
            <span className="flex items-center gap-1.5"><Clock className="h-4 w-4 text-yellow-400" /> 7–9pm UK time</span>
            <span className="flex items-center gap-1.5"><Monitor className="h-4 w-4 text-yellow-400" /> Live on Zoom, replay included</span>
          </div>
          <div className="max-w-sm mx-auto">
            <RegisterForm source="hero" dark />
            <p className="mt-3 text-xs text-white/50 leading-relaxed">
              An interactive, hands-on workshop. Your £19 comes off CoachDog membership if you join within 72 hours of the event.
            </p>
          </div>
        </div>
      </div>

      {/* ── Why this workshop ─────────────────────────────────────────────── */}
      <div className="bg-white py-10 lg:py-12">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <span className="text-xs font-bold uppercase tracking-widest text-brand-500 mb-3 block">Why this workshop</span>
          <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-slate-900 mb-6 leading-tight">
            Resolutions tell you what. Strategy tells you how.
          </h2>
          <div className="space-y-4 text-slate-600 leading-relaxed">
            <p>Every January, coaches set resolutions: more clients, more visibility, more income. By February, most have quietly faded.</p>
            <p>The problem isn't ambition. It's that a resolution tells you what you want, never how you'll get it. A strategy does both: who you serve, how they find you, what you offer, and the few actions that matter most.</p>
            <p>In this workshop, you won't just hear about strategy. You'll build yours, live, with guidance and other coaches alongside you.</p>
          </div>
        </div>
      </div>

      {/* ── Is this for you ───────────────────────────────────────────────── */}
      <div className="bg-slate-50 py-10 lg:py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <span className="text-xs font-bold uppercase tracking-widest text-brand-500 mb-3 block">This is for you if you're…</span>
            <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-slate-900">Sound familiar?</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {personas.map(({ icon: Icon, label, text }, i) => {
              const active = activePersona === i;
              return (
                <button key={i} onClick={() => setActivePersona(active ? null : i)}
                  className={`text-left rounded-2xl p-5 border transition-all duration-300 cursor-pointer ${
                    active
                      ? 'bg-slate-900 border-slate-900 shadow-xl scale-[1.02]'
                      : 'bg-white border-slate-200 shadow-sm hover:border-brand-300 hover:shadow-md hover:-translate-y-1'
                  }`}>
                  <div className={`inline-flex h-10 w-10 items-center justify-center rounded-xl mb-3 transition-colors ${active ? 'bg-yellow-400/20' : 'bg-brand-50'}`}>
                    <Icon className={`h-5 w-5 ${active ? 'text-yellow-400' : 'text-brand-600'}`} />
                  </div>
                  <p className={`font-bold text-sm mb-1 ${active ? 'text-yellow-400' : 'text-slate-700'}`}>{label}</p>
                  <p className={`text-sm leading-relaxed ${active ? 'text-white/80' : 'text-slate-500'}`}>{text}</p>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── You'll leave with — sticky-scroll carousel ────────────────────── */}
      <TakeawayCarousel cards={takeaways} />

      {/* ── Schedule ──────────────────────────────────────────────────────── */}
      <div className="bg-slate-50 py-10 lg:py-12">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <span className="text-xs font-bold uppercase tracking-widest text-brand-500 mb-3 block">The session</span>
            <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-slate-900">What we'll cover</h2>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left py-3 px-5 font-semibold text-slate-500 text-xs uppercase tracking-wide whitespace-nowrap">Time</th>
                    <th className="text-left py-3 px-5 font-semibold text-slate-500 text-xs uppercase tracking-wide">Session</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ['7:00pm', 'Why resolutions fail coaches, and what to do instead'],
                    ['7:10pm', 'Strategy vs goals: a simple framework for your practice'],
                    ['7:35pm', 'Build your strategy: guided workbook time, plus pair work in breakout rooms'],
                    ['8:15pm', 'Make it visible: how the right clients will find you in 2027'],
                    ['8:35pm', 'Live Q&A: bring your questions'],
                    ['8:50pm', 'Your next step, and an attendee-only offer from CoachDog'],
                  ].map(([time, session], i) => (
                    <tr key={i} className="border-b border-slate-50 last:border-0">
                      <td className="py-3.5 px-5 font-semibold text-brand-600 whitespace-nowrap">{time}</td>
                      <td className="py-3.5 px-5 text-slate-700">{session}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <p className="mt-4 text-xs text-slate-400 text-center">Bring a notebook, or have the workbook open. Cameras on is encouraged but never required.</p>
        </div>
      </div>

      {/* ── Host ──────────────────────────────────────────────────────────── */}
      <div className="bg-white py-10 lg:py-12">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <span className="text-xs font-bold uppercase tracking-widest text-brand-500 mb-8 block">Your host</span>
          <div className="flex flex-col sm:flex-row gap-8 items-start">
            <div className="flex-shrink-0">
              <button
                onClick={() => setLightboxOpen(true)}
                className="group relative block rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 cursor-zoom-in bg-slate-100"
                style={{ width: 148 }}
                aria-label="View photo of Paul Smith"
              >
                <img
                  src="/events/paul-smith.png"
                  alt="Paul Smith"
                  className="w-full object-contain"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/15 transition-colors duration-300 flex items-end justify-center pb-2 opacity-0 group-hover:opacity-100">
                  <span className="text-white text-xs font-semibold bg-black/50 px-2 py-0.5 rounded-full">View</span>
                </div>
              </button>
            </div>
            <div className="flex-1">
              <h2 className="font-display font-extrabold text-2xl sm:text-3xl text-slate-900 mb-1">Paul Smith</h2>
              <p className="text-slate-500 text-sm font-medium mb-4">Managing Director, Coaching Minds</p>
              <p className="text-slate-600 text-sm leading-relaxed">
                Paul leads Coaching Minds, an EMCC accredited coaching academy that trains coaches through its Level 5 programme. He works with coaches every day on the part of the job that training rarely covers: building a practice that lasts.
              </p>
            </div>
          </div>
          <div className="mt-8 pt-6 border-t border-slate-100">
            <p className="text-sm text-slate-500">
              Delivered in partnership with{' '}
              <span className="font-semibold text-slate-700">Coaching Minds</span>
              {' '}and{' '}
              <Link to="/" className="font-semibold text-brand-600 hover:underline">CoachDog</Link>
              {' '}- the directory where every coach is verified against their EMCC, ICF or AC accreditation.
            </p>
          </div>
        </div>
      </div>

      {/* ── Lightbox ──────────────────────────────────────────────────────── */}
      {lightboxOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={() => setLightboxOpen(false)}>
          <div className="relative max-w-xs w-full mx-4" onClick={e => e.stopPropagation()}>
            <button onClick={() => setLightboxOpen(false)}
              className="absolute -top-3 -right-3 z-10 h-8 w-8 flex items-center justify-center rounded-full bg-white shadow-lg hover:bg-slate-100 transition-colors"
              aria-label="Close">
              <X className="h-4 w-4 text-slate-700" />
            </button>
            <img src="/events/paul-smith.png" alt="Paul Smith" className="w-full rounded-2xl shadow-2xl" />
            <p className="mt-3 text-center text-white/70 text-sm font-medium">Paul Smith - Managing Director, Coaching Minds</p>
          </div>
        </div>
      )}

      {/* ── Ticket includes ───────────────────────────────────────────────── */}
      <div className="bg-slate-50 py-10 lg:py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <span className="text-xs font-bold uppercase tracking-widest text-brand-500 mb-3 block">What's included</span>
            <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-slate-900">Your ticket includes</h2>
          </div>
          <div ref={ticketIncludes.ref} className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
            {ticketItems.map(({ icon: Icon, text }, i) => (
              <div key={i}
                className="group flex items-start gap-4 bg-white rounded-2xl p-5 border border-slate-200 shadow-sm cursor-default transition-all duration-300 hover:-translate-y-2 hover:shadow-xl hover:border-brand-200"
                style={{
                  opacity: ticketIncludes.visible ? 1 : 0,
                  transform: ticketIncludes.visible ? undefined : 'translateY(20px)',
                  transitionDelay: ticketIncludes.visible ? undefined : `${i * 100}ms`,
                }}>
                <div className="flex-shrink-0 h-9 w-9 flex items-center justify-center rounded-xl bg-brand-50 transition-colors duration-300 group-hover:bg-brand-600">
                  <Icon className="h-4 w-4 text-brand-600 transition-colors duration-300 group-hover:text-white" />
                </div>
                <p className="text-slate-700 text-sm leading-relaxed">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── FAQ ───────────────────────────────────────────────────────────── */}
      <div className="bg-white py-10 lg:py-12">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <span className="text-xs font-bold uppercase tracking-widest text-brand-500 mb-3 block">Questions</span>
            <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-slate-900">Frequently asked questions</h2>
          </div>
          <div className="space-y-3">
            {[
              { q: 'Why is there a charge?', a: 'A small ticket means everyone who books has committed to showing up, which makes for a better, more engaged room. And if you join CoachDog within 72 hours of the event, your £19 is credited against membership.' },
              { q: "I can't make it live. Should I still book?", a: 'Yes. Every ticket includes the full replay and the workbook, so you can work through it in your own time.' },
              { q: 'Do I need to be accredited?', a: 'No. The workshop is open to coaches at any stage, including those still training. Accreditation is required to be listed on CoachDog itself.' },
              { q: 'Will I be put on the spot?', a: "No. You'll work through the workbook at your own pace, and the breakout pairs are relaxed and supportive. Cameras are encouraged but optional." },
              { q: 'Is this a sales pitch?', a: "It's a working session first. Almost all of the two hours is spent building your strategy. At the end, we'll share a short, attendee-only offer for CoachDog, and there's no obligation to take it." },
              { q: 'What do I need?', a: 'Zoom on a laptop or tablet, the workbook (sent before the event) and a quiet two hours.' },
              { q: "What's your refund policy?", a: '[Confirm the policy before publishing - e.g. full refund up to 48 hours before the event.]' },
            ].map((item, i) => <FaqItem key={i} q={item.q} a={item.a} />)}
          </div>
        </div>
      </div>

      {/* ── Closing CTA ───────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden py-20" style={{ background: '#111c32' }}>
        <div className="absolute top-0 right-1/4 w-80 h-80 rounded-full opacity-10" style={{ background: '#0d9488', filter: 'blur(80px)' }} />
        <div className="relative max-w-lg mx-auto px-4 sm:px-6 text-center z-10">
          <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-white mb-4">
            Make 2027 the year it all fits together.
          </h2>
          <p className="text-white/70 text-base mb-8">Two hours. One clear strategy. A practice the right clients can find.</p>
          <RegisterForm source="closing-cta" dark />
        </div>
      </div>

    </div>
  );
};

export default StrategyNotResolutions;
