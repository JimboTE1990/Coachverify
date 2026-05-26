import React from 'react';
import { Link } from 'react-router-dom';
import { Lock, Sparkles, BookOpen, ChevronRight } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

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
            CoachDog Paid Plans
          </div>
          <h1 className="text-4xl lg:text-5xl font-display font-extrabold text-slate-900 leading-tight mb-4">
            Premium Resources
          </h1>
          <p className="text-lg text-slate-600 mb-8">
            Exclusive coaching tools, workbooks, and guides for CoachDog paid plan users. Available on all paid plans, including the free trial.
          </p>

          {!hasPremiumAccess && (
            <Link
              to="/pricing"
              className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white font-bold px-7 py-3.5 rounded-xl shadow-lg shadow-amber-500/30 transition-all hover:-translate-y-0.5"
            >
              <Sparkles className="h-5 w-5" />
              View CoachDog Plans
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
