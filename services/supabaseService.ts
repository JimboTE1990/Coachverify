import { supabase } from '../lib/supabase';
import { Coach, Review, SocialLink, Specialty, Format } from '../types';

// Re-export supabase for use in other components
export { supabase };

// ============================================================================
// COACH SERVICES
// ============================================================================

export const getCoaches = async (): Promise<Coach[]> => {
  // Show coaches with active subscriptions (trial or active)
  // Trial coaches are auto-verified to appear immediately (for scalability)
  // Only paid coaches require manual verification
  const { data: coaches, error } = await supabase
    .from('coach_profiles')
    .select('*')
    .in('subscription_status', ['trial', 'active']) // Show all coaches with active subscriptions
    .or('subscription_status.eq.trial,is_verified.eq.true') // Trial coaches OR verified coaches
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching coaches:', error);
    return [];
  }

  return mapCoachProfiles(coaches || []);
};

export const getCoachById = async (id: string): Promise<Coach | null> => {
  const { data: coach, error } = await supabase
    .from('coach_profiles')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching coach:', error);
    return null;
  }

  if (!coach) return null;

  // Fetch reviews separately
  const { data: reviews } = await supabase
    .from('reviews')
    .select('*')
    .eq('coach_id', id)
    .order('created_at', { ascending: false });

  // Fetch social links
  const { data: socialLinks } = await supabase
    .from('social_links')
    .select('*')
    .eq('coach_id', id)
    .order('display_order', { ascending: true });

  const mappedCoach = mapCoachProfile(coach);
  mappedCoach.reviews = (reviews || []).map(mapReview);
  mappedCoach.socialLinks = (socialLinks || []).map(mapSocialLink);

  return mappedCoach;
};

export const getCoachByUserId = async (userId: string): Promise<Coach | null> => {
  console.log('[getCoachByUserId] Fetching coach profile for user_id:', userId);

  const { data: coach, error } = await supabase
    .from('coach_profiles')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error) {
    console.error('[getCoachByUserId] Error fetching coach by user_id:', error);
    console.error('[getCoachByUserId] Error code:', error.code);
    console.error('[getCoachByUserId] Error message:', error.message);
    console.error('[getCoachByUserId] Error details:', error.details);
    console.error('[getCoachByUserId] Error hint:', error.hint);
    return null;
  }

  console.log('[getCoachByUserId] Successfully fetched coach:', coach ? 'YES' : 'NO');

  if (!coach) return null;

  // Fetch reviews separately
  const { data: reviews } = await supabase
    .from('reviews')
    .select('*')
    .eq('coach_id', coach.id)
    .order('created_at', { ascending: false });

  // Fetch social links
  const { data: socialLinks } = await supabase
    .from('social_links')
    .select('*')
    .eq('coach_id', coach.id)
    .order('display_order', { ascending: true });

  const mappedCoach = mapCoachProfile(coach);
  mappedCoach.reviews = (reviews || []).map(mapReview);
  mappedCoach.socialLinks = (socialLinks || []).map(mapSocialLink);

  return mappedCoach;
};

export const updateCoach = async (coach: Coach): Promise<boolean> => {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    console.error('User not authenticated');
    return false;
  }

  // Build update object with only defined fields
  const updateData: any = {
    name: coach.name,
    email: coach.email,
    phone_number: coach.phoneNumber || null,
    photo_url: coach.photoUrl,
    bio: coach.bio || '',
    location: coach.location,
    hourly_rate: coach.hourlyRate,
    years_experience: coach.yearsExperience,
    is_verified: coach.isVerified,
    documents_submitted: coach.documentsSubmitted,
    subscription_status: coach.subscriptionStatus,
    billing_cycle: coach.billingCycle,
    two_factor_enabled: coach.twoFactorEnabled,
  };

  // Add optional fields only if they are defined
  if (coach.trialEndsAt !== undefined) updateData.trial_ends_at = coach.trialEndsAt;
  if (coach.lastPaymentDate !== undefined) updateData.last_payment_date = coach.lastPaymentDate;

  // Enhanced profile fields (only add if defined)
  if (coach.accreditationLevel !== undefined) updateData.accreditation_level = coach.accreditationLevel;
  if (coach.additionalCertifications !== undefined) updateData.additional_certifications = coach.additionalCertifications;
  if (coach.coachingHours !== undefined) updateData.coaching_hours = coach.coachingHours;
  if (coach.locationRadius !== undefined) updateData.location_radius = coach.locationRadius;
  if (coach.qualifications !== undefined) updateData.qualifications = coach.qualifications;
  if (coach.acknowledgements !== undefined) updateData.acknowledgements = coach.acknowledgements;
  if (coach.coachingExpertise !== undefined) updateData.coaching_expertise = coach.coachingExpertise;
  if (coach.cpdQualifications !== undefined) updateData.cpd_qualifications = coach.cpdQualifications;
  if (coach.coachingLanguages !== undefined) updateData.coaching_languages = coach.coachingLanguages;
  if (coach.gender !== undefined) updateData.gender = coach.gender;
  if (coach.currency !== undefined) updateData.currency = coach.currency;

  // Specialties and formats as JSONB columns
  if (coach.specialties !== undefined) updateData.specialties = coach.specialties;
  if (coach.availableFormats !== undefined) updateData.formats = coach.availableFormats;
  if (coach.certifications !== undefined) updateData.certifications = coach.certifications;

  // Cancellation fields (only add if defined)
  if (coach.cancelledAt !== undefined) updateData.cancelled_at = coach.cancelledAt;
  if (coach.subscriptionEndsAt !== undefined) updateData.subscription_ends_at = coach.subscriptionEndsAt;
  if (coach.cancelReason !== undefined) updateData.cancel_reason = coach.cancelReason;
  if (coach.cancelFeedback !== undefined) updateData.cancel_feedback = coach.cancelFeedback;
  if (coach.dataRetentionPreference !== undefined) updateData.data_retention_preference = coach.dataRetentionPreference;
  if (coach.scheduledDeletionAt !== undefined) updateData.scheduled_deletion_at = coach.scheduledDeletionAt;

  // Update main coach record
  const { error: coachError } = await supabase
    .from('coach_profiles')
    .update(updateData)
    .eq('id', coach.id)
    .eq('user_id', user.id);

  if (coachError) {
    console.error('Error updating coach:', coachError);
    console.error('Error details:', coachError.message, coachError.details, coachError.hint);
    return false;
  }

  // Update social links with error handling
  try {
    await updateCoachSocialLinks(coach.id, coach.socialLinks || []);
  } catch (error: any) {
    console.error('[updateCoach] Failed to update social links:', error);
    // Don't fail the entire update if social links fail
    // User will see their other changes saved, and we'll log the specific error
  }

  return true;
};

export const registerCoach = async (
  email: string,
  password: string,
  name: string
): Promise<Coach | null> => {
  // Sign up the user
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
  });

  if (authError || !authData.user) {
    console.error('Error creating user:', authError);
    return null;
  }

  // Create coach profile
  const { data: coach, error: coachError } = await supabase
    .from('coaches')
    .insert({
      user_id: authData.user.id,
      name,
      email,
      photo_url: 'https://picsum.photos/200/200?grayscale',
      bio: 'Profile under construction.',
      location: 'Remote',
      hourly_rate: 0,
      years_experience: 0,
      subscription_status: 'onboarding',
      billing_cycle: 'monthly',
    })
    .select()
    .single();

  if (coachError || !coach) {
    console.error('Error creating coach profile:', coachError);
    return null;
  }

  // Add default specialty
  const { data: generalSpecialty } = await supabase
    .from('specialties')
    .select('id')
    .eq('name', 'General')
    .single();

  if (generalSpecialty) {
    await supabase.from('coach_specialties').insert({
      coach_id: coach.id,
      specialty_id: generalSpecialty.id,
    });
  }

  // Add default format
  const { data: onlineFormat } = await supabase
    .from('formats')
    .select('id')
    .eq('name', 'Online')
    .single();

  if (onlineFormat) {
    await supabase.from('coach_formats').insert({
      coach_id: coach.id,
      format_id: onlineFormat.id,
    });
  }

  return await getCoachById(coach.id);
};

export const toggleVerifyCoach = async (coachId: string): Promise<boolean> => {
  const coach = await getCoachById(coachId);
  if (!coach) return false;

  const newVerifiedStatus = !coach.isVerified;

  const { error } = await supabase
    .from('coaches')
    .update({
      is_verified: newVerifiedStatus,
      verified_at: newVerifiedStatus ? new Date().toISOString() : null,
      documents_submitted: newVerifiedStatus ? true : coach.documentsSubmitted,
    })
    .eq('id', coachId);

  if (error) {
    console.error('Error toggling verification:', error);
    return false;
  }

  return true;
};

export const verifyCoachLicense = async (
  body: string,
  regNumber: string
): Promise<boolean> => {
  // TODO: Integrate with actual verification APIs (EMCC, ICF, etc.)
  // For now, simulate verification
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(body.length > 0 && regNumber.length > 3);
    }, 1000);
  });
};

// ============================================================================
// REVIEW SERVICES
// ============================================================================

export const addReview = async (
  coachId: string,
  authorName: string,
  rating: number,
  reviewText: string,
  coachingPeriod: string,
  location?: string,
  reviewToken?: string // Optional token - will be generated if not provided
): Promise<Review | null> => {
  // Import spam detection (dynamic import to avoid circular dependencies)
  const { detectSpam, getSpamMessage } = await import('../utils/spamDetection');

  // Run spam detection before submitting
  const spamCheck = detectSpam(reviewText, authorName);

  // If spam is detected with high confidence, reject the review
  if (spamCheck.isSpam && spamCheck.confidence >= 70) {
    console.warn('[addReview] Spam detected:', spamCheck);
    throw new Error(getSpamMessage(spamCheck));
  }

  // Generate token if not provided
  const token = reviewToken || generateReviewToken();

  const { data: review, error } = await supabase
    .from('reviews')
    .insert({
      coach_id: coachId,
      author_name: authorName,
      rating,
      review_text: reviewText,
      coaching_period: coachingPeriod,
      reviewer_location: location || null,
      review_token: token, // Store token for ownership verification
      spam_score: spamCheck.confidence,
      spam_reasons: spamCheck.reasons,
      is_spam: spamCheck.isSpam,
      spam_category: spamCheck.category || null,
    })
    .select()
    .single();

  if (error) {
    console.error('Error adding review:', error);
    return null;
  }

  const mappedReview = mapReview(review);
  // Add token to response so it can be stored in localStorage
  (mappedReview as any).token = token;

  return mappedReview;
};

// Helper function to generate secure review token
const generateReviewToken = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

/**
 * Delete a review (requires token for ownership verification)
 */
export const deleteReview = async (
  reviewId: string,
  reviewToken: string
): Promise<boolean> => {
  console.log('[deleteReview] Attempting to delete review:', { reviewId });

  // Verify token matches before deleting
  const { data: review } = await supabase
    .from('reviews')
    .select('review_token')
    .eq('id', reviewId)
    .single();

  if (!review || review.review_token !== reviewToken) {
    console.error('[deleteReview] Invalid token or review not found');
    return false;
  }

  const { error } = await supabase
    .from('reviews')
    .delete()
    .eq('id', reviewId);

  if (error) {
    console.error('[deleteReview] Error deleting review:', error);
    return false;
  }

  console.log('[deleteReview] Successfully deleted review');
  return true;
};

/**
 * Update a review (requires token for ownership verification)
 */
export const updateReview = async (
  reviewId: string,
  reviewToken: string,
  updates: {
    rating?: number;
    reviewText?: string;
    authorName?: string;
    coachingPeriod?: string;
    location?: string;
  }
): Promise<Review | null> => {
  console.log('[updateReview] Attempting to update review:', { reviewId });

  // Verify token matches before updating
  const { data: review } = await supabase
    .from('reviews')
    .select('review_token')
    .eq('id', reviewId)
    .single();

  if (!review || review.review_token !== reviewToken) {
    console.error('[updateReview] Invalid token or review not found');
    return null;
  }

  // Build update object with snake_case field names
  const updateData: Record<string, any> = {};
  if (updates.rating !== undefined) updateData.rating = updates.rating;
  if (updates.reviewText !== undefined) updateData.review_text = updates.reviewText;
  if (updates.authorName !== undefined) updateData.author_name = updates.authorName;
  if (updates.coachingPeriod !== undefined) updateData.coaching_period = updates.coachingPeriod;
  if (updates.location !== undefined) updateData.reviewer_location = updates.location;

  const { data: updatedReview, error } = await supabase
    .from('reviews')
    .update(updateData)
    .eq('id', reviewId)
    .select()
    .single();

  if (error) {
    console.error('[updateReview] Error updating review:', error);
    return null;
  }

  console.log('[updateReview] Successfully updated review');
  return mapReview(updatedReview);
};

export const toggleFlagReview = async (
  coachId: string,
  reviewId: string
): Promise<boolean> => {
  const { data: review } = await supabase
    .from('reviews')
    .select('is_flagged')
    .eq('id', reviewId)
    .single();

  if (!review) return false;

  const { error } = await supabase
    .from('reviews')
    .update({ is_flagged: !review.is_flagged })
    .eq('id', reviewId)
    .eq('coach_id', coachId);

  if (error) {
    console.error('Error flagging review:', error);
    return false;
  }

  return true;
};

export const addCoachReply = async (
  reviewId: string,
  coachReply: string
): Promise<Review | null> => {
  const { data: review, error } = await supabase
    .from('reviews')
    .update({
      coach_reply: coachReply,
      coach_reply_date: new Date().toISOString(),
    })
    .eq('id', reviewId)
    .select()
    .single();

  if (error) {
    console.error('Error adding coach reply:', error);
    return null;
  }

  return mapReview(review);
};

export const verifyReview = async (
  reviewId: string,
  coachId: string
): Promise<boolean> => {
  console.log('[verifyReview] Attempting to verify review:', { reviewId, coachId });

  const { data, error } = await supabase
    .from('reviews')
    .update({
      verification_status: 'verified',
      verified_at: new Date().toISOString(),
    })
    .eq('id', reviewId)
    .eq('coach_id', coachId)
    .select();

  if (error) {
    console.error('[verifyReview] Error:', error);
    console.error('[verifyReview] Error details:', {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint
    });
    return false;
  }

  console.log('[verifyReview] Success! Updated rows:', data);
  return true;
};

export const flagReview = async (
  reviewId: string,
  coachId: string
): Promise<boolean> => {
  console.log('[flagReview] Attempting to flag review:', { reviewId, coachId });

  const { data, error } = await supabase
    .from('reviews')
    .update({
      verification_status: 'flagged',
    })
    .eq('id', reviewId)
    .eq('coach_id', coachId)
    .select();

  if (error) {
    console.error('[flagReview] Error:', error);
    console.error('[flagReview] Error details:', {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint
    });
    return false;
  }

  console.log('[flagReview] Success! Updated rows:', data);
  return true;
};

export const resetReviewVerification = async (
  reviewId: string,
  coachId: string
): Promise<boolean> => {
  const { error } = await supabase
    .from('reviews')
    .update({
      verification_status: 'unverified',
      verified_at: null,
    })
    .eq('id', reviewId)
    .eq('coach_id', coachId);

  if (error) {
    console.error('Error resetting review verification:', error);
    return false;
  }

  return true;
};

// ============================================================================
// REVIEW COMMENT SERVICES
// ============================================================================

/**
 * Add a comment to a review (coach response)
 */
export const addReviewComment = async (
  reviewId: string,
  coachId: string,
  coachName: string,
  commentText: string
): Promise<boolean> => {
  console.log('[addReviewComment] Adding comment to review:', { reviewId, coachId });

  const { error } = await supabase
    .from('review_comments')
    .insert({
      review_id: reviewId,
      author_id: coachId,
      author_name: coachName,
      text: commentText,
    });

  if (error) {
    console.error('[addReviewComment] Error adding comment:', error);
    return false;
  }

  console.log('[addReviewComment] Successfully added comment');
  return true;
};

/**
 * Get all comments for a review
 */
export const getReviewComments = async (reviewId: string): Promise<any[]> => {
  const { data: comments, error } = await supabase
    .from('review_comments')
    .select('*')
    .eq('review_id', reviewId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('[getReviewComments] Error fetching comments:', error);
    return [];
  }

  return comments || [];
};

/**
 * Flag a review as spam with AI validation
 * Returns validation result showing whether the flag is legitimate
 */
export const flagReviewAsSpam = async (
  reviewId: string,
  coachId: string,
  coachReason?: string
): Promise<{
  success: boolean;
  isLegitimateFlag: boolean;
  confidence: number;
  analysis: string;
}> => {
  console.log('[flagReviewAsSpam] Flagging review as spam:', { reviewId, coachId });

  // Get the review to validate
  const { data: review, error: fetchError } = await supabase
    .from('reviews')
    .select('review_text, author_name, spam_score, spam_reasons, spam_category')
    .eq('id', reviewId)
    .eq('coach_id', coachId)
    .single();

  if (fetchError || !review) {
    console.error('[flagReviewAsSpam] Error fetching review:', fetchError);
    return {
      success: false,
      isLegitimateFlag: false,
      confidence: 0,
      analysis: 'Failed to fetch review for validation'
    };
  }

  // Import spam validation (dynamic import)
  const { validateCoachSpamFlag } = await import('../utils/spamDetection');

  // Validate the coach's spam flag
  const validation = validateCoachSpamFlag(
    review.review_text,
    review.author_name,
    coachReason
  );

  console.log('[flagReviewAsSpam] Validation result:', validation);

  // Update the review with spam flag
  const { error: updateError } = await supabase
    .from('reviews')
    .update({
      is_spam: true,
      spam_score: Math.max(review.spam_score || 0, validation.confidence),
      spam_category: review.spam_category || 'suspicious',
      spam_reasons: [
        ...(review.spam_reasons || []),
        `Coach flagged as spam${coachReason ? `: ${coachReason}` : ''}`
      ]
    })
    .eq('id', reviewId)
    .eq('coach_id', coachId);

  if (updateError) {
    console.error('[flagReviewAsSpam] Error updating review:', updateError);
    return {
      success: false,
      isLegitimateFlag: validation.isLegitimateFlag,
      confidence: validation.confidence,
      analysis: validation.analysis
    };
  }

  console.log('[flagReviewAsSpam] Successfully flagged review');
  return {
    success: true,
    isLegitimateFlag: validation.isLegitimateFlag,
    confidence: validation.confidence,
    analysis: validation.analysis
  };
};

// ============================================================================
// SEARCH & MATCHING SERVICES
// ============================================================================

export const searchCoaches = async (filters: {
  specialty?: string;
  format?: string;
  minRate?: number;
  maxRate?: number;
  location?: string;
}): Promise<Coach[]> => {
  // Show coaches with active subscriptions (trial or active)
  // Trial coaches are auto-visible, paid coaches need verification
  let query = supabase
    .from('coach_profiles')
    .select('*')
    .in('subscription_status', ['trial', 'active']) // Only show coaches with active subscriptions
    .or('subscription_status.eq.trial,is_verified.eq.true'); // Trial coaches OR verified coaches

  if (filters.specialty) {
    query = query.contains('specialties', [filters.specialty]);
  }

  if (filters.format) {
    query = query.contains('formats', [filters.format]);
  }

  if (filters.minRate) {
    query = query.gte('hourly_rate', filters.minRate);
  }

  if (filters.maxRate) {
    query = query.lte('hourly_rate', filters.maxRate);
  }

  if (filters.location) {
    query = query.ilike('location', `%${filters.location}%`);
  }

  const { data, error } = await query.order('avg_rating', { ascending: false });

  if (error) {
    console.error('Error searching coaches:', error);
    return [];
  }

  return mapCoachProfiles(data || []);
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const updateCoachSpecialties = async (coachId: string, specialties: Specialty[]) => {
  // Delete existing
  await supabase.from('coach_specialties').delete().eq('coach_id', coachId);

  // Get specialty IDs
  const { data: specialtyData } = await supabase
    .from('specialties')
    .select('id, name')
    .in('name', specialties);

  if (specialtyData) {
    await supabase.from('coach_specialties').insert(
      specialtyData.map((s) => ({
        coach_id: coachId,
        specialty_id: s.id,
      }))
    );
  }
};

const updateCoachFormats = async (coachId: string, formats: Format[]) => {
  await supabase.from('coach_formats').delete().eq('coach_id', coachId);

  const { data: formatData } = await supabase
    .from('formats')
    .select('id, name')
    .in('name', formats);

  if (formatData) {
    await supabase.from('coach_formats').insert(
      formatData.map((f) => ({
        coach_id: coachId,
        format_id: f.id,
      }))
    );
  }
};

const updateCoachCertifications = async (coachId: string, certifications: string[]) => {
  await supabase.from('certifications').delete().eq('coach_id', coachId);

  if (certifications.length > 0) {
    await supabase.from('certifications').insert(
      certifications.map((cert) => ({
        coach_id: coachId,
        name: cert,
      }))
    );
  }
};

const updateCoachSocialLinks = async (coachId: string, socialLinks: SocialLink[]) => {
  console.log('[updateCoachSocialLinks] Updating social links for coach:', coachId, 'Links:', socialLinks);

  // Delete existing social links
  const { error: deleteError } = await supabase.from('social_links').delete().eq('coach_id', coachId);

  if (deleteError) {
    console.error('[updateCoachSocialLinks] Error deleting existing social links:', deleteError);
    throw new Error(`Failed to delete social links: ${deleteError.message}`);
  }

  // Insert new social links
  if (socialLinks.length > 0) {
    const { error: insertError } = await supabase.from('social_links').insert(
      socialLinks.map((link, index) => ({
        coach_id: coachId,
        platform: link.platform,
        url: link.url,
        display_order: index,
      }))
    );

    if (insertError) {
      console.error('[updateCoachSocialLinks] Error inserting social links:', insertError);
      throw new Error(`Failed to insert social links: ${insertError.message}`);
    }

    console.log('[updateCoachSocialLinks] Successfully saved', socialLinks.length, 'social links');
  } else {
    console.log('[updateCoachSocialLinks] No social links to save (empty array)');
  }
};

const mapCoachProfile = (data: any): Coach => {
  return {
    id: data.id,
    name: data.name,
    email: data.email,
    phoneNumber: data.phone_number,
    photoUrl: data.photo_url || 'https://picsum.photos/200/200',
    specialties: data.specialties || [],
    bio: data.bio || '',
    socialLinks: [],
    hourlyRate: data.hourly_rate || 0,
    yearsExperience: data.years_experience || 0,
    certifications: data.certifications || [],
    isVerified: data.is_verified || false,
    availableFormats: data.formats || [],
    location: data.location || 'Remote',
    reviews: [],
    documentsSubmitted: data.documents_submitted || false,
    subscriptionStatus: data.subscription_status || 'onboarding',
    trialEndsAt: data.trial_ends_at,
    trialUsed: data.trial_used || false,
    billingCycle: data.billing_cycle || 'monthly',
    lastPaymentDate: data.last_payment_date,
    twoFactorEnabled: data.two_factor_enabled || false,

    // Enhanced profile fields
    accreditationLevel: data.accreditation_level,
    additionalCertifications: data.additional_certifications,
    coachingHours: data.coaching_hours,
    locationRadius: data.location_radius,
    qualifications: data.qualifications,
    acknowledgements: data.acknowledgements,
    averageRating: data.average_rating,
    totalReviews: data.total_reviews,
    coachingExpertise: data.coaching_expertise,
    cpdQualifications: data.cpd_qualifications,
    coachingLanguages: data.coaching_languages,
    gender: data.gender,
    currency: data.currency || 'GBP',

    // Cancellation tracking (Phase 2)
    cancelledAt: data.cancelled_at,
    subscriptionEndsAt: data.subscription_ends_at,
    cancelReason: data.cancel_reason,
    cancelFeedback: data.cancel_feedback,
    dataRetentionPreference: data.data_retention_preference,
    scheduledDeletionAt: data.scheduled_deletion_at,

    // Profile visibility & access (Phase 2)
    profileVisible: data.profile_visible,
    dashboardAccess: data.dashboard_access,

    // Stripe integration (Phase 2, for future use)
    stripeCustomerId: data.stripe_customer_id,
    stripeSubscriptionId: data.stripe_subscription_id,
  };
};

const mapCoachProfiles = (data: any[]): Coach[] => {
  return data.map(mapCoachProfile);
};

const mapReview = (data: any): Review => {
  return {
    id: data.id,
    coachId: data.coach_id,
    author: data.author_name,
    authorPhotoUrl: data.author_photo_url,
    rating: data.rating,
    text: data.review_text || '',
    isFlagged: data.is_flagged || false,
    date: new Date(data.created_at).toISOString().split('T')[0],
    isVerifiedClient: data.is_verified_client || false,
    coachReply: data.coach_reply || undefined,
    coachReplyDate: data.coach_reply_date ? new Date(data.coach_reply_date).toISOString().split('T')[0] : undefined,
    coachingPeriod: data.coaching_period || undefined,
    verificationStatus: data.verification_status || 'unverified',
    verifiedAt: data.verified_at ? new Date(data.verified_at).toISOString().split('T')[0] : undefined,
    location: data.reviewer_location || undefined,

    // Spam detection fields
    spamScore: data.spam_score,
    spamReasons: data.spam_reasons || [],
    isSpam: data.is_spam || false,
    spamCategory: data.spam_category,
  };
};

const mapSocialLink = (data: any): SocialLink => {
  return {
    id: data.id,
    platform: data.platform,
    url: data.url,
  };
};

const getSessionId = (): string => {
  let sessionId = sessionStorage.getItem('session_id');
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('session_id', sessionId);
  }
  return sessionId;
};

// ============================================================================
// ANALYTICS SERVICES
// ============================================================================

// Track profile view
export const trackProfileView = async (coachId: string): Promise<void> => {
  try {
    const sessionId = getSessionId();

    // Check if this session already viewed this profile in last 30 minutes
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
    const { data: recentView } = await supabase
      .from('profile_views')
      .select('id')
      .eq('coach_id', coachId)
      .eq('session_id', sessionId)
      .gte('viewed_at', thirtyMinutesAgo)
      .maybeSingle();

    // If already viewed recently, don't track again
    if (recentView) {
      console.log('[Analytics] Profile view already tracked for this session');
      return;
    }

    // Track the view
    await supabase.from('profile_views').insert({
      coach_id: coachId,
      viewed_at: new Date().toISOString(),
      viewer_user_agent: navigator.userAgent,
      referrer: document.referrer || 'direct',
      session_id: sessionId
    });

    console.log('[Analytics] Profile view tracked successfully');
  } catch (error) {
    console.error('[Analytics] Error tracking profile view:', error);
    // Don't throw - analytics failures shouldn't break user experience
  }
};

// Get analytics for a specific coach
export interface CoachAnalytics {
  totalViews: number;
  viewsLast7Days: number;
  viewsLast30Days: number;
  viewsByDay: { date: string; views: number }[];
  topReferrers: { referrer: string; count: number }[];
}

export const getCoachAnalytics = async (coachId: string): Promise<CoachAnalytics> => {
  try {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

    // Total views (from cached count)
    const { data: coach } = await supabase
      .from('coaches')
      .select('total_profile_views')
      .eq('id', coachId)
      .single();

    // Views last 7 days
    const { data: views7Days } = await supabase
      .from('profile_views')
      .select('id')
      .eq('coach_id', coachId)
      .gte('viewed_at', sevenDaysAgo);

    // Views last 30 days
    const { data: views30Days } = await supabase
      .from('profile_views')
      .select('id')
      .eq('coach_id', coachId)
      .gte('viewed_at', thirtyDaysAgo);

    // Views by day (last 30 days)
    const { data: viewsRaw } = await supabase
      .from('profile_views')
      .select('viewed_at')
      .eq('coach_id', coachId)
      .gte('viewed_at', thirtyDaysAgo)
      .order('viewed_at', { ascending: true });

    // Group by day
    const viewsByDay = viewsRaw?.reduce((acc: any[], view: any) => {
      const date = new Date(view.viewed_at).toISOString().split('T')[0];
      const existing = acc.find(item => item.date === date);
      if (existing) {
        existing.views++;
      } else {
        acc.push({ date, views: 1 });
      }
      return acc;
    }, []) || [];

    // Top referrers (last 30 days)
    const { data: referrersRaw } = await supabase
      .from('profile_views')
      .select('referrer')
      .eq('coach_id', coachId)
      .gte('viewed_at', thirtyDaysAgo);

    const referrerCounts = referrersRaw?.reduce((acc: any, view: any) => {
      const ref = view.referrer || 'direct';
      acc[ref] = (acc[ref] || 0) + 1;
      return acc;
    }, {}) || {};

    const topReferrers = Object.entries(referrerCounts)
      .map(([referrer, count]) => ({ referrer, count: count as number }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      totalViews: coach?.total_profile_views || 0,
      viewsLast7Days: views7Days?.length || 0,
      viewsLast30Days: views30Days?.length || 0,
      viewsByDay,
      topReferrers
    };
  } catch (error) {
    console.error('[Analytics] Error fetching analytics:', error);
    return {
      totalViews: 0,
      viewsLast7Days: 0,
      viewsLast30Days: 0,
      viewsByDay: [],
      topReferrers: []
    };
  }
};
