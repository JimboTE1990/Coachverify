import React, { useState } from 'react';
import { X, AlertTriangle, Trash2, Clock, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { Coach } from '../../types';

interface TrialExpiredModalProps {
  coach: Coach;
  onClose: () => void;
  onDeleteAccount: () => Promise<void>;
}

export const TrialExpiredModal: React.FC<TrialExpiredModalProps> = ({
  coach,
  onClose,
  onDeleteAccount,
}) => {
  const navigate = useNavigate();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleUpgradeNow = () => {
    onClose();
    navigate('/pricing');
  };

  const handleDecideLater = () => {
    onClose();
  };

  const handleDeleteAccount = async () => {
    if (!showDeleteConfirm) {
      setShowDeleteConfirm(true);
      return;
    }

    setIsDeleting(true);
    try {
      await onDeleteAccount();
      onClose();
    } catch (error) {
      console.error('Error deleting account:', error);
      alert('Failed to delete account. Please contact support.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-600 to-orange-600 text-white p-8 rounded-t-3xl relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
            aria-label="Close modal"
          >
            <X className="h-6 w-6" />
          </button>

          <div className="flex items-center gap-4 mb-4">
            <div className="bg-white/20 p-3 rounded-full">
              <AlertTriangle className="h-8 w-8" />
            </div>
            <div>
              <h2 className="text-3xl font-display font-bold">Your Trial Has Ended</h2>
              <p className="text-red-100 mt-1">Your profile is currently hidden from clients</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-8">
          <p className="text-slate-700 text-lg mb-8">
            What would you like to do? Choose an option below to continue.
          </p>

          {!showDeleteConfirm ? (
            <div className="space-y-4">
              {/* Option 1: Upgrade Now */}
              <button
                onClick={handleUpgradeNow}
                className="w-full bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-700 hover:to-indigo-700 text-white rounded-2xl p-6 transition-all shadow-lg hover:shadow-xl hover:-translate-y-1 text-left group"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="bg-white/20 p-3 rounded-full group-hover:scale-110 transition-transform">
                      <Zap className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold mb-2">Upgrade Now</h3>
                      <p className="text-white/90 text-sm mb-3">
                        Get back online and start receiving client matches immediately
                      </p>
                      <ul className="space-y-1 text-sm text-white/80">
                        <li>✓ Profile visible in search</li>
                        <li>✓ Unlimited client matches</li>
                        <li>✓ Verified badge</li>
                        <li>✓ £15/mo or £150/yr (save 17%)</li>
                      </ul>
                    </div>
                  </div>
                  <div className="bg-green-400 text-green-900 text-xs font-bold px-3 py-1 rounded-full">
                    RECOMMENDED
                  </div>
                </div>
              </button>

              {/* Option 2: Decide Later */}
              <button
                onClick={handleDecideLater}
                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-900 rounded-2xl p-6 transition-all text-left border-2 border-slate-200"
              >
                <div className="flex items-start gap-4">
                  <div className="bg-slate-200 p-3 rounded-full">
                    <Clock className="h-6 w-6 text-slate-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2">Decide Later</h3>
                    <p className="text-slate-600 text-sm mb-3">
                      Take your time to think about it. Your data will be kept safe.
                    </p>
                    <ul className="space-y-1 text-sm text-slate-600">
                      <li>• Your profile stays hidden</li>
                      <li>• Data retained for 2 years</li>
                      <li>• Easy to reactivate anytime</li>
                    </ul>
                  </div>
                </div>
              </button>

              {/* Option 3: Delete Account */}
              <button
                onClick={handleDeleteAccount}
                className="w-full bg-white hover:bg-red-50 text-red-600 rounded-2xl p-6 transition-all text-left border-2 border-red-200"
              >
                <div className="flex items-start gap-4">
                  <div className="bg-red-100 p-3 rounded-full">
                    <Trash2 className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2">Delete My Account</h3>
                    <p className="text-red-600/80 text-sm mb-3">
                      Permanently remove all your data from our platform
                    </p>
                    <ul className="space-y-1 text-sm text-red-600/70">
                      <li>⚠️ This action cannot be undone</li>
                      <li>⚠️ All data deleted within 30 days</li>
                      <li>⚠️ You'll need to create a new account to return</li>
                    </ul>
                  </div>
                </div>
              </button>
            </div>
          ) : (
            // Delete Confirmation Screen
            <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-8">
              <div className="flex items-start gap-4 mb-6">
                <div className="bg-red-100 p-3 rounded-full">
                  <AlertTriangle className="h-8 w-8 text-red-600" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-red-900 mb-2">
                    Are you absolutely sure?
                  </h3>
                  <p className="text-red-800 mb-4">
                    This will permanently delete your CoachDog account and all associated data.
                  </p>
                  <div className="bg-white rounded-lg p-4 mb-4">
                    <p className="text-slate-700 text-sm mb-2">
                      <strong>What will be deleted:</strong>
                    </p>
                    <ul className="text-sm text-slate-600 space-y-1">
                      <li>• Your coach profile and bio</li>
                      <li>• All certifications and qualifications</li>
                      <li>• Reviews and ratings</li>
                      <li>• Account settings and preferences</li>
                      <li>• Payment history</li>
                    </ul>
                  </div>
                  <p className="text-red-700 text-sm font-medium">
                    This action cannot be undone. All data will be permanently deleted within 30 days.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={isDeleting}
                  className="flex-1 bg-slate-100 text-slate-700 py-3 rounded-xl font-bold hover:bg-slate-200 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAccount}
                  disabled={isDeleting}
                  className="flex-1 bg-red-600 text-white py-3 rounded-xl font-bold hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center"
                >
                  {isDeleting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-5 w-5 mr-2" />
                      Yes, Delete My Account
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-8 py-4 rounded-b-3xl border-t border-slate-200">
          <p className="text-sm text-slate-600 text-center">
            Need help deciding?{' '}
            <a href="mailto:support@coachverify.com" className="text-brand-600 hover:underline font-medium">
              Contact our support team
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};
