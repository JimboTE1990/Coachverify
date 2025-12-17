import React, { useState } from 'react';
import { AlertCircle, X, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { Coach } from '../../types';

interface TrialCountdownBannerProps {
  coach: Coach;
}

export const TrialCountdownBanner: React.FC<TrialCountdownBannerProps> = ({ coach }) => {
  const navigate = useNavigate();
  const [isDismissed, setIsDismissed] = useState(false);

  // Don't show if not on trial or if trial end date is missing
  if (coach.subscriptionStatus !== 'trial' || !coach.trialEndsAt) {
    return null;
  }

  // Calculate days remaining
  const trialEndDate = new Date(coach.trialEndsAt);
  const now = new Date();
  const daysRemaining = Math.ceil((trialEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  // Don't show if more than 7 days remaining or already expired
  if (daysRemaining > 7 || daysRemaining < 0) {
    return null;
  }

  // Don't show if dismissed (only for informational banners, not urgent ones)
  if (isDismissed && daysRemaining > 1) {
    return null;
  }

  // Format the trial end date
  const formattedDate = trialEndDate.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  // Determine banner style based on days remaining
  const getBannerStyle = () => {
    if (daysRemaining <= 1) {
      return {
        bg: 'bg-red-50',
        border: 'border-red-200',
        text: 'text-red-900',
        icon: 'text-red-600',
        button: 'bg-red-600 hover:bg-red-700 text-white',
        urgency: 'Last chance!'
      };
    } else if (daysRemaining <= 3) {
      return {
        bg: 'bg-yellow-50',
        border: 'border-yellow-200',
        text: 'text-yellow-900',
        icon: 'text-yellow-600',
        button: 'bg-yellow-600 hover:bg-yellow-700 text-white',
        urgency: 'Only a few days left!'
      };
    } else {
      return {
        bg: 'bg-blue-50',
        border: 'border-blue-200',
        text: 'text-blue-900',
        icon: 'text-blue-600',
        button: 'bg-blue-600 hover:bg-blue-700 text-white',
        urgency: 'Reminder'
      };
    }
  };

  const style = getBannerStyle();

  const getMessage = () => {
    if (daysRemaining <= 1) {
      return `Your trial expires tomorrow (${formattedDate}). Choose a plan to continue your profile visibility.`;
    } else if (daysRemaining === 2) {
      return `Your trial expires in 2 days (${formattedDate}). Lock in your price now!`;
    } else {
      return `Your trial ends in ${daysRemaining} days (${formattedDate}). Choose a plan anytime during your trial.`;
    }
  };

  return (
    <div className={`${style.bg} border ${style.border} rounded-xl p-4 mb-6 shadow-sm animate-fade-in`}>
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className={`flex-shrink-0 ${style.icon}`}>
          {daysRemaining <= 1 ? (
            <AlertCircle className="h-6 w-6" />
          ) : (
            <Calendar className="h-6 w-6" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className={`font-bold text-sm ${style.text} mb-1`}>
                {style.urgency}
              </p>
              <p className={`text-sm ${style.text}`}>
                {getMessage()}
              </p>
            </div>

            {/* Dismiss button - only for non-urgent banners */}
            {daysRemaining > 1 && (
              <button
                onClick={() => setIsDismissed(true)}
                className={`flex-shrink-0 ${style.icon} hover:opacity-70 transition-opacity`}
                aria-label="Dismiss"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>

          {/* Action button */}
          <button
            onClick={() => navigate('/pricing')}
            className={`mt-3 ${style.button} px-4 py-2 rounded-lg text-sm font-bold transition-colors shadow-sm`}
          >
            {daysRemaining <= 1 ? 'Choose Plan Now' : 'View Plans'}
          </button>
        </div>
      </div>
    </div>
  );
};
