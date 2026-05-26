import React from 'react';
import { Link } from 'react-router-dom';
import { Lock, Sparkles, BookOpen, FileText, ChevronRight } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

const PREMIUM_RESOURCES = [
  {
    title: 'Wheel of Life — Advanced Template',
    description: 'A deeper version of the classic wheel exercise with coaching prompts, scoring guides, and session debrief framework. Designed for multi-session use.',
    type: 'Worksheet',
    tags: ['Life Coaching', 'Assessment'],
    thumbnail: null,
  },
  {
    title: 'Goal-Setting Workbook',
    description: 'A structured GROW-model workbook helping clients move from broad aspirations to specific, time-bound action plans with accountability built in.',
    type: 'Workbook',
    tags: ['Goal Setting', 'GROW Model'],
    thumbnail: null,
  },
  {
    title: 'Values Clarification Exercise',
    description: 'A step-by-step process for helping clients identify and rank their core values — the foundation of every meaningful coaching conversation.',
    type: 'Exercise',
    tags: ['Values', 'Self-discovery'],
    thumbnail: null,
  },
  {
    title: 'Inner Critic Coaching Guide',
    description: 'Techniques and frameworks for working with the inner critic — reframing self-limiting beliefs and building self-compassion.',
    type: 'Guide',
    tags: ['Mindset', 'Limiting Beliefs'],
    thumbnail: null,
  },
];

const isPaidMember = (coach: any) =>
  coach && ['trial', 'active', 'lifetime'].includes(coach.subscriptionStatus || '');

export const PremiumResources: React.FC = () => {
  const { isAuthenticated, coach } = useAuth();
  const hasPremiumAccess = isAuthenticated && isPaidMember(coach);

  return (
    <div className="min-h-screen bg-white">
      {/* Breadcrumb */}
      <div className="bg-slate-50 border-b border-slate-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-1.5 text-sm text-slate-500">
          <Link to="/resources" className="hover:text-emerald-700 transition-colors font-medium">Resources</Link>
          <ChevronRight className="h-4 w-4 flex-shrink-0" />
          <span className="text-slate-900 font-medium">Premium Resources</span>
        </div>
      </div>

      {/* Hero */}
      <section className="bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 border-b border-amber-100 py-14 lg:py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="inline-flex items-center gap-2 bg-amber-100 text-amber-700 text-sm font-semibold px-4 py-1.5 rounded-full mb-6">
            <Lock className="h-4 w-4" />
            Members Only
          </div>
          <h1 className="text-4xl lg:text-5xl font-display font-extrabold text-slate-900 leading-tight mb-4">
            Premium Resources
          </h1>
          <p className="text-lg text-slate-600 mb-8">
            Exclusive coaching tools, workbooks, and guides for CoachDog members. Available on all plans including free trial.
          </p>

          {!hasPremiumAccess && (
            <Link
              to="/pricing"
              className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white font-bold px-7 py-3.5 rounded-xl shadow-lg shadow-amber-500/30 transition-all hover:-translate-y-0.5"
            >
              <Sparkles className="h-5 w-5" />
              Unlock with Membership
            </Link>
          )}
        </div>
      </section>

      {/* Locked resources grid */}
      <section className="py-14 lg:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">

          {/* Coming soon notice */}
          <div className="mb-8 flex items-start gap-3 bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm text-slate-600">
            <Sparkles className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
            <p><span className="font-semibold text-slate-800">Content coming soon.</span> These resources are in production and will be available to all members shortly. Sign up now and you'll get access the moment they launch.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {PREMIUM_RESOURCES.map((resource) => (
              <div key={resource.title} className="relative bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">

                {/* Card top bar */}
                <div className="h-1.5 bg-gradient-to-r from-amber-400 to-orange-400" />

                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-3 rounded-xl bg-amber-50 text-amber-600">
                      <FileText className="h-6 w-6" />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full uppercase tracking-wide">
                        {resource.type}
                      </span>
                      {!hasPremiumAccess && (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-100 px-2.5 py-1 rounded-full">
                          <Lock className="h-3 w-3" /> Locked
                        </span>
                      )}
                    </div>
                  </div>

                  <h3 className="text-lg font-display font-bold mb-2 leading-snug text-slate-900">
                    {resource.title}
                  </h3>

                  <p className="text-sm leading-relaxed mb-4 text-slate-500">
                    {resource.description}
                  </p>

                  <div className="flex flex-wrap gap-1.5">
                    {resource.tags.map((tag) => (
                      <span key={tag} className="text-xs px-2.5 py-0.5 rounded-full font-medium text-amber-700 bg-amber-50">
                        {tag}
                      </span>
                    ))}
                  </div>

                  {!hasPremiumAccess && (
                    <Link
                      to="/pricing"
                      className="mt-5 flex items-center gap-1.5 text-xs font-semibold text-amber-600 hover:text-amber-700 transition-colors"
                    >
                      <Lock className="h-3.5 w-3.5" /> Unlock access →
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Upgrade CTA for non-members */}
          {!hasPremiumAccess && (
            <div className="mt-12 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 p-8 text-center">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-amber-100 mb-4">
                <Sparkles className="h-7 w-7 text-amber-500" />
              </div>
              <h3 className="text-xl font-display font-bold text-slate-900 mb-2">Unlock all premium resources</h3>
              <p className="text-slate-500 text-sm max-w-sm mx-auto mb-6">
                Join CoachDog to get instant access to premium content - included on all plans (even the free trial).
              </p>
              <Link
                to="/pricing"
                className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white font-bold px-7 py-3 rounded-xl shadow transition-all hover:-translate-y-0.5"
              >
                <Sparkles className="h-4 w-4" />
                View plans
              </Link>
            </div>
          )}

          {/* Back link */}
          <div className="mt-10">
            <Link to="/resources" className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-emerald-700 transition-colors">
              <BookOpen className="h-4 w-4" />
              Back to free resources
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};
