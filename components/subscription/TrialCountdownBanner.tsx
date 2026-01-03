import React, { useState } from 'react';
import { X, Calendar, AlertTriangle, Clock, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { Coach } from '../../types';
import { useTrialStatus } from '../../hooks/useTrialStatus';

interface TrialCountdownBannerProps {
  coach: Coach;
}

export const TrialCountdownBanner: React.FC<TrialCountdownBannerProps> = ({ coach }) => {
  const navigate = useNavigate();
  const trialStatus = useTrialStatus(coach);
  const [isDismissed, setIsDismissed] = useState(false);

  // Don't show if not in trial or if no countdown needed
  if (!trialStatus.showCountdownBanner || isDismissed) {
    return null;
  }

  const { daysRemaining, bannerSeverity, trialEndsAt } = trialStatus;
  const formattedEndDate = trialEndsAt?.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  // Banner styling based on severity
  const getBannerStyles = () => {
    switch (bannerSeverity) {
      case 'urgent': // 1-2 days
        return {
          bg: 'bg-orange-600',
          border: 'border-orange-700',
          text: 'text-white',
          subtext: 'text-orange-100',
          button: 'bg-white text-orange-600 hover:bg-orange-50',
          icon: AlertTriangle,
        };
      case 'warning': // 3-6 days
        return {
          bg: 'bg-yellow-500',
          border: 'border-yellow-600',
          text: 'text-yellow-900',
          subtext: 'text-yellow-800',
          button: 'bg-yellow-900 text-white hover:bg-yellow-800',
          icon: Clock,
        };
      default: // 7+ days (info)
        return {
          bg: 'bg-blue-600',
          border: 'border-blue-700',
          text: 'text-white',
          subtext: 'text-blue-100',
          button: 'bg-white text-blue-600 hover:bg-blue-50',
          icon: Calendar,
        };
    }
  };

  const styles = getBannerStyles();
  const IconComponent = styles.icon;

  // Banner content based on severity
  const getBannerContent = () => {
    if (daysRemaining <= 2) {
      return {
        emoji: '🔔',
        title: daysRemaining === 1 ? 'Last chance! Your trial expires tomorrow' : `Only ${daysRemaining} days left in your trial!`,
        subtitle: `After ${formattedEndDate}, clients won't be able to find you. Keep your profile live.`,
        cta: "Upgrade Now - Don't Miss Out",
      };
    } else if (daysRemaining <= 6) {
      return {
        emoji: '⚠️',
        title: `Only ${daysRemaining} days left in your trial!`,
        subtitle: `Your profile will be hidden from search after ${formattedEndDate}. Upgrade to stay visible.`,
        cta: 'Upgrade Now',
      };
    } else {
      return {
        emoji: '📅',
        title: `Your trial ends in ${daysRemaining} days`,
        subtitle: `Lock in your early bird rate now - £15/mo or £150/yr (save 17%)`,
        cta: 'View Pricing',
      };
    }
  };

  const content = getBannerContent();
  const canDismiss = daysRemaining > 3; // Only allow dismissing info banners

  return (
    <div className={`${styles.bg} ${styles.border} border-b-2 py-3 px-4 shadow-lg`}>
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1">
          <IconComponent className={`h-6 w-6 flex-shrink-0 ${styles.text}`} />
          <div className="min-w-0">
            <p className={`font-bold text-sm ${styles.text}`}>
              {content.emoji} {content.title}
            </p>
            <p className={`text-xs ${styles.subtext} mt-0.5`}>
              {content.subtitle}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/pricing')}
            className={`${styles.button} px-5 py-2 rounded-lg text-sm font-bold transition-colors flex-shrink-0 shadow-md flex items-center gap-2`}
          >
            <Zap className="h-4 w-4" />
            {content.cta}
          </button>

          {canDismiss && (
            <button
              onClick={() => setIsDismissed(true)}
              className={`${styles.text} hover:opacity-80 transition-opacity p-1`}
              aria-label="Dismiss banner"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
