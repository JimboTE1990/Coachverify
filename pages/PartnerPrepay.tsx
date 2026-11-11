import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle, Loader, Lock, Tag, X, Infinity, Copy, Check } from 'lucide-react';
import { SUBSCRIPTION_CONSTANTS } from '../constants/subscription';
import { validateDiscountCode, calculateDiscount, DiscountCode } from '../config/discountCodes';
import { createPrepaymentCheckoutSession, confirmPrepayment } from '../services/prepaymentService';

// Lets a not-yet-accredited partner-school coach pay the full Lifetime price
// now and get a one-time code, redeemed later at normal signup. No login -
// they don't have a CoachDog account yet.
export const PartnerPrepay: React.FC = () => {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const justPaid = searchParams.get('paid') === '1' && !!sessionId;

  const [email, setEmail] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [appliedDiscount, setAppliedDiscount] = useState<DiscountCode | null>(null);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [discountInputValue, setDiscountInputValue] = useState('');
  const [discountError, setDiscountError] = useState<string | null>(null);
  const [showDiscountInput, setShowDiscountInput] = useState(false);

  const [confirming, setConfirming] = useState(justPaid);
  const [promoCode, setPromoCode] = useState<string | null>(null);
  const [amountPaid, setAmountPaid] = useState<number | null>(null);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const confirmStarted = useRef(false);

  useEffect(() => {
    if (!justPaid || !sessionId || confirmStarted.current) return;
    confirmStarted.current = true;
    confirmPrepayment(sessionId)
      .then((result) => {
        setPromoCode(result.promoCode);
        setAmountPaid(result.amountPaidPence);
      })
      .catch((err) => setConfirmError(err.message || 'Failed to confirm payment'))
      .finally(() => setConfirming(false));
  }, [justPaid, sessionId]);

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

  const handlePay = async () => {
    setError(null);
    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }
    setIsProcessing(true);
    try {
      await createPrepaymentCheckoutSession({
        email: email.trim(),
        discountCode: appliedDiscount?.code,
        stripePromotionCodeId: appliedDiscount?.stripePromotionCodeId,
      });
      // Stripe will redirect; this code won't execute after that.
    } catch (err) {
      setIsProcessing(false);
      setError(err instanceof Error ? err.message : 'Failed to start checkout. Please try again.');
    }
  };

  const handleCopy = () => {
    if (!promoCode) return;
    navigator.clipboard.writeText(promoCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const finalPrice = SUBSCRIPTION_CONSTANTS.LIFETIME_PRICE_GBP - discountAmount;

  if (confirming) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Loader className="h-10 w-10 animate-spin text-[#1e3a5f] mx-auto mb-4" />
          <p className="text-slate-600">Confirming your payment...</p>
        </div>
      </div>
    );
  }

  if (justPaid && (promoCode || confirmError)) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-200 p-8 text-center">
          {promoCode ? (
            <>
              <div className="flex justify-center mb-6">
                <div className="bg-green-100 rounded-full p-4">
                  <CheckCircle className="h-12 w-12 text-green-600" />
                </div>
              </div>
              <h1 className="text-2xl font-display font-bold text-slate-900 mb-3">Payment received</h1>
              <p className="text-slate-600 mb-6">
                {amountPaid != null && `You paid £${(amountPaid / 100).toFixed(2)}. `}
                Save this code - you'll use it to get your Lifetime membership for free once you sign up as an accredited coach.
              </p>
              <div className="bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl p-5 mb-4 flex items-center justify-between gap-3">
                <span className="font-mono text-lg font-bold text-slate-900 tracking-wide">{promoCode}</span>
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 text-sm font-semibold text-[#1e3a5f] hover:text-[#2B4170] transition-colors flex-shrink-0"
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                When you're accredited, sign up as normal and enter this code in the "Have a discount code?" box at checkout.
              </p>
            </>
          ) : (
            <>
              <h1 className="text-2xl font-display font-bold text-slate-900 mb-3">Something went wrong</h1>
              <p className="text-slate-600">{confirmError}</p>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - plan summary */}
          <div>
            <div className="bg-[#111c32] rounded-2xl shadow-xl p-8 relative overflow-hidden">
              <div className="absolute inset-0 opacity-10 pointer-events-none">
                <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-yellow-300 blur-3xl" />
                <div className="absolute -bottom-16 -left-16 w-48 h-48 rounded-full bg-blue-400 blur-3xl" />
              </div>
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-5">
                  <Infinity className="h-5 w-5 text-yellow-400" />
                  <h2 className="text-xl font-bold text-white">Lifetime Membership - Pre-payment</h2>
                </div>
                <div className="mb-2">
                  <div className="flex items-baseline gap-3">
                    <span className="text-5xl font-display font-black text-white">£{finalPrice}</span>
                    <span className="text-base font-bold text-blue-200">one-time payment</span>
                  </div>
                  {discountAmount > 0 && (
                    <p className="text-sm text-blue-300/60 line-through mt-1">
                      Was £{SUBSCRIPTION_CONSTANTS.LIFETIME_PRICE_GBP}
                    </p>
                  )}
                </div>
                <p className="text-sm text-blue-300/70 mb-6 leading-relaxed">
                  For coaches training with a CoachDog partner school who aren't accredited yet. Pay now, and once you're accredited and sign up, you'll get Lifetime access for free using the code you receive today.
                </p>
                <div className="bg-white/8 border border-yellow-400/25 rounded-xl px-4 py-3">
                  <p className="text-xs text-blue-100 font-semibold">
                    No CoachDog account needed yet - just your email.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - payment form */}
          <div>
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
              <h2 className="text-2xl font-display font-bold text-slate-900 mb-6">
                Secure Checkout
              </h2>

              {error && (
                <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4">
                  <p className="text-sm text-red-700 font-medium">{error}</p>
                </div>
              )}

              <div className="mb-6">
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Your email address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]"
                />
              </div>

              <div className="bg-slate-50 rounded-xl p-6 mb-6">
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wide mb-4">
                  Payment Summary
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between text-slate-700">
                    <span>Base Price:</span>
                    <span className={discountAmount > 0 ? 'line-through text-slate-400' : 'font-bold'}>
                      £{SUBSCRIPTION_CONSTANTS.LIFETIME_PRICE_GBP}
                    </span>
                  </div>
                  {discountAmount > 0 && appliedDiscount && (
                    <div className="flex justify-between text-green-700 font-medium">
                      <span>Discount ({appliedDiscount.code}):</span>
                      <span>-£{discountAmount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="pt-3 border-t border-slate-200">
                    <div className="flex justify-between text-slate-900 text-lg">
                      <span className="font-bold">Total Due Today:</span>
                      <span className="font-black text-2xl">£{finalPrice.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                {appliedDiscount ? (
                  <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-xl px-4 py-3">
                    <div className="flex items-center text-green-700">
                      <Tag className="h-4 w-4 mr-2 flex-shrink-0" />
                      <span className="font-medium text-sm">{appliedDiscount.code} applied</span>
                    </div>
                    <button onClick={handleRemoveDiscount} className="text-green-600 hover:text-green-800 ml-2" aria-label="Remove discount">
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
                      <button onClick={handleApplyDiscount} className="bg-[#1e3a5f] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#2B4170] transition-colors">
                        Apply
                      </button>
                      <button onClick={() => { setShowDiscountInput(false); setDiscountError(null); }} className="text-slate-400 hover:text-slate-600 px-2" aria-label="Cancel">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    {discountError && <p className="mt-1 text-xs text-red-600">{discountError}</p>}
                  </div>
                ) : (
                  <button onClick={() => setShowDiscountInput(true)} className="flex items-center text-sm text-slate-500 hover:text-[#1e3a5f] transition-colors">
                    <Tag className="h-4 w-4 mr-1.5" />
                    Have a discount code?
                  </button>
                )}
              </div>

              <button
                onClick={handlePay}
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
                    Pay £{finalPrice.toFixed(2)} now
                  </>
                )}
              </button>

              <div className="mt-5 flex items-center justify-center text-slate-400 text-xs gap-1.5">
                <Lock className="h-3 w-3" />
                <span>Secured by Stripe - payment details encrypted, never stored</span>
              </div>

              <div className="mt-4 text-center">
                <Link to="/" className="text-xs text-slate-400 hover:text-slate-600 underline">Back to CoachDog</Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
