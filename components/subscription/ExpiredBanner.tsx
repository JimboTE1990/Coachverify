import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { Coach } from '../../types';

interface ExpiredBannerProps {
  coach: Coach;
}

export const ExpiredBanner: React.FC<ExpiredBannerProps> = ({ coach }) => {
  const navigate = useNavigate();

  // Check if subscription is truly expired (past subscription_ends_at date)
  const isPastEndDate = coach.subscriptionEndsAt && new Date(coach.subscriptionEndsAt) < new Date();
  const isExpired = coach.subscriptionStatus === 'expired' || (coach.cancelledAt && isPastEndDate);

  if (!isExpired) {
    return null;
  }

  return (
    <div className="bg-red-600 text-white py-3 px-4 shadow-lg">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1">
          <AlertTriangle className="h-6 w-6 flex-shrink-0" />
          <div className="min-w-0">
            <p className="font-bold text-sm">
              Your profile is currently hidden from clients
            </p>
            <p className="text-xs text-red-100 mt-0.5">
              Upgrade to an active subscription to become visible in search results again
            </p>
          </div>
        </div>

        <button
          onClick={() => navigate('/pricing')}
          className="bg-white text-red-600 px-5 py-2 rounded-lg text-sm font-bold hover:bg-red-50 transition-colors flex-shrink-0 shadow-md"
        >
          Reactivate
        </button>
      </div>
    </div>
  );
};
