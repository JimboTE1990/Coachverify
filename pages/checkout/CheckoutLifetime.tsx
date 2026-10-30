import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, ArrowLeft, Loader, Lock, Zap, Tag, X, Infinity } from 'lucide-react';
import { SUBSCRIPTION_CONSTANTS } from '../../constants/subscription';
import { STRIPE_PRICES } from '../../lib/stripe';
import { supabase } from '../../lib/supabase';
import { createCheckoutSession } from '../../services/stripeService';
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
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      // No session — show the page so they can see the discount code field;
      // the checkout button will redirect to login when they try to pay.
      if (!session || sessionError || !session.user) {
        setIsLoading(false);
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
        } as unknown as Coach);
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
    // Not logged in — redirect to login, return here after
    if (!currentCoach) {
      navigate('/coach-login', { state: { from: { pathname: '/checkout/lifetime' } } });
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      console.log('[CheckoutLifetime] Initiating Stripe Checkout for coach:', currentCoach?.id);
      console.log('[CheckoutLifetime] STRIPE_PRICES.lifetime:', STRIPE_PRICES.lifetime);

      // Get coach email from session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.email) {
        throw new Error('Unable to retrieve your email. Please try logging in again.');
      }

      // Validate price ID before proceeding
      if (!STRIPE_PRICES.lifetime) {
        throw new Error('Lifetime price ID not configured. Please check environment variables.');
      }

      console.log('[CheckoutLifetime] Creating checkout session with params:', {
        priceId: STRIPE_PRICES.lifetime,
        coachId: currentCoach!.id,
        coachEmail: session.user.email,
        billingCycle: 'lifetime',
        hasDiscount: !!appliedDiscount?.code,
      });

      // Create Stripe Checkout Session for lifetime payment
      await createCheckoutSession({
        priceId: STRIPE_PRICES.lifetime,
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1e3a5f]"></div>
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
          {/* Left Column — dark navy plan summary */}
          <div>
            <div className="bg-[#111c32] rounded-2xl shadow-xl p-8 relative overflow-hidden">
              {/* Subtle glow */}
              <div className="absolute inset-0 opacity-10 pointer-events-none">
                <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-yellow-300 blur-3xl" />
                <div className="absolute -bottom-16 -left-16 w-48 h-48 rounded-full bg-blue-400 blur-3xl" />
              </div>

              <div className="relative z-10">
                {/* Annual anchor + heading + badge */}
                <div className="mb-1">
                  <span className="text-sm font-semibold text-blue-300/50 line-through">Annual Membership &nbsp;£{SUBSCRIPTION_CONSTANTS.ANNUAL_PRICE_GBP}/yr</span>
                </div>
                <div className="flex justify-between items-center mb-5">
                  <div className="flex items-center gap-2">
                    <Infinity className="h-5 w-5 text-yellow-400" />
                    <h2 className="text-xl font-bold text-white">Lifetime Membership</h2>
                  </div>
                  <span className="bg-yellow-400 text-[#111c32] text-xs font-bold px-3 py-1 rounded-full flex items-center justify-center text-center">
                    Founding offer
                  </span>
                </div>

                {/* Price */}
                <div className="mb-2">
                  <div className="flex items-baseline gap-3">
                    <span className="text-5xl font-display font-black text-white">
                      £{finalPrice}
                    </span>
                    <span className="text-base font-bold text-blue-200">one-time payment</span>
                  </div>
                  {discountAmount > 0 && (
                    <p className="text-sm text-blue-300/60 line-through mt-1">
                      Was £{SUBSCRIPTION_CONSTANTS.LIFETIME_PRICE_GBP}
                    </p>
                  )}
                </div>
                <p className="text-sm text-blue-300/70 mb-6 leading-relaxed">
                  No renewals, no annual fees. Full access to every feature, including everything we build in future.
                </p>

                {/* Closing notice */}
                <div className="bg-white/8 border border-yellow-400/25 rounded-xl px-4 py-3 mb-6">
                  <p className="text-xs text-blue-100 font-semibold">
                    Closes at 100 coaches or 31 December 2026, whichever comes first.
                  </p>
                </div>

                {/* Features 2-col */}
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3 mb-6">
                  <li className="flex items-start gap-2 text-sm text-blue-100">
                    <CheckCircle className="h-4 w-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                    <span>Accreditation verified and shown on your profile</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm text-blue-100">
                    <CheckCircle className="h-4 w-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                    <span>Your own link:<br />coachdog.co.uk/yourname</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm text-blue-100">
                    <CheckCircle className="h-4 w-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                    <span>Open, transparent client ratings</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm text-blue-100">
                    <CheckCircle className="h-4 w-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                    <span>Client Q&A community</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm text-blue-100">
                    <CheckCircle className="h-4 w-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                    <span>Collaboration space for coach projects</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm text-blue-100">
                    <CheckCircle className="h-4 w-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                    <span>Every future feature, included</span>
                  </li>
                </ul>

                {/* Founder badge highlight */}
                <div className="bg-white/8 border border-yellow-400/30 rounded-xl p-4 flex items-center gap-4">
                  <div className="w-16 h-16 flex-shrink-0 rounded-full border-2 border-yellow-400 bg-yellow-400/10 flex flex-col items-center justify-center gap-0.5">
                    <span className="text-yellow-400 text-[8px] font-black uppercase tracking-widest leading-none">FOUNDER</span>
                    <span className="text-yellow-400 text-xl font-black leading-tight">100</span>
                  </div>
                  <div>
                    <p className="text-white font-bold text-sm">Permanent Founder badge</p>
                    <p className="text-blue-300/60 text-xs mt-0.5">Added to your profile once all founding places are filled.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column — checkout form */}
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
                    <span className="font-bold flex items-center gap-1">
                      <Infinity className="h-4 w-4 text-[#1e3a5f]" />
                      Lifetime Access
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
                            🎉 {appliedDiscount.displayName} — {appliedDiscount.description}
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
                  <div className="bg-[#111c32] rounded-lg p-3 mt-3">
                    <p className="text-xs text-yellow-300 font-semibold text-center">
                      One-time payment · No recurring fees · Lifetime access
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
                        className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f] uppercase"
                        autoFocus
                      />
                      <button
                        onClick={handleApplyDiscount}
                        className="bg-[#1e3a5f] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#2B4170] transition-colors"
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
                    className="flex items-center text-sm text-slate-500 hover:text-[#1e3a5f] transition-colors"
                  >
                    <Tag className="h-4 w-4 mr-1.5" />
                    Have a discount code?
                  </button>
                )}
              </div>

              {/* Checkout Button */}
              <button
                onClick={handleCheckout}
                disabled={isProcessing}
                className="w-full bg-yellow-400 text-[#111c32] py-4 rounded-xl font-bold text-lg hover:bg-yellow-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-md hover:shadow-lg"
              >
                {isProcessing ? (
                  <>
                    <Loader className="animate-spin h-5 w-5 mr-2" />
                    Redirecting to secure checkout...
                  </>
                ) : (
                  <>
                    <Lock className="h-5 w-5 mr-2" />
                    Claim your founding place
                  </>
                )}
              </button>

              {/* Security note */}
              <div className="mt-5 flex items-center justify-center text-slate-400 text-xs gap-1.5">
                <Lock className="h-3 w-3" />
                <span>Secured by Stripe — payment details encrypted, never stored</span>
              </div>

              <div className="mt-3 text-center">
                <p className="text-xs text-slate-400">
                  By proceeding, you agree to our Terms of Service and Privacy Policy
                </p>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-100">
                <p className="text-xs text-slate-400 text-center leading-relaxed">
                  *Lifetime access refers to the lifetime of the platform, not the purchaser. Subject to our Terms of Service.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
