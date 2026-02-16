import { Coach, QuestionnaireAnswers } from '../types';

/**
 * Calculate match percentage between a coach and questionnaire answers
 * Returns a score from 0-100
 */
export const calculateMatchScore = (coach: Coach, answers: QuestionnaireAnswers): number => {
  let totalPoints = 0;
  let maxPoints = 0;

  // 1. Specialty Match (Weight: 25 points) - CRITICAL
  // Priority: mainCoachingCategories > coachingExpertise > specialties (legacy)
  maxPoints += 25;

  // First, check if coach has selected main coaching categories (new primary field)
  if (coach.mainCoachingCategories && coach.mainCoachingCategories.length > 0 && answers.coachingExpertise && answers.coachingExpertise.length > 0) {
    // Map the user's detailed expertise selections back to their main categories
    const CATEGORY_MAPPING: Record<string, string> = {
      'Career Transition': 'Career & Professional Development',
      'Leadership Development': 'Career & Professional Development',
      'Executive Coaching': 'Career & Professional Development',
      'Team Coaching': 'Career & Professional Development',
      'Performance Coaching': 'Career & Professional Development',
      'Communication Skills': 'Career & Professional Development',
      'Public Speaking': 'Career & Professional Development',
      'Interview Preparation': 'Career & Professional Development',
      'Networking': 'Career & Professional Development',
      'Personal Branding': 'Career & Professional Development',
      'Work-Life Balance': 'Career & Professional Development',
      'Time Management': 'Career & Professional Development',
      'Productivity': 'Career & Professional Development',
      'Confidence Building': 'Career & Professional Development',
      'Business Start-up': 'Business & Entrepreneurship',
      'Business Growth & Scaling': 'Business & Entrepreneurship',
      'Strategic Planning': 'Business & Entrepreneurship',
      'Sales Coaching': 'Business & Entrepreneurship',
      'Marketing & Branding': 'Business & Entrepreneurship',
      'Negotiation Skills': 'Business & Entrepreneurship',
      'Innovation & Creativity': 'Business & Entrepreneurship',
      'Succession Planning': 'Business & Entrepreneurship',
      'Stress Management': 'Health & Wellness',
      'Mindfulness & Meditation': 'Health & Wellness',
      'Sleep Improvement': 'Health & Wellness',
      'Nutrition & Healthy Eating': 'Health & Wellness',
      'Fitness & Exercise': 'Health & Wellness',
      'Weight Management': 'Health & Wellness',
      'Chronic Illness Management': 'Health & Wellness',
      'Mental Health & Wellbeing': 'Health & Wellness',
      'Addiction Recovery': 'Health & Wellness',
      'Grief & Loss': 'Health & Wellness',
      'Burnout Recovery': 'Health & Wellness',
      'Life Purpose & Meaning': 'Personal & Life',
      'Goal Setting & Achievement': 'Personal & Life',
      'Relationship Coaching': 'Personal & Life',
      'Parenting': 'Personal & Life',
      'Family Dynamics': 'Personal & Life',
      'Divorce & Separation': 'Personal & Life',
      'Self-Esteem & Confidence': 'Personal & Life',
      'Personal Growth': 'Personal & Life',
      'Spiritual Development': 'Personal & Life',
      'Retirement Planning (Life)': 'Personal & Life',
      'Lifestyle Design': 'Personal & Life',
      'Creative Expression': 'Personal & Life',
      'Financial Planning & Budgeting': 'Financial',
      'Debt Management': 'Financial',
      'Investment Coaching': 'Financial',
      'Retirement Planning (Financial)': 'Financial',
      'Money Mindset': 'Financial'
    };

    // Find which main categories the user's expertise selections belong to
    const userMainCategories = new Set(
      answers.coachingExpertise.map(e => CATEGORY_MAPPING[e]).filter(Boolean)
    );

    // Check if coach has any matching main categories
    const categoryMatches = coach.mainCoachingCategories.filter(c =>
      userMainCategories.has(c)
    );

    if (categoryMatches.length > 0) {
      // Give points based on match ratio (how many of user's categories the coach covers)
      const matchRatio = categoryMatches.length / userMainCategories.size;
      totalPoints += Math.round(25 * matchRatio);
    } else if (coach.coachingExpertise && coach.coachingExpertise.length > 0) {
      // Fallback: Check detailed expertise if no main category match
      const expertiseMatches = coach.coachingExpertise.filter(e =>
        answers.coachingExpertise?.includes(e)
      );
      if (expertiseMatches.length > 0) {
        const matchRatio = expertiseMatches.length / answers.coachingExpertise.length;
        totalPoints += Math.round(25 * matchRatio * 0.8); // 80% weight for detailed-only match
      }
    }
  } else if (answers.goal && coach.specialties?.includes(answers.goal as any)) {
    // Legacy: old specialties field for backward compatibility
    totalPoints += 25;
  } else if (answers.coachingExpertise && answers.coachingExpertise.length > 0 && coach.coachingExpertise) {
    // Check if coach has any matching coaching expertise areas (no main categories set)
    const expertiseMatches = coach.coachingExpertise.filter(e =>
      answers.coachingExpertise?.includes(e)
    );
    if (expertiseMatches.length > 0) {
      const matchRatio = expertiseMatches.length / answers.coachingExpertise.length;
      totalPoints += Math.round(25 * matchRatio);
    }
  }

  // 2. Format Match (Weight: 15 points) - IMPORTANT
  maxPoints += 15;
  if (answers.preferredFormat.length > 0) {
    const formatMatches = coach.availableFormats?.filter(f =>
      answers.preferredFormat.includes(f)
    ) || [];
    if (formatMatches.length > 0) {
      // Give full points if any format matches
      totalPoints += 15;
    }
  } else {
    // If no preference specified, give full points
    totalPoints += 15;
  }

  // 3. Budget Match (Weight: 20 points) - IMPORTANT
  maxPoints += 20;
  if (coach.hourlyRate) {
    const budgetMin = answers.budgetMin || 30;
    const budgetMax = answers.budgetMax || 500;

    if (coach.hourlyRate >= budgetMin && coach.hourlyRate <= budgetMax) {
      totalPoints += 20; // Full points if within range
    } else if (coach.hourlyRate < budgetMin) {
      // Still match if below minimum (cheaper is fine!)
      totalPoints += 20;
    } else {
      // Partial points if within 20% over budget max
      const overBudgetPercent = ((coach.hourlyRate - budgetMax) / budgetMax) * 100;
      if (overBudgetPercent <= 20) {
        totalPoints += 10; // Half points
      }
    }
  }

  // 4. Certification Match (Weight: 15 points) - MODERATE
  maxPoints += 15;
  if (answers.preferredCertifications && answers.preferredCertifications.length > 0) {
    const certMatches = coach.additionalCertifications?.filter(c =>
      answers.preferredCertifications?.includes(c)
    ) || [];

    if (certMatches.length > 0) {
      // Points proportional to number of matching certifications
      const matchRatio = certMatches.length / answers.preferredCertifications.length;
      totalPoints += Math.round(15 * matchRatio);
    }
  } else {
    // If no preference, give full points
    totalPoints += 15;
  }

  // 5. Language Match (Weight: 10 points) - MODERATE
  maxPoints += 10;
  if (answers.languagePreferences && answers.languagePreferences.length > 0) {
    // Check if coach speaks any of the preferred languages
    const languageMatches = coach.languages?.filter(l =>
      answers.languagePreferences?.includes(l)
    ) || [];

    if (languageMatches.length > 0) {
      // Give full points if at least one language matches
      totalPoints += 10;
    }
  } else {
    // If no language preference specified, give full points
    totalPoints += 10;
  }

  // 6. Experience Level Match (Weight: 10 points) - MODERATE
  maxPoints += 10;
  if (answers.experienceLevel && answers.experienceLevel !== 'any') {
    const hours = coach.coachingHours || 0;

    if (answers.experienceLevel === 'beginner' && hours >= 100 && hours <= 500) {
      totalPoints += 10;
    } else if (answers.experienceLevel === 'intermediate' && hours > 500 && hours <= 1500) {
      totalPoints += 10;
    } else if (answers.experienceLevel === 'advanced' && hours > 1500) {
      totalPoints += 10;
    } else if (hours > 100) {
      // Partial points if coach has experience but not exact match
      totalPoints += 5;
    }
  } else {
    totalPoints += 10;
  }

  // 7. Review Quality Boost (Weight: 5 points) - BONUS
  // Rewards coaches with high ratings and many reviews
  maxPoints += 5;
  const avgRating = coach.averageRating || 0;
  const totalReviews = coach.totalReviews || 0;

  if (totalReviews > 0) {
    // Points based on rating (0-3 points)
    const ratingPoints = (avgRating / 5) * 3;

    // Bonus points for review volume (0-2 points)
    let volumeBonus = 0;
    if (totalReviews >= 20) volumeBonus = 2;
    else if (totalReviews >= 10) volumeBonus = 1.5;
    else if (totalReviews >= 5) volumeBonus = 1;
    else if (totalReviews >= 2) volumeBonus = 0.5;

    totalPoints += Math.round(ratingPoints + volumeBonus);
  }

  // Calculate percentage
  const percentage = Math.round((totalPoints / maxPoints) * 100);
  return percentage;
};

/**
 * Generate a human-readable match reason explaining why this coach matches
 */
export const getMatchReason = (coach: Coach, answers: QuestionnaireAnswers): string => {
  const reasons: string[] = [];

  // Specialty match
  if (answers.goal && coach.specialties?.includes(answers.goal as any)) {
    reasons.push(`Specializes in ${answers.goal}`);
  }

  // Budget match
  const budgetMin = answers.budgetMin || 30;
  const budgetMax = answers.budgetMax || 500;
  if (coach.hourlyRate && coach.hourlyRate >= budgetMin && coach.hourlyRate <= budgetMax) {
    reasons.push("Fits your budget");
  }

  // Format match
  const formatMatches = coach.availableFormats?.filter(f =>
    answers.preferredFormat.includes(f)
  ) || [];
  if (formatMatches.length > 0) {
    reasons.push(`Available ${formatMatches[0].toLowerCase()}`);
  }

  // Certification match
  const certMatches = coach.additionalCertifications?.filter(c =>
    answers.preferredCertifications?.includes(c)
  ) || [];
  if (certMatches.length > 0) {
    reasons.push(certMatches[0]); // Show first matching certification
  }

  // Language match
  if (answers.languagePreferences && answers.languagePreferences.length > 0) {
    const languageMatches = coach.languages?.filter(l =>
      answers.languagePreferences?.includes(l)
    ) || [];
    if (languageMatches.length > 0) {
      reasons.push(`Speaks ${languageMatches[0]}`); // Show first matching language
    }
  }

  // Experience match
  if (answers.experienceLevel && answers.experienceLevel !== 'any') {
    const hours = coach.coachingHours || 0;
    if (answers.experienceLevel === 'beginner' && hours >= 100 && hours <= 500) {
      reasons.push(`${hours}+ hours experience`);
    } else if (answers.experienceLevel === 'intermediate' && hours > 500 && hours <= 1500) {
      reasons.push(`${hours}+ hours experience`);
    } else if (answers.experienceLevel === 'advanced' && hours > 1500) {
      reasons.push(`${hours}+ hours experience`);
    }
  }

  if (reasons.length === 0) {
    return "General recommendation";
  }

  // Return top 3 reasons
  return reasons.slice(0, 3).join(" • ");
};

/**
 * Sort coaches by match score (highest first)
 */
export const sortCoachesByMatch = (
  coaches: Coach[],
  answers: QuestionnaireAnswers
): Coach[] => {
  return [...coaches].sort((a, b) => {
    const scoreA = calculateMatchScore(a, answers);
    const scoreB = calculateMatchScore(b, answers);
    return scoreB - scoreA;
  });
};

/**
 * Calculate review quality score for sorting (0-100)
 * Used when no questionnaire data is available
 */
export const calculateReviewScore = (coach: Coach): number => {
  const avgRating = coach.averageRating || 0;
  const totalReviews = coach.totalReviews || 0;

  if (totalReviews === 0) return 0;

  // Base score from rating (0-70 points)
  const ratingScore = (avgRating / 5) * 70;

  // Volume boost (0-30 points)
  let volumeScore = 0;
  if (totalReviews >= 50) volumeScore = 30;
  else if (totalReviews >= 20) volumeScore = 25;
  else if (totalReviews >= 10) volumeScore = 20;
  else if (totalReviews >= 5) volumeScore = 15;
  else if (totalReviews >= 2) volumeScore = 10;
  else volumeScore = 5;

  return Math.round(ratingScore + volumeScore);
};

/**
 * Sort coaches by review quality (highest first)
 * Prioritizes highly-rated coaches with many reviews
 */
export const sortCoachesByReviews = (coaches: Coach[]): Coach[] => {
  return [...coaches].sort((a, b) => {
    const scoreA = calculateReviewScore(a);
    const scoreB = calculateReviewScore(b);
    return scoreB - scoreA;
  });
};
