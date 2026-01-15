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

  // Only show for trial users without billing cycle (unpaid trial)
  const shouldShow =
    coach.subscriptionStatus === 'trial' &&
    !coach.billingCycle &&
    coach.trialEndsAt;

  // Check if we've already shown this notification in this session
  useEffect(() => {
    const shownThisSession = sessionStorage.getItem('trial_notification_shown');
    if (shownThisSession) {
      setIsDismissed(true);
    }
  }, []);

  const handleDismiss = () => {
    setIsDismissed(true);
    sessionStorage.setItem('trial_notification_shown', 'true');
  };

  if (!shouldShow || isDismissed) {
    return null;
  }

  // Calculate days remaining
  const trialEndDate = new Date(coach.trialEndsAt);
  const today = new Date();
  const daysRemaining = Math.ceil((trialEndDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

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
      <div className={`bg-gradient-to-br rounded-2xl shadow-2xl p-6 relative border-2 ${
        hasPromotion
          ? 'from-purple-50 via-pink-50 to-rose-50 border-purple-300'
          : 'from-amber-50 via-orange-50 to-rose-50 border-amber-300'
      }`}>
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
          <div className="absolute top-3 left-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-black px-3 py-1 rounded-full shadow-lg flex items-center gap-1">
            <Zap className="h-3 w-3" />
            {promotionalBadge}
          </div>
        )}

        {/* Header */}
        <div className="flex items-center gap-3 mb-4 mt-2">
          <div className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center shadow-lg ${
            hasPromotion
              ? 'bg-gradient-to-br from-purple-400 to-pink-500'
              : 'bg-gradient-to-br from-amber-400 to-orange-500'
          }`}>
            {hasPromotion ? (
              <Zap className="h-6 w-6 text-white" />
            ) : (
              <Sparkles className="h-6 w-6 text-white" />
            )}
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-900">
              {hasPromotion ? 'Special Offer Available!' : "You're on a Free Trial"}
            </h3>
            <div className={`flex items-center gap-1.5 text-sm font-bold ${
              hasPromotion ? 'text-purple-700' : 'text-amber-700'
            }`}>
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
            After this date, you'll <strong className="text-rose-700">lose access to your account</strong> and all profile data.
          </p>
        </div>

        {/* CTA */}
        <Link
          to="/pricing"
          onClick={handleDismiss}
          className={`block w-full text-center text-white font-black py-3 px-4 rounded-xl transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 ${
            hasPromotion
              ? 'bg-gradient-to-r from-purple-500 via-pink-500 to-rose-500 hover:from-purple-600 hover:via-pink-600 hover:to-rose-600'
              : 'bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 hover:from-amber-600 hover:via-orange-600 hover:to-rose-600'
          }`}
        >
          {hasPromotion ? 'Claim Your Offer Now →' : 'Upgrade to Premium Now →'}
        </Link>

        <p className="text-xs text-center text-slate-500 mt-3">
          {pricingMessage}
        </p>
      </div>
    </div>
  );
};
