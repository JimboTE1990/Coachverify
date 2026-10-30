import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CheckCircle, Infinity, Shield, Star, Users } from 'lucide-react';
import { ProductReviewWidget } from '../components/ProductReviewWidget';
import { useAuth } from '../hooks/useAuth';
import { PRICING_CONFIG } from '../config/pricing';
import { SUBSCRIPTION_CONSTANTS } from '../constants/subscription';
import { supabase } from '../lib/supabase';

export const Pricing: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, coach } = useAuth();

  // Check if user already has a paid subscription (not trial) - includes lifetime
  const hasActiveSubscription = coach && (coach.subscriptionStatus === 'active' || coach.subscriptionStatus === 'lifetime');

  // Check if user is on trial
  const isOnTrial = coach && coach.subscriptionStatus === 'trial';

  // Get current billing cycle for premium users
  const currentBillingCycle = coach?.billingCycle; // 'monthly' or 'annual'

  // Live count of founding (lifetime) members — progress bar shown only at 60+
  const [foundingCount, setFoundingCount] = useState<number | null>(null);
  useEffect(() => {
    supabase
      .from('coaches')
      .select('*', { count: 'exact', head: true })
      .eq('subscription_status', 'lifetime')
      .then(({ count }) => setFoundingCount(count ?? 0));
  }, []);
  const PROGRESS_THRESHOLD = 60;
  const showProgress = foundingCount !== null && foundingCount >= PROGRESS_THRESHOLD;

  const handlePlanSelection = (plan: 'monthly' | 'annual' | 'lifetime') => {
    // Already on this plan
    if (hasActiveSubscription && currentBillingCycle === plan) {
      navigate('/for-coaches?tab=subscription');
      return;
    }

    // Switching between monthly/annual
    if (hasActiveSubscription && currentBillingCycle && currentBillingCycle !== plan && plan !== 'lifetime') {
      navigate(`/subscription/change-plan?to=${plan}`);
      return;
    }

    // Everyone else (including unauthenticated) goes to checkout — checkout handles auth
    navigate(`/checkout/${plan}`);
  };

  const annualPrice = PRICING_CONFIG.plans.annual.price;

  return (
    <div className="bg-slate-50 min-h-screen flex flex-col">

      {/* Hero */}
      <div className="relative pt-24 pb-12 overflow-hidden">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center relative z-10">
          <div className="inline-flex items-center bg-[#1e3a5f] text-white px-4 py-1.5 rounded-full text-sm font-bold mb-6 shadow-md">
            Limited founding pricing — closes at 100 coaches or 31 Dec 2026
          </div>
          <h1 className="text-4xl md:text-5xl font-display font-extrabold text-slate-900 mb-4 tracking-tight">
            Secure your place in the{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#1e3a5f] to-[#2B4170]">
              original cohort.
            </span>
          </h1>
          <p className="text-lg text-slate-600 max-w-xl mx-auto leading-relaxed">
            A small group of coaches are locking in lifetime membership at founding pricing before it closes forever. After that, standard subscription plans apply.
          </p>

          {/* Progress bar — only shown at 60+ */}
          {showProgress && (
            <div className="mt-8 max-w-sm mx-auto">
              <div className="flex justify-between text-sm font-semibold text-slate-700 mb-2">
                <span>{foundingCount} of 100 places taken</span>
                <span className="text-[#2B4170]">{100 - foundingCount!} remaining</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                <div
                  className="h-3 rounded-full bg-gradient-to-r from-[#1e3a5f] to-[#2B4170] transition-all duration-700"
                  style={{ width: `${(foundingCount! / 100) * 100}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Background blobs */}
        <div className="absolute top-0 left-1/2 w-full -translate-x-1/2 h-full z-0 opacity-20 pointer-events-none">
          <div className="absolute top-0 right-1/4 -mt-20 w-96 h-96 rounded-full bg-blue-200 blur-3xl animate-blob" />
          <div className="absolute bottom-0 left-1/4 -mb-20 w-80 h-80 rounded-full bg-indigo-200 blur-3xl animate-blob" style={{ animationDelay: '2s' }} />
        </div>
      </div>

      <div className="pb-24 relative z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Trial / Expired status for logged-in users */}
          {(() => {
            const trialEndDate = coach?.trialEndsAt ? new Date(coach.trialEndsAt) : null;
            const formattedTrialEnd = trialEndDate?.toLocaleDateString('en-GB', {
              day: 'numeric', month: 'long', year: 'numeric'
            });
            const today = new Date();
            const daysRemaining = trialEndDate
              ? Math.max(0, Math.ceil((trialEndDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)))
              : 0;

            if (isAuthenticated && coach?.subscriptionStatus === 'trial') {
              return (
                <div className="bg-white rounded-2xl shadow border border-green-200 p-6 mb-10 flex items-center gap-4">
                  <div className="bg-green-100 rounded-full p-3 flex-shrink-0">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-900">Your free trial is active</p>
                    <p className="text-sm text-slate-500">
                      {formattedTrialEnd ? `Ends ${formattedTrialEnd}` : 'Full platform access'}{daysRemaining > 0 ? ` · ${daysRemaining} days remaining` : ''}
                      {' '}— upgrade below to lock in founding pricing before it closes.
                    </p>
                  </div>
                </div>
              );
            }

            if (isAuthenticated && coach?.subscriptionStatus === 'expired') {
              return (
                <div className="bg-white rounded-2xl shadow border border-red-200 p-6 mb-10 flex items-center gap-4">
                  <div className="bg-red-100 rounded-full p-3 flex-shrink-0">
                    <Shield className="h-6 w-6 text-red-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-900">Your trial has ended</p>
                    <p className="text-sm text-slate-500">
                      Your profile is currently hidden. Claim your founding place below to become visible to clients again.
                    </p>
                  </div>
                </div>
              );
            }

            if (isAuthenticated && (coach?.subscriptionStatus === 'active' || coach?.subscriptionStatus === 'lifetime')) {
              return null;
            }

            return null;
          })()}

          {/* Main cards */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6 items-start">

            {/* Lifetime Card — dark navy, hero */}
            <div className="md:col-span-3 bg-[#111c32] rounded-3xl shadow-xl p-8 flex flex-col relative overflow-hidden">
              {/* Subtle glow */}
              <div className="absolute inset-0 opacity-10 pointer-events-none">
                <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-yellow-300 blur-3xl" />
                <div className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full bg-blue-400 blur-3xl" />
              </div>

              <div className="relative z-10">
                {/* Annual strikethrough anchor — above the heading */}
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-sm font-semibold text-blue-300/60 line-through">Annual Membership &nbsp;£{annualPrice}/yr</span>
                </div>

                {/* Heading + badge */}
                <div className="flex justify-between items-center mb-5">
                  <div className="flex items-center gap-2">
                    <Infinity className="h-5 w-5 text-yellow-400" />
                    <h2 className="text-2xl font-bold text-white">Lifetime Membership</h2>
                  </div>
                  <span className="bg-yellow-400 text-[#111c32] text-xs font-bold px-3 py-1 rounded-full shadow-sm flex items-center justify-center text-center">
                    Founding offer
                  </span>
                </div>

                {/* Price */}
                <div className="flex items-baseline gap-3 mb-2">
                  <span className="text-6xl font-display font-black text-white">
                    £{SUBSCRIPTION_CONSTANTS.LIFETIME_PRICE_GBP}
                  </span>
                  <span className="text-lg font-bold text-blue-200">once, for life</span>
                </div>
                <p className="text-sm text-blue-300/80 mb-6 leading-relaxed">
                  No renewals, no annual fees. Full access to every feature, including everything we build in future.
                </p>

                {/* Founder badge highlight */}
                <div className="bg-white/8 border border-yellow-400/30 rounded-2xl p-4 mb-6 flex items-center gap-4">
                  <div className="w-20 h-20 flex-shrink-0 rounded-full border-2 border-yellow-400 bg-yellow-400/10 flex flex-col items-center justify-center gap-0.5">
                    <span className="text-yellow-400 text-[9px] font-black uppercase tracking-widest leading-none">FOUNDER</span>
                    <span className="text-yellow-400 text-2xl font-black leading-tight">100</span>
                  </div>
                  <div>
                    <p className="text-white font-bold text-sm">A permanent Founder badge</p>
                    <p className="text-blue-300/70 text-xs">Shown on your profile for good. Only 100 will ever exist.</p>
                    <p className="text-blue-300/50 text-xs mt-1">Badges added to profiles once all founding places are filled.</p>
                  </div>
                </div>

                {/* Feature list — 2 column */}
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3 mb-8">
                  <li className="flex items-start gap-2.5 text-sm text-blue-100">
                    <CheckCircle className="h-4 w-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                    <span>Accreditation verified and shown on your profile</span>
                  </li>
                  <li className="flex items-start gap-2.5 text-sm text-blue-100">
                    <CheckCircle className="h-4 w-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                    <span>Your own link:<br />coachdog.co.uk/yourname</span>
                  </li>
                  <li className="flex items-start gap-2.5 text-sm text-blue-100">
                    <CheckCircle className="h-4 w-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                    <span>Open, transparent client ratings</span>
                  </li>
                  <li className="flex items-start gap-2.5 text-sm text-blue-100">
                    <CheckCircle className="h-4 w-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                    <span>Client Q&A community</span>
                  </li>
                  <li className="flex items-start gap-2.5 text-sm text-blue-100">
                    <CheckCircle className="h-4 w-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                    <span>Collaboration space for coach projects</span>
                  </li>
                  <li className="flex items-start gap-2.5 text-sm text-blue-100">
                    <CheckCircle className="h-4 w-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                    <span>Every future feature, included</span>
                  </li>
                </ul>

                <button
                  onClick={() => handlePlanSelection('lifetime')}
                  disabled={coach?.subscriptionStatus === 'lifetime'}
                  className="w-full bg-yellow-400 text-[#111c32] py-4 rounded-xl font-bold text-lg hover:bg-yellow-300 transition-all shadow-md hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {coach?.subscriptionStatus === 'lifetime'
                    ? "You're a Founding Member 🐾"
                    : 'Claim your founding place'}
                </button>
                <p className="text-center text-blue-300/60 text-xs mt-3">
                  Closes at 100 coaches or 31 December 2026
                </p>

                <p className="mt-3 text-xs text-blue-300/40 text-center leading-relaxed">
                  *Lifetime access refers to the lifetime of the platform, not the purchaser. Subject to our Terms of Service.
                </p>
              </div>
            </div>

            {/* Free Trial card — secondary, takes 2/5 width on desktop */}
            <div className="md:col-span-2 flex flex-col gap-6">

              {/* Trial/Expired/Active state overrides */}
              {(() => {
                const trialEndDate = coach?.trialEndsAt ? new Date(coach.trialEndsAt) : null;
                const formattedTrialEnd = trialEndDate?.toLocaleDateString('en-GB', {
                  day: 'numeric', month: 'long', year: 'numeric'
                });

                if (isAuthenticated && coach?.subscriptionStatus === 'trial') {
                  return (
                    <div className="bg-white rounded-2xl shadow-sm border-2 border-green-300 p-6 flex flex-col">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="bg-green-100 text-green-700 font-bold px-2 py-0.5 rounded-full text-xs border border-green-200">Active</span>
                        <h3 className="text-lg font-bold text-slate-900">Free Trial</h3>
                      </div>
                      <div className="text-center py-4">
                        <div className="w-full bg-green-100 border-2 border-green-300 text-green-800 text-center py-3 rounded-xl font-bold mb-3">
                          ✓ Trial Active
                        </div>
                        {formattedTrialEnd && (
                          <p className="text-sm font-semibold text-slate-700">
                            Ends <span className="text-rose-600">{formattedTrialEnd}</span>
                          </p>
                        )}
                        <p className="text-xs text-slate-400 mt-3">Upgrade to lock in founding pricing before it closes.</p>
                      </div>
                    </div>
                  );
                }

                if (isAuthenticated && coach?.subscriptionStatus === 'expired') {
                  return (
                    <div className="bg-white rounded-2xl shadow-sm border-2 border-red-200 p-6 flex flex-col">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="bg-red-100 text-red-700 font-bold px-2 py-0.5 rounded-full text-xs border border-red-200">Expired</span>
                        <h3 className="text-lg font-bold text-slate-900">Free Trial</h3>
                      </div>
                      <div className="text-center py-4">
                        <div className="w-full bg-red-100 border-2 border-red-300 text-red-800 text-center py-3 rounded-xl font-bold mb-3">
                          Trial Ended
                        </div>
                        <p className="text-xs text-slate-400 mt-3">Claim founding access to reactivate your profile.</p>
                      </div>
                    </div>
                  );
                }

                if (isAuthenticated && (coach?.subscriptionStatus === 'active' || coach?.subscriptionStatus === 'lifetime')) {
                  return null;
                }

                // Default: unauthenticated or onboarding
                return (
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col">
                    <h3 className="text-lg font-bold text-slate-900 mb-1">30-Day Free Trial</h3>
                    <p className="text-sm text-slate-500 mb-4">Not ready to commit? Try first.</p>

                    <div className="text-center mb-5">
                      <span className="text-5xl font-display font-black text-slate-900">£0</span>
                      <span className="block text-xs text-slate-500 font-bold uppercase tracking-wide mt-1">for 30 days</span>
                    </div>

                    <ul className="space-y-2.5 mb-6 flex-1">
                      <li className="flex items-center gap-2.5 text-sm text-slate-600">
                        <CheckCircle className="h-4 w-4 text-brand-500 flex-shrink-0" />
                        Full verified profile and listing
                      </li>
                      <li className="flex items-center gap-2.5 text-sm text-slate-600">
                        <CheckCircle className="h-4 w-4 text-brand-500 flex-shrink-0" />
                        Ratings, Q&A and collaboration space
                      </li>
                      <li className="flex items-center gap-2.5 text-sm text-slate-600">
                        <CheckCircle className="h-4 w-4 text-brand-500 flex-shrink-0" />
                        Clients can book free intro calls
                      </li>
                    </ul>

                    <Link
                      to="/coach-signup"
                      className="block w-full bg-[#1e3a5f] text-white text-center py-3.5 rounded-xl font-bold hover:bg-[#2B4170] transition-colors shadow-sm"
                    >
                      Start free trial
                    </Link>
                    <p className="text-xs text-slate-400 text-center mt-3">No credit card required</p>
                    <p className="text-xs text-slate-500 text-center mt-2 font-medium">
                      Upgrade to founding pricing any time before 31 December
                    </p>
                  </div>
                );
              })()}

              {/* Trust signals */}
              <div className="bg-white rounded-2xl border border-slate-100 p-5">
                <div className="flex items-start gap-3 mb-4">
                  <Shield className="h-5 w-5 text-[#2B4170] flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-slate-600 font-medium">
                    Every coach is verified against EMCC, ICF or AC accreditation
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <Users className="h-5 w-5 text-[#2B4170] flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-slate-600 font-medium">
                    Trusted by coaches across the UK
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Monthly & Annual plans — re-enable after founding offer closes (all logic retained) */}
          {false && (
            /* Monthly Plan */
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8 flex flex-col items-center hover:shadow-md transition-shadow">
              <h3 className="text-xl font-bold text-slate-900">Monthly</h3>
              <p className="text-sm text-slate-500 mt-1">Pay as you go</p>
              <div className="mt-8 flex flex-col items-center justify-center">
                <span className="text-sm text-slate-400 font-medium line-through">Standard: £30/mo</span>
                <div className="flex items-baseline mt-2">
                  <span className="text-5xl font-display font-black text-slate-900">
                    £{PRICING_CONFIG.plans.monthly.price}
                  </span>
                  <span className="ml-1 text-base font-medium text-slate-500">/mo</span>
                </div>
              </div>
              <div className="mt-8 border-t border-slate-100 w-full pt-8">
                <ul className="space-y-4 text-left text-sm text-slate-600">
                  <li className="flex items-center"><CheckCircle className="h-5 w-5 text-brand-500 mr-3" />Verified Accreditation Badge</li>
                  <li className="flex items-center"><CheckCircle className="h-5 w-5 text-brand-500 mr-3" />Professional landing page with shareable link</li>
                  <li className="flex items-center"><CheckCircle className="h-5 w-5 text-brand-500 mr-3" />Client reviews</li>
                  <li className="flex items-center"><CheckCircle className="h-5 w-5 text-brand-500 mr-3" />No long contract / flexible monthly option</li>
                </ul>
              </div>
              <button
                onClick={() => handlePlanSelection('monthly')}
                disabled={coach?.subscriptionStatus === 'lifetime' || (hasActiveSubscription && currentBillingCycle === 'monthly')}
                className="mt-8 w-full bg-brand-600 text-white py-4 rounded-xl font-bold hover:bg-brand-700 transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {coach?.subscriptionStatus === 'lifetime'
                  ? 'On Lifetime Plan'
                  : hasActiveSubscription && currentBillingCycle === 'monthly'
                  ? 'Current Plan'
                  : hasActiveSubscription && currentBillingCycle === 'annual'
                  ? 'Switch to Monthly'
                  : isOnTrial
                  ? 'Upgrade to Monthly'
                  : 'Select Monthly'}
              </button>
            </div>
          )}

          {false && (
            /* Annual Plan */
            <div className="bg-white rounded-3xl shadow-xl border-2 border-brand-500 p-8 flex flex-col items-center relative">
              <h3 className="text-xl font-bold text-slate-900 mt-2">Annual</h3>
              <p className="text-sm text-slate-500 mt-1">Commit & Save</p>
              <div className="mt-8 flex flex-col items-center justify-center">
                <span className="text-sm text-slate-400 font-medium line-through">Standard: £300/yr</span>
                <div className="flex items-baseline mt-2">
                  <span className="text-5xl font-display font-black text-slate-900">
                    £{annualPrice}
                  </span>
                  <span className="ml-1 text-base font-medium text-slate-500">/yr</span>
                </div>
                <span className="text-xs text-green-600 font-bold mt-2 bg-green-50 px-2 py-1 rounded-md">Save £30/year</span>
              </div>
              <div className="mt-8 border-t border-slate-100 w-full pt-8">
                <ul className="space-y-4 text-left text-sm text-slate-600">
                  <li className="flex items-center"><CheckCircle className="h-5 w-5 text-brand-500 mr-3" />Verified Accreditation Badge</li>
                  <li className="flex items-center"><CheckCircle className="h-5 w-5 text-brand-500 mr-3" />Professional landing page with shareable link</li>
                  <li className="flex items-center"><CheckCircle className="h-5 w-5 text-brand-500 mr-3" />Client reviews</li>
                  <li className="flex items-center"><CheckCircle className="h-5 w-5 text-brand-500 mr-3" />Fixed plan for 12 months, 2 months saving vs monthly</li>
                </ul>
              </div>
              <button
                onClick={() => handlePlanSelection('annual')}
                disabled={coach?.subscriptionStatus === 'lifetime' || (hasActiveSubscription && currentBillingCycle === 'annual')}
                className="mt-8 w-full bg-gradient-to-r from-brand-600 to-indigo-600 text-white py-4 rounded-xl font-bold hover:from-brand-700 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {coach?.subscriptionStatus === 'lifetime'
                  ? 'On Lifetime Plan'
                  : hasActiveSubscription && currentBillingCycle === 'annual'
                  ? 'Current Plan'
                  : hasActiveSubscription && currentBillingCycle === 'monthly'
                  ? 'Switch to Annual'
                  : isOnTrial
                  ? 'Upgrade to Annual'
                  : 'Select Annual'}
              </button>
            </div>
          )}

        </div>
      </div>

      <ProductReviewWidget />
    </div>
  );
};
