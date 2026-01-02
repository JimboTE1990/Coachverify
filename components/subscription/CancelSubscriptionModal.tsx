import React, { useState } from 'react';
import { X, AlertTriangle, CheckCircle, Info, Save, Trash2 } from 'lucide-react';
import type { Coach } from '../../types';

interface CancelSubscriptionModalProps {
  coach: Coach;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string, feedback: string, dataPreference: 'keep' | 'delete') => Promise<void>;
}

const CANCEL_REASONS = [
  'Too expensive',
  'Not getting enough clients',
  'Switching to another platform',
  'Technical issues',
  'No longer coaching',
  'Taking a break',
  'Other'
];

type CancelStep = 'confirm' | 'reason' | 'data' | 'success';

export const CancelSubscriptionModal: React.FC<CancelSubscriptionModalProps> = ({
  coach,
  isOpen,
  onClose,
  onConfirm
}) => {
  const [step, setStep] = useState<CancelStep>('confirm');
  const [selectedReason, setSelectedReason] = useState<string>('');
  const [feedback, setFeedback] = useState('');
  const [dataPreference, setDataPreference] = useState<'keep' | 'delete'>('keep');
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  // Prevent opening modal if subscription is already cancelled
  if (coach.cancelledAt) {
    return null;
  }

  // Calculate when access ends (current billing period end)
  const calculateAccessEndDate = (): Date => {
    const now = new Date();

    // If already cancelled, use subscription_ends_at
    if (coach.subscriptionEndsAt) {
      return new Date(coach.subscriptionEndsAt);
    }

    // Calculate based on last payment date + billing cycle
    if (coach.lastPaymentDate) {
      const lastPayment = new Date(coach.lastPaymentDate);
      const endDate = new Date(lastPayment);

      if (coach.billingCycle === 'annual') {
        endDate.setFullYear(lastPayment.getFullYear() + 1);
      } else {
        endDate.setMonth(lastPayment.getMonth() + 1);
      }

      return endDate;
    }

    // Fallback: Calculate from billing cycle duration
    const daysToAdd = coach.billingCycle === 'annual' ? 365 : 30;
    const fallback = new Date(now.getTime() + daysToAdd * 24 * 60 * 60 * 1000);
    return fallback;
  };

  const accessEndsDate = calculateAccessEndDate();
  const formattedEndDate = accessEndsDate.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const handleCancel = async () => {
    if (!selectedReason) return;

    // Double-check that subscription isn't already cancelled
    if (coach.cancelledAt) {
      alert('This subscription has already been cancelled.');
      onClose();
      return;
    }

    setIsProcessing(true);
    try {
      await onConfirm(selectedReason, feedback, dataPreference);
      setStep('success');
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      alert('Failed to cancel subscription. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    setStep('confirm');
    setSelectedReason('');
    setFeedback('');
    setDataPreference('keep');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-scale-in">
        {/* Step 1: Confirmation */}
        {step === 'confirm' && (
          <div className="p-8">
            {/* Header */}
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="bg-yellow-100 p-2 rounded-full">
                  <AlertTriangle className="h-6 w-6 text-yellow-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-display font-bold text-slate-900">
                    Cancel Subscription?
                  </h2>
                  <p className="text-sm text-slate-500 mt-1">
                    We're sorry to see you go
                  </p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Warning if pending plan change exists */}
            {coach.pendingPlanChange && (
              <div className="bg-blue-50 border-2 border-blue-300 rounded-xl p-5 mb-6">
                <div className="flex items-start gap-3">
                  <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-blue-900 mb-2">You have a pending plan change</h4>
                    <p className="text-sm text-blue-800">
                      Your plan is scheduled to change to{' '}
                      <span className="font-bold capitalize">{coach.pendingPlanChange.newBillingCycle}</span> on{' '}
                      <span className="font-bold">
                        {new Date(coach.pendingPlanChange.effectiveDate).toLocaleDateString('en-GB', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </span>
                      . If you cancel now, you'll lose access on{' '}
                      <span className="font-bold">{formattedEndDate}</span> before the plan change takes effect.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* What happens */}
            <div className="bg-slate-50 rounded-xl p-6 mb-6">
              <h3 className="font-bold text-slate-900 mb-4">What happens when you cancel:</h3>
              <ul className="space-y-3 text-sm text-slate-700">
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-slate-400 mr-3 flex-shrink-0 mt-0.5" />
                  <span>Your profile will remain visible until <strong>{formattedEndDate}</strong></span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-slate-400 mr-3 flex-shrink-0 mt-0.5" />
                  <span>After this date, your profile will be hidden from search</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-slate-400 mr-3 flex-shrink-0 mt-0.5" />
                  <span>You can reactivate anytime before <strong>{formattedEndDate}</strong></span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-slate-400 mr-3 flex-shrink-0 mt-0.5" />
                  <span>No further charges will be made</span>
                </li>
              </ul>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={handleClose}
                className="flex-1 bg-brand-600 text-white py-3 rounded-xl font-bold hover:bg-brand-700 transition-colors"
              >
                Keep Subscription
              </button>
              <button
                onClick={() => setStep('reason')}
                className="flex-1 bg-slate-100 text-slate-700 py-3 rounded-xl font-bold hover:bg-slate-200 transition-colors"
              >
                Continue to Cancel
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Reason Selection */}
        {step === 'reason' && (
          <div className="p-8">
            {/* Header */}
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-2xl font-display font-bold text-slate-900">
                  Why are you cancelling?
                </h2>
                <p className="text-sm text-slate-500 mt-1">
                  Your feedback helps us improve
                </p>
              </div>
              <button
                onClick={handleClose}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Reason Selection */}
            <div className="mb-6">
              <label className="block text-sm font-bold text-slate-700 mb-3">
                Select a reason <span className="text-red-500">*</span>
              </label>
              <div className="space-y-2">
                {CANCEL_REASONS.map((reason) => (
                  <label
                    key={reason}
                    className="flex items-center p-4 rounded-xl border-2 border-slate-200 hover:border-brand-300 cursor-pointer transition-all"
                  >
                    <input
                      type="radio"
                      name="cancelReason"
                      value={reason}
                      checked={selectedReason === reason}
                      onChange={(e) => setSelectedReason(e.target.value)}
                      className="h-4 w-4 text-brand-600 focus:ring-brand-500"
                    />
                    <span className="ml-3 text-sm font-medium text-slate-800">{reason}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Optional Feedback */}
            {selectedReason && (
              <div className="mb-6 animate-fade-in">
                <label className="block text-sm font-bold text-slate-700 mb-3">
                  Additional feedback (optional)
                </label>
                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Tell us more about your experience..."
                  rows={4}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-brand-500 outline-none resize-none"
                />
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => setStep('confirm')}
                className="flex-1 bg-slate-100 text-slate-700 py-3 rounded-xl font-bold hover:bg-slate-200 transition-colors"
              >
                Back
              </button>
              <button
                onClick={() => setStep('data')}
                disabled={!selectedReason}
                className="flex-1 bg-red-600 text-white py-3 rounded-xl font-bold hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Data Retention */}
        {step === 'data' && (
          <div className="p-8">
            {/* Header */}
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-2xl font-display font-bold text-slate-900">
                  Data Retention
                </h2>
                <p className="text-sm text-slate-500 mt-1">
                  What should we do with your data?
                </p>
              </div>
              <button
                onClick={handleClose}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Info Banner */}
            <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-5 mb-6">
              <p className="text-blue-900 text-sm">
                <strong>Your subscription is now being cancelled.</strong>
                <br /><br />
                Access continues until: <strong>{formattedEndDate}</strong>
                <br />
                After this date, your profile will be hidden from search.
              </p>
            </div>

            {/* Data Preference Options */}
            <div className="space-y-4 mb-6">
              {/* Keep Data */}
              <label
                className={`block p-6 rounded-2xl border-2 cursor-pointer transition-all ${
                  dataPreference === 'keep'
                    ? 'border-brand-500 bg-brand-50'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-start">
                  <input
                    type="radio"
                    name="dataPreference"
                    value="keep"
                    checked={dataPreference === 'keep'}
                    onChange={(e) => setDataPreference(e.target.value as 'keep')}
                    className="mt-1 mr-4 h-5 w-5 text-brand-600"
                  />
                  <div>
                    <div className="flex items-center mb-2">
                      <Save className="h-5 w-5 text-brand-600 mr-2" />
                      <span className="font-bold text-slate-900">Keep my data (Recommended)</span>
                    </div>
                    <ul className="space-y-1 text-sm text-slate-600 ml-7">
                      <li>• Your profile and settings are saved</li>
                      <li>• Easy to reactivate anytime</li>
                      <li>• Data retained for 2 years of inactivity</li>
                      <li>• You can delete it anytime from account settings</li>
                    </ul>
                  </div>
                </div>
              </label>

              {/* Delete Data */}
              <label
                className={`block p-6 rounded-2xl border-2 cursor-pointer transition-all ${
                  dataPreference === 'delete'
                    ? 'border-red-500 bg-red-50'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-start">
                  <input
                    type="radio"
                    name="dataPreference"
                    value="delete"
                    checked={dataPreference === 'delete'}
                    onChange={(e) => setDataPreference(e.target.value as 'delete')}
                    className="mt-1 mr-4 h-5 w-5 text-red-600"
                  />
                  <div>
                    <div className="flex items-center mb-2">
                      <Trash2 className="h-5 w-5 text-red-600 mr-2" />
                      <span className="font-bold text-slate-900">Delete my data immediately</span>
                    </div>
                    <ul className="space-y-1 text-sm text-slate-600 ml-7">
                      <li>• Permanent deletion within 30 days</li>
                      <li>• Cannot be undone</li>
                      <li>• Will need to recreate profile if you return</li>
                      <li>• You can always request deletion later</li>
                    </ul>
                  </div>
                </div>
              </label>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => setStep('reason')}
                disabled={isProcessing}
                className="flex-1 bg-slate-100 text-slate-700 py-3 rounded-xl font-bold hover:bg-slate-200 transition-colors disabled:opacity-50"
              >
                Back
              </button>
              <button
                onClick={handleCancel}
                disabled={isProcessing}
                className="flex-1 bg-red-600 text-white py-3 rounded-xl font-bold hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center"
              >
                {isProcessing ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Cancelling...
                  </>
                ) : (
                  'Confirm Cancellation'
                )}
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Success */}
        {step === 'success' && (
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>

            <h2 className="text-2xl font-display font-bold text-slate-900 mb-2">
              Your subscription has been cancelled
            </h2>

            <p className="text-slate-600 mb-6">
              We're sorry to see you go, but we're here whenever you're ready to come back.
            </p>

            {/* Cancellation Summary */}
            <div className="bg-slate-50 rounded-2xl p-6 mb-6 text-left">
              <h4 className="font-bold text-slate-900 mb-4">Cancellation Summary</h4>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600">Cancelled on:</span>
                  <span className="font-semibold text-slate-900">
                    {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Access continues until:</span>
                  <span className="font-semibold text-slate-900">{formattedEndDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Final charge:</span>
                  <span className="font-semibold text-green-600">£0 (already paid)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Profile becomes hidden after:</span>
                  <span className="font-semibold text-slate-900">{formattedEndDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Data retention:</span>
                  <span className="font-semibold text-slate-900">
                    {dataPreference === 'keep' ? '2 years (you chose to keep your data)' : 'Deleted within 30 days'}
                  </span>
                </div>
              </div>
            </div>

            {/* What Happens Next */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 text-left">
              <h4 className="font-bold text-blue-900 mb-3">What happens next:</h4>
              <ul className="space-y-2 text-sm text-blue-800">
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 mr-3 flex-shrink-0 mt-0.5" />
                  <span>Full access continues until {formattedEndDate}</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 mr-3 flex-shrink-0 mt-0.5" />
                  <span>No further charges</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 mr-3 flex-shrink-0 mt-0.5" />
                  <span>Profile becomes hidden on {formattedEndDate}</span>
                </li>
                {dataPreference === 'keep' && (
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 mr-3 flex-shrink-0 mt-0.5" />
                    <span>Data retained for 2 years - you can reactivate anytime</span>
                  </li>
                )}
                {dataPreference === 'delete' && (
                  <li className="flex items-start">
                    <Trash2 className="h-5 w-5 mr-3 flex-shrink-0 mt-0.5" />
                    <span>Data will be permanently deleted within 30 days</span>
                  </li>
                )}
              </ul>
            </div>

            <button
              onClick={handleClose}
              className="w-full bg-brand-600 text-white py-3 rounded-xl font-bold hover:bg-brand-700 transition-colors"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
