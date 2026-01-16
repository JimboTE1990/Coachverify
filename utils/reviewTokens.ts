/**
 * Review Token Management
 * Handles secure token generation and localStorage for review ownership tracking
 */

interface StoredReview {
  id: string;
  token: string;
  submittedAt: string;
}

const STORAGE_KEY = 'coachdog_my_reviews';

/**
 * Generate a secure random token for review ownership
 */
export const generateReviewToken = (): string => {
  // Generate a random UUID-like token
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

/**
 * Store a review token in localStorage
 */
export const storeReviewToken = (reviewId: string, token: string): void => {
  try {
    const stored = getStoredReviews();
    stored.push({
      id: reviewId,
      token: token,
      submittedAt: new Date().toISOString()
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
    console.log('[ReviewTokens] Stored token for review:', reviewId);
  } catch (error) {
    console.error('[ReviewTokens] Failed to store token:', error);
  }
};

/**
 * Get all stored review tokens
 */
export const getStoredReviews = (): StoredReview[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('[ReviewTokens] Failed to get stored reviews:', error);
    return [];
  }
};

/**
 * Get token for a specific review ID
 */
export const getReviewToken = (reviewId: string): string | null => {
  const stored = getStoredReviews();
  const review = stored.find(r => r.id === reviewId);
  return review ? review.token : null;
};

/**
 * Check if user can manage a review (has token for it)
 */
export const canManageReview = (reviewId: string): boolean => {
  return getReviewToken(reviewId) !== null;
};

/**
 * Remove a review token from localStorage (after deletion)
 */
export const removeReviewToken = (reviewId: string): void => {
  try {
    const stored = getStoredReviews();
    const filtered = stored.filter(r => r.id !== reviewId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    console.log('[ReviewTokens] Removed token for review:', reviewId);
  } catch (error) {
    console.error('[ReviewTokens] Failed to remove token:', error);
  }
};

/**
 * Get all review IDs that the user can manage
 */
export const getManageableReviewIds = (): string[] => {
  return getStoredReviews().map(r => r.id);
};

/**
 * Clean up old review tokens (optional - remove tokens older than 90 days)
 */
export const cleanupOldTokens = (): void => {
  try {
    const stored = getStoredReviews();
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const filtered = stored.filter(r => {
      const submittedDate = new Date(r.submittedAt);
      return submittedDate > ninetyDaysAgo;
    });

    if (filtered.length < stored.length) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
      console.log('[ReviewTokens] Cleaned up old tokens:', stored.length - filtered.length);
    }
  } catch (error) {
    console.error('[ReviewTokens] Failed to cleanup tokens:', error);
  }
};
