import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle, Calendar, Clock, Monitor, ChevronDown, ChevronUp, ArrowRight } from 'lucide-react';
import { registerForEvent } from '../../services/supabaseService';

// Swap this for the real Eventbrite / Zoom URL when confirmed
const BOOKING_URL = '#';
const CAMPAIGN_ID = 'strategy-not-resolutions-jan-2027';

// ── Reusable email capture form ───────────────────────────────────────────────

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
    if (BOOKING_URL !== '#') {
      window.open(BOOKING_URL, '_blank', 'noopener,noreferrer');
    }
  };

  const inputCls = dark
    ? 'w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-yellow-400 text-sm'
    : 'w-full px-4 py-3 rounded-xl bg-white border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm';

  if (submitted) {
    return (
      <div className={`rounded-2xl p-6 text-center ${dark ? 'bg-white/10 border border-white/20' : 'bg-brand-50 border border-brand-100'}`}>
        <CheckCircle className={`h-8 w-8 mx-auto mb-3 ${dark ? 'text-yellow-400' : 'text-brand-600'}`} />
        <p className={`font-bold text-base mb-1 ${dark ? 'text-white' : 'text-slate-900'}`}>You're registered!</p>
        <p className={`text-sm ${dark ? 'text-white/70' : 'text-slate-500'}`}>
          {BOOKING_URL !== '#'
            ? 'Your booking page is opening in a new tab.'
            : "We'll be in touch with joining details before the event."}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <input
        type="text"
        required
        placeholder="Your name"
        value={name}
        onChange={e => setName(e.target.value)}
        className={inputCls}
      />
      <input
        type="email"
        required
        placeholder="Your email address"
        value={email}
        onChange={e => setEmail(e.target.value)}
        className={inputCls}
      />
      <button
        type="submit"
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 bg-yellow-400 hover:bg-yellow-300 text-[#111c32] font-bold px-6 py-3.5 rounded-xl shadow-lg transition-all hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed text-sm"
      >
        {loading ? 'Saving…' : (
          <>Register interest &amp; book <ArrowRight className="h-4 w-4" /></>
        )}
      </button>
    </form>
  );
};

// ── FAQ accordion ─────────────────────────────────────────────────────────────

const FaqItem: React.FC<{ q: string; a: string }> = ({ q, a }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-slate-200 rounded-2xl overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-slate-50 transition-colors"
      >
        <span className="font-semibold text-slate-800 text-sm pr-4">{q}</span>
        {open ? <ChevronUp className="h-4 w-4 text-slate-400 flex-shrink-0" /> : <ChevronDown className="h-4 w-4 text-slate-400 flex-shrink-0" />}
      </button>
      {open && (
        <div className="px-6 pb-5 text-sm text-slate-600 leading-relaxed border-t border-slate-100">{a}</div>
      )}
    </div>
  );
};

// ── Page ──────────────────────────────────────────────────────────────────────

const StrategyNotResolutions: React.FC = () => {
  return (
    <div className="bg-slate-50 min-h-screen">

        {/* ── Hero ───────────────────────────────────────────────────────── */}
        <div className="relative overflow-hidden" style={{ background: '#111c32' }}>
          {/* Blob decorations */}
          <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full opacity-10" style={{ background: '#0d9488', filter: 'blur(80px)' }} />
          <div className="absolute bottom-0 right-1/4 w-80 h-80 rounded-full opacity-10" style={{ background: '#6366f1', filter: 'blur(80px)' }} />

          <div className="relative max-w-3xl mx-auto px-4 sm:px-6 pt-20 pb-16 text-center z-10">
            {/* Eyebrow */}
            <span className="inline-flex items-center bg-white/10 border border-white/20 text-white/90 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest mb-6">
              Live online workshop for coaches
            </span>

            <h1 className="font-display font-extrabold text-4xl sm:text-5xl text-white tracking-tight mb-5 leading-tight">
              Strategy, not resolutions.
            </h1>

            <p className="text-white/80 text-lg sm:text-xl leading-relaxed mb-8 max-w-2xl mx-auto">
              In two focused hours, build a clear, practical strategy for your coaching practice in 2027 — so this is the year the right clients find you.
            </p>

            {/* Key details */}
            <div className="flex flex-wrap items-center justify-center gap-4 mb-10 text-sm text-white/70">
              <span className="flex items-center gap-1.5"><Calendar className="h-4 w-4 text-yellow-400" /> Wednesday 13 January 2027</span>
              <span className="flex items-center gap-1.5"><Clock className="h-4 w-4 text-yellow-400" /> 7–9pm UK time</span>
              <span className="flex items-center gap-1.5"><Monitor className="h-4 w-4 text-yellow-400" /> Live on Zoom, replay included</span>
            </div>

            {/* Capture form */}
            <div className="max-w-sm mx-auto">
              <RegisterForm source="hero" dark />
              <p className="mt-3 text-xs text-white/50 leading-relaxed">
                An interactive, hands-on workshop. Your £19 comes off CoachDog membership if you join within 72 hours of the event.
              </p>
            </div>
          </div>
        </div>

        {/* ── Why this workshop ───────────────────────────────────────────── */}
        <div className="bg-white py-16 lg:py-20">
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

        {/* ── Is this for you ─────────────────────────────────────────────── */}
        <div className="bg-slate-50 py-16 lg:py-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-10">
              <span className="text-xs font-bold uppercase tracking-widest text-brand-500 mb-3 block">This is for you if you're…</span>
              <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-slate-900">The right fit</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                'An accredited or training coach who wants a steadier flow of the right clients',
                'Tired of plans that start strong in January and stall by spring',
                'Unsure where to focus your marketing time and energy',
                'Ready to treat your coaching practice like the business it is',
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3 bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
                  <CheckCircle className="h-5 w-5 text-brand-600 flex-shrink-0 mt-0.5" />
                  <p className="text-slate-700 text-sm leading-relaxed">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── You'll leave with ───────────────────────────────────────────── */}
        <div className="bg-white py-16 lg:py-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-10">
              <span className="text-xs font-bold uppercase tracking-widest text-brand-500 mb-3 block">What you'll take away</span>
              <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-slate-900">You'll leave with</h2>
            </div>
            <div className="space-y-3 max-w-2xl mx-auto">
              {[
                'A one-page strategy for your practice in 2027, built during the session',
                'Clarity on who you serve best, and how to describe it in one sentence',
                'A simple visibility plan, so the right clients can actually find you',
                'Your first three actions, ready to start the next morning',
                'The workbook and full replay, to revisit whenever you need',
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-trust-500 flex-shrink-0 mt-0.5" />
                  <p className="text-slate-700 text-sm leading-relaxed">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Schedule ────────────────────────────────────────────────────── */}
        <div className="bg-slate-50 py-16 lg:py-20">
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

        {/* ── Host ────────────────────────────────────────────────────────── */}
        <div className="bg-white py-16 lg:py-20">
          <div className="max-w-2xl mx-auto px-4 sm:px-6">
            <span className="text-xs font-bold uppercase tracking-widest text-brand-500 mb-3 block">Your host</span>
            <h2 className="font-display font-extrabold text-2xl sm:text-3xl text-slate-900 mb-4">Paul Smith</h2>
            <p className="text-slate-500 text-sm font-medium mb-4">Managing Director, Coaching Minds</p>
            <div className="space-y-3 text-slate-600 text-sm leading-relaxed">
              <p>Paul leads Coaching Minds, an EMCC accredited coaching academy that trains coaches through its Level 5 programme. He works with coaches every day on the part of the job that training rarely covers: building a practice that lasts.</p>
              <p className="italic text-slate-400">[One or two lines on Paul's own coaching background — to be added before publishing.]</p>
            </div>
            <div className="mt-6 pt-6 border-t border-slate-100">
              <p className="text-sm text-slate-500">
                Delivered in partnership with{' '}
                <span className="font-semibold text-slate-700">Coaching Minds</span>
                {' '}and{' '}
                <Link to="/" className="font-semibold text-brand-600 hover:underline">CoachDog</Link>
                {' '}— the directory where every coach is verified against their EMCC, ICF or AC accreditation.
              </p>
            </div>
          </div>
        </div>

        {/* ── Ticket includes ─────────────────────────────────────────────── */}
        <div className="bg-slate-50 py-16 lg:py-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-10">
              <span className="text-xs font-bold uppercase tracking-widest text-brand-500 mb-3 block">What's included</span>
              <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-slate-900">Your ticket includes</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
              {[
                'The full two-hour live workshop on Zoom',
                'The Strategy, Not Resolutions workbook',
                'The replay, so you can watch again or catch up if you can\'t make it live',
                'An attendee-only CoachDog offer, with your £19 credited against membership if you join within 72 hours',
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3 bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
                  <CheckCircle className="h-5 w-5 text-trust-500 flex-shrink-0 mt-0.5" />
                  <p className="text-slate-700 text-sm leading-relaxed">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── FAQ ─────────────────────────────────────────────────────────── */}
        <div className="bg-white py-16 lg:py-20">
          <div className="max-w-2xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-10">
              <span className="text-xs font-bold uppercase tracking-widest text-brand-500 mb-3 block">Questions</span>
              <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-slate-900">Frequently asked questions</h2>
            </div>
            <div className="space-y-3">
              {[
                {
                  q: 'Why is there a charge?',
                  a: 'A small ticket means everyone who books has committed to showing up, which makes for a better, more engaged room. And if you join CoachDog within 72 hours of the event, your £19 is credited against membership.',
                },
                {
                  q: "I can't make it live. Should I still book?",
                  a: 'Yes. Every ticket includes the full replay and the workbook, so you can work through it in your own time.',
                },
                {
                  q: 'Do I need to be accredited?',
                  a: 'No. The workshop is open to coaches at any stage, including those still training. Accreditation is required to be listed on CoachDog itself.',
                },
                {
                  q: 'Will I be put on the spot?',
                  a: "No. You'll work through the workbook at your own pace, and the breakout pairs are relaxed and supportive. Cameras are encouraged but optional.",
                },
                {
                  q: 'Is this a sales pitch?',
                  a: "It's a working session first. Almost all of the two hours is spent building your strategy. At the end, we'll share a short, attendee-only offer for CoachDog, and there's no obligation to take it.",
                },
                {
                  q: 'What do I need?',
                  a: 'Zoom on a laptop or tablet, the workbook (sent before the event) and a quiet two hours.',
                },
                {
                  q: "What's your refund policy?",
                  a: '[Confirm the policy before publishing — e.g. full refund up to 48 hours before the event.]',
                },
              ].map((item, i) => (
                <FaqItem key={i} q={item.q} a={item.a} />
              ))}
            </div>
          </div>
        </div>

        {/* ── Closing CTA ─────────────────────────────────────────────────── */}
        <div className="relative overflow-hidden py-20" style={{ background: '#111c32' }}>
          <div className="absolute top-0 right-1/4 w-80 h-80 rounded-full opacity-10" style={{ background: '#0d9488', filter: 'blur(80px)' }} />
          <div className="relative max-w-lg mx-auto px-4 sm:px-6 text-center z-10">
            <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-white mb-4">
              Make 2027 the year it all fits together.
            </h2>
            <p className="text-white/70 text-base mb-8">
              Two hours. One clear strategy. A practice the right clients can find.
            </p>
            <RegisterForm source="closing-cta" dark />
          </div>
        </div>

    </div>
  );
};

export default StrategyNotResolutions;
