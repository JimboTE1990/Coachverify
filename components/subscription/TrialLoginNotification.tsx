import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { X, Sparkles, Clock, Zap } from 'lucide-react';
import { Coach } from '../../types';
import { getCTAPricingMessage, getPromotionalBadge, isPromotionActive } from '../../config/pricing';

interface TrialLoginNotificationProps {
  coach: Coach;
}

export const TrialLoginNotification: React.FC<TrialLoginNotificationProps> = ({ coach }) => {
  const [isDismissed, setIsDismissed] = useState(false);
  const [hasShown, setHasShown] = useState(false);

  // Only show for trial users (show for all trials, regardless of billing)
  const shouldShow =
    coach.subscriptionStatus === 'trial' &&
    coach.trialEndsAt;

  // Show notification automatically after a short delay on first render
  useEffect(() => {
    if (shouldShow && !hasShown) {
      const timer = setTimeout(() => {
        setHasShown(true);
      }, 1500); // Show after 1.5 seconds

      return () => clearTimeout(timer);
    }
  }, [shouldShow, hasShown]);

  const handleDismiss = () => {
    setIsDismissed(true);
    // Store dismissal in sessionStorage so it doesn't re-appear on navigation
    sessionStorage.setItem('trial_notification_dismissed', 'true');
  };

  // Check if user dismissed it in this session
  useEffect(() => {
    const wasDismissed = sessionStorage.getItem('trial_notification_dismissed');
    if (wasDismissed) {
      setIsDismissed(true);
    }
  }, []);

  if (!shouldShow || isDismissed || !hasShown) {
    return null;
  }

  // Calculate days remaining (reset time to midnight for accurate day calculation)
  const trialEndDate = new Date(coach.trialEndsAt);
  const today = new Date();

  // Reset both dates to midnight to get accurate day difference
  const trialEndMidnight = new Date(trialEndDate.getFullYear(), trialEndDate.getMonth(), trialEndDate.getDate());
  const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  // Calculate difference in days
  const daysRemaining = Math.max(0, Math.ceil((trialEndMidnight.getTime() - todayMidnight.getTime()) / (1000 * 60 * 60 * 24)));

  // Format date for display
  const formattedDate = trialEndDate.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  // Get dynamic pricing message
  const pricingMessage = getCTAPricingMessage();
  const promotionalBadge = getPromotionalBadge();
  const hasPromotion = isPromotionActive();

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-md animate-slide-in-right">
      <div className="bg-gradient-to-br from-yellow-50 via-orange-50 to-orange-100 rounded-2xl shadow-2xl p-6 relative border-2 border-orange-400/50"
        style={{
          boxShadow: '0 0 20px rgba(249, 115, 22, 0.3), 0 20px 25px -5px rgba(0, 0, 0, 0.1)'
        }}
      >
        {/* Dismiss Button */}
        <button
          onClick={handleDismiss}
          className="absolute top-3 right-3 text-slate-400 hover:text-slate-600 transition-colors"
          aria-label="Dismiss notification"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Promotional Badge (if active) */}
        {promotionalBadge && (
          <div className="absolute top-3 left-3 bg-gradient-to-r from-brand-600 to-indigo-600 text-white text-xs font-black px-3 py-1 rounded-full shadow-lg flex items-center gap-1">
            <Zap className="h-3 w-3" />
            {promotionalBadge}
          </div>
        )}

        {/* Header */}
        <div className="flex items-center gap-3 mb-4 mt-2">
          <div className="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center shadow-lg bg-gradient-to-br from-brand-600 to-indigo-600">
            <img
              src="/favicon.png"
              alt="CoachDog"
              className="h-8 w-8 object-contain"
            />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-900">
              "You're on a Free Trial"
            </h3>
            <div className="flex items-center gap-1.5 text-sm font-bold text-orange-700">
              <Clock className="h-4 w-4" />
              {daysRemaining} {daysRemaining === 1 ? 'day' : 'days'} remaining
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="space-y-3 mb-5">
          <p className="text-sm text-slate-700 leading-relaxed">
            Your trial ends on <strong className="text-slate-900">{formattedDate}</strong>.
          </p>
          <p className="text-sm text-slate-700 leading-relaxed">
            After this date, your <strong className="text-rose-700">profile will no longer be visible</strong> to clients in search results.
          </p>
        </div>

        {/* CTA */}
        <Link
          to="/pricing"
          onClick={handleDismiss}
          className="block w-full text-center text-white font-black py-3 px-4 rounded-xl transition-all hover:shadow-xl transform hover:-translate-y-0.5 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-700 hover:to-indigo-700 border-2 border-orange-400/50"
          style={{
            boxShadow: '0 0 15px rgba(249, 115, 22, 0.4), 0 4px 6px -1px rgba(0, 0, 0, 0.1)'
          }}
        >
          Upgrade to Premium Now →
        </Link>

        <p className="text-xs text-center text-slate-500 mt-3">
          {pricingMessage}
        </p>
      </div>
    </div>
  );
};
