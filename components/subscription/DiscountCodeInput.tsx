import React, { useState, useEffect } from 'react';
import { Check, X, Tag, Loader2 } from 'lucide-react';
import {
  validateDiscountCode,
  calculateDiscount,
  getActivePromoCode,
  clearActivePromoCode,
  DiscountCode
} from '../../config/discountCodes';

interface DiscountCodeInputProps {
  planId: 'monthly' | 'annual';
  planPrice: number;
  onDiscountApplied: (discount: DiscountCode | null, discountAmount: number) => void;
  autoApply?: boolean; // Auto-apply code from URL on mount
}

export const DiscountCodeInput: React.FC<DiscountCodeInputProps> = ({
  planId,
  planPrice,
  onDiscountApplied,
  autoApply = true,
}) => {
  const [codeInput, setCodeInput] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState<DiscountCode | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  // Auto-apply code from URL on mount
  useEffect(() => {
    if (autoApply) {
      const promoCode = getActivePromoCode();
      if (promoCode) {
        applyDiscountCode(promoCode);
      }
    }
  }, [planId, planPrice]); // Re-apply when plan changes

  const applyDiscountCode = (code: string) => {
    setIsValidating(true);
    setValidationError(null);

    // Simulate slight delay for UX
    setTimeout(() => {
      const validation = validateDiscountCode(code);

      if (!validation.valid || !validation.discount) {
        setValidationError(validation.error || 'Invalid code');
        setAppliedDiscount(null);
        onDiscountApplied(null, 0);
        setIsValidating(false);
        return;
      }

      // Calculate discount for this plan
      const discountCalc = calculateDiscount(validation.discount, planPrice, planId);

      if (discountCalc.discountAmount === 0) {
        setValidationError(discountCalc.description);
        setAppliedDiscount(null);
        onDiscountApplied(null, 0);
        setIsValidating(false);
        return;
      }

      // Success
      setAppliedDiscount(validation.discount);
      setValidationError(null);
      onDiscountApplied(validation.discount, discountCalc.discountAmount);
      setCodeInput(code.toUpperCase());
      setIsValidating(false);
    }, 300);
  };

  const handleApplyCode = () => {
    if (!codeInput.trim()) return;
    applyDiscountCode(codeInput);
  };

  const handleRemoveCode = () => {
    setAppliedDiscount(null);
    setCodeInput('');
    setValidationError(null);
    clearActivePromoCode();
    onDiscountApplied(null, 0);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleApplyCode();
    }
  };

  // Calculate discount details for display
  const discountCalc = appliedDiscount
    ? calculateDiscount(appliedDiscount, planPrice, planId)
    : null;

  return (
    <div className="space-y-3">
      {/* Input Section */}
      {!appliedDiscount && (
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">
            Discount Code
          </label>
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={codeInput}
                onChange={(e) => setCodeInput(e.target.value.toUpperCase())}
                onKeyPress={handleKeyPress}
                placeholder="Enter code (e.g., PARTNER2026)"
                className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent text-sm font-mono uppercase"
                disabled={isValidating}
              />
            </div>
            <button
              onClick={handleApplyCode}
              disabled={!codeInput.trim() || isValidating}
              className="px-6 py-3 bg-brand-600 text-white rounded-xl font-bold hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
            >
              {isValidating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Checking...
                </>
              ) : (
                'Apply'
              )}
            </button>
          </div>

          {/* Validation Error */}
          {validationError && (
            <div className="mt-2 flex items-center gap-2 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
              <X className="h-4 w-4 flex-shrink-0" />
              <span>{validationError}</span>
            </div>
          )}
        </div>
      )}

      {/* Applied Discount Display */}
      {appliedDiscount && discountCalc && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-xl p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 flex-1">
              <div className="bg-green-500 text-white rounded-full p-1.5 mt-0.5">
                <Check className="h-4 w-4" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-black text-slate-900 text-sm">
                    {appliedDiscount.displayName || appliedDiscount.code}
                  </p>
                  <span className="bg-green-600 text-white text-xs px-2 py-0.5 rounded-full font-bold">
                    {discountCalc.description}
                  </span>
                </div>
                {appliedDiscount.description && (
                  <p className="text-xs text-slate-600">{appliedDiscount.description}</p>
                )}
                <p className="text-sm font-bold text-green-700 mt-1">
                  You save £{discountCalc.discountAmount.toFixed(2)}
                </p>
              </div>
            </div>
            <button
              onClick={handleRemoveCode}
              className="text-slate-400 hover:text-slate-600 transition-colors"
              aria-label="Remove discount code"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
