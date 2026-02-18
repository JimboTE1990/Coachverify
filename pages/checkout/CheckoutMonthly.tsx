import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, ArrowLeft, Loader, Lock, Tag, X } from 'lucide-react';
import { SUBSCRIPTION_CONSTANTS } from '../../constants/subscription';
import { supabase } from '../../lib/supabase';
import { createCheckoutSession, getPriceId } from '../../services/stripeService';
import type { Coach } from '../../types';
import { getActivePromoCode, validateDiscountCode, calculateDiscount, DiscountCode } from '../../config/discountCodes';

// Checkout page for monthly subscription plan
export const CheckoutMonthly: React.FC = () => {
  const navigate = useNavigate();
  const [currentCoach, setCurrentCoach] = useState<Coach | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [appliedDiscount, setAppliedDiscount] = useState<DiscountCode | null>(null);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [discountInputValue, setDiscountInputValue] = useState('');
  const [discountError, setDiscountError] = useState<string | null>(null);
  const [showDiscountInput, setShowDiscountInput] = useState(false);

  useEffect(() => {
    checkAuthAndFetchCoach();

    // Check for discount code from session storage
    const promoCode = getActivePromoCode();
    if (promoCode) {
      const validation = validateDiscountCode(promoCode);
      if (validation.valid && validation.discount) {
        setAppliedDiscount(validation.discount);
        const calc = calculateDiscount(validation.discount, SUBSCRIPTION_CONSTANTS.MONTHLY_PRICE_GBP, 'monthly');
        setDiscountAmount(calc.discountAmount);
        setDiscountInputValue(promoCode.toUpperCase());
      }
    }
  }, []);

  const handleApplyDiscount = () => {
    setDiscountError(null);
    const code = discountInputValue.trim();
    if (!code) return;
    const validation = validateDiscountCode(code);
    if (!validation.valid || !validation.discount) {
      setDiscountError(validation.error || 'Invalid code');
      return;
    }
    const calc = calculateDiscount(validation.discount, SUBSCRIPTION_CONSTANTS.MONTHLY_PRICE_GBP, 'monthly');
    if (calc.discountAmount === 0 && validation.discount.type !== 'trial_extension') {
      setDiscountError('This code is not valid for the monthly plan');
      return;
    }
    setAppliedDiscount(validation.discount);
    setDiscountAmount(calc.discountAmount);
    setShowDiscountInput(false);
  };

  const handleRemoveDiscount = () => {
    setAppliedDiscount(null);
    setDiscountAmount(0);
    setDiscountInputValue('');
    setDiscountError(null);
  };

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
          billing_cycle: 'monthly',
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

      // Auto-detect expired trials: if DB says 'trial' but trial_ends_at is in the past, treat as expired
      const subscriptionStatus = (
        coach.subscription_status === 'trial' &&
        coach.trial_ends_at &&
        new Date(coach.trial_ends_at) < new Date()
      ) ? 'expired' : coach.subscription_status;

      console.log('User eligible for checkout:', subscriptionStatus);

      // Map snake_case DB fields to camelCase Coach type
      setCurrentCoach({
        id: coach.id,
        subscriptionStatus,
        billingCycle: coach.billing_cycle,
        trialEndsAt: coach.trial_ends_at ?? undefined,
      } as Coach);
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
      console.log('[CheckoutMonthly] Initiating Stripe Checkout for coach:', currentCoach?.id);

      // Get coach email from session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.email) {
        throw new Error('Unable to retrieve your email. Please try logging in again.');
      }

      // Create Stripe Checkout Session
      // Only pass trialEndsAt if user has an active trial (not expired)
      const trialEndsAtForStripe = hasActiveTrial ? currentCoach?.trialEndsAt : undefined;

      await createCheckoutSession({
        priceId: getPriceId('monthly'),
        coachId: currentCoach!.id,
        coachEmail: session.user.email,
        billingCycle: 'monthly',
        trialEndsAt: trialEndsAtForStripe,
        discountCode: appliedDiscount?.code,
        stripePromotionCodeId: appliedDiscount?.stripePromotionCodeId,
      });

      // Note: Stripe will redirect to checkout page
      // This code won't execute after redirect
    } catch (err: any) {
      console.error('[CheckoutMonthly] Checkout error:', err);
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

  // Check if user has an ACTIVE trial — must be 'trial' status AND trial end date is in the future
  const hasActiveTrial = currentCoach?.subscriptionStatus === 'trial' &&
    currentCoach?.trialEndsAt &&
    new Date(currentCoach.trialEndsAt) > new Date();
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
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
              <h2 className="text-2xl font-display font-bold text-slate-900 mb-6">
                Monthly Plan
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
                    <p className="text-sm text-slate-600">
                      Then £{SUBSCRIPTION_CONSTANTS.MONTHLY_PRICE_GBP}/month
                    </p>
                    <div className="mt-4 bg-green-50 rounded-lg p-3 border border-green-200">
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
                    <p className="text-sm text-slate-600">
                      Then £{SUBSCRIPTION_CONSTANTS.MONTHLY_PRICE_GBP}/month
                    </p>
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
                        £{SUBSCRIPTION_CONSTANTS.MONTHLY_PRICE_GBP}
                      </span>
                      <span className="ml-2 text-slate-600">/month</span>
                    </div>
                    <p className="text-sm text-slate-600">Billed monthly</p>
                    <div className="mt-4 bg-blue-50 rounded-lg p-3 border border-blue-200">
                      <p className="text-sm text-blue-800">
                        Your subscription starts today and renews monthly.
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
                    <span>No long contract / flexible option</span>
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
                <p className="text-sm font-semibold text-slate-900 mb-1">
                  Lock in 50% Early Bird Discount
                </p>
                <p className="text-xs text-slate-600">
                  This discounted rate (£15 instead of £30) is locked in for life while you remain subscribed.
                </p>
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
                    <span className="font-bold">Monthly</span>
                  </div>
                  <div className="flex justify-between text-slate-700">
                    <span>Base Price:</span>
                    <span className={discountAmount > 0 ? 'line-through text-slate-400' : 'font-bold'}>£{SUBSCRIPTION_CONSTANTS.MONTHLY_PRICE_GBP}/month</span>
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
                          <span className="font-black">£{(SUBSCRIPTION_CONSTANTS.MONTHLY_PRICE_GBP - discountAmount).toFixed(2)}/month</span>
                        </div>
                      </div>
                    </>
                  )}
                  {hasActiveTrial && (
                    <div className="pt-3 border-t border-slate-200">
                      <div className="flex justify-between text-green-700 font-medium">
                        <span>Trial continues until:</span>
                        <span>{formattedTrialEndDate}</span>
                      </div>
                      <div className="flex justify-between text-slate-700 mt-2">
                        <span>First charge:</span>
                        <span className="font-bold">£{SUBSCRIPTION_CONSTANTS.MONTHLY_PRICE_GBP} on {formattedTrialEndDate}</span>
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

              {/* Discount Code */}
              <div className="mb-6">
                {appliedDiscount ? (
                  <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-xl px-4 py-3">
                    <div className="flex items-center text-green-700">
                      <Tag className="h-4 w-4 mr-2 flex-shrink-0" />
                      <span className="font-medium text-sm">{appliedDiscount.code} applied</span>
                      {appliedDiscount.displayName && (
                        <span className="ml-1 text-xs text-green-600">— {appliedDiscount.displayName}</span>
                      )}
                    </div>
                    <button
                      onClick={handleRemoveDiscount}
                      className="text-green-600 hover:text-green-800 ml-2"
                      aria-label="Remove discount"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : showDiscountInput ? (
                  <div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={discountInputValue}
                        onChange={(e) => setDiscountInputValue(e.target.value.toUpperCase())}
                        onKeyDown={(e) => e.key === 'Enter' && handleApplyDiscount()}
                        placeholder="Enter discount code"
                        className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 uppercase"
                        autoFocus
                      />
                      <button
                        onClick={handleApplyDiscount}
                        className="bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-700 transition-colors"
                      >
                        Apply
                      </button>
                      <button
                        onClick={() => { setShowDiscountInput(false); setDiscountError(null); }}
                        className="text-slate-400 hover:text-slate-600 px-2"
                        aria-label="Cancel"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    {discountError && (
                      <p className="mt-1 text-xs text-red-600">{discountError}</p>
                    )}
                  </div>
                ) : (
                  <button
                    onClick={() => setShowDiscountInput(true)}
                    className="flex items-center text-sm text-slate-500 hover:text-brand-600 transition-colors"
                  >
                    <Tag className="h-4 w-4 mr-1.5" />
                    Have a discount code?
                  </button>
                )}
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
