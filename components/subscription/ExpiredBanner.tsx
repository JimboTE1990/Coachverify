import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { Coach } from '../../types';
import { useTrialStatus } from '../../hooks/useTrialStatus';

interface ExpiredBannerProps {
  coach: Coach;
}

export const ExpiredBanner: React.FC<ExpiredBannerProps> = ({ coach }) => {
  const navigate = useNavigate();
  const trialStatus = useTrialStatus(coach);

  if (!trialStatus.isExpired) {
    return null;
  }

  // Different messaging based on user type
  const getMessage = () => {
    if (trialStatus.neverPaid) {
      // User who never upgraded from trial
      return {
        title: 'Your trial has expired',
        subtitle: 'Upgrade to a paid plan to make your profile visible to clients again',
        cta: 'Upgrade Now'
      };
    } else if (trialStatus.wasPaidSubscriber) {
      // User who paid, then cancelled
      return {
        title: 'Your subscription has ended',
        subtitle: 'Reactivate your subscription to become visible in search results again',
        cta: 'Reactivate'
      };
    } else {
      // Default expired state
      return {
        title: 'Your profile is currently hidden from clients',
        subtitle: 'Upgrade to an active subscription to become visible in search results again',
        cta: 'Upgrade'
      };
    }
  };

  const content = getMessage();

  return (
    <div className="bg-red-600 text-white py-3 px-4 shadow-lg">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1">
          <AlertTriangle className="h-6 w-6 flex-shrink-0" />
          <div className="min-w-0">
            <p className="font-bold text-sm">
              {content.title}
            </p>
            <p className="text-xs text-red-100 mt-0.5">
              {content.subtitle}
            </p>
          </div>
        </div>

        <button
          onClick={() => navigate('/pricing')}
          className="bg-white text-red-600 px-5 py-2 rounded-lg text-sm font-bold hover:bg-red-50 transition-colors flex-shrink-0 shadow-md"
        >
          {content.cta}
        </button>
      </div>
    </div>
  );
};
