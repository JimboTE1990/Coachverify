import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, ArrowLeft, AlertCircle, Zap } from 'lucide-react';
import { PaymentForm } from '../../components/checkout/PaymentForm';
import { SUBSCRIPTION_CONSTANTS } from '../../constants/subscription';
import { supabase } from '../../lib/supabase';
import type { Coach } from '../../types';
import type { PaymentFormData, PaymentResult } from '../../types/payment';

// Checkout page for annual subscription plan
export const CheckoutAnnual: React.FC = () => {
  const navigate = useNavigate();
  const [currentCoach, setCurrentCoach] = useState<Coach | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuthAndFetchCoach();
  }, []);

  const checkAuthAndFetchCoach = async () => {
    try {
      // Check authentication with session first (faster than getUser)
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      // CRITICAL: If no session or error getting session, redirect to login immediately
      if (!session || sessionError || !session.user) {
        console.log('No valid session - redirecting to login');
        navigate('/for-coaches', { replace: true });
        return;
      }

      console.log('User authenticated:', session.user.id);

      // User is authenticated, fetch their coach profile
      const { data: coach, error } = await supabase
        .from('coaches')
        .select('id, subscription_status, trial_used, billing_cycle, trial_ends_at')
        .eq('id', session.user.id)
        .single();

      if (error) {
        console.error('Error fetching coach:', error);
        // Profile doesn't exist yet or error - let them proceed with checkout
        // They're authenticated, so create minimal coach object
        setCurrentCoach({
          id: session.user.id,
          subscription_status: 'onboarding',
          trial_used: false,
          billing_cycle: 'annual',
        } as Coach);
        setIsLoading(false);
        return;
      }

      // Check if already has active subscription - redirect to dashboard to manage
      if (coach.subscription_status === 'active' || coach.subscription_status === 'trial') {
        console.log('User already has active subscription - redirecting to dashboard');
        navigate('/for-coaches', { replace: true });
        return;
      }

      console.log('User eligible for checkout:', coach.subscription_status);

      setCurrentCoach(coach as Coach);
      setIsLoading(false);
    } catch (err) {
      console.error('Auth check failed:', err);
      // On unexpected error, redirect to login
      navigate('/for-coaches');
    }
  };

  const handlePaymentSubmit = async (formData: PaymentFormData): Promise<PaymentResult> => {
    setIsProcessing(true);
    setError(null);

    try {
      // Mock payment processing
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Check for test failure card
      const cardNumber = formData.cardNumber.replace(/\s/g, '');
      if (cardNumber === '4000000000000002') {
        throw new Error('Your card was declined. Please try a different payment method.');
      }

      // Calculate ACTUAL billing dates based on trial status
      const now = new Date();
      let trialEndDate: Date | null = null;
      let firstChargeDate: Date;
      let isTrialIncluded: boolean;

      // If user has an ACTIVE trial (trial started on email verification)
      if (currentCoach?.subscriptionStatus === 'trial' && currentCoach?.trialEndsAt) {
        trialEndDate = new Date(currentCoach.trialEndsAt);
        firstChargeDate = trialEndDate;
        isTrialIncluded = true;
        console.log('[CheckoutAnnual] Using existing trial end date:', trialEndDate);
      }
      // Legacy: User hasn't used trial yet (old flow)
      else if (!currentCoach?.trialUsed) {
        trialEndDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
        firstChargeDate = trialEndDate;
        isTrialIncluded = true;
        console.log('[CheckoutAnnual] Creating new 30-day trial');
      }
      // No trial available - immediate billing
      else {
        firstChargeDate = now;
        isTrialIncluded = false;
        console.log('[CheckoutAnnual] No trial - immediate billing');
      }

      // Update coach subscription in database
      const updateData: any = {
        subscription_status: isTrialIncluded ? 'trial' : 'active',
        billing_cycle: 'annual',
        trial_used: true,
        profile_visible: true,
        dashboard_access: true,
      };

      if (isTrialIncluded) {
        updateData.trial_ends_at = trialEndDate?.toISOString();
      } else {
        updateData.last_payment_date = now.toISOString();
        updateData.subscription_ends_at = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000).toISOString();
      }

      const { error: updateError } = await supabase
        .from('coaches')
        .update(updateData)
        .eq('id', currentCoach?.id);

      if (updateError) throw updateError;

      // Navigate to success page
      navigate('/checkout/success', {
        state: {
          billingCycle: 'annual',
          amount: SUBSCRIPTION_CONSTANTS.ANNUAL_PRICE_GBP,
          isTrialIncluded,
          firstChargeDate: firstChargeDate?.toISOString(),
        },
      });

      return {
        success: true,
        paymentMethodId: 'pm_mock_' + Date.now(),
        subscriptionId: 'sub_mock_' + Date.now(),
      };
    } catch (err: any) {
      const errorMessage = err.message || 'Payment failed. Please try again.';
      setError(errorMessage);
      return {
        success: false,
        error: errorMessage,
      };
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600"></div>
      </div>
    );
  }

  // Check if user has an ACTIVE trial (new auth flow - trial starts on email verification)
  const hasActiveTrial = currentCoach?.subscriptionStatus === 'trial' && currentCoach?.trialEndsAt;
  const trialEndDate = hasActiveTrial && currentCoach?.trialEndsAt
    ? new Date(currentCoach.trialEndsAt)
    : null;
  const formattedTrialEndDate = trialEndDate?.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  // Legacy: Check if trial was already used (for users before new auth flow)
  const hasUsedTrial = currentCoach?.trialUsed || false;
  const isTrialIncluded = hasActiveTrial || !hasUsedTrial;
  const monthlySavings = (SUBSCRIPTION_CONSTANTS.MONTHLY_PRICE_GBP * 12) - SUBSCRIPTION_CONSTANTS.ANNUAL_PRICE_GBP;

  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <button
          onClick={() => navigate('/pricing')}
          className="flex items-center text-slate-600 hover:text-slate-900 mb-8 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Pricing
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Plan Summary */}
          <div>
            <div className="bg-white rounded-2xl shadow-xl border-2 border-brand-500 p-8 relative">
              {/* Best Value Badge */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-brand-600 to-indigo-600 text-white text-xs px-4 py-1.5 rounded-full font-bold uppercase tracking-wider shadow-md">
                Best Value
              </div>

              <h2 className="text-2xl font-display font-bold text-slate-900 mb-6 mt-2">
                Annual Plan
              </h2>

              {/* Price Display */}
              <div className="mb-8">
                {hasActiveTrial ? (
                  <>
                    {/* Active trial - show when it ends and when billing starts */}
                    <div className="flex items-baseline mb-2">
                      <span className="text-5xl font-display font-black text-slate-900">£0</span>
                      <span className="ml-2 text-slate-600">until {formattedTrialEndDate}</span>
                    </div>
                    <p className="text-sm text-slate-600 mb-2">
                      Then £{SUBSCRIPTION_CONSTANTS.ANNUAL_PRICE_GBP}/year
                    </p>
                    <div className="inline-flex items-center bg-green-50 px-3 py-1 rounded-full border border-green-200 mb-2">
                      <span className="text-sm font-bold text-green-700">
                        Save £{monthlySavings} per year
                      </span>
                    </div>
                    <div className="mt-2 bg-green-50 rounded-lg p-3 border border-green-200">
                      <p className="text-sm text-green-800 font-medium">
                        ✓ Your trial continues until {formattedTrialEndDate}. First charge on {formattedTrialEndDate}.
                      </p>
                    </div>
                  </>
                ) : isTrialIncluded ? (
                  <>
                    {/* New trial for legacy users */}
                    <div className="flex items-baseline mb-2">
                      <span className="text-5xl font-display font-black text-slate-900">£0</span>
                      <span className="ml-2 text-slate-600">for 30 days</span>
                    </div>
                    <p className="text-sm text-slate-600 mb-2">
                      Then £{SUBSCRIPTION_CONSTANTS.ANNUAL_PRICE_GBP}/year
                    </p>
                    <div className="inline-flex items-center bg-green-50 px-3 py-1 rounded-full border border-green-200">
                      <span className="text-sm font-bold text-green-700">
                        Save £{monthlySavings} per year
                      </span>
                    </div>
                    <div className="mt-4 bg-green-50 rounded-lg p-3 border border-green-200">
                      <p className="text-sm text-green-800 font-medium">
                        🎉 Free trial included! Start today, first charge in 30 days.
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    {/* No trial - immediate billing */}
                    <div className="flex items-baseline mb-2">
                      <span className="text-5xl font-display font-black text-slate-900">
                        £{SUBSCRIPTION_CONSTANTS.ANNUAL_PRICE_GBP}
                      </span>
                      <span className="ml-2 text-slate-600">/year</span>
                    </div>
                    <p className="text-sm text-slate-600 mb-2">Billed annually</p>
                    <div className="inline-flex items-center bg-green-50 px-3 py-1 rounded-full border border-green-200">
                      <span className="text-sm font-bold text-green-700">
                        Save £{monthlySavings} vs monthly
                      </span>
                    </div>
                    <div className="mt-4 bg-blue-50 rounded-lg p-3 border border-blue-200">
                      <p className="text-sm text-blue-800">
                        Your subscription starts today and renews annually.
                      </p>
                    </div>
                  </>
                )}
              </div>

              {/* Features */}
              <div className="border-t border-slate-200 pt-6">
                <p className="text-xs font-extrabold text-slate-400 uppercase tracking-widest mb-4">
                  What's Included
                </p>
                <ul className="space-y-4">
                  <li className="flex items-center text-slate-700">
                    <div className="bg-green-100 p-1 rounded-full mr-3">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    </div>
                    <span>Verified Profile</span>
                  </li>
                  <li className="flex items-center text-slate-700">
                    <div className="bg-green-100 p-1 rounded-full mr-3">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    </div>
                    <span>Unlimited Matches</span>
                  </li>
                  <li className="flex items-center text-slate-700">
                    <div className="bg-green-100 p-1 rounded-full mr-3">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    </div>
                    <span>Fixed plan for 12 months - with 2 months saving vs monthly plan</span>
                  </li>
                  <li className="flex items-center text-slate-700">
                    <div className="bg-green-100 p-1 rounded-full mr-3">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    </div>
                    <span>Cancel anytime</span>
                  </li>
                </ul>
              </div>

              {/* Lock in Price Notice */}
              <div className="mt-8 bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                <div className="flex items-start">
                  <Zap className="h-5 w-5 text-yellow-600 mr-3 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-slate-900 mb-1">
                      Lock in 50% Early Bird Discount
                    </p>
                    <p className="text-xs text-slate-600">
                      This discounted rate (£150 instead of £300) is locked in for life while you remain subscribed.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Payment Form */}
          <div>
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
              <h2 className="text-2xl font-display font-bold text-slate-900 mb-6">
                Payment Details
              </h2>

              {/* Error messages hidden - logged to console for debugging */}

              <PaymentForm
                amount={SUBSCRIPTION_CONSTANTS.ANNUAL_PRICE_GBP}
                billingCycle="annual"
                isTrialIncluded={isTrialIncluded}
                onSubmit={handlePaymentSubmit}
                isProcessing={isProcessing}
              />

              <div className="mt-6 text-center">
                <p className="text-xs text-slate-500">
                  By proceeding, you agree to our Terms of Service and Privacy Policy
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
