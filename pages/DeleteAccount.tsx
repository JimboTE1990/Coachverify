import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, ArrowLeft, Trash2, Calendar, Shield, Clock } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { PasswordVerificationModal } from '../components/PasswordVerificationModal';

export const DeleteAccount: React.FC = () => {
  const { currentCoach } = useAuth();
  const navigate = useNavigate();
  const [isPasswordVerified, setIsPasswordVerified] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(true);
  const [deleteReason, setDeleteReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Redirect if no coach
  useEffect(() => {
    if (!currentCoach) {
      navigate('/dashboard');
    }
  }, [currentCoach, navigate]);

  if (!currentCoach) return null;

  // Calculate deletion timeline
  const calculateDeletionDates = () => {
    const now = new Date();

    // Effective date is end of subscription (or tomorrow if already cancelled/expired)
    let effectiveDate: Date;
    if (currentCoach.subscriptionEndsAt) {
      effectiveDate = new Date(currentCoach.subscriptionEndsAt);
    } else if (currentCoach.subscriptionStatus === 'trial' && currentCoach.trialEndsAt) {
      effectiveDate = new Date(currentCoach.trialEndsAt);
    } else {
      // No active subscription - effective tomorrow
      effectiveDate = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    }

    // Permanent deletion is 30 days after effective date
    const permanentDate = new Date(effectiveDate.getTime() + 30 * 24 * 60 * 60 * 1000);

    return { effectiveDate, permanentDate };
  };

  const { effectiveDate, permanentDate } = calculateDeletionDates();

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  // Check if deletion is blocked
  const isDeletionBlocked = currentCoach.subscriptionStatus === 'active' && !currentCoach.cancelledAt;

  const handleDeleteRequest = async () => {
    if (isDeletionBlocked) {
      alert('Please cancel your subscription before requesting account deletion.');
      return;
    }

    // Confirmation dialog
    const confirmed = window.confirm(
      `Are you absolutely sure you want to delete your account?\n\n` +
      `Your profile will be hidden on ${formatDate(effectiveDate)} and permanently deleted on ${formatDate(permanentDate)}.\n\n` +
      `This action can be reversed within 30 days by contacting support.`
    );

    if (!confirmed) return;

    // Type "DELETE" confirmation
    const verification = window.prompt(
      'To confirm deletion, please type DELETE in capital letters:'
    );

    if (verification !== 'DELETE') {
      alert('Deletion cancelled. Verification text did not match.');
      return;
    }

    setIsProcessing(true);

    try {
      // Call delete account service function
      const { requestAccountDeletion } = await import('../services/supabaseService');
      const success = await requestAccountDeletion(currentCoach.id, deleteReason);

      if (success) {
        alert(
          `Your account deletion has been scheduled.\n\n` +
          `Timeline:\n` +
          `• Today: Deletion requested\n` +
          `• ${formatDate(effectiveDate)}: Profile hidden, dashboard locked\n` +
          `• ${formatDate(permanentDate)}: Data permanently deleted\n\n` +
          `You can restore your account within 30 days by contacting support@coachdog.com`
        );
        navigate('/dashboard');
      } else {
        alert('Failed to schedule account deletion. Please try again or contact support.');
      }
    } catch (error) {
      console.error('Delete account error:', error);
      alert('An error occurred. Please contact support@coachdog.com');
    } finally {
      setIsProcessing(false);
    }
  };

  // Show password modal first
  if (!isPasswordVerified) {
    return (
      <PasswordVerificationModal
        isOpen={showPasswordModal}
        onClose={() => navigate('/dashboard')}
        onVerified={() => setIsPasswordVerified(true)}
        title="Delete Account - Password Required"
        message="For your security, please verify your password before accessing account deletion."
        email={currentCoach.email}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="text-sm font-medium">Back to Dashboard</span>
        </button>

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-red-500 to-red-600 p-6 text-white">
            <div className="flex items-center gap-4">
              <div className="bg-white/20 p-3 rounded-lg">
                <Trash2 className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Delete Account</h1>
                <p className="text-red-100 text-sm mt-1">
                  Permanently remove your CoachDog profile and data
                </p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-8">
            {/* Subscription Warning */}
            {isDeletionBlocked && (
              <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-6 mb-8">
                <div className="flex items-start gap-4">
                  <AlertTriangle className="h-6 w-6 text-yellow-600 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="text-lg font-bold text-yellow-900 mb-2">
                      Active Subscription Detected
                    </h3>
                    <p className="text-sm text-yellow-800 mb-4">
                      You must cancel your subscription before you can delete your account.
                      Your subscription is currently active{currentCoach.subscriptionEndsAt && ` until ${formatDate(new Date(currentCoach.subscriptionEndsAt))}`}.
                    </p>
                    <button
                      onClick={() => navigate('/dashboard')}
                      className="px-4 py-2 bg-yellow-600 text-white rounded-lg text-sm font-bold hover:bg-yellow-700 transition-colors"
                    >
                      Go to Subscription Settings
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Timeline */}
            <div className="mb-8">
              <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Calendar className="h-5 w-5 text-slate-600" />
                Deletion Timeline
              </h2>
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-brand-100 rounded-full flex items-center justify-center">
                    <span className="text-xs font-bold text-brand-700">1</span>
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">Today: Request deletion</p>
                    <p className="text-sm text-slate-600">
                      Your account remains fully active until the effective date
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                    <span className="text-xs font-bold text-orange-700">2</span>
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">
                      {formatDate(effectiveDate)}: Profile hidden
                    </p>
                    <p className="text-sm text-slate-600">
                      Profile removed from search, dashboard locked
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                    <span className="text-xs font-bold text-red-700">3</span>
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">
                      {formatDate(permanentDate)}: Data permanently deleted
                    </p>
                    <p className="text-sm text-slate-600">
                      All your data will be permanently removed from our systems
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* What Gets Deleted */}
            <div className="mb-8">
              <h2 className="text-lg font-bold text-slate-900 mb-4">What Gets Deleted</h2>
              <ul className="space-y-2 text-sm text-slate-700">
                <li className="flex items-start gap-2">
                  <span className="text-red-600 mt-1">•</span>
                  <span>Coach profile and all profile information</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-600 mt-1">•</span>
                  <span>All reviews and ratings</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-600 mt-1">•</span>
                  <span>Accreditation verification status</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-600 mt-1">•</span>
                  <span>Analytics and performance data</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-600 mt-1">•</span>
                  <span>Account settings and preferences</span>
                </li>
              </ul>
            </div>

            {/* Restoration Window */}
            <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6 mb-8">
              <div className="flex items-start gap-4">
                <Shield className="h-6 w-6 text-blue-600 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-lg font-bold text-blue-900 mb-2 flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    30-Day Restoration Window
                  </h3>
                  <p className="text-sm text-blue-800 mb-3">
                    Changed your mind? You can restore your account any time before{' '}
                    <span className="font-bold">{formatDate(permanentDate)}</span> by contacting:
                  </p>
                  <a
                    href="mailto:support@coachdog.com"
                    className="text-sm font-bold text-blue-600 hover:text-blue-700 underline"
                  >
                    support@coachdog.com
                  </a>
                  <p className="text-xs text-blue-700 mt-3">
                    After the permanent deletion date, restoration is not possible.
                  </p>
                </div>
              </div>
            </div>

            {/* Reason (Optional) */}
            <div className="mb-8">
              <label className="block text-sm font-bold text-slate-900 mb-2">
                Why are you leaving? (Optional)
              </label>
              <textarea
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
                placeholder="Your feedback helps us improve CoachDog for other coaches..."
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                rows={4}
                maxLength={500}
              />
              <p className="text-xs text-slate-500 mt-1">{deleteReason.length}/500 characters</p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="flex-1 px-6 py-3 border-2 border-slate-300 rounded-lg text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteRequest}
                disabled={isDeletionBlocked || isProcessing}
                className={`flex-1 px-6 py-3 rounded-lg text-sm font-bold transition-colors ${
                  isDeletionBlocked
                    ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                    : 'bg-red-600 text-white hover:bg-red-700'
                }`}
              >
                {isProcessing ? 'Processing...' : 'Request Account Deletion'}
              </button>
            </div>

            {/* Fine Print */}
            <p className="text-xs text-slate-500 text-center mt-6">
              By requesting deletion, you acknowledge that this action will hide your profile on{' '}
              {formatDate(effectiveDate)} and permanently delete all data on {formatDate(permanentDate)}.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
