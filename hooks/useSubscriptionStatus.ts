import { useMemo } from 'react';
import type { Coach } from '../types';
import {
  calculateDaysRemaining,
  shouldShowTrialWarning,
  getTrialWarningLevel,
  type SubscriptionStatus as SubscriptionStatusType,
} from '../constants/subscription';

export interface SubscriptionStatusInfo {
  // Status flags
  isActive: boolean;
  isExpired: boolean;
  isTrial: boolean;
  isOnboarding: boolean;
  isCancelled: boolean;

  // Trial information
  daysRemaining: number | null;
  trialEndsAt: Date | null;
  shouldShowWarning: boolean;
  warningLevel: 'none' | 'info' | 'warning' | 'urgent';

  // Access control
  canAccessDashboard: boolean;
  canEditProfile: boolean;
  isProfileVisible: boolean;

  // Subscription details
  subscriptionStatus: SubscriptionStatusType;
  billingCycle: 'monthly' | 'annual' | null;
  subscriptionEndsAt: Date | null;

  // Display helpers
  statusLabel: string;
  statusColor: string;
}

/**
 * Hook to calculate subscription status and access permissions
 *
 * @param coach - Coach profile data
 * @returns Comprehensive subscription status information
 *
 * @example
 * const status = useSubscriptionStatus(coach);
 * if (status.shouldShowWarning) {
 *   // Show trial expiring banner
 * }
 */
export const useSubscriptionStatus = (coach: Coach | null): SubscriptionStatusInfo => {
  return useMemo(() => {
    // Default state for no coach
    if (!coach) {
      return {
        isActive: false,
        isExpired: false,
        isTrial: false,
        isOnboarding: true,
        isCancelled: false,
        daysRemaining: null,
        trialEndsAt: null,
        shouldShowWarning: false,
        warningLevel: 'none' as const,
        canAccessDashboard: false,
        canEditProfile: false,
        isProfileVisible: false,
        subscriptionStatus: 'onboarding' as const,
        billingCycle: null,
        subscriptionEndsAt: null,
        statusLabel: 'Onboarding',
        statusColor: '#6b7280', // gray
      };
    }

    const status = coach.subscriptionStatus || 'onboarding';
    const isOnboarding = status === 'onboarding';
    const isTrial = status === 'trial';
    const isActive = status === 'active';
    const isExpired = status === 'expired';
    const isCancelled = !!coach.cancelledAt;

    // Calculate trial days remaining
    let daysRemaining: number | null = null;
    let trialEndsAt: Date | null = null;
    if (isTrial && coach.trialEndsAt) {
      trialEndsAt = new Date(coach.trialEndsAt);
      daysRemaining = calculateDaysRemaining(trialEndsAt);
    }

    // Warning levels for trial
    const shouldShowWarning = isTrial && daysRemaining !== null && shouldShowTrialWarning(daysRemaining);
    const warningLevel = isTrial && daysRemaining !== null ? getTrialWarningLevel(daysRemaining) : 'none';

    // Access permissions
    const canAccessDashboard = isTrial || isActive;
    const canEditProfile = isOnboarding || isTrial || isActive || isExpired; // Expired can edit
    const isProfileVisible = coach.profileVisible ?? (isTrial || isActive); // Default based on status

    // Subscription end date
    let subscriptionEndsAt: Date | null = null;
    if (coach.subscriptionEndsAt) {
      subscriptionEndsAt = new Date(coach.subscriptionEndsAt);
    }

    // Status label and color for UI
    let statusLabel: string;
    let statusColor: string;

    if (isOnboarding) {
      statusLabel = 'Onboarding';
      statusColor = '#6b7280'; // gray
    } else if (isTrial) {
      statusLabel = daysRemaining !== null ? `Trial (${daysRemaining} days left)` : 'Trial';
      statusColor = '#3b82f6'; // blue
    } else if (isActive) {
      if (isCancelled && subscriptionEndsAt) {
        const daysUntilEnd = calculateDaysRemaining(subscriptionEndsAt);
        statusLabel = `Cancelling (${daysUntilEnd} days left)`;
        statusColor = '#f59e0b'; // amber
      } else {
        statusLabel = 'Active';
        statusColor = '#10b981'; // green
      }
    } else if (isExpired) {
      statusLabel = 'Expired';
      statusColor = '#ef4444'; // red
    } else {
      statusLabel = 'Unknown';
      statusColor = '#6b7280'; // gray
    }

    return {
      isActive,
      isExpired,
      isTrial,
      isOnboarding,
      isCancelled,
      daysRemaining,
      trialEndsAt,
      shouldShowWarning,
      warningLevel,
      canAccessDashboard,
      canEditProfile,
      isProfileVisible,
      subscriptionStatus: status,
      billingCycle: coach.billingCycle || null,
      subscriptionEndsAt,
      statusLabel,
      statusColor,
    };
  }, [coach]);
};

/**
 * Helper hook to check if user should be prompted to upgrade
 */
export const useShouldPromptUpgrade = (coach: Coach | null): boolean => {
  const status = useSubscriptionStatus(coach);

  // Show upgrade prompt if:
  // 1. Trial with warning (7, 3, or 1 days left)
  // 2. Expired
  // 3. Onboarding (not verified yet, but could show after verification)

  return status.shouldShowWarning || status.isExpired;
};
