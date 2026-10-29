import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { createBillingPortalSession } from '../../services/stripeService';
import { ArrowLeft, CheckCircle, Lock } from 'lucide-react';

export const ChangePlanConfirm: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { coach, loading } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);

  const newPlan = searchParams.get('to');
  const currentPlan = coach?.billingCycle;

  // Redirect if invalid
  useEffect(() => {
    if (!loading && (!coach || !newPlan || newPlan === currentPlan)) {
      navigate('/for-coaches?tab=subscription');
    }
  }, [loading, coach, newPlan, currentPlan, navigate]);

  if (loading || !coach) {
    return null;
  }

  // Calculate ACTUAL next billing date based on current subscription (same logic as ChangePlan)
  const calculateNextBillingDate = (): Date => {
    if (coach.subscriptionStatus === 'trial' && coach.trialEndsAt) {
      return new Date(coach.trialEndsAt);
    }
    if (coach.subscriptionEndsAt) {
      return new Date(coach.subscriptionEndsAt);
    }
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

  const plans = {
    monthly: { price: '£15', period: '/mo' },
    annual: { price: '£150', period: '/yr' }
  };

  const handleConfirmChange = async () => {
    if (!coach.stripeCustomerId) {
      alert('Could not find your billing account. Please contact support.');
      return;
    }
    setIsProcessing(true);
    try {
      // Open Stripe Customer Portal where the plan switch is completed
      await createBillingPortalSession(coach.stripeCustomerId);
    } catch (error) {
      console.error('[ChangePlanConfirm] Error opening billing portal:', error);
      alert('Failed to open billing portal. Please try again.');
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <Link
          to={`/subscription/change-plan?to=${newPlan}`}
          className="flex items-center text-slate-600 hover:text-slate-900 mb-8 transition-colors"
        >
          <ArrowLeft className="h-5 w-5 mr-2" /> Back
        </Link>

        <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-lg">
          <h1 className="text-3xl font-display font-bold text-slate-900 mb-6">
            Confirm Your Plan Change
          </h1>

          {/* Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-6">
            <div className="space-y-3">
              <div className="flex items-center text-blue-800">
                <CheckCircle className="h-5 w-5 mr-3 flex-shrink-0" />
                <span className="font-medium">
                  {newPlan === 'annual'
                    ? 'Switching to Annual takes effect immediately — you\'ll be charged the annual rate with any applicable proration.'
                    : 'Switching to Monthly takes effect at the end of your current billing period on ' + formattedDate + '.'}
                </span>
              </div>
              <div className="flex items-center text-blue-800">
                <Lock className="h-5 w-5 mr-3 flex-shrink-0" />
                <span className="font-medium">You'll be taken to our secure billing page to complete the switch.</span>
              </div>
            </div>
          </div>

          {/* Summary */}
          <div className="bg-slate-50 rounded-xl p-6 mb-6">
            <h3 className="font-bold text-slate-900 mb-4">Summary</h3>
            <div className="space-y-3 text-slate-700">
              <div className="flex justify-between">
                <span>Current plan:</span>
                <span className="font-bold">
                  {currentPlan === 'monthly' ? 'Monthly' : 'Annual'} {plans[currentPlan as keyof typeof plans]?.price}{plans[currentPlan as keyof typeof plans]?.period}
                </span>
              </div>
              <div className="flex justify-between">
                <span>New plan:</span>
                <span className="font-bold text-brand-600">
                  {newPlan === 'monthly' ? 'Monthly' : 'Annual'} {plans[newPlan as keyof typeof plans]?.price}{plans[newPlan as keyof typeof plans]?.period}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Effective date:</span>
                <span className="font-bold">{formattedDate}</span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-3">
                <span>First charge:</span>
                <span className="font-bold text-slate-900">
                  {plans[newPlan as keyof typeof plans]?.price} on {formattedDate}
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-4">
            <Link
              to={`/subscription/change-plan?to=${newPlan}`}
              className="flex-1 bg-slate-100 text-slate-700 py-4 rounded-xl font-bold hover:bg-slate-200 transition-colors text-center"
            >
              Back
            </Link>
            <button
              onClick={handleConfirmChange}
              disabled={isProcessing}
              className="flex-1 bg-brand-600 text-white py-4 rounded-xl font-bold hover:bg-brand-700 transition-colors disabled:opacity-50 flex items-center justify-center"
            >
              {isProcessing ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Processing...
                </>
              ) : (
                <>
                  <Lock className="h-5 w-5 mr-2" />
                  Confirm Plan Change
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
