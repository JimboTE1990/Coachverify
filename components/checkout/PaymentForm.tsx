import React, { useState } from 'react';
import { CreditCard, Lock, AlertCircle } from 'lucide-react';
import type { PaymentFormData, PaymentResult } from '../../types/payment';

interface PaymentFormProps {
  amount: number;
  billingCycle: 'monthly' | 'annual';
  isTrialIncluded: boolean;
  onSubmit: (formData: PaymentFormData) => Promise<PaymentResult>;
  isProcessing: boolean;
}

export const PaymentForm: React.FC<PaymentFormProps> = ({
  amount,
  billingCycle,
  isTrialIncluded,
  onSubmit,
  isProcessing,
}) => {
  const [formData, setFormData] = useState<PaymentFormData>({
    cardNumber: '',
    cardholderName: '',
    expiryMonth: '',
    expiryYear: '',
    cvv: '',
    billingPostcode: '',
  });

  const [errors, setErrors] = useState<Partial<Record<keyof PaymentFormData, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof PaymentFormData, boolean>>>({});

  // Luhn algorithm for card number validation
  const validateCardNumber = (cardNumber: string): boolean => {
    const cleaned = cardNumber.replace(/\s/g, '');
    if (!/^\d+$/.test(cleaned) || cleaned.length < 13 || cleaned.length > 19) {
      return false;
    }

    let sum = 0;
    let isEven = false;

    for (let i = cleaned.length - 1; i >= 0; i--) {
      let digit = parseInt(cleaned[i], 10);

      if (isEven) {
        digit *= 2;
        if (digit > 9) {
          digit -= 9;
        }
      }

      sum += digit;
      isEven = !isEven;
    }

    return sum % 10 === 0;
  };

  // Format card number with spaces (4 digits per group)
  const formatCardNumber = (value: string): string => {
    const cleaned = value.replace(/\s/g, '');
    const groups = cleaned.match(/.{1,4}/g) || [];
    return groups.join(' ');
  };

  // Get card brand from card number
  const getCardBrand = (cardNumber: string): string => {
    const cleaned = cardNumber.replace(/\s/g, '');
    if (/^4/.test(cleaned)) return 'Visa';
    if (/^5[1-5]/.test(cleaned)) return 'Mastercard';
    if (/^3[47]/.test(cleaned)) return 'Amex';
    if (/^6(?:011|5)/.test(cleaned)) return 'Discover';
    return 'Card';
  };

  const validateField = (name: keyof PaymentFormData, value: string): string | undefined => {
    switch (name) {
      case 'cardNumber':
        const cleaned = value.replace(/\s/g, '');
        if (!cleaned) return 'Card number is required';
        if (!/^\d+$/.test(cleaned)) return 'Card number must contain only digits';
        if (cleaned.length < 13 || cleaned.length > 19) return 'Invalid card number length';
        if (!validateCardNumber(value)) return 'Invalid card number';
        // Test failure card
        if (cleaned === '4000000000000002') return 'This test card will be declined';
        return undefined;

      case 'cardholderName':
        if (!value.trim()) return 'Cardholder name is required';
        if (value.trim().length < 3) return 'Name must be at least 3 characters';
        if (!/^[a-zA-Z\s]+$/.test(value)) return 'Name must contain only letters';
        return undefined;

      case 'expiryMonth':
        const month = parseInt(value, 10);
        if (!value) return 'Month is required';
        if (isNaN(month) || month < 1 || month > 12) return 'Invalid month';
        return undefined;

      case 'expiryYear':
        const year = parseInt(value, 10);
        const currentYear = new Date().getFullYear();
        if (!value) return 'Year is required';
        if (isNaN(year)) return 'Invalid year';
        if (year < currentYear || year > currentYear + 20) return 'Invalid expiry year';

        // Check if card is expired
        if (formData.expiryMonth) {
          const month = parseInt(formData.expiryMonth, 10);
          const cardDate = new Date(year, month - 1);
          const now = new Date();
          if (cardDate < now) return 'Card has expired';
        }
        return undefined;

      case 'cvv':
        if (!value) return 'CVV is required';
        if (!/^\d{3,4}$/.test(value)) return 'CVV must be 3 or 4 digits';
        return undefined;

      case 'billingPostcode':
        if (!value.trim()) return 'Postcode is required';
        if (value.trim().length < 3) return 'Invalid postcode';
        return undefined;

      default:
        return undefined;
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    let processedValue = value;

    // Format card number with spaces
    if (name === 'cardNumber') {
      processedValue = formatCardNumber(value.replace(/\s/g, '').slice(0, 19));
    }

    // Limit CVV to 4 digits
    if (name === 'cvv') {
      processedValue = value.replace(/\D/g, '').slice(0, 4);
    }

    // Limit expiry month to 2 digits
    if (name === 'expiryMonth') {
      processedValue = value.replace(/\D/g, '').slice(0, 2);
    }

    // Limit expiry year to 4 digits
    if (name === 'expiryYear') {
      processedValue = value.replace(/\D/g, '').slice(0, 4);
    }

    // Uppercase name
    if (name === 'cardholderName') {
      processedValue = value.toUpperCase();
    }

    setFormData((prev) => ({ ...prev, [name]: processedValue }));

    // Validate on change if field was touched
    if (touched[name as keyof PaymentFormData]) {
      const error = validateField(name as keyof PaymentFormData, processedValue);
      setErrors((prev) => ({ ...prev, [name]: error }));
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    const error = validateField(name as keyof PaymentFormData, value);
    setErrors((prev) => ({ ...prev, [name]: error }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate all fields
    const newErrors: Partial<Record<keyof PaymentFormData, string>> = {};
    Object.keys(formData).forEach((key) => {
      const error = validateField(key as keyof PaymentFormData, formData[key as keyof PaymentFormData]);
      if (error) {
        newErrors[key as keyof PaymentFormData] = error;
      }
    });

    // Mark all fields as touched
    const allTouched: Partial<Record<keyof PaymentFormData, boolean>> = {};
    Object.keys(formData).forEach((key) => {
      allTouched[key as keyof PaymentFormData] = true;
    });
    setTouched(allTouched);

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Submit form
    await onSubmit(formData);
  };

  const cardBrand = getCardBrand(formData.cardNumber);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Card Number */}
      <div>
        <label htmlFor="cardNumber" className="block text-sm font-medium text-slate-700 mb-2">
          Card Number
        </label>
        <div className="relative">
          <input
            type="text"
            id="cardNumber"
            name="cardNumber"
            value={formData.cardNumber}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="1234 5678 9012 3456"
            disabled={isProcessing}
            className={`w-full px-4 py-3 pr-12 border rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-colors ${
              errors.cardNumber && touched.cardNumber
                ? 'border-red-500 bg-red-50'
                : 'border-slate-300'
            }`}
          />
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            <CreditCard className="h-5 w-5 text-slate-400" />
          </div>
        </div>
        {formData.cardNumber && !errors.cardNumber && (
          <p className="text-xs text-slate-600 mt-1">{cardBrand}</p>
        )}
        {errors.cardNumber && touched.cardNumber && (
          <p className="text-sm text-red-600 mt-1">{errors.cardNumber}</p>
        )}
      </div>

      {/* Cardholder Name */}
      <div>
        <label htmlFor="cardholderName" className="block text-sm font-medium text-slate-700 mb-2">
          Cardholder Name
        </label>
        <input
          type="text"
          id="cardholderName"
          name="cardholderName"
          value={formData.cardholderName}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder="JOHN SMITH"
          disabled={isProcessing}
          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-colors ${
            errors.cardholderName && touched.cardholderName
              ? 'border-red-500 bg-red-50'
              : 'border-slate-300'
          }`}
        />
        {errors.cardholderName && touched.cardholderName && (
          <p className="text-sm text-red-600 mt-1">{errors.cardholderName}</p>
        )}
      </div>

      {/* Expiry & CVV */}
      <div className="grid grid-cols-2 gap-4">
        {/* Expiry Date */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Expiry Date
          </label>
          <div className="flex space-x-2">
            <input
              type="text"
              name="expiryMonth"
              value={formData.expiryMonth}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="MM"
              disabled={isProcessing}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-colors ${
                errors.expiryMonth && touched.expiryMonth
                  ? 'border-red-500 bg-red-50'
                  : 'border-slate-300'
              }`}
            />
            <input
              type="text"
              name="expiryYear"
              value={formData.expiryYear}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="YYYY"
              disabled={isProcessing}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-colors ${
                errors.expiryYear && touched.expiryYear
                  ? 'border-red-500 bg-red-50'
                  : 'border-slate-300'
              }`}
            />
          </div>
          {(errors.expiryMonth || errors.expiryYear) && (touched.expiryMonth || touched.expiryYear) && (
            <p className="text-sm text-red-600 mt-1">
              {errors.expiryMonth || errors.expiryYear}
            </p>
          )}
        </div>

        {/* CVV */}
        <div>
          <label htmlFor="cvv" className="block text-sm font-medium text-slate-700 mb-2">
            CVV
          </label>
          <input
            type="text"
            id="cvv"
            name="cvv"
            value={formData.cvv}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="123"
            disabled={isProcessing}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-colors ${
              errors.cvv && touched.cvv
                ? 'border-red-500 bg-red-50'
                : 'border-slate-300'
            }`}
          />
          {errors.cvv && touched.cvv && (
            <p className="text-sm text-red-600 mt-1">{errors.cvv}</p>
          )}
        </div>
      </div>

      {/* Billing Postcode */}
      <div>
        <label htmlFor="billingPostcode" className="block text-sm font-medium text-slate-700 mb-2">
          Billing Postcode
        </label>
        <input
          type="text"
          id="billingPostcode"
          name="billingPostcode"
          value={formData.billingPostcode}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder="SW1A 1AA"
          disabled={isProcessing}
          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-colors ${
            errors.billingPostcode && touched.billingPostcode
              ? 'border-red-500 bg-red-50'
              : 'border-slate-300'
          }`}
        />
        {errors.billingPostcode && touched.billingPostcode && (
          <p className="text-sm text-red-600 mt-1">{errors.billingPostcode}</p>
        )}
      </div>

      {/* Payment Summary */}
      <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-slate-600">
            {isTrialIncluded ? 'First charge' : 'Today\'s charge'}
          </span>
          <span className="text-lg font-bold text-slate-900">
            {isTrialIncluded ? '£0.00' : `£${amount.toFixed(2)}`}
          </span>
        </div>
        {isTrialIncluded && (
          <>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-slate-600">After 30-day trial</span>
              <span className="text-sm font-medium text-slate-900">
                £{amount.toFixed(2)}/{billingCycle === 'monthly' ? 'month' : 'year'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-2">
              Your trial starts today. You'll be charged £{amount.toFixed(2)} on{' '}
              {new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-GB')}
            </p>
          </>
        )}
        {!isTrialIncluded && (
          <p className="text-xs text-slate-500 mt-2">
            Subscription renews {billingCycle === 'monthly' ? 'monthly' : 'annually'}
          </p>
        )}
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isProcessing}
        className="w-full bg-gradient-to-r from-brand-600 to-indigo-600 text-white py-4 rounded-xl font-bold hover:from-brand-700 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
      >
        {isProcessing ? (
          <>
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
            Processing...
          </>
        ) : (
          <>
            <Lock className="h-5 w-5 mr-2" />
            {isTrialIncluded ? 'Start Free Trial' : `Pay £${amount.toFixed(2)}`}
          </>
        )}
      </button>

      {/* Security Notice */}
      <p className="text-xs text-center text-slate-500">
        <Lock className="h-3 w-3 inline mr-1" />
        Your payment information is encrypted and secure
      </p>
    </form>
  );
};
