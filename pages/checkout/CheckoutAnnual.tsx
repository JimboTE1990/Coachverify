import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, ArrowLeft, Loader, Lock, Zap } from 'lucide-react';
import { SUBSCRIPTION_CONSTANTS } from '../../constants/subscription';
import { supabase } from '../../lib/supabase';
import { createCheckoutSession, getPriceId } from '../../services/stripeService';
import type { Coach } from '../../types';
import { getActivePromoCode, validateDiscountCode, calculateDiscount, DiscountCode } from '../../config/discountCodes';

// Checkout page for annual subscription plan
export const CheckoutAnnual: React.FC = () => {
  const navigate = useNavigate();
  const [currentCoach, setCurrentCoach] = useState<Coach | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [appliedDiscount, setAppliedDiscount] = useState<DiscountCode | null>(null);
  const [discountAmount, setDiscountAmount] = useState(0);

  useEffect(() => {
    checkAuthAndFetchCoach();

    // Check for discount code from session storage
    const promoCode = getActivePromoCode();
    if (promoCode) {
      const validation = validateDiscountCode(promoCode);
      if (validation.valid && validation.discount) {
        setAppliedDiscount(validation.discount);
        const calc = calculateDiscount(validation.discount, SUBSCRIPTION_CONSTANTS.ANNUAL_PRICE_GBP, 'annual');
        setDiscountAmount(calc.discountAmount);
      }
    }
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
        .from('coach_profiles')
        .select('id, subscription_status, billing_cycle, trial_ends_at')
        .eq('user_id', session.user.id)
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

      // Check if already has active PAID subscription - redirect to dashboard to manage
      // Trial users should be allowed to upgrade!
      if (coach.subscription_status === 'active') {
        console.log('User already has active paid subscription - redirecting to dashboard');
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

  const handleCheckout = async () => {
    setIsProcessing(true);
    setError(null);

    try {
      console.log('[CheckoutAnnual] Initiating Stripe Checkout for coach:', currentCoach?.id);

      // Get coach email from session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.email) {
        throw new Error('Unable to retrieve your email. Please try logging in again.');
      }

      // Only pass trialEndsAt if user has an active trial (not expired)
      const trialEndsAtForStripe = hasActiveTrial ? currentCoach?.trialEndsAt : undefined;

      // Create Stripe Checkout Session
      await createCheckoutSession({
        priceId: getPriceId('annual'),
        coachId: currentCoach!.id,
        coachEmail: session.user.email,
        billingCycle: 'annual',
        trialEndsAt: trialEndsAtForStripe,
        discountCode: appliedDiscount?.code,
        stripePromotionCodeId: appliedDiscount?.stripePromotionCodeId,
      });

      // Note: Stripe will redirect to checkout page
      // This code won't execute after redirect
    } catch (err: any) {
      console.error('[CheckoutAnnual] Checkout error:', err);
      setIsProcessing(false);
      setError(err.message || 'Failed to initiate checkout. Please try again.');
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

  // Only offer a trial to users who have never had one (onboarding status, no trial_ends_at)
  // Expired users and users who have already had a trial must pay immediately
  const isExpiredUser = currentCoach?.subscriptionStatus === 'expired';
  const hasHadTrialBefore = !!currentCoach?.trialEndsAt || currentCoach?.trialUsed;
  const isTrialIncluded = hasActiveTrial || (!hasHadTrialBefore && !isExpiredUser);
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

          {/* Right Column - Checkout Button */}
          <div>
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
              <h2 className="text-2xl font-display font-bold text-slate-900 mb-6">
                Secure Checkout
              </h2>

              {/* Error Display */}
              {error && (
                <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4">
                  <p className="text-sm text-red-700 font-medium">{error}</p>
                </div>
              )}

              {/* Payment Summary */}
              <div className="bg-slate-50 rounded-xl p-6 mb-6">
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wide mb-4">
                  Payment Summary
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between text-slate-700">
                    <span>Plan:</span>
                    <span className="font-bold">Annual</span>
                  </div>
                  <div className="flex justify-between text-slate-700">
                    <span>Base Price:</span>
                    <span className={discountAmount > 0 ? 'line-through text-slate-400' : 'font-bold'}>£{SUBSCRIPTION_CONSTANTS.ANNUAL_PRICE_GBP}/year</span>
                  </div>
                  {discountAmount > 0 && appliedDiscount && (
                    <>
                      <div className="flex justify-between text-green-700 font-medium">
                        <span>Discount ({appliedDiscount.code}):</span>
                        <span>-£{discountAmount.toFixed(2)}</span>
                      </div>
                      <div className="pt-2 border-t border-slate-200">
                        <div className="flex justify-between text-slate-900 text-lg">
                          <span className="font-bold">Final Price:</span>
                          <span className="font-black">£{(SUBSCRIPTION_CONSTANTS.ANNUAL_PRICE_GBP - discountAmount).toFixed(2)}/year</span>
                        </div>
                      </div>
                    </>
                  )}
                  <div className="flex justify-between text-green-700 font-medium">
                    <span>Savings vs Monthly:</span>
                    <span>£{monthlySavings + (discountAmount > 0 ? discountAmount : 0)}/year</span>
                  </div>
                  {hasActiveTrial && (
                    <div className="pt-3 border-t border-slate-200">
                      <div className="flex justify-between text-green-700 font-medium">
                        <span>Trial continues until:</span>
                        <span>{formattedTrialEndDate}</span>
                      </div>
                      <div className="flex justify-between text-slate-700 mt-2">
                        <span>First charge:</span>
                        <span className="font-bold">£{SUBSCRIPTION_CONSTANTS.ANNUAL_PRICE_GBP} on {formattedTrialEndDate}</span>
                      </div>
                    </div>
                  )}
                  {!hasActiveTrial && isTrialIncluded && (
                    <div className="pt-3 border-t border-slate-200">
                      <div className="flex justify-between text-green-700 font-medium">
                        <span>Free trial:</span>
                        <span>30 days</span>
                      </div>
                      <div className="flex justify-between text-slate-700 mt-2">
                        <span>First charge:</span>
                        <span className="font-bold">In 30 days</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Secure Checkout Button */}
              <button
                onClick={handleCheckout}
                disabled={isProcessing}
                className="w-full bg-brand-600 text-white py-4 rounded-xl font-bold hover:bg-brand-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-lg hover:shadow-xl"
              >
                {isProcessing ? (
                  <>
                    <Loader className="animate-spin h-5 w-5 mr-2" />
                    Redirecting to secure checkout...
                  </>
                ) : (
                  <>
                    <Lock className="h-5 w-5 mr-2" />
                    Continue to Secure Payment
                  </>
                )}
              </button>

              {/* Security Badge */}
              <div className="mt-6 flex items-center justify-center text-slate-500 text-xs">
                <Lock className="h-3 w-3 mr-2" />
                <span>Secured by Stripe - Your payment details are encrypted and never stored on our servers</span>
              </div>

              <div className="mt-4 text-center">
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
