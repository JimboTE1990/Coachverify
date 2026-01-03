import { useMemo } from 'react';
import type { Coach } from '../types';

export type BannerSeverity = 'info' | 'warning' | 'urgent' | 'expired';

export interface TrialStatus {
  isTrialActive: boolean;
  isExpired: boolean;
  daysRemaining: number;
  showCountdownBanner: boolean;
  bannerSeverity: BannerSeverity;
  trialEndsAt: Date | null;
  neverPaid: boolean; // User never upgraded from trial
  wasPaidSubscriber: boolean; // User paid, then cancelled
}

/**
 * Hook to calculate trial status and determine which banners to show
 *
 * Trial Warning Thresholds:
 * - 7+ days: Blue info banner (dismissible)
 * - 3-6 days: Yellow warning banner
 * - 1-2 days: Orange urgent banner
 * - 0 days (expired): Red persistent banner (handled by ExpiredBanner)
 */
export const useTrialStatus = (coach: Coach | null): TrialStatus => {
  return useMemo(() => {
    if (!coach) {
      return {
        isTrialActive: false,
        isExpired: false,
        daysRemaining: 0,
        showCountdownBanner: false,
        bannerSeverity: 'info',
        trialEndsAt: null,
        neverPaid: false,
        wasPaidSubscriber: false,
      };
    }

    const now = new Date();
    const trialEndsAt = coach.trialEndsAt ? new Date(coach.trialEndsAt) : null;
    const isPastEndDate = coach.subscriptionEndsAt && new Date(coach.subscriptionEndsAt) < now;

    // Calculate days remaining
    let daysRemaining = 0;
    if (trialEndsAt) {
      const diffTime = trialEndsAt.getTime() - now.getTime();
      daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    // Determine if trial is active
    const isTrialActive = coach.subscriptionStatus === 'trial' && !coach.billingCycle;

    // Determine if expired
    const isExpired = coach.subscriptionStatus === 'expired' || (coach.cancelledAt && isPastEndDate);

    // Determine banner severity based on days remaining
    let bannerSeverity: BannerSeverity = 'info';
    if (daysRemaining <= 0) {
      bannerSeverity = 'expired';
    } else if (daysRemaining <= 2) {
      bannerSeverity = 'urgent';
    } else if (daysRemaining <= 6) {
      bannerSeverity = 'warning';
    }

    // Show countdown banner if trial is active and 7 days or less
    const showCountdownBanner = isTrialActive && daysRemaining > 0 && daysRemaining <= 7;

    // Determine user type
    const neverPaid = coach.subscriptionStatus === 'expired' && !coach.billingCycle;
    const wasPaidSubscriber = !!coach.cancelledAt && isPastEndDate;

    return {
      isTrialActive,
      isExpired,
      daysRemaining,
      showCountdownBanner,
      bannerSeverity,
      trialEndsAt,
      neverPaid,
      wasPaidSubscriber,
    };
  }, [coach]);
};
