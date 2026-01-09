import { supabase } from '../lib/supabase';
import { Coach, Review, SocialLink, Specialty, Format } from '../types';

// Re-export supabase for use in other components
export { supabase };

// ============================================================================
// COACH SERVICES
// ============================================================================

export const getCoaches = async (): Promise<Coach[]> => {
  const { data: coaches, error } = await supabase
    .from('coach_profiles')
    .select('*')
    .eq('is_verified', true)
    .in('subscription_status', ['trial', 'active']) // Only show coaches with active subscriptions
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

  // Cancellation fields (only add if defined)
  if (coach.cancelledAt !== undefined) updateData.cancelled_at = coach.cancelledAt;
  if (coach.subscriptionEndsAt !== undefined) updateData.subscription_ends_at = coach.subscriptionEndsAt;
  if (coach.cancelReason !== undefined) updateData.cancel_reason = coach.cancelReason;
  if (coach.cancelFeedback !== undefined) updateData.cancel_feedback = coach.cancelFeedback;
  if (coach.dataRetentionPreference !== undefined) updateData.data_retention_preference = coach.dataRetentionPreference;
  if (coach.scheduledDeletionAt !== undefined) updateData.scheduled_deletion_at = coach.scheduledDeletionAt;

  // Update main coach record
  const { error: coachError } = await supabase
    .from('coaches')
    .update(updateData)
    .eq('id', coach.id)
    .eq('user_id', user.id);

  if (coachError) {
    console.error('Error updating coach:', coachError);
    console.error('Error details:', coachError.message, coachError.details, coachError.hint);
    return false;
  }

  // Update specialties
  await updateCoachSpecialties(coach.id, coach.specialties);

  // Update formats
  await updateCoachFormats(coach.id, coach.availableFormats);

  // Update certifications
  await updateCoachCertifications(coach.id, coach.certifications);

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
  location?: string
): Promise<Review | null> => {
  const { data: review, error } = await supabase
    .from('reviews')
    .insert({
      coach_id: coachId,
      author_name: authorName,
      rating,
      review_text: reviewText,
      coaching_period: coachingPeriod,
      reviewer_location: location || null,
    })
    .select()
    .single();

  if (error) {
    console.error('Error adding review:', error);
    return null;
  }

  return mapReview(review);
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
  const { error } = await supabase
    .from('reviews')
    .update({
      verification_status: 'verified',
      verified_at: new Date().toISOString(),
    })
    .eq('id', reviewId)
    .eq('coach_id', coachId);

  if (error) {
    console.error('Error verifying review:', error);
    return false;
  }

  return true;
};

export const flagReview = async (
  reviewId: string,
  coachId: string
): Promise<boolean> => {
  const { error } = await supabase
    .from('reviews')
    .update({
      verification_status: 'flagged',
    })
    .eq('id', reviewId)
    .eq('coach_id', coachId);

  if (error) {
    console.error('Error flagging review:', error);
    return false;
  }

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
// SEARCH & MATCHING SERVICES
// ============================================================================

export const searchCoaches = async (filters: {
  specialty?: string;
  format?: string;
  minRate?: number;
  maxRate?: number;
  location?: string;
}): Promise<Coach[]> => {
  let query = supabase
    .from('coach_profiles')
    .select('*')
    .eq('is_verified', true)
    .in('subscription_status', ['trial', 'active']); // Only show coaches with active subscriptions

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
