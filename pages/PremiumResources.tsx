import React from 'react';
import { Link } from 'react-router-dom';
import { Lock, Sparkles, BookOpen, ChevronRight, ArrowRight, Play } from 'lucide-react';
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

      {/* Resources grid */}
      <section className="py-14 lg:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">

          <div className="grid sm:grid-cols-2 gap-6 mb-12">
            {/* CoachDog Spark card */}
            <Link
              to="/resources/spark"
              className="group border border-slate-200 rounded-2xl overflow-hidden hover:border-amber-300 hover:shadow-lg transition-all"
            >
              <div className="bg-slate-900 px-5 py-6">
                <div className="flex flex-wrap gap-2 mb-3">
                  <span className="text-xs font-bold text-amber-400 bg-amber-400/10 px-2.5 py-0.5 rounded-full uppercase tracking-wide">Premium</span>
                  <span className="text-xs text-slate-300 bg-white/10 px-2.5 py-0.5 rounded-full">Video Series</span>
                  <span className="text-xs text-slate-300 bg-white/10 px-2.5 py-0.5 rounded-full">Profile Tips</span>
                </div>
                <h3 className="text-lg font-bold text-white leading-snug">
                  CoachDog Spark ⚡
                </h3>
              </div>
              <div className="px-5 py-4 bg-white">
                <p className="text-sm text-slate-600 mb-4 leading-relaxed">
                  A growing video series of how-tos and profile tips to help you get the most from CoachDog. New lessons added regularly.
                </p>
                <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-amber-600 group-hover:gap-2.5 transition-all">
                  <Play className="h-4 w-4" /> Watch lessons
                </span>
              </div>
            </Link>

            {/* TKI Questionnaire card */}
            <Link
              to="/resources/tki-questionnaire"
              className="group border border-slate-200 rounded-2xl overflow-hidden hover:border-teal-300 hover:shadow-lg transition-all"
            >
              <div className="bg-slate-900 px-5 py-6">
                <div className="flex flex-wrap gap-2 mb-3">
                  <span className="text-xs font-bold text-amber-400 bg-amber-400/10 px-2.5 py-0.5 rounded-full uppercase tracking-wide">Premium</span>
                  <span className="text-xs text-slate-300 bg-white/10 px-2.5 py-0.5 rounded-full">Self-Assessment</span>
                  <span className="text-xs text-slate-300 bg-white/10 px-2.5 py-0.5 rounded-full">Conflict Styles</span>
                </div>
                <h3 className="text-lg font-bold text-white leading-snug">
                  Thomas-Kilmann TKI Questionnaire
                </h3>
              </div>
              <div className="px-5 py-4 bg-white">
                <p className="text-sm text-slate-600 mb-4 leading-relaxed">
                  A 15-pair interactive questionnaire that identifies your dominant conflict mode across five styles: Competing, Avoiding, Accommodating, Collaborating, and Compromising.
                </p>
                <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-teal-600 group-hover:gap-2.5 transition-all">
                  Open tool <ArrowRight className="h-4 w-4" />
                </span>
              </div>
            </Link>
          </div>

          {/* Back link */}
          <div>
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
