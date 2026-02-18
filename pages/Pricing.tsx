import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CheckCircle, Zap, Clock } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { PRICING_CONFIG } from '../config/pricing';

export const Pricing: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, coach } = useAuth();

  // Check if user already has a paid subscription (not trial) - includes lifetime
  const hasActiveSubscription = coach && (coach.subscriptionStatus === 'active' || coach.subscriptionStatus === 'lifetime');

  // Check if user is on trial
  const isOnTrial = coach && coach.subscriptionStatus === 'trial';

  // Get current billing cycle for premium users
  const currentBillingCycle = coach?.billingCycle; // 'monthly' or 'annual'

  const handlePlanSelection = (plan: 'monthly' | 'annual') => {
    // If already subscribed and trying to switch plans, go to change plan flow
    if (hasActiveSubscription && currentBillingCycle && currentBillingCycle !== plan) {
      navigate(`/subscription/change-plan?to=${plan}`);
      return;
    }

    // If already on this plan, navigate to subscription management
    if (hasActiveSubscription && currentBillingCycle === plan) {
      navigate('/for-coaches?tab=subscription');
      return;
    }

    // If not authenticated, redirect to login
    if (!isAuthenticated) {
      // Store selected plan and discount code in sessionStorage for post-login redirect
      sessionStorage.setItem('pendingCheckout', JSON.stringify({
        plan,
        discountCode: appliedDiscount?.code || null,
        timestamp: Date.now()
      }));
      navigate('/coach-login', { state: { from: { pathname: `/checkout/${plan}` } } });
      return;
    }

    // Authenticated and no subscription - go to checkout (discount will be retrieved from sessionStorage)
    navigate(`/checkout/${plan}`);
  };

  // Calculate final prices
  const monthlyPrice = PRICING_CONFIG.plans.monthly.price;
  const annualPrice = PRICING_CONFIG.plans.annual.price;

  return (
    <div className="bg-slate-50 min-h-screen flex flex-col">

      {/* Light Hero Section */}
      <div className="relative pt-24 pb-16 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="inline-flex items-center bg-gradient-to-r from-rose-500 to-orange-500 text-white px-4 py-1.5 rounded-full text-sm font-bold mb-8 shadow-lg animate-pulse">
             <Clock className="h-4 w-4 mr-2" /> Limited Time: 50% Off Lifetime Rates
          </div>
          <h1 className="text-5xl md:text-6xl font-display font-extrabold text-slate-900 mb-6 tracking-tight">
             Start Your Journey <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 to-indigo-600">Risk-Free.</span>
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Join the verified network today. Experience the full platform before committing to a plan.
          </p>
        </div>

        {/* Animated Blobs */}
        <div className="absolute top-0 left-1/2 w-full -translate-x-1/2 h-full z-0 opacity-40 pointer-events-none">
             <div className="absolute top-0 right-1/4 -mt-20 w-96 h-96 rounded-full bg-rose-100 blur-3xl animate-blob"></div>
             <div className="absolute bottom-0 left-1/4 -mb-20 w-80 h-80 rounded-full bg-brand-100 blur-3xl animate-blob" style={{ animationDelay: '2s' }}></div>
        </div>
      </div>

      <div className="pb-24 relative z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* STEP 1: Free Trial Block (Hero Card) */}
          {(() => {
            // Calculate trial end date for display
            const trialEndDate = coach?.trialEndsAt ? new Date(coach.trialEndsAt) : null;
            const formattedTrialEnd = trialEndDate?.toLocaleDateString('en-GB', {
              day: 'numeric', month: 'long', year: 'numeric'
            });
            const today = new Date();
            const daysRemaining = trialEndDate
              ? Math.max(0, Math.ceil((trialEndDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)))
              : 0;

            // Logged-in trial user: show status, not CTA
            if (isAuthenticated && coach?.subscriptionStatus === 'trial') {
              return (
                <div className="bg-white rounded-3xl shadow-xl border-2 border-green-300 overflow-hidden mb-16">
                  <div className="md:flex">
                    <div className="p-10 md:w-2/3">
                      <div className="flex items-center mb-6">
                        <span className="bg-green-100 text-green-700 font-bold px-3 py-1 rounded-full text-xs uppercase tracking-wide mr-3 border border-green-200">Active</span>
                        <h2 className="text-3xl font-display font-bold text-slate-900">Free Trial Active</h2>
                      </div>
                      <p className="text-slate-600 mb-6 text-lg leading-relaxed">
                        Your free trial is running. Enjoy full platform access — your profile is visible to clients and you're receiving matches.
                      </p>
                      <ul className="space-y-3">
                        <li className="flex items-center text-slate-700 font-medium">
                          <div className="bg-green-100 p-1 rounded-full mr-3"><CheckCircle className="h-4 w-4 text-green-600" /></div>
                          Verified Profile
                        </li>
                        <li className="flex items-center text-slate-700 font-medium">
                          <div className="bg-green-100 p-1 rounded-full mr-3"><CheckCircle className="h-4 w-4 text-green-600" /></div>
                          Unlimited Matches
                        </li>
                        <li className="flex items-center text-slate-700 font-medium">
                          <div className="bg-green-100 p-1 rounded-full mr-3"><CheckCircle className="h-4 w-4 text-green-600" /></div>
                          Full Platform Access
                        </li>
                      </ul>
                    </div>
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-10 md:w-1/3 flex flex-col justify-center items-center border-t md:border-t-0 md:border-l border-green-100">
                      <div className="text-center w-full">
                        <div className="w-full bg-green-100 border-2 border-green-300 text-green-800 text-center py-4 rounded-xl font-bold shadow-lg mb-4">
                          ✓ Trial Active
                        </div>
                        {formattedTrialEnd && (
                          <p className="text-sm font-semibold text-slate-700">
                            Ends <span className="text-rose-600">{formattedTrialEnd}</span>
                          </p>
                        )}
                        {daysRemaining > 0 && (
                          <p className="text-xs text-slate-500 mt-1">{daysRemaining} {daysRemaining === 1 ? 'day' : 'days'} remaining</p>
                        )}
                        <p className="text-xs text-slate-400 mt-4">Select a plan below to upgrade before your trial ends.</p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            }

            // Logged-in expired user: show expired status
            if (isAuthenticated && coach?.subscriptionStatus === 'expired') {
              return (
                <div className="bg-white rounded-3xl shadow-xl border-2 border-red-200 overflow-hidden mb-16">
                  <div className="md:flex">
                    <div className="p-10 md:w-2/3">
                      <div className="flex items-center mb-6">
                        <span className="bg-red-100 text-red-700 font-bold px-3 py-1 rounded-full text-xs uppercase tracking-wide mr-3 border border-red-200">Expired</span>
                        <h2 className="text-3xl font-display font-bold text-slate-900">Free Trial Ended</h2>
                      </div>
                      <p className="text-slate-600 mb-6 text-lg leading-relaxed">
                        Your free trial has ended and your profile is currently hidden from clients. Upgrade to a paid plan to become visible again.
                      </p>
                      <ul className="space-y-3">
                        <li className="flex items-center text-slate-700 font-medium">
                          <div className="bg-green-100 p-1 rounded-full mr-3"><CheckCircle className="h-4 w-4 text-green-600" /></div>
                          Profile visible to clients
                        </li>
                        <li className="flex items-center text-slate-700 font-medium">
                          <div className="bg-green-100 p-1 rounded-full mr-3"><CheckCircle className="h-4 w-4 text-green-600" /></div>
                          Unlimited Matches
                        </li>
                        <li className="flex items-center text-slate-700 font-medium">
                          <div className="bg-green-100 p-1 rounded-full mr-3"><CheckCircle className="h-4 w-4 text-green-600" /></div>
                          Full Platform Access
                        </li>
                      </ul>
                    </div>
                    <div className="bg-gradient-to-br from-red-50 to-orange-50 p-10 md:w-1/3 flex flex-col justify-center items-center border-t md:border-t-0 md:border-l border-red-100">
                      <div className="text-center w-full">
                        <div className="w-full bg-red-100 border-2 border-red-300 text-red-800 text-center py-4 rounded-xl font-bold shadow-lg mb-4">
                          Trial Ended
                        </div>
                        {formattedTrialEnd && (
                          <p className="text-sm font-semibold text-slate-700">
                            Ended <span className="text-rose-600">{formattedTrialEnd}</span>
                          </p>
                        )}
                        <p className="text-xs text-slate-400 mt-4">Select a plan below to reactivate your profile.</p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            }

            // Logged-in active subscriber or lifetime: hide the trial section entirely
            if (isAuthenticated && (coach?.subscriptionStatus === 'active' || coach?.subscriptionStatus === 'lifetime')) {
              return null;
            }

            // Not logged in (or onboarding): show the standard "Start Free Trial" card
            return (
              <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden mb-16 transform hover:-translate-y-1 transition-transform duration-300">
                <div className="md:flex">
                  <div className="p-10 md:w-2/3">
                    <div className="flex items-center mb-6">
                      <span className="bg-brand-100 text-brand-700 font-bold px-3 py-1 rounded-full text-xs uppercase tracking-wide mr-3 border border-brand-200">All plans include</span>
                      <h2 className="text-3xl font-display font-bold text-slate-900">30-Day Free Trial</h2>
                    </div>
                    <p className="text-slate-600 mb-8 text-lg leading-relaxed">
                      Sign up now - no payment required. Your trial activates automatically when you verify your email. Build your profile, get verified, and receive matches with zero risk.
                    </p>
                    <ul className="space-y-3">
                      <li className="flex items-center text-slate-700 font-medium">
                        <div className="bg-green-100 p-1 rounded-full mr-3"><CheckCircle className="h-4 w-4 text-green-600" /></div>
                        Verified Profile
                      </li>
                      <li className="flex items-center text-slate-700 font-medium">
                        <div className="bg-green-100 p-1 rounded-full mr-3"><CheckCircle className="h-4 w-4 text-green-600" /></div>
                        Unlimited Matches
                      </li>
                      <li className="flex items-center text-slate-700 font-medium">
                        <div className="bg-green-100 p-1 rounded-full mr-3"><CheckCircle className="h-4 w-4 text-green-600" /></div>
                        Full Platform Access
                      </li>
                    </ul>
                  </div>
                  <div className="bg-gradient-to-br from-brand-50 to-indigo-50 p-10 md:w-1/3 flex flex-col justify-center items-center border-t md:border-t-0 md:border-l border-slate-100">
                    <div className="text-center w-full">
                      <p className="text-slate-400 text-sm line-through mb-1">Standard: £30</p>
                      <p className="text-5xl font-display font-black text-slate-900 mb-2">£0</p>
                      <p className="text-sm text-slate-500 font-bold uppercase tracking-wide mb-8">for 30 days</p>
                      <Link
                        to="/coach-signup"
                        className="block w-full bg-slate-900 text-white text-center py-4 rounded-xl font-bold hover:bg-slate-800 shadow-lg hover:shadow-xl transition-all"
                      >
                        Start Free Trial
                      </Link>
                      <p className="text-xs text-slate-400 mt-4">No credit card required</p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* STEP 2: Paid Plans Section */}
          <div className="text-center mb-12">
             <span className="text-brand-600 font-bold text-sm uppercase tracking-widest">Choose Your Plan</span>
             <h3 className="text-3xl font-display font-bold text-slate-900 mt-2">Lock in your price anytime</h3>
             <p className="text-slate-500 mt-2">Add payment during your trial - billing starts after your 30 days end. Lock in the Early Bird 50% discount for life.</p>
          </div>

          {/* Paid Plans Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">

            {/* Monthly Plan */}
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8 flex flex-col items-center hover:shadow-md transition-shadow">
              <h3 className="text-xl font-bold text-slate-900">Monthly</h3>
              <p className="text-sm text-slate-500 mt-1">Pay as you go</p>

              <div className="mt-8 flex flex-col items-center justify-center">
                <span className="text-sm text-slate-400 font-medium line-through">Standard: £30/mo</span>
                <div className="flex items-baseline mt-2">
                  <span className="text-5xl font-display font-black text-slate-900">
                    £{monthlyPrice}
                  </span>
                  <span className="ml-1 text-base font-medium text-slate-500">/mo</span>
                </div>
              </div>

              <div className="mt-8 border-t border-slate-100 w-full pt-8">
                 <p className="text-xs font-extrabold text-slate-400 uppercase tracking-widest mb-4 text-center">Includes</p>
                 <ul className="space-y-4 text-left text-sm text-slate-600">
                    <li className="flex items-center">
                      <CheckCircle className="h-5 w-5 text-brand-500 mr-3" />
                      Verified Profile
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="h-5 w-5 text-brand-500 mr-3" />
                      Unlimited Matches
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="h-5 w-5 text-brand-500 mr-3" />
                      No long contract / flexible option
                    </li>
                 </ul>
              </div>

              <button
                onClick={() => handlePlanSelection('monthly')}
                disabled={hasActiveSubscription && currentBillingCycle === 'monthly'}
                className="mt-8 w-full bg-brand-600 text-white py-4 rounded-xl font-bold hover:bg-brand-700 transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {hasActiveSubscription && currentBillingCycle === 'monthly'
                  ? 'Current Plan'
                  : hasActiveSubscription && currentBillingCycle === 'annual'
                  ? 'Switch to Monthly'
                  : isOnTrial
                  ? 'Upgrade to Monthly'
                  : 'Select Monthly'}
              </button>
            </div>

            {/* Annual Plan */}
            <div className="bg-white rounded-3xl shadow-xl border-2 border-brand-500 p-8 flex flex-col items-center relative transform md:-translate-y-4">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-brand-600 to-indigo-600 text-white text-xs px-4 py-1.5 rounded-full font-bold uppercase tracking-wider shadow-md">
                Best Value
              </div>
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
                 <p className="text-xs font-extrabold text-slate-400 uppercase tracking-widest mb-4 text-center">Everything in Monthly, plus</p>
                 <ul className="space-y-4 text-left text-sm text-slate-600">
                    <li className="flex items-center">
                      <CheckCircle className="h-5 w-5 text-brand-500 mr-3" />
                      Verified Profile
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="h-5 w-5 text-brand-500 mr-3" />
                      Unlimited Matches
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="h-5 w-5 text-brand-500 mr-3" />
                      Fixed plan for 12 months - with 2 months saving vs monthly plan
                    </li>
                 </ul>
              </div>

              <button
                onClick={() => handlePlanSelection('annual')}
                disabled={hasActiveSubscription && currentBillingCycle === 'annual'}
                className="mt-8 w-full bg-gradient-to-r from-brand-600 to-indigo-600 text-white py-4 rounded-xl font-bold hover:from-brand-700 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {hasActiveSubscription && currentBillingCycle === 'annual'
                  ? 'Current Plan'
                  : hasActiveSubscription && currentBillingCycle === 'monthly'
                  ? 'Switch to Annual'
                  : isOnTrial
                  ? 'Upgrade to Annual'
                  : 'Select Annual'}
              </button>
            </div>
          </div>

          {/* Lock in Price Guarantee */}
          <div className="mt-16 flex justify-center">
             <div className="bg-yellow-50 rounded-2xl border border-yellow-100 p-6 inline-flex items-center space-x-4 max-w-2xl">
                <div className="bg-yellow-100 p-3 rounded-full flex-shrink-0 text-yellow-600">
                   <Zap className="h-6 w-6" />
                </div>
                <div className="text-left">
                   <p className="font-bold text-slate-900">Lock in Your Price Today</p>
                   <p className="text-sm text-slate-600">
                     {isAuthenticated && coach?.subscriptionStatus === 'trial' ? (
                       <>Upgrade now and continue using your trial. Payment will be charged after your trial ends. Lock in the 50% Early Bird discount for life.</>
                     ) : isAuthenticated && coach?.subscriptionStatus === 'expired' ? (
                       <>Your trial has ended. Payment starts today when you select a plan. Lock in the 50% Early Bird discount for life.</>
                     ) : (
                       <>Select a paid plan during your 30-day free trial and get this 50% discount locked in for life. Payment starts after your trial ends.</>
                     )}
                   </p>
                </div>
             </div>
          </div>

        </div>
      </div>
    </div>
  );
};
