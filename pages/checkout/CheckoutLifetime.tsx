import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, ArrowLeft, Loader, Lock, Zap, Tag, X, Infinity } from 'lucide-react';
import { SUBSCRIPTION_CONSTANTS } from '../../constants/subscription';
import { supabase } from '../../lib/supabase';
import { createCheckoutSession, getPriceId } from '../../services/stripeService';
import type { Coach } from '../../types';
import { getActivePromoCode, validateDiscountCode, calculateDiscount, DiscountCode } from '../../config/discountCodes';

// Checkout page for lifetime access plan
export const CheckoutLifetime: React.FC = () => {
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
        const calc = calculateDiscount(validation.discount, SUBSCRIPTION_CONSTANTS.LIFETIME_PRICE_GBP, 'lifetime');
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
    const calc = calculateDiscount(validation.discount, SUBSCRIPTION_CONSTANTS.LIFETIME_PRICE_GBP, 'lifetime');
    if (calc.discountAmount === 0 && validation.discount.type !== 'trial_extension') {
      setDiscountError('This code is not valid for the lifetime plan');
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
          billing_cycle: 'lifetime',
        } as Coach);
        setIsLoading(false);
        return;
      }

      // Check if already has lifetime access - redirect to dashboard
      if (coach.subscription_status === 'lifetime') {
        console.log('User already has lifetime access - redirecting to dashboard');
        navigate('/for-coaches', { replace: true });
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
      console.log('[CheckoutLifetime] Initiating Stripe Checkout for coach:', currentCoach?.id);

      // Get coach email from session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.email) {
        throw new Error('Unable to retrieve your email. Please try logging in again.');
      }

      // Create Stripe Checkout Session for lifetime payment
      await createCheckoutSession({
        priceId: SUBSCRIPTION_CONSTANTS.LIFETIME_STRIPE_PRICE_ID,
        coachId: currentCoach!.id,
        coachEmail: session.user.email,
        billingCycle: 'lifetime',
        discountCode: appliedDiscount?.code,
        stripePromotionCodeId: appliedDiscount?.stripePromotionCodeId,
      });

      // Note: Stripe will redirect to checkout page
      // This code won't execute after redirect
    } catch (err: any) {
      console.error('[CheckoutLifetime] Checkout error:', err);
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

  const finalPrice = SUBSCRIPTION_CONSTANTS.LIFETIME_PRICE_GBP - discountAmount;

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
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl shadow-xl border-2 border-amber-400 p-8 relative">
              {/* Limited Offer Badge */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs px-4 py-1.5 rounded-full font-bold uppercase tracking-wider shadow-md animate-pulse">
                ⚡ Limited Offer
              </div>

              <h2 className="text-2xl font-display font-bold text-slate-900 mb-6 mt-2 flex items-center">
                Lifetime Access
                <Infinity className="h-6 w-6 ml-2 text-amber-600" />
              </h2>

              {/* Price Display */}
              <div className="mb-8">
                <div className="flex items-baseline mb-2">
                  <span className="text-5xl font-display font-black text-slate-900">
                    £{finalPrice}
                  </span>
                  <span className="ml-2 text-slate-600">one-time payment</span>
                </div>
                {discountAmount > 0 && (
                  <p className="text-sm text-slate-500 line-through mb-2">
                    Was £{SUBSCRIPTION_CONSTANTS.LIFETIME_PRICE_GBP}
                  </p>
                )}
                <div className="inline-flex items-center bg-amber-100 px-3 py-1.5 rounded-full border border-amber-300 mb-4">
                  <span className="text-sm font-bold text-amber-800">
                    🔥 Pay once, access forever - never pay again!
                  </span>
                </div>
                <div className="mt-4 bg-gradient-to-r from-amber-100 to-orange-100 rounded-lg p-4 border-2 border-amber-300">
                  <p className="text-sm font-bold text-amber-900 mb-2 flex items-center">
                    <Zap className="h-4 w-4 mr-2 text-amber-600" />
                    Limited Time & Quantity Offer
                  </p>
                  <p className="text-xs text-amber-800">
                    This exclusive lifetime offer is available for a limited time only. Once sold out or the offer ends, it will not return at this price. Secure your lifetime access today!
                  </p>
                </div>
              </div>

              {/* Features */}
              <div className="border-t border-amber-200 pt-6">
                <p className="text-xs font-extrabold text-slate-500 uppercase tracking-widest mb-4">
                  Everything Included
                </p>
                <ul className="space-y-4">
                  <li className="flex items-center text-slate-700">
                    <div className="bg-green-100 p-1 rounded-full mr-3">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    </div>
                    <span className="font-medium">Professional verification of accreditations displayed for clients to review</span>
                  </li>
                  <li className="flex items-center text-slate-700">
                    <div className="bg-green-100 p-1 rounded-full mr-3">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    </div>
                    <span className="font-medium">Professional landing page with shareable link for social media channels</span>
                  </li>
                  <li className="flex items-center text-slate-700">
                    <div className="bg-green-100 p-1 rounded-full mr-3">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    </div>
                    <span className="font-medium">Client reviews to enhance credibility and build trust</span>
                  </li>
                  <li className="flex items-center text-slate-700">
                    <div className="bg-green-100 p-1 rounded-full mr-3">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    </div>
                    <span className="font-medium">Unlimited client matches</span>
                  </li>
                  <li className="flex items-center text-slate-700">
                    <div className="bg-amber-100 p-1 rounded-full mr-3">
                      <Infinity className="h-4 w-4 text-amber-600" />
                    </div>
                    <span className="font-bold text-amber-900">Lifetime access - no recurring fees ever!</span>
                  </li>
                </ul>
              </div>

              {/* Value Comparison */}
              <div className="mt-8 bg-white/80 rounded-lg p-4 border border-amber-200">
                <div className="flex items-start">
                  <Zap className="h-5 w-5 text-amber-600 mr-3 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-slate-900 mb-1">
                      Incredible Value
                    </p>
                    <p className="text-xs text-slate-600">
                      Annual plan costs £{SUBSCRIPTION_CONSTANTS.ANNUAL_PRICE_GBP}/year. Lifetime access pays for itself in just over one year, then it's completely free forever!
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
                    <span className="font-bold flex items-center">
                      Lifetime Access
                      <Infinity className="h-4 w-4 ml-1 text-amber-600" />
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-700">
                    <span>Base Price:</span>
                    <span className={discountAmount > 0 ? 'line-through text-slate-400' : 'font-bold'}>
                      £{SUBSCRIPTION_CONSTANTS.LIFETIME_PRICE_GBP}
                    </span>
                  </div>
                  {discountAmount > 0 && appliedDiscount && (
                    <>
                      <div className="flex justify-between text-green-700 font-medium">
                        <span>Discount ({appliedDiscount.code}):</span>
                        <span>-£{discountAmount.toFixed(2)}</span>
                      </div>
                      {appliedDiscount.displayName && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-2">
                          <p className="text-xs text-green-800 font-medium">
                            🎉 {appliedDiscount.displayName} - {appliedDiscount.description}
                          </p>
                        </div>
                      )}
                    </>
                  )}
                  <div className="pt-3 border-t border-slate-200">
                    <div className="flex justify-between text-slate-900 text-lg">
                      <span className="font-bold">Total Due Today:</span>
                      <span className="font-black text-2xl">£{finalPrice.toFixed(2)}</span>
                    </div>
                  </div>
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mt-3">
                    <p className="text-xs text-amber-900 font-medium text-center">
                      ✓ One-time payment • No recurring fees • Lifetime access
                    </p>
                  </div>
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
                className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white py-4 rounded-xl font-bold hover:from-amber-600 hover:to-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-lg hover:shadow-xl"
              >
                {isProcessing ? (
                  <>
                    <Loader className="animate-spin h-5 w-5 mr-2" />
                    Redirecting to secure checkout...
                  </>
                ) : (
                  <>
                    <Lock className="h-5 w-5 mr-2" />
                    Secure Lifetime Access Now
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

              {/* Lifetime Disclaimer */}
              <div className="mt-4 pt-4 border-t border-slate-200">
                <p className="text-xs text-slate-400 text-center leading-relaxed">
                  *Lifetime access refers to the lifetime of the software platform, not the purchaser's lifetime. Access is subject to our Terms of Service.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
