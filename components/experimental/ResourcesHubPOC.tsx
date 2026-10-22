// DEV POC — not linked from nav, dev server only
import React from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink, ShieldCheck, BookOpen, Users, TrendingUp, Star } from 'lucide-react';
import { PocNav } from './PocNav';

interface ResourceCard {
  id: string;
  icon: React.ReactNode;
  tag: string;
  title: string;
  description: string;
  cta: string;
  href: string;
  external?: boolean;
  badge?: string;
}

const RESOURCES: ResourceCard[] = [
  {
    id: 'r1',
    icon: <ShieldCheck className="h-5 w-5" />,
    tag: 'Accreditation',
    title: 'What is coaching accreditation and why does it matter?',
    description: 'Understand the difference between ICF, EMCC, and AC credentials — and why clients look for them.',
    cta: 'Read guide',
    href: '/how-to-find-a-certified-verified-coach',
    badge: '🎓 CoachDog Verified',
  },
  {
    id: 'r2',
    icon: <Star className="h-5 w-5" />,
    tag: 'Accreditation',
    title: 'EMCC vs ICF — which accreditation pathway is right for you?',
    description: 'A practical comparison of both bodies — requirements, costs, timelines, and global recognition.',
    cta: 'Read guide',
    href: '/insights-poc/resources',
    badge: '🛡️ Coach Authored',
  },
  {
    id: 'r3',
    icon: <BookOpen className="h-5 w-5" />,
    tag: 'Profile Tips',
    title: 'Building a CoachDog profile that converts',
    description: 'What clients actually look for — and how to make your specialisms, style, and credentials land clearly.',
    cta: 'Read guide',
    href: '/insights-poc/resources',
  },
  {
    id: 'r4',
    icon: <TrendingUp className="h-5 w-5" />,
    tag: 'Growth',
    title: 'How CoachDog verifies your credentials',
    description: 'A step-by-step walkthrough of how our OCR and manual review process works — and what to upload.',
    cta: 'Read guide',
    href: '/insights-poc/resources',
  },
  {
    id: 'r5',
    icon: <Users className="h-5 w-5" />,
    tag: 'Community',
    title: 'Introducing Coach Answers: get visible by helping real people',
    description: 'How replying to community questions gives you organic exposure to people actively looking for coaching.',
    cta: 'Learn more',
    href: '/insights-poc',
  },
  {
    id: 'r6',
    icon: <BookOpen className="h-5 w-5" />,
    tag: 'Content',
    title: 'How to write articles that build trust with future clients',
    description: 'Tips for publishing on CoachDog — what works, what to avoid, and how our editorial QA works.',
    cta: 'Read guide',
    href: '/insights-poc/resources',
    badge: '✍️ Coming Soon',
  },
];

const QUICK_LINKS = [
  { label: 'Update your profile', href: '/dashboard' },
  { label: 'Manage your availability', href: '/dashboard' },
  { label: 'View your reviews', href: '/dashboard' },
  { label: 'Upgrade your subscription', href: '/pricing' },
  { label: 'Contact support', href: '/contact' },
];

export const ResourcesHubPOC: React.FC = () => {
  return (
    <>
      <PocNav />
      <div className="min-h-screen bg-slate-50">

        {/* Header */}
        <div className="bg-white border-b border-slate-200">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">For Coaches</p>
            <h1 className="text-3xl sm:text-4xl font-display font-extrabold text-slate-900 mb-2">
              Coach Resources
            </h1>
            <p className="text-slate-500 text-base">
              Everything you need to set up, grow, and make the most of your CoachDog presence.
            </p>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-12">

          {/* Resource cards */}
          <section>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-5">
              Guides & Articles
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {RESOURCES.map(card => (
                <Link
                  key={card.id}
                  to={card.href}
                  className="group bg-white rounded-2xl border border-slate-200 shadow-sm p-5 hover:shadow-md hover:border-slate-300 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="h-9 w-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 group-hover:bg-slate-200 transition-colors">
                        {card.icon}
                      </div>
                      <span className="text-xs font-bold uppercase tracking-widest text-slate-400">
                        {card.tag}
                      </span>
                    </div>
                    <p className="text-sm font-bold text-slate-900 leading-snug mb-2">
                      {card.title}
                    </p>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      {card.description}
                    </p>
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-xs font-semibold" style={{ color: '#2D8A7E' }}>
                      {card.cta} →
                    </span>
                    {card.badge && (
                      <span className="text-xs text-slate-400 font-medium">{card.badge}</span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </section>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

            {/* Quick links */}
            <div className="lg:col-span-1">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">
                Quick Links
              </p>
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden divide-y divide-slate-100">
                {QUICK_LINKS.map(link => (
                  <Link
                    key={link.label}
                    to={link.href}
                    className="flex items-center justify-between px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    {link.label}
                    <ExternalLink className="h-3.5 w-3.5 text-slate-300" />
                  </Link>
                ))}
              </div>
            </div>

            {/* Community callout */}
            <div className="lg:col-span-2 space-y-4">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
                Get More Visibility
              </p>

              <div
                className="rounded-2xl p-6 text-white"
                style={{ backgroundColor: '#2D8A7E' }}
              >
                <p className="text-lg font-display font-bold mb-1">Answer community questions</p>
                <p className="text-sm opacity-80 mb-4 leading-relaxed">
                  When you reply to a thread on the community Q&A, your response is highlighted as a Featured Coach Answer — with a direct link to your profile. It's organic visibility with people who are actively looking for a coach.
                </p>
                <Link
                  to="/insights-poc"
                  className="inline-block bg-white text-sm font-semibold px-5 py-2.5 rounded-full hover:opacity-90 transition-opacity"
                  style={{ color: '#2D8A7E' }}
                >
                  Browse Community Questions →
                </Link>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                <p className="font-display font-bold text-slate-900 mb-1">Write an article</p>
                <p className="text-sm text-slate-500 leading-relaxed mb-4">
                  Share your expertise with a long-form piece. CoachDog's editorial team reviews all submissions — if approved, it's published under your name with a link to your profile. Article publishing is coming soon.
                </p>
                <button
                  disabled
                  className="text-sm font-semibold px-4 py-2 rounded-full border border-slate-200 text-slate-400 cursor-not-allowed"
                >
                  Coming Soon
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </>
  );
};
