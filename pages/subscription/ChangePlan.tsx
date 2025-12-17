import React, { useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { ArrowLeft, ArrowRight, CheckCircle } from 'lucide-react';

export const ChangePlan: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { coach, loading } = useAuth();

  const newPlan = searchParams.get('to'); // 'monthly' or 'annual'
  const currentPlan = coach?.billingCycle;

  // Redirect if invalid state
  useEffect(() => {
    if (!loading && (!coach || !newPlan || newPlan === currentPlan)) {
      navigate('/for-coaches?tab=subscription');
    }
  }, [loading, coach, newPlan, currentPlan, navigate]);

  if (loading || !coach) {
    return null;
  }

  // Calculate ACTUAL next billing date based on current subscription
  const calculateNextBillingDate = (): Date => {
    // If trial is active, billing starts when trial ends
    if (coach.subscriptionStatus === 'trial' && coach.trialEndsAt) {
      return new Date(coach.trialEndsAt);
    }

    // If subscription has an end date, use that
    if (coach.subscriptionEndsAt) {
      return new Date(coach.subscriptionEndsAt);
    }

    // If we have last payment date, calculate next billing
    if (coach.lastPaymentDate) {
      const lastPayment = new Date(coach.lastPaymentDate);
      const nextBilling = new Date(lastPayment);

      if (coach.billingCycle === 'annual') {
        nextBilling.setFullYear(lastPayment.getFullYear() + 1);
      } else {
        nextBilling.setMonth(lastPayment.getMonth() + 1);
      }

      return nextBilling;
    }

    // Fallback: 30 days from now (shouldn't normally happen)
    const fallback = new Date();
    fallback.setDate(fallback.getDate() + 30);
    return fallback;
  };

  const nextBillingDate = calculateNextBillingDate();
  const formattedDate = nextBillingDate.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  // Calculate how long until current plan ends
  const now = new Date();
  const daysUntilChange = Math.ceil((nextBillingDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  const monthsUntilChange = Math.floor(daysUntilChange / 30);

  // Calculate next renewal after billing date (when NEW plan would renew)
  const nextRenewal = new Date(nextBillingDate);
  if (newPlan === 'annual') {
    nextRenewal.setFullYear(nextRenewal.getFullYear() + 1);
  } else {
    nextRenewal.setMonth(nextRenewal.getMonth() + 1);
  }
  const formattedRenewal = nextRenewal.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const plans = {
    monthly: { price: '£15', period: '/mo', annual: '£180' },
    annual: { price: '£150', period: '/yr', annual: '£150', savings: '£30' }
  };

  const currentPlanInfo = plans[currentPlan as 'monthly' | 'annual'];
  const newPlanInfo = plans[newPlan as 'monthly' | 'annual'];

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <Link
          to="/for-coaches?tab=subscription"
          className="flex items-center text-slate-600 hover:text-slate-900 mb-8 transition-colors"
        >
          <ArrowLeft className="h-5 w-5 mr-2" /> Back to Subscription
        </Link>

        <h1 className="text-3xl font-display font-bold text-slate-900 mb-2">
          Change Your Plan
        </h1>
        <p className="text-slate-600 mb-8">
          Review the changes before confirming
        </p>

        {/* Side-by-side comparison */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Current Plan */}
          <div className="bg-white rounded-2xl border-2 border-slate-200 p-6">
            <div className="text-sm font-bold text-slate-500 uppercase tracking-wide mb-4">
              Current Plan
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-2">
              {currentPlan === 'monthly' ? 'Monthly' : 'Annual'}
            </h3>
            <div className="flex items-baseline mb-6">
              <span className="text-4xl font-display font-black text-slate-900">
                {currentPlanInfo?.price}
              </span>
              <span className="text-slate-500 ml-2">{currentPlanInfo?.period}</span>
            </div>
            <ul className="space-y-3">
              <li className="flex items-center text-slate-700">
                <CheckCircle className="h-5 w-5 text-slate-400 mr-3" />
                Verified Profile
              </li>
              <li className="flex items-center text-slate-700">
                <CheckCircle className="h-5 w-5 text-slate-400 mr-3" />
                Unlimited Matches
              </li>
            </ul>
          </div>

          {/* New Plan */}
          <div className="bg-gradient-to-br from-brand-50 to-indigo-50 rounded-2xl border-2 border-brand-500 p-6 relative">
            <div className="absolute -top-3 -right-3 bg-brand-600 text-white text-xs px-3 py-1 rounded-full font-bold">
              NEW
            </div>
            <div className="text-sm font-bold text-brand-700 uppercase tracking-wide mb-4">
              New Plan
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-2">
              {newPlan === 'monthly' ? 'Monthly' : 'Annual'}
            </h3>
            <div className="flex items-baseline mb-2">
              <span className="text-4xl font-display font-black text-slate-900">
                {newPlanInfo?.price}
              </span>
              <span className="text-slate-500 ml-2">{newPlanInfo?.period}</span>
            </div>
            {newPlan === 'annual' && (
              <div className="bg-green-100 text-green-800 text-sm px-3 py-1 rounded-md inline-block mb-6 font-bold">
                Save {newPlanInfo?.savings}/year
              </div>
            )}
            <ul className="space-y-3 mt-4">
              <li className="flex items-center text-slate-700">
                <CheckCircle className="h-5 w-5 text-brand-600 mr-3" />
                Verified Profile
              </li>
              <li className="flex items-center text-slate-700">
                <CheckCircle className="h-5 w-5 text-brand-600 mr-3" />
                Unlimited Matches
              </li>
              {newPlan === 'annual' && (
                <li className="flex items-center text-slate-700">
                  <CheckCircle className="h-5 w-5 text-brand-600 mr-3" />
                  2 months free vs monthly
                </li>
              )}
            </ul>
          </div>
        </div>

        {/* Billing Impact */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-8">
          <h3 className="text-xl font-bold text-slate-900 mb-4">How This Works</h3>

          {/* Clear explanation based on time remaining */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-blue-900 font-medium leading-relaxed">
              You are currently on a <span className="font-bold capitalize">{currentPlan}</span> plan which runs until{' '}
              <span className="font-bold">{formattedDate}</span>
              {monthsUntilChange > 0 && (
                <span> ({monthsUntilChange} month{monthsUntilChange !== 1 ? 's' : ''} remaining)</span>
              )}
              {monthsUntilChange === 0 && daysUntilChange > 0 && (
                <span> ({daysUntilChange} day{daysUntilChange !== 1 ? 's' : ''} remaining)</span>
              )}
              . When this date passes, you'll automatically move onto the{' '}
              <span className="font-bold capitalize">{newPlan}</span> plan.
            </p>
          </div>

          <div className="space-y-3 text-slate-700">
            <div className="flex items-start">
              <div className="bg-blue-100 p-1 rounded-full mr-3 mt-1">
                <CheckCircle className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <span className="font-medium">Your {currentPlan} plan continues until:</span>
                <span className="block text-slate-900 font-bold">{formattedDate}</span>
              </div>
            </div>
            <div className="flex items-start">
              <div className="bg-brand-100 p-1 rounded-full mr-3 mt-1">
                <CheckCircle className="h-4 w-4 text-brand-600" />
              </div>
              <div>
                <span className="font-medium">First charge on new {newPlan} plan:</span>
                <span className="block text-slate-900 font-bold">
                  {newPlanInfo?.price} on {formattedDate}
                </span>
              </div>
            </div>
            <div className="flex items-start">
              <div className="bg-green-100 p-1 rounded-full mr-3 mt-1">
                <CheckCircle className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <span className="font-medium">Next renewal after that:</span>
                <span className="block text-slate-900 font-bold">{formattedRenewal}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-4">
          <Link
            to="/for-coaches?tab=subscription"
            className="flex-1 bg-slate-100 text-slate-700 py-4 rounded-xl font-bold hover:bg-slate-200 transition-colors text-center"
          >
            Cancel
          </Link>
          <Link
            to={`/subscription/change-plan/confirm?to=${newPlan}`}
            className="flex-1 bg-brand-600 text-white py-4 rounded-xl font-bold hover:bg-brand-700 transition-colors flex items-center justify-center"
          >
            Continue to Confirm <ArrowRight className="h-5 w-5 ml-2" />
          </Link>
        </div>
      </div>
    </div>
  );
};
