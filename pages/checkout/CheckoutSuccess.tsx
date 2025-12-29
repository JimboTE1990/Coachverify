import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { CheckCircle, ArrowRight, Calendar, CreditCard, Loader } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

export const CheckoutSuccess: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { coach, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);

  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    // Wait for auth to load
    if (!authLoading) {
      setLoading(false);
    }
  }, [authLoading]);

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Loader className="h-12 w-12 animate-spin text-brand-600 mx-auto mb-4" />
          <p className="text-slate-600">Loading subscription details...</p>
        </div>
      </div>
    );
  }

  if (!sessionId) {
    navigate('/for-coaches');
    return null;
  }

  // Use coach data to determine subscription details
  const billingCycle = coach?.billingCycle || 'monthly';
  const amount = billingCycle === 'monthly' ? 15 : 150;
  const hasActiveTrial = coach?.subscriptionStatus === 'trial' && coach?.trialEndsAt;
  const trialEndDate = coach?.trialEndsAt ? new Date(coach.trialEndsAt) : null;

  // Calculate next billing date
  const getNextBillingDate = () => {
    if (hasActiveTrial && trialEndDate) {
      return trialEndDate;
    }
    // If no trial, billing starts from today + billing period
    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + (billingCycle === 'monthly' ? 30 : 365));
    return nextDate;
  };

  const nextBillingDate = getNextBillingDate();

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-2xl w-full">
        {/* Success Card */}
        <div className="bg-white rounded-3xl shadow-xl border border-slate-200 p-8 md:p-12 text-center">
          {/* Success Icon */}
          <div className="flex justify-center mb-6">
            <div className="bg-green-100 rounded-full p-4">
              <CheckCircle className="h-16 w-16 text-green-600" />
            </div>
          </div>

          {/* Heading */}
          <h1 className="text-3xl md:text-4xl font-display font-bold text-slate-900 mb-4">
            Payment Confirmed!
          </h1>

          <p className="text-lg text-slate-600 mb-8">
            {hasActiveTrial
              ? `You're now a premium CoachVerify user. Your plan starts after your free trial ends on ${trialEndDate?.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}.`
              : 'Thank you for subscribing to CoachVerify. Your premium account is now active.'}
          </p>

          {/* Subscription Details */}
          <div className="bg-slate-50 rounded-2xl p-6 mb-8 text-left">
            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">
              Your Plan
            </h2>

            <div className="space-y-4">
              {/* Plan Type */}
              <div className="flex items-center justify-between">
                <span className="text-slate-700">Billing Cycle</span>
                <span className="font-semibold text-slate-900">
                  {billingCycle === 'monthly' ? 'Monthly' : 'Annual'}
                </span>
              </div>

              {/* Amount */}
              <div className="flex items-center justify-between">
                <span className="text-slate-700">Price</span>
                <span className="font-semibold text-slate-900">
                  £{amount.toFixed(2)}/{billingCycle === 'monthly' ? 'month' : 'year'}
                </span>
              </div>

              {/* Status */}
              <div className="flex items-center justify-between">
                <span className="text-slate-700">Status</span>
                <span className="inline-flex items-center bg-green-100 text-green-800 text-sm font-semibold px-3 py-1 rounded-full">
                  {hasActiveTrial ? 'Premium (Free Trial Active)' : 'Active'}
                </span>
              </div>

              {/* Next Billing Date */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                <div className="flex items-center text-slate-700">
                  <Calendar className="h-4 w-4 mr-2" />
                  <span>Next Billing Date</span>
                </div>
                <span className="font-semibold text-slate-900">
                  {nextBillingDate.toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </span>
              </div>
            </div>
          </div>

          {/* What Happens Next */}
          <div className="bg-blue-50 rounded-2xl p-6 mb-8 text-left border border-blue-100">
            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">
              What Happens Next
            </h2>

            <ul className="space-y-3 text-sm text-slate-700">
              {hasActiveTrial ? (
                <>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
                    <span>
                      Your profile is now live and visible to users looking for coaches
                    </span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
                    <span>
                      Your free trial continues until {trialEndDate?.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
                    <span>
                      You have full access to all premium features during your trial
                    </span>
                  </li>
                  <li className="flex items-start">
                    <CreditCard className="h-5 w-5 text-blue-600 mr-3 flex-shrink-0 mt-0.5" />
                    <span>
                      After your trial ends, you'll be charged £{amount.toFixed(2)} on {trialEndDate?.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
                    <span>
                      You can cancel anytime before {trialEndDate?.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })} from your dashboard settings
                    </span>
                  </li>
                </>
              ) : (
                <>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
                    <span>
                      Your profile is now live and visible to users looking for coaches
                    </span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
                    <span>
                      You have full access to all CoachVerify premium features
                    </span>
                  </li>
                  <li className="flex items-start">
                    <CreditCard className="h-5 w-5 text-blue-600 mr-3 flex-shrink-0 mt-0.5" />
                    <span>
                      Your next billing date is {nextBillingDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })} (£{amount.toFixed(2)})
                    </span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
                    <span>
                      Your subscription will automatically renew {billingCycle === 'monthly' ? 'monthly' : 'annually'}
                    </span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
                    <span>
                      You can cancel anytime from your dashboard settings
                    </span>
                  </li>
                </>
              )}
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="space-y-4">
            <Link
              to="/for-coaches"
              className="block w-full bg-gradient-to-r from-brand-600 to-indigo-600 text-white py-4 rounded-xl font-bold hover:from-brand-700 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg"
            >
              Go to Dashboard
              <ArrowRight className="h-5 w-5 inline ml-2" />
            </Link>

            <Link
              to="/search"
              className="block w-full bg-white text-slate-700 py-4 rounded-xl font-bold border-2 border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all"
            >
              Browse Coaches
            </Link>
          </div>

          {/* Support Link */}
          <p className="text-sm text-slate-500 mt-8">
            Need help? Contact us at{' '}
            <a href="mailto:support@coachverify.com" className="text-brand-600 hover:underline">
              support@coachverify.com
            </a>
          </p>
        </div>

        {/* Lock-in Reminder */}
        <div className="mt-8 bg-yellow-50 rounded-2xl p-6 border border-yellow-200 text-center">
          <p className="text-sm font-semibold text-slate-900 mb-1">
            🎉 You've locked in the 50% Early Bird discount!
          </p>
          <p className="text-xs text-slate-600">
            This discounted rate is yours for life while you remain subscribed. Regular price: £
            {billingCycle === 'monthly' ? '30' : '300'}/{billingCycle === 'monthly' ? 'mo' : 'yr'}
          </p>
        </div>
      </div>
    </div>
  );
};
