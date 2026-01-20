import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { updateCoach, getCoachAnalytics, getCoachById, verifyReview, flagReview, resetReviewVerification, addReviewComment, getReviewComments, flagReviewAsSpam, type CoachAnalytics } from '../services/supabaseService';
import { verifyEMCCAccreditation, needsEMCCVerification, getVerificationStatusMessage } from '../services/emccVerificationService';
import {
  Coach,
  Review,
  Specialty,
  Format,
  CoachingExpertise,
  CoachingExpertiseCategory,
  CareerProfessionalExpertise,
  BusinessEntrepreneurshipExpertise,
  HealthWellnessExpertise,
  PersonalLifeExpertise,
  FinancialExpertise,
  NicheDemographicExpertise,
  MethodologyModalityExpertise,
  CPDQualification,
  CoachingLanguage,
  Currency,
  CURRENCIES
} from '../types';
import {
  User, Settings, CreditCard, Lock, LogOut,
  Plus, Trash2, Link as LinkIcon, CheckCircle, Shield,
  AlertTriangle, Mail, Smartphone, RefreshCw, Eye, EyeOff,
  Tag, Monitor, LayoutDashboard, Sparkles, BarChart, TrendingUp, Calendar,
  Award, GraduationCap, Trophy, Star, Flag, MessageCircle, Send
} from 'lucide-react';
import { CoachDogFullLogo } from '../components/Layout';
import { useAuth } from '../hooks/useAuth';
import { useDeviceDetection } from '../hooks/useDeviceDetection';
import { ViewModeToggle } from '../components/common/ViewModeToggle';
import { TrialCountdownBanner } from '../components/subscription/TrialCountdownBanner';
import { CancelSubscriptionModal } from '../components/subscription/CancelSubscriptionModal';
import { TrialExpiredModal } from '../components/subscription/TrialExpiredModal';
import { ProfileViewsChart } from '../components/analytics/ProfileViewsChart';
import { useTrialStatus } from '../hooks/useTrialStatus';
import { ImageUpload } from '../components/ImageUpload';
import { MultiSelect } from '../components/forms/MultiSelect';
import { CollapsibleSection } from '../components/forms/CollapsibleSection';

const AVAILABLE_SPECIALTIES: Specialty[] = [
  'Career Growth',
  'Stress Relief',
  'Relationships',
  'Health & Wellness',
  'Executive Coaching'
];

const AVAILABLE_FORMATS: Format[] = ['Online', 'In-Person', 'Hybrid'];

// Coaching Expertise by Category
const COACHING_EXPERTISE_BY_CATEGORY: Record<CoachingExpertiseCategory, CoachingExpertise[]> = {
  'Career & Professional Development': [
    'Career Transition', 'Leadership Development', 'Executive Coaching',
    'Team Coaching', 'Performance Coaching', 'Communication Skills',
    'Public Speaking', 'Interview Preparation', 'Networking',
    'Personal Branding', 'Work-Life Balance', 'Time Management',
    'Productivity', 'Confidence Building'
  ] as CareerProfessionalExpertise[],
  'Business & Entrepreneurship': [
    'Business Start-up', 'Business Growth & Scaling', 'Strategic Planning',
    'Sales Coaching', 'Marketing & Branding', 'Negotiation Skills',
    'Innovation & Creativity', 'Succession Planning'
  ] as BusinessEntrepreneurshipExpertise[],
  'Health & Wellness': [
    'Stress Management', 'Mindfulness & Meditation', 'Sleep Improvement',
    'Nutrition & Healthy Eating', 'Fitness & Exercise', 'Weight Management',
    'Chronic Illness Management', 'Mental Health & Wellbeing',
    'Addiction Recovery', 'Grief & Loss', 'Burnout Recovery'
  ] as HealthWellnessExpertise[],
  'Personal & Life': [
    'Life Purpose & Meaning', 'Goal Setting & Achievement', 'Relationship Coaching',
    'Parenting', 'Family Dynamics', 'Divorce & Separation',
    'Self-Esteem & Confidence', 'Personal Growth', 'Spiritual Development',
    'Retirement Planning (Life)', 'Lifestyle Design', 'Creative Expression'
  ] as PersonalLifeExpertise[],
  'Financial': [
    'Financial Planning & Budgeting', 'Debt Management', 'Investment Coaching',
    'Retirement Planning (Financial)', 'Money Mindset'
  ] as FinancialExpertise[],
  'Niche & Demographic': [
    'LGBTQ+ Coaching', 'Neurodiversity (ADHD, Autism, etc.)',
    'Youth & Students (Ages 16-25)', 'Mid-Career Professionals',
    'Senior Professionals (50+)', 'Women in Leadership',
    'Veterans & Military Transition', 'Expats & Relocation',
    'Artists & Creatives', 'Athletes & Sports Performance'
  ] as NicheDemographicExpertise[],
  'Methodology & Modality': [
    'Cognitive Behavioral Coaching (CBC)', 'Neuro-Linguistic Programming (NLP)',
    'Solution-Focused Coaching', 'Positive Psychology', 'Ontological Coaching',
    'Systemic Coaching', 'Gestalt Coaching', 'Psychodynamic Coaching',
    'Narrative Coaching', 'Somatic Coaching', 'Mindfulness-Based Coaching',
    'Acceptance and Commitment Therapy (ACT)', 'Transactional Analysis (TA)'
  ] as MethodologyModalityExpertise[]
};

// CPD Qualifications
const CPD_QUALIFICATIONS: CPDQualification[] = [
  'ICF Associate Certified Coach (ACC)', 'ICF Professional Certified Coach (PCC)',
  'ICF Master Certified Coach (MCC)', 'EMCC Foundation Level',
  'EMCC Practitioner Level', 'EMCC Senior Practitioner Level',
  'EMCC Master Practitioner Level', 'AC Accredited Coach',
  'ILM Level 5 Coaching', 'ILM Level 7 Executive Coaching',
  'CMI Level 5 Coaching', 'CMI Level 7 Executive Coaching',
  'Certificate in Coaching Supervision', 'Diploma in Coaching Supervision',
  'Mental Health First Aid (MHFA)', 'Trauma-Informed Coaching Certificate',
  'Diversity & Inclusion Coaching Certificate', 'Corporate Coaching Certification',
  'Team Coaching Certification', 'Career Coaching Certification',
  'Executive Coaching Certification', 'Life Coaching Certification',
  'Health & Wellness Coaching Certification', 'Financial Coaching Certification',
  'Relationship Coaching Certification', 'NLP Practitioner Certification',
  'NLP Master Practitioner Certification', 'CBT (Cognitive Behavioral Therapy) Training',
  'Solution-Focused Brief Therapy (SFBT) Training', 'Positive Psychology Practitioner',
  'Mindfulness Teacher Training', 'Somatic Experiencing Practitioner',
  'Gestalt Coaching Certification', 'Systemic Team Coaching',
  'Ontological Coaching Certification', 'Transactional Analysis (TA) 101',
  'Leadership Coaching Certification', 'Performance Coaching Certification',
  'Business Coaching Certification', 'Parenting Coach Certification',
  'Retirement Coaching Certification', 'ADHD Coaching Certification',
  'Nutrition Coaching Certification'
];

// Coaching Languages
const COACHING_LANGUAGES: CoachingLanguage[] = [
  'English', 'Spanish', 'French', 'German', 'Italian', 'Portuguese',
  'Dutch', 'Polish', 'Romanian', 'Greek', 'Swedish', 'Danish',
  'Norwegian', 'Finnish', 'Czech', 'Hungarian', 'Bulgarian', 'Croatian',
  'Slovak', 'Lithuanian', 'Latvian', 'Estonian', 'Slovenian',
  'Arabic', 'Hebrew', 'Turkish', 'Russian', 'Ukrainian',
  'Mandarin Chinese', 'Cantonese', 'Japanese', 'Korean',
  'Hindi', 'Urdu', 'Bengali', 'Punjabi', 'Tamil',
  'Tagalog', 'Vietnamese', 'Thai', 'Indonesian', 'Malay', 'Swahili'
];

export const CoachDashboard: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { coach: currentCoach, logout, loading: authLoading, refreshCoach } = useAuth();
  const { viewMode, setViewMode, isMobile, isTablet } = useDeviceDetection();
  const hasRedirected = useRef(false);

  const [activeTab, setActiveTab] = useState<'profile' | 'account' | 'subscription' | 'analytics'>('profile');

  // Local form state for profile editing (prevents auto-save on every keystroke)
  const [localProfile, setLocalProfile] = useState<Partial<Coach> | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Analytics state
  const [analytics, setAnalytics] = useState<CoachAnalytics | null>(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);

  // Initialize local profile state when coach data loads
  useEffect(() => {
    if (currentCoach && !localProfile) {
      setLocalProfile({
        name: currentCoach.name,
        bio: currentCoach.bio,
        hourlyRate: currentCoach.hourlyRate,
        currency: currentCoach.currency || 'GBP',
        photoUrl: currentCoach.photoUrl,
        gender: currentCoach.gender,
        specialties: currentCoach.specialties || [],
        availableFormats: currentCoach.availableFormats || [],
        socialLinks: currentCoach.socialLinks || [],
        coachingExpertise: currentCoach.coachingExpertise || [],
        cpdQualifications: currentCoach.cpdQualifications || [],
        coachingLanguages: currentCoach.coachingLanguages || [],
        accreditationLevel: currentCoach.accreditationLevel,
        qualifications: currentCoach.qualifications || [],
        acknowledgements: currentCoach.acknowledgements || [],
        additionalCertifications: currentCoach.additionalCertifications || [],
        coachingHours: currentCoach.coachingHours,
        locationRadius: currentCoach.locationRadius
      });
    }
  }, [currentCoach, localProfile]);

  // New Link State
  const [newLink, setNewLink] = useState<{ platform: string; url: string; type: 'url' | 'email' | 'tel' }>({ platform: '', url: '', type: 'url' });
  const [newQualification, setNewQualification] = useState<{ degree: string; institution?: string; year?: number }>({ degree: '', institution: '', year: undefined });
  const [newAcknowledgement, setNewAcknowledgement] = useState<{ title: string; icon?: string; year?: number }>({ title: '', icon: '', year: undefined });

  // 2FA Setup State
  const [isSettingUp2FA, setIsSettingUp2FA] = useState(false);
  const [twoFACode, setTwoFACode] = useState('');

  // Password Change State
  const [passState, setPassState] = useState({ current: '', new: '', confirm: '' });
  const [showPassState, setShowPassState] = useState({ current: false, new: false, confirm: false });

  // Cancel Subscription Modal State
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);

  // Trial Expired Modal State
  const [isTrialExpiredModalOpen, setIsTrialExpiredModalOpen] = useState(false);

  // EMCC Verification Modal State
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [verificationData, setVerificationData] = useState({
    eiaNumber: '', // EIA number (Reference field) - REQUIRED for verification
    fullName: ''
  });
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const trialStatus = useTrialStatus(currentCoach);

  // Toast Notification State
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Review Sub-Tab State
  const [reviewSubTab, setReviewSubTab] = useState<'pending' | 'archived'>('pending');

  // Comment and spam flag state
  const [commentingOnReview, setCommentingOnReview] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');
  const [commentSubmitting, setCommentSubmitting] = useState(false);
  const [reviewComments, setReviewComments] = useState<Record<string, any[]>>({});
  const [flaggingReview, setFlaggingReview] = useState<string | null>(null);
  const [flagReason, setFlagReason] = useState('');
  const [flagSubmitting, setFlagSubmitting] = useState(false);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000); // Auto-dismiss after 4 seconds
  };

  // Helper function to strip mailto: and tel: prefixes for display
  const stripProtocol = (url: string): string => {
    if (url.startsWith('mailto:')) {
      return url.replace('mailto:', '');
    } else if (url.startsWith('tel:')) {
      return url.replace('tel:', '');
    }
    return url;
  };

  // Redirect to login if not authenticated
  useEffect(() => {
    console.log('[CoachDashboard] Auth state:', { authLoading, hasCoach: !!currentCoach, hasRedirected: hasRedirected.current });

    // CRITICAL FIX: Only redirect if authLoading is false AND we've waited at least 3 seconds
    // This prevents redirect loops when profile fetch is slow or fails
    if (!authLoading && !currentCoach && !hasRedirected.current) {
      // Add a delay to give profile fetch time to complete
      const timeoutId = setTimeout(() => {
        if (!currentCoach) {
          console.log('[CoachDashboard] Not authenticated after delay, redirecting to login');
          hasRedirected.current = true;
          navigate('/coach-login', { state: { from: location } });
        }
      }, 2000); // Wait 2 seconds before redirecting

      return () => clearTimeout(timeoutId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, currentCoach]);

  // Check for pending checkout after login
  useEffect(() => {
    if (currentCoach && !authLoading) {
      const pendingCheckout = sessionStorage.getItem('pendingCheckout');

      if (pendingCheckout) {
        try {
          const { plan, timestamp } = JSON.parse(pendingCheckout);

          // Expire after 30 minutes
          const thirtyMinutes = 30 * 60 * 1000;
          if (Date.now() - timestamp < thirtyMinutes) {
            console.log('[CoachDashboard] Redirecting to pending checkout:', plan);
            sessionStorage.removeItem('pendingCheckout');
            navigate(`/checkout/${plan}`, { replace: true });
          } else {
            sessionStorage.removeItem('pendingCheckout');
          }
        } catch (err) {
          console.error('[CoachDashboard] Error parsing pending checkout:', err);
          sessionStorage.removeItem('pendingCheckout');
        }
      }
    }
  }, [currentCoach, authLoading, navigate]);

  // Load analytics when analytics tab is selected
  useEffect(() => {
    if (activeTab === 'analytics' && currentCoach && !analytics) {
      const loadAnalytics = async () => {
        setLoadingAnalytics(true);
        const data = await getCoachAnalytics(currentCoach.id);
        setAnalytics(data);
        setLoadingAnalytics(false);
      };
      loadAnalytics();
    }
  }, [activeTab, currentCoach, analytics]);

  // Check for trial expiration and show modal once on first login
  useEffect(() => {
    if (currentCoach && trialStatus.isExpired && trialStatus.neverPaid) {
      // Check if modal has been shown in this session
      const hasSeenExpiredModal = sessionStorage.getItem('hasSeenTrialExpiredModal');

      if (!hasSeenExpiredModal) {
        setIsTrialExpiredModalOpen(true);
        sessionStorage.setItem('hasSeenTrialExpiredModal', 'true');
      }
    }
  }, [currentCoach, trialStatus.isExpired, trialStatus.neverPaid]);

  const handleLogout = async () => {
    await logout();
    navigate('/coach-login');
  };

  const handleVerifyReview = async (reviewId: string) => {
    console.log('[handleVerifyReview] Called with reviewId:', reviewId);
    console.log('[handleVerifyReview] currentCoach:', currentCoach);

    if (!currentCoach?.id) {
      console.error('[handleVerifyReview] No coach ID found');
      showToast('Error: Coach ID not found. Please refresh and try again.', 'error');
      return;
    }

    console.log('[handleVerifyReview] Calling verifyReview...');
    const success = await verifyReview(reviewId, currentCoach.id);
    console.log('[handleVerifyReview] Success:', success);

    if (success) {
      // Refresh coach data to get updated reviews
      await refreshCoach();
      showToast('Review verified successfully! Badge will show on public profile.', 'success');
    } else {
      showToast('Failed to verify review. Please check console for errors.', 'error');
    }
  };

  const handleFlagReview = async (reviewId: string) => {
    console.log('[handleFlagReview] Called with reviewId:', reviewId);

    if (!currentCoach?.id) {
      console.error('[handleFlagReview] No coach ID found');
      showToast('Error: Coach ID not found. Please refresh and try again.', 'error');
      return;
    }

    console.log('[handleFlagReview] Calling flagReview...');
    const success = await flagReview(reviewId, currentCoach.id);
    console.log('[handleFlagReview] Success:', success);

    if (success) {
      // Refresh coach data to get updated reviews
      await refreshCoach();
      showToast('Review flagged as possible spam. Warning badge will show on public profile.', 'success');
    } else {
      showToast('Failed to flag review. Please check console for errors.', 'error');
    }
  };

  const handleResetReview = async (reviewId: string) => {
    if (!currentCoach?.id) return;

    const success = await resetReviewVerification(reviewId, currentCoach.id);
    if (success) {
      // Refresh coach data to get updated reviews
      await refreshCoach();
      showToast('Review status reset to unverified.', 'success');
    } else {
      showToast('Failed to reset review. Please check console for errors.', 'error');
    }
  };

  // Handle coach adding a comment to a review
  const handleCommentSubmit = async (reviewId: string) => {
    if (!commentText.trim()) {
      showToast('Please enter a comment', 'error');
      return;
    }

    if (!currentCoach?.id) {
      showToast('Error: Coach ID not found', 'error');
      return;
    }

    setCommentSubmitting(true);
    try {
      const success = await addReviewComment(
        reviewId,
        currentCoach.id,
        currentCoach.name,
        commentText.trim()
      );

      if (!success) {
        throw new Error('Failed to save comment');
      }

      // Reload comments for this review
      const comments = await getReviewComments(reviewId);
      setReviewComments(prev => ({ ...prev, [reviewId]: comments }));

      // Reset form
      setCommentingOnReview(null);
      setCommentText('');

      showToast('Comment posted successfully!', 'success');
    } catch (error) {
      console.error('Error submitting comment:', error);
      showToast('Failed to post comment. Please try again.', 'error');
    } finally {
      setCommentSubmitting(false);
    }
  };

  // Handle coach flagging review as spam
  const handleFlagAsSpam = async (reviewId: string) => {
    if (!currentCoach?.id) {
      showToast('Error: Coach ID not found', 'error');
      return;
    }

    setFlagSubmitting(true);
    try {
      const result = await flagReviewAsSpam(
        reviewId,
        currentCoach.id,
        flagReason.trim() || undefined
      );

      if (!result.success) {
        throw new Error('Failed to flag review');
      }

      // Show validation result
      if (result.isLegitimateFlag) {
        showToast(`✅ Review flagged as spam! AI Confidence: ${result.confidence}%`, 'success');
      } else {
        showToast(`⚠️ Review flagged, but AI suggests it may be legitimate (${result.confidence}% confidence)`, 'success');
      }

      // Refresh coach data
      await refreshCoach();

      // Reset form
      setFlaggingReview(null);
      setFlagReason('');
    } catch (error) {
      console.error('Error flagging review:', error);
      showToast('Failed to flag review. Please try again.', 'error');
    } finally {
      setFlagSubmitting(false);
    }
  };

  // Load comments for a review
  const loadReviewComments = async (reviewId: string) => {
    if (reviewComments[reviewId]) return; // Already loaded
    const comments = await getReviewComments(reviewId);
    setReviewComments(prev => ({ ...prev, [reviewId]: comments }));
  };

  // Update local profile state (doesn't save to database)
  const updateLocalProfile = (updates: Partial<Coach>) => {
    setLocalProfile(prev => ({ ...prev, ...updates }));
    setHasUnsavedChanges(true);
  };

  // Save changes to database (only called when user clicks "Save Changes")
  const handleSaveProfile = async () => {
    if (!currentCoach || !localProfile) return;

    setIsSaving(true);
    const updated = { ...currentCoach, ...localProfile };

    const success = await updateCoach(updated);
    if (success) {
      await refreshCoach(); // Refresh auth context with updated data
      setHasUnsavedChanges(false);
      showToast('Profile updated successfully!', 'success');

      // Show verification modal if EMCC selected and not yet verified
      if (needsEMCCVerification(updated)) {
        setShowVerificationModal(true);
        setVerificationData({
          eiaNumber: '', // EIA/Reference number from EMCC database
          fullName: updated.name, // Pre-fill with their profile name
          profileUrl: '', // EMCC directory profile URL (optional)
          membershipNumber: '' // Deprecated - not publicly available
        });
      }
    } else {
      showToast('Failed to save changes. Please try again.', 'error');
    }
    setIsSaving(false);
  };

  // Handle EMCC verification submission
  const handleVerificationSubmit = async () => {
    if (!currentCoach) return;

    // Validation
    if (!verificationData.fullName.trim()) {
      setVerificationError('Please enter your full name exactly as it appears in the EMCC directory');
      return;
    }

    if (!verificationData.eiaNumber.trim()) {
      setVerificationError('Please provide your EIA number from the EMCC directory');
      return;
    }

    setIsVerifying(true);
    setVerificationError(null);

    try {
      const verificationResult = await verifyEMCCAccreditation({
        coachId: currentCoach.id,
        fullName: verificationData.fullName.trim(),
        accreditationLevel: currentCoach.accreditationLevel,
        country: currentCoach.location,
        eiaNumber: verificationData.eiaNumber.trim()
      });

      const message = getVerificationStatusMessage(verificationResult);

      if (verificationResult.verified) {
        showToast(message, 'success');
        setShowVerificationModal(false);
        await refreshCoach(); // Refresh to show updated verification status
      } else {
        // Show error in modal for retry
        setVerificationError(
          verificationResult.reason ||
          'We couldn\'t verify your EMCC accreditation. Please double-check that your name and membership number exactly match your EMCC directory entry, then try again. If the problem persists, contact support at support@coachdog.com'
        );
      }
    } catch (error) {
      console.error('[EMCC Verification] Error:', error);
      setVerificationError(
        'Verification service is temporarily unavailable. Please try again later or contact support at support@coachdog.com'
      );
    } finally {
      setIsVerifying(false);
    }
  };

  // For subscription/account changes that still need immediate saves
  const handleUpdateCoach = async (updates: Partial<Coach>) => {
    if (!currentCoach) return;
    const updated = { ...currentCoach, ...updates };

    const success = await updateCoach(updated);
    if (success) {
      await refreshCoach(); // Refresh auth context with updated data
      showToast('Profile updated successfully!', 'success');
    } else {
      showToast('Failed to save changes. Please try again.', 'error');
    }
  };

  // Cancel subscription handler
  const handleCancelSubscription = async (reason: string, feedback: string, dataPreference: 'keep' | 'delete') => {
    if (!currentCoach) return;

    // Prevent duplicate cancellations
    if (currentCoach.cancelledAt) {
      alert('This subscription has already been cancelled.');
      setIsCancelModalOpen(false);
      return;
    }

    // Calculate subscription end date (30 days from now for monthly, 365 days for annual)
    const now = new Date();
    const daysToAdd = currentCoach.billingCycle === 'annual' ? 365 : 30;
    const subscriptionEndsAt = new Date(now.getTime() + daysToAdd * 24 * 60 * 60 * 1000);

    // Calculate scheduled deletion date based on preference
    let scheduledDeletionAt: string | undefined;
    if (dataPreference === 'delete') {
      // Delete within 30 days after subscription ends
      const deletionDate = new Date(subscriptionEndsAt.getTime() + 30 * 24 * 60 * 60 * 1000);
      scheduledDeletionAt = deletionDate.toISOString();
    } else {
      // Keep for 2 years after subscription ends
      const deletionDate = new Date(subscriptionEndsAt.getTime() + 2 * 365 * 24 * 60 * 60 * 1000);
      scheduledDeletionAt = deletionDate.toISOString();
    }

    const updates = {
      cancelledAt: now.toISOString(),
      subscriptionEndsAt: subscriptionEndsAt.toISOString(),
      cancelReason: reason,
      cancelFeedback: feedback || undefined,
      dataRetentionPreference: dataPreference,
      scheduledDeletionAt
    };

    const success = await updateCoach({ ...currentCoach, ...updates });
    if (success) {
      await refreshCoach();
      setIsCancelModalOpen(false);
    } else {
      throw new Error('Failed to cancel subscription');
    }
  };

  // Reactivate subscription handler
  const handleReactivateSubscription = async () => {
    if (!currentCoach) return;

    const updates = {
      cancelledAt: null,
      subscriptionEndsAt: null,
      cancelReason: null,
      cancelFeedback: null,
      dataRetentionPreference: null,
      scheduledDeletionAt: null
    };

    const success = await updateCoach({ ...currentCoach, ...updates });
    if (success) {
      await refreshCoach();
      alert('✓ Subscription reactivated successfully!');
    } else {
      alert('⚠ Failed to reactivate subscription. Please try again.');
    }
  };

  // Delete account handler
  const handleDeleteAccount = async () => {
    if (!currentCoach) return;

    // In production, this would call an API endpoint to:
    // 1. Mark account for deletion
    // 2. Set scheduled_deletion_at to 30 days from now
    // 3. Anonymize profile immediately (hide from search)
    // 4. Send confirmation email
    // 5. Queue background job for final deletion

    // For now, we'll mark the account as expired and schedule deletion
    const now = new Date();
    const deletionDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days from now

    const updates = {
      subscriptionStatus: 'expired' as const,
      cancelledAt: now.toISOString(),
      subscriptionEndsAt: now.toISOString(), // End access immediately
      cancelReason: 'Account deletion requested',
      dataRetentionPreference: 'delete' as const,
      scheduledDeletionAt: deletionDate.toISOString()
    };

    const success = await updateCoach({ ...currentCoach, ...updates });
    if (success) {
      // Log out and redirect to home
      await logout();
      navigate('/', { state: { message: 'Your account has been scheduled for deletion. You will receive a confirmation email shortly.' } });
    } else {
      throw new Error('Failed to delete account');
    }
  };

  // Email validation function (reused from CoachSignup)
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
  };

  // Phone validation function (basic check for minimum digits)
  const validatePhone = (phone: string): boolean => {
    // Remove all non-digit characters
    const digitsOnly = phone.replace(/\D/g, '');
    // Must have at least 10 digits (handles most international formats)
    return digitsOnly.length >= 10;
  };

  // --- Profile Helpers (use local state, not immediate saves) ---
  const addLink = () => {
    if (!newLink.platform || !newLink.url) {
      alert('Please fill in both the label and value fields.');
      return;
    }

    // Validate email format
    if (newLink.type === 'email') {
      const emailToValidate = newLink.url.replace('mailto:', ''); // Remove mailto: if present
      if (!validateEmail(emailToValidate)) {
        alert('Please enter a valid email address (e.g., coach@example.com)');
        return;
      }
      // Ensure mailto: prefix
      if (!newLink.url.startsWith('mailto:')) {
        newLink.url = `mailto:${emailToValidate}`;
      }
    }

    // Validate phone format
    if (newLink.type === 'tel') {
      const phoneToValidate = newLink.url.replace('tel:', ''); // Remove tel: if present
      if (!validatePhone(phoneToValidate)) {
        alert('Please enter a valid phone number with at least 10 digits (e.g., +44 7700 900000)');
        return;
      }
      // Ensure tel: prefix
      if (!newLink.url.startsWith('tel:')) {
        newLink.url = `tel:${phoneToValidate}`;
      }
    }

    // Validate URL format
    if (newLink.type === 'url' && !newLink.url.startsWith('http://') && !newLink.url.startsWith('https://')) {
      alert('Please enter a valid URL starting with http:// or https://');
      return;
    }

    const updatedLinks = [...(localProfile?.socialLinks || []), {
      ...newLink,
      id: `link_${Date.now()}`
    }];
    updateLocalProfile({ socialLinks: updatedLinks });
    setNewLink({ platform: '', url: '', type: 'url' });
  };

  const removeLink = (index: number) => {
    const updatedLinks = [...(localProfile?.socialLinks || [])];
    updatedLinks.splice(index, 1);
    updateLocalProfile({ socialLinks: updatedLinks });
  };

  const toggleSpecialty = (s: Specialty) => {
    if (!localProfile) return;
    const current = localProfile.specialties || [];
    const updated = current.includes(s)
        ? current.filter(item => item !== s)
        : [...current, s];
    updateLocalProfile({ specialties: updated });
  };

  const toggleFormat = (f: Format) => {
    if (!localProfile) return;
    const current = localProfile.availableFormats || [];
    const updated = current.includes(f)
        ? current.filter(item => item !== f)
        : [...current, f];
    updateLocalProfile({ availableFormats: updated });
  };

  const handleForgotPassword = () => {
      alert(`Password reset link sent to ${currentCoach?.email}`);
  };

  const handleEnable2FA = () => {
      if(twoFACode === '123456') {
          handleUpdateCoach({ twoFactorEnabled: true });
          setIsSettingUp2FA(false);
          setTwoFACode('');
      } else {
          alert("Invalid code. Try 123456");
      }
  };

  // Loading state
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600"></div>
      </div>
    );
  }

  // Not authenticated - redirect handled by useEffect
  if (!currentCoach) {
    return null;
  }

  // ---------------- EXPIRED ----------------
  if (currentCoach.subscriptionStatus === 'expired') {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-4">
         <div className="bg-white max-w-lg w-full rounded-3xl shadow-2xl p-10 text-center border border-slate-100">
             <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <Lock className="h-10 w-10 text-red-500" />
             </div>
             <h2 className="text-3xl font-display font-bold text-slate-900 mb-3">Trial Expired</h2>
             <p className="text-slate-500 mb-8">Your dashboard is locked. Choose a plan to continue managing your profile.</p>
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <Link
                  to="/checkout/monthly"
                  className="bg-slate-100 border-2 border-transparent hover:border-slate-400 p-5 rounded-2xl shadow-sm hover:shadow-md transition-all block"
                >
                  <span className="block font-bold text-slate-900 text-xl">Monthly</span>
                  <span className="block text-slate-500">£15/mo</span>
                </Link>
                <Link
                  to="/checkout/annual"
                  className="bg-slate-900 border-2 border-slate-900 p-5 rounded-2xl relative shadow-lg hover:-translate-y-1 transition-all block text-white"
                >
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand-600 text-white text-[10px] px-3 py-1 rounded-full font-bold shadow-sm">SAVE 17%</div>
                  <span className="block font-bold text-xl">Annual</span>
                  <span className="block text-slate-300">£150/yr</span>
                </Link>
             </div>
             <button onClick={handleLogout} className="text-slate-400 hover:text-slate-600 font-medium text-sm">Log Out</button>
         </div>
      </div>
    );
  }

  // ---------------- MAIN DASHBOARD ----------------
  // Determine if we should show sidebar or mobile tabs based on view mode
  const showSidebar = viewMode === 'desktop' || (!isMobile && !isTablet);
  const showMobileTabs = viewMode === 'mobile' || isMobile;

  return (
    <div className="bg-slate-50 min-h-screen">

      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-24 right-4 z-[10000] animate-fade-in-up shadow-2xl rounded-xl border-2 ${
          toast.type === 'success'
            ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-300'
            : 'bg-gradient-to-r from-red-50 to-rose-50 border-red-300'
        }`}>
          <div className="flex items-center gap-3 px-6 py-4">
            {toast.type === 'success' ? (
              <div className="bg-green-500 p-2 rounded-full flex-shrink-0">
                <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            ) : (
              <div className="bg-red-500 p-2 rounded-full flex-shrink-0">
                <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
            )}
            <div>
              <p className={`font-display font-bold text-base ${
                toast.type === 'success' ? 'text-green-900' : 'text-red-900'
              }`}>
                {toast.message}
              </p>
            </div>
            <button
              onClick={() => setToast(null)}
              className={`ml-4 flex-shrink-0 hover:opacity-70 transition-opacity ${
                toast.type === 'success' ? 'text-green-700' : 'text-red-700'
              }`}
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Dashboard Banner Gradient */}
      <div className="bg-gradient-to-r from-teal-600 to-indigo-700 h-48 w-full absolute top-20 left-0 z-0"></div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 mt-12">

        {/* View Mode Toggle - Show on tablet and desktop */}
        {!isMobile && (
          <div className="flex justify-end mb-4">
            <ViewModeToggle viewMode={viewMode} onToggle={setViewMode} />
          </div>
        )}

        {/* Mobile Tab Bar - Show only in mobile view */}
        {showMobileTabs && (
          <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-2 mb-6 overflow-x-auto">
            <div className="flex space-x-2 min-w-max">
              <button
                onClick={() => setActiveTab('profile')}
                className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${
                  activeTab === 'profile'
                    ? 'bg-brand-50 text-brand-700 shadow-sm'
                    : 'text-slate-500 hover:bg-slate-50'
                }`}
              >
                <User className="h-4 w-4 inline mr-2" />
                Profile
              </button>
              <button
                onClick={() => setActiveTab('subscription')}
                className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${
                  activeTab === 'subscription'
                    ? 'bg-indigo-50 text-indigo-700 shadow-sm'
                    : 'text-slate-500 hover:bg-slate-50'
                }`}
              >
                <CreditCard className="h-4 w-4 inline mr-2" />
                Subscription
              </button>
              <button
                onClick={() => setActiveTab('analytics')}
                className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${
                  activeTab === 'analytics'
                    ? 'bg-green-50 text-green-700 shadow-sm'
                    : 'text-slate-500 hover:bg-slate-50'
                }`}
              >
                <BarChart className="h-4 w-4 inline mr-2" />
                Analytics
              </button>
              <button
                onClick={() => setActiveTab('reviews')}
                className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${
                  activeTab === 'reviews'
                    ? 'bg-yellow-50 text-yellow-700 shadow-sm'
                    : 'text-slate-500 hover:bg-slate-50'
                }`}
              >
                <Star className="h-4 w-4 inline mr-2" />
                Reviews
                {currentCoach?.reviews && currentCoach.reviews.filter(r => r.verificationStatus === 'unverified').length > 0 && (
                  <span className="ml-2 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                    {currentCoach.reviews.filter(r => r.verificationStatus === 'unverified').length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('account')}
                className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${
                  activeTab === 'account'
                    ? 'bg-slate-100 text-slate-800 shadow-sm'
                    : 'text-slate-500 hover:bg-slate-50'
                }`}
              >
                <Settings className="h-4 w-4 inline mr-2" />
                Account
              </button>
            </div>
          </div>
        )}

        <div className={`flex flex-col ${showSidebar ? 'md:flex-row' : ''} md:items-start gap-8`}>

          {/* Sidebar - Show only in desktop view */}
          {showSidebar && (
          <div className="md:w-72 flex-shrink-0">
            <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden sticky top-24">
              
              {/* Profile Card Header */}
              <div className="p-8 pb-6 text-center bg-slate-50/50">
                <div className="relative inline-block">
                  <img 
                    src={currentCoach.photoUrl || 'https://picsum.photos/200/200'} 
                    alt="Profile" 
                    className="w-24 h-24 rounded-2xl mx-auto object-cover border-4 border-white shadow-md" 
                  />
                  {currentCoach.subscriptionStatus === 'trial' && (
                    <span className="absolute -bottom-2 -right-2 bg-blue-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold shadow-sm">TRIAL</span>
                  )}
                </div>
                <h2 className="font-display font-bold text-xl text-slate-900 mt-4">{currentCoach.name}</h2>
                <p className="text-xs font-bold text-brand-600 uppercase tracking-wide mt-1">Verified Coach</p>
              </div>

              {/* Navigation Tabs */}
              <nav className="p-3 space-y-1">
                <button 
                  onClick={() => setActiveTab('profile')} 
                  className={`w-full flex items-center px-4 py-3 text-sm font-bold rounded-xl transition-all ${activeTab === 'profile' ? 'bg-brand-50 text-brand-700 shadow-sm' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'}`}
                >
                  <User className={`h-5 w-5 mr-3 ${activeTab === 'profile' ? 'text-brand-600' : 'text-slate-400'}`} /> Edit Profile
                </button>
                <button
                  onClick={() => setActiveTab('subscription')}
                  className={`w-full flex items-center px-4 py-3 text-sm font-bold rounded-xl transition-all ${activeTab === 'subscription' ? 'bg-indigo-50 text-indigo-700 shadow-sm' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'}`}
                >
                  <CreditCard className={`h-5 w-5 mr-3 ${activeTab === 'subscription' ? 'text-indigo-600' : 'text-slate-400'}`} /> Subscription
                </button>
                <button
                  onClick={() => setActiveTab('analytics')}
                  className={`w-full flex items-center px-4 py-3 text-sm font-bold rounded-xl transition-all ${activeTab === 'analytics' ? 'bg-green-50 text-green-700 shadow-sm' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'}`}
                >
                  <BarChart className={`h-5 w-5 mr-3 ${activeTab === 'analytics' ? 'text-green-600' : 'text-slate-400'}`} /> Analytics
                </button>
                <button
                  onClick={() => setActiveTab('reviews')}
                  className={`w-full flex items-center justify-between px-4 py-3 text-sm font-bold rounded-xl transition-all ${activeTab === 'reviews' ? 'bg-yellow-50 text-yellow-700 shadow-sm' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'}`}
                >
                  <div className="flex items-center">
                    <Star className={`h-5 w-5 mr-3 ${activeTab === 'reviews' ? 'text-yellow-600' : 'text-slate-400'}`} /> Reviews
                  </div>
                  {currentCoach?.reviews && currentCoach.reviews.filter(r => r.verificationStatus === 'unverified').length > 0 && (
                    <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                      {currentCoach.reviews.filter(r => r.verificationStatus === 'unverified').length}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setActiveTab('account')}
                  className={`w-full flex items-center px-4 py-3 text-sm font-bold rounded-xl transition-all ${activeTab === 'account' ? 'bg-slate-100 text-slate-800 shadow-sm' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'}`}
                >
                  <Settings className={`h-5 w-5 mr-3 ${activeTab === 'account' ? 'text-slate-700' : 'text-slate-400'}`} /> Account
                </button>
              </nav>

              <div className="p-3 border-t border-slate-100 mt-2">
                 <button onClick={handleLogout} className="w-full flex items-center px-4 py-3 text-sm font-bold text-red-600 hover:bg-red-50 rounded-xl transition-colors">
                   <LogOut className="h-5 w-5 mr-3" /> Sign Out
                 </button>
              </div>
            </div>
          </div>
          )}

          {/* Content Area */}
          <div className="flex-grow space-y-6">

            {/* Trial Countdown Banner */}
            {currentCoach && <TrialCountdownBanner coach={currentCoach} />}

            {/* ---------------- PROFILE TAB ---------------- */}
            {activeTab === 'profile' && (
              <div className="space-y-6">
                {/* Upgrade CTA for unpaid trial users */}
                {currentCoach.subscriptionStatus === 'trial' && !currentCoach.billingCycle && (
                  <div className="bg-gradient-to-br from-brand-600 via-indigo-600 to-purple-600 rounded-2xl shadow-2xl border border-brand-700 p-6 text-white animate-fade-in">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                      <div className="text-center md:text-left">
                        <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                          <h3 className="text-xl font-bold">Upgrade to Keep Your Profile Live</h3>
                        </div>
                        <p className="text-brand-100 text-sm">
                          Your trial ends on {currentCoach.trialEndsAt ? new Date(currentCoach.trialEndsAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long' }) : 'soon'}. Choose a plan to stay visible to clients.
                        </p>
                      </div>
                      <Link
                        to="/pricing"
                        className="bg-white text-brand-600 px-6 py-3 rounded-xl font-bold hover:bg-brand-50 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 whitespace-nowrap"
                      >
                        View Plans
                      </Link>
                    </div>
                  </div>
                )}

                <div className="bg-white rounded-2xl shadow-lg border border-slate-200/60 p-8 space-y-8 animate-fade-in-up">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-6">
                    <div className="flex items-center">
                        <div className="bg-brand-100 p-2 rounded-lg mr-4 text-brand-600">
                            <User className="h-6 w-6" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-display font-bold text-slate-900">Public Profile</h2>
                            <p className="text-slate-500 text-sm">Update how clients see you.</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {hasUnsavedChanges && (
                        <span className="text-xs font-bold text-amber-600 flex items-center">
                          <AlertTriangle className="h-4 w-4 mr-1" /> Unsaved changes
                        </span>
                      )}
                      <button
                        onClick={() => navigate(`/coach/${currentCoach?.id}`)}
                        className="bg-slate-100 text-slate-700 px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-slate-200 transition-all flex items-center"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Preview Profile
                      </button>
                      <button
                        onClick={handleSaveProfile}
                        disabled={!hasUnsavedChanges || isSaving}
                        className="bg-brand-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-brand-500/30 hover:bg-brand-700 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                      >
                        {isSaving ? (
                          <>
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> Saving...
                          </>
                        ) : (
                          'Save Changes'
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Profile Photo Upload */}
                  <ImageUpload
                    currentImageUrl={localProfile?.photoUrl}
                    onImageUpdate={(newUrl) => updateLocalProfile({ photoUrl: newUrl })}
                    coachId={currentCoach.id}
                  />

                  {/* Basic Info */}
                  <div className="grid grid-cols-1 gap-6">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Full Name</label>
                        <input
                          type="text"
                          value={localProfile?.name || ''}
                          onChange={(e) => updateLocalProfile({name: e.target.value})}
                          className="w-full border border-slate-200 bg-slate-50 rounded-xl px-4 py-3 focus:bg-white focus:ring-2 focus:ring-brand-500 outline-none transition-colors"
                        />
                    </div>
                  </div>

                  {/* Matching Criteria Section */}
                  <div className="bg-gradient-to-br from-brand-50 to-indigo-50 rounded-2xl p-6 border border-brand-100 space-y-6">
                      <h3 className="text-sm font-extrabold text-brand-900 flex items-center uppercase tracking-widest">
                        <Sparkles className="h-4 w-4 mr-2" /> Matching Criteria
                      </h3>
                      
                      {/* Specialties Tags */}
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-3 flex items-center">
                           <Tag className="h-4 w-4 mr-2 text-slate-400" /> Specializations
                        </label>
                        <div className="flex flex-wrap gap-2">
                           {AVAILABLE_SPECIALTIES.map(s => (
                             <button
                               key={s}
                               onClick={() => toggleSpecialty(s)}
                               className={`px-4 py-2 rounded-lg text-xs font-bold border transition-all duration-200 ${
                                 localProfile?.specialties?.includes(s)
                                 ? 'bg-brand-600 text-white border-brand-600 shadow-md transform scale-105'
                                 : 'bg-white text-slate-600 border-slate-200 hover:border-brand-300 hover:text-brand-600'
                               }`}
                             >
                               {s}
                             </button>
                           ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* Format Checkboxes */}
                          <div>
                            <label className="block text-sm font-bold text-slate-700 mb-3 flex items-center">
                                <Monitor className="h-4 w-4 mr-2 text-slate-400" /> Coaching Formats
                            </label>
                            <div className="space-y-2">
                                {AVAILABLE_FORMATS.map(f => (
                                <label key={f} className="flex items-center cursor-pointer p-2 rounded-lg hover:bg-white/50 transition-colors">
                                    <input
                                        type="checkbox"
                                        checked={localProfile?.availableFormats?.includes(f)}
                                        onChange={() => toggleFormat(f)}
                                        className="h-5 w-5 text-brand-600 focus:ring-brand-500 border-gray-300 rounded"
                                    />
                                    <span className="ml-3 text-sm font-medium text-slate-800">{f}</span>
                                </label>
                                ))}
                            </div>
                          </div>

                          {/* Currency */}
                          <div>
                            <label className="block text-sm font-bold text-slate-700 mb-3">Currency</label>
                            <select
                              value={localProfile?.currency || 'GBP'}
                              onChange={(e) => updateLocalProfile({currency: e.target.value as Currency})}
                              className="w-full border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-brand-500 outline-none text-sm font-medium text-slate-800 bg-white"
                            >
                              {CURRENCIES.map((curr) => (
                                <option key={curr.code} value={curr.code}>
                                  {curr.symbol} {curr.code} - {curr.name}
                                </option>
                              ))}
                            </select>
                            <p className="text-xs text-slate-500 mt-2">Your preferred currency for pricing.</p>
                          </div>

                          {/* Hourly Rate */}
                          <div>
                            <label className="block text-sm font-bold text-slate-700 mb-3">
                              Hourly Rate ({CURRENCIES.find(c => c.code === (localProfile?.currency || 'GBP'))?.symbol || '£'})
                            </label>
                            <div className="relative">
                                <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400 font-bold">
                                  {CURRENCIES.find(c => c.code === (localProfile?.currency || 'GBP'))?.symbol || '£'}
                                </span>
                                <input
                                    type="number"
                                    value={localProfile?.hourlyRate || ''}
                                    onChange={(e) => updateLocalProfile({hourlyRate: parseInt(e.target.value) || 0})}
                                    onFocus={(e) => {
                                        e.target.select();
                                        if (e.target.value === '0') {
                                            updateLocalProfile({hourlyRate: 0});
                                        }
                                    }}
                                    placeholder="0"
                                    className="w-full border border-slate-200 rounded-xl pl-8 pr-4 py-3 focus:ring-2 focus:ring-brand-500 outline-none text-lg font-bold text-slate-800"
                                />
                            </div>
                            <p className="text-xs text-slate-500 mt-2">Used to match with client budget ranges.</p>
                          </div>

                          {/* Gender */}
                          <div>
                            <label className="block text-sm font-bold text-slate-700 mb-3">Gender</label>
                            <div className="space-y-2">
                              {['Male', 'Female', 'Non-binary', 'Prefer not to say'].map((g) => (
                                <label key={g} className="flex items-center cursor-pointer p-2 rounded-lg hover:bg-white/50 transition-colors">
                                  <input
                                    type="radio"
                                    name="gender"
                                    value={g}
                                    checked={localProfile?.gender === g}
                                    onChange={(e) => updateLocalProfile({gender: e.target.value})}
                                    className="h-5 w-5 text-brand-600 focus:ring-brand-500 border-gray-300"
                                  />
                                  <span className="ml-3 text-sm font-medium text-slate-800">{g}</span>
                                </label>
                              ))}
                              <div className="pl-7">
                                <input
                                  type="text"
                                  placeholder="Prefer to self-describe (optional)"
                                  value={localProfile?.gender && !['Male', 'Female', 'Non-binary', 'Prefer not to say'].includes(localProfile.gender) ? localProfile.gender : ''}
                                  onChange={(e) => updateLocalProfile({gender: e.target.value})}
                                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                                />
                              </div>
                            </div>
                          </div>
                      </div>
                  </div>

                  {/* Bio */}
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Bio</label>
                    <textarea rows={4} value={localProfile?.bio || ''} onChange={(e) => updateLocalProfile({bio: e.target.value})} className="w-full border border-slate-200 bg-slate-50 rounded-xl px-4 py-3 focus:bg-white focus:ring-2 focus:ring-brand-500 outline-none transition-colors" />
                  </div>

                  {/* Professional Credentials Section */}
                  <CollapsibleSection
                    title="Professional Credentials"
                    subtitle="Your coaching accreditation and experience"
                    icon={<Award className="h-4 w-4" />}
                    defaultOpen={false}
                    gradient="from-indigo-50 to-purple-50"
                    borderColor="border-indigo-100"
                    iconBgColor="bg-indigo-100"
                    iconTextColor="text-indigo-600"
                  >
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* Accreditation Body */}
                          <div>
                            <label className="block text-sm font-bold text-slate-700 mb-3">Accreditation Body</label>
                            <select
                              value={localProfile?.accreditationBody || ''}
                              onChange={(e) => updateLocalProfile({accreditationBody: e.target.value as any})}
                              className="w-full border border-slate-200 bg-white rounded-xl px-4 py-3 focus:ring-2 focus:ring-brand-500 outline-none text-slate-800"
                            >
                              <option value="">Select body...</option>
                              <option value="EMCC">EMCC (European Mentoring & Coaching Council)</option>
                              <option value="ICF">ICF (International Coaching Federation)</option>
                              <option value="Other">Other</option>
                            </select>
                            {localProfile?.accreditationBody === 'EMCC' && (
                              <div className="mt-3">
                                {localProfile?.emccVerified ? (
                                  <div className="flex items-center gap-2 text-green-700 text-sm font-bold">
                                    <CheckCircle className="h-4 w-4" />
                                    EMCC Verified
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => {
                                      setShowVerificationModal(true);
                                      setVerificationData({
                                        eiaNumber: '',
                                        fullName: currentCoach?.name || '',
                                        profileUrl: '',
                                        membershipNumber: ''
                                      });
                                    }}
                                    className="flex items-center gap-2 bg-amber-100 text-amber-800 px-4 py-2 rounded-lg text-sm font-bold hover:bg-amber-200 transition-all"
                                  >
                                    <Shield className="h-4 w-4" />
                                    Verify EMCC Accreditation
                                  </button>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Accreditation Level */}
                          <div>
                            <label className="block text-sm font-bold text-slate-700 mb-3">Accreditation Level</label>
                            <select
                              value={localProfile?.accreditationLevel || ''}
                              onChange={(e) => updateLocalProfile({accreditationLevel: e.target.value as any})}
                              className="w-full border border-slate-200 bg-white rounded-xl px-4 py-3 focus:ring-2 focus:ring-brand-500 outline-none text-slate-800"
                            >
                              <option value="">Select accreditation...</option>
                              <option value="Foundation">Foundation</option>
                              <option value="Practitioner">Practitioner</option>
                              <option value="Senior Practitioner">Senior Practitioner</option>
                              <option value="Master Practitioner">Master Practitioner</option>
                            </select>
                          </div>

                          {/* Coaching Hours */}
                          <div>
                            <label className="block text-sm font-bold text-slate-700 mb-3">Coaching Hours</label>
                            <input
                              type="number"
                              value={localProfile?.coachingHours || ''}
                              onChange={(e) => updateLocalProfile({coachingHours: parseInt(e.target.value) || 0})}
                              placeholder="e.g., 500"
                              className="w-full border border-slate-200 bg-white rounded-xl px-4 py-3 focus:ring-2 focus:ring-brand-500 outline-none text-slate-800"
                            />
                            <p className="text-xs text-slate-500 mt-2">Total hours of coaching experience</p>
                          </div>
                      </div>

                      {/* Additional Certifications - Now MultiSelect */}
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-3">Additional Certifications</label>
                        <MultiSelect
                          options={['Mental Health First Aid Trained', 'Trauma Informed', 'Diversity & Inclusion Certified', 'Child & Adolescent Specialist', 'Corporate Coaching Certified', 'NLP Practitioner', 'CBT Trained']}
                          selected={localProfile?.additionalCertifications || []}
                          onChange={(selected) => updateLocalProfile({additionalCertifications: selected as any})}
                          placeholder="Select certifications..."
                          searchPlaceholder="Search certifications..."
                        />
                      </div>

                      {/* Location Radius */}
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-3">Location Radius (for in-person coaching)</label>
                        <input
                          type="text"
                          value={localProfile?.locationRadius || ''}
                          onChange={(e) => updateLocalProfile({locationRadius: e.target.value})}
                          placeholder="e.g., within 5 miles of London"
                          className="w-full border border-slate-200 bg-white rounded-xl px-4 py-3 focus:ring-2 focus:ring-brand-500 outline-none text-slate-800"
                        />
                      </div>
                  </CollapsibleSection>

                  {/* Coaching Expertise Section */}
                  <CollapsibleSection
                    title="Coaching Areas of Expertise"
                    subtitle="Select specific areas where you specialize (helps clients find you)"
                    icon={<Sparkles className="h-4 w-4" />}
                    defaultOpen={false}
                    gradient="from-purple-50 to-pink-50"
                    borderColor="border-purple-100"
                    iconBgColor="bg-purple-100"
                    iconTextColor="text-purple-600"
                  >
                    {Object.entries(COACHING_EXPERTISE_BY_CATEGORY).map(([category, options]) => (
                      <div key={category}>
                        <label className="block text-sm font-bold text-slate-900 mb-2">{category}</label>
                        <MultiSelect
                          options={options}
                          selected={localProfile?.coachingExpertise?.filter(e => options.includes(e as any)) || []}
                          onChange={(selected) => {
                            const current = localProfile?.coachingExpertise || [];
                            const otherCategories = current.filter(e => !options.includes(e as any));
                            const updated = [...otherCategories, ...selected] as CoachingExpertise[];
                            updateLocalProfile({coachingExpertise: updated});
                          }}
                          placeholder={`Select ${category.toLowerCase()} areas...`}
                          searchPlaceholder="Search areas..."
                          maxHeight="300px"
                        />
                      </div>
                    ))}
                  </CollapsibleSection>

                  {/* CPD Qualifications Section */}
                  <CollapsibleSection
                    title="CPD Qualifications & Certifications"
                    subtitle="Additional professional development certifications you hold"
                    icon={<Award className="h-4 w-4" />}
                    defaultOpen={false}
                    gradient="from-teal-50 to-cyan-50"
                    borderColor="border-teal-100"
                    iconBgColor="bg-teal-100"
                    iconTextColor="text-teal-600"
                  >
                    <MultiSelect
                      options={CPD_QUALIFICATIONS}
                      selected={localProfile?.cpdQualifications || []}
                      onChange={(selected) => updateLocalProfile({cpdQualifications: selected})}
                      placeholder="Select CPD qualifications..."
                      searchPlaceholder="Search qualifications (e.g., ICF, EMCC, ILM)..."
                      maxHeight="400px"
                    />
                  </CollapsibleSection>

                  {/* Languages Section (Enhanced) */}
                  <CollapsibleSection
                    title="Coaching Languages"
                    subtitle="Languages in which you offer coaching sessions"
                    icon={
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                      </svg>
                    }
                    defaultOpen={false}
                    gradient="from-blue-50 to-indigo-50"
                    borderColor="border-blue-100"
                    iconBgColor="bg-blue-100"
                    iconTextColor="text-blue-600"
                  >
                    <MultiSelect
                      options={COACHING_LANGUAGES}
                      selected={localProfile?.coachingLanguages || []}
                      onChange={(selected) => updateLocalProfile({coachingLanguages: selected})}
                      placeholder="Select languages..."
                      searchPlaceholder="Search languages..."
                      maxHeight="400px"
                    />
                  </CollapsibleSection>

                  {/* Qualifications Section */}
                  <CollapsibleSection
                    title="Qualifications"
                    subtitle="Your academic and professional qualifications"
                    icon={<GraduationCap className="h-4 w-4" />}
                    defaultOpen={false}
                    gradient="from-green-50 to-emerald-50"
                    borderColor="border-green-100"
                    iconBgColor="bg-green-100"
                    iconTextColor="text-green-600"
                  >
                    <div className="space-y-3 mb-4">
                        {localProfile?.qualifications?.map((qual, idx) => (
                            <div key={idx} className="flex items-start space-x-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
                                <div className="flex-grow">
                                    <p className="text-sm font-bold text-slate-900">{qual.degree}</p>
                                    {qual.institution && <p className="text-xs text-slate-600 mt-1">{qual.institution}</p>}
                                    {qual.year && <p className="text-xs text-slate-500 mt-1">{qual.year}</p>}
                                </div>
                                <button
                                  onClick={() => {
                                    const updated = (localProfile?.qualifications || []).filter((_, i) => i !== idx);
                                    updateLocalProfile({qualifications: updated});
                                  }}
                                  className="text-slate-400 hover:text-red-500 p-2 transition-colors"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>
                        ))}
                    </div>

                    <div className="flex flex-col gap-3 bg-white p-4 rounded-xl border border-slate-200">
                        <input
                            type="text"
                            placeholder="Degree (e.g., Masters in Law)"
                            className="border border-slate-200 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-brand-500 outline-none"
                            value={newQualification.degree}
                            onChange={(e) => setNewQualification({...newQualification, degree: e.target.value})}
                        />
                        <input
                            type="text"
                            placeholder="Institution (optional)"
                            className="border border-slate-200 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-brand-500 outline-none"
                            value={newQualification.institution}
                            onChange={(e) => setNewQualification({...newQualification, institution: e.target.value})}
                        />
                        <input
                            type="number"
                            placeholder="Year (optional)"
                            className="border border-slate-200 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-brand-500 outline-none"
                            value={newQualification.year || ''}
                            onChange={(e) => setNewQualification({...newQualification, year: parseInt(e.target.value) || undefined})}
                        />
                        <button
                            onClick={() => {
                              if (newQualification.degree) {
                                const updated = [...(localProfile?.qualifications || []), {
                                  id: `qual_${Date.now()}`,
                                  degree: newQualification.degree,
                                  institution: newQualification.institution,
                                  year: newQualification.year
                                }];
                                updateLocalProfile({qualifications: updated});
                                setNewQualification({degree: '', institution: '', year: undefined});
                              }
                            }}
                            disabled={!newQualification.degree}
                            className="bg-slate-900 text-white px-5 py-2.5 rounded-lg font-bold hover:bg-slate-800 disabled:opacity-50 flex items-center justify-center shadow-md"
                        >
                            <Plus className="h-4 w-4 mr-1" /> Add Qualification
                        </button>
                    </div>
                  </CollapsibleSection>

                  {/* Acknowledgements Section */}
                  <CollapsibleSection
                    title="Acknowledgements & Awards"
                    subtitle="Professional recognition and achievements"
                    icon={<Trophy className="h-4 w-4" />}
                    defaultOpen={false}
                    gradient="from-amber-50 to-yellow-50"
                    borderColor="border-amber-100"
                    iconBgColor="bg-amber-100"
                    iconTextColor="text-amber-600"
                  >
                    <div className="space-y-3 mb-4">
                        {localProfile?.acknowledgements?.map((ack, idx) => {
                          const iconMap: { [key: string]: string } = {
                            'trophy': '🏆',
                            'star': '⭐',
                            'medal': '🏅',
                            'award': '🎖️',
                            'certificate': '📜',
                            'crown': '👑',
                            'ribbon': '🎗️'
                          };
                          return (
                            <div key={idx} className="flex items-start space-x-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
                                {ack.icon && (
                                  <div className="text-2xl flex-shrink-0">{iconMap[ack.icon] || '🏆'}</div>
                                )}
                                <div className="flex-grow">
                                    <p className="text-sm font-bold text-slate-900">{ack.title}</p>
                                    <div className="flex items-center gap-2 mt-1">
                                      {ack.year && <span className="text-xs text-slate-500">{ack.year}</span>}
                                    </div>
                                </div>
                                <button
                                  onClick={() => {
                                    const updated = (localProfile?.acknowledgements || []).filter((_, i) => i !== idx);
                                    updateLocalProfile({acknowledgements: updated});
                                  }}
                                  className="text-slate-400 hover:text-red-500 p-2 transition-colors"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>
                          );
                        })}
                    </div>

                    <div className="flex flex-col gap-3 bg-white p-4 rounded-xl border border-slate-200">
                        <input
                            type="text"
                            placeholder="Title (e.g., Coach of the Year 2025)"
                            className="border border-slate-200 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-brand-500 outline-none"
                            value={newAcknowledgement.title}
                            onChange={(e) => setNewAcknowledgement({...newAcknowledgement, title: e.target.value})}
                        />
                        <div className="grid grid-cols-2 gap-3">
                          <select
                              className="border border-slate-200 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-brand-500 outline-none bg-white"
                              value={newAcknowledgement.icon || ''}
                              onChange={(e) => setNewAcknowledgement({...newAcknowledgement, icon: e.target.value})}
                          >
                              <option value="">Select icon (optional)</option>
                              <option value="trophy">🏆 Trophy</option>
                              <option value="star">⭐ Star</option>
                              <option value="medal">🏅 Medal</option>
                              <option value="award">🎖️ Award</option>
                              <option value="certificate">📜 Certificate</option>
                              <option value="crown">👑 Crown</option>
                              <option value="ribbon">🎗️ Ribbon</option>
                          </select>
                          <input
                              type="number"
                              placeholder="Year (optional)"
                              className="border border-slate-200 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-brand-500 outline-none"
                              value={newAcknowledgement.year || ''}
                              onChange={(e) => setNewAcknowledgement({...newAcknowledgement, year: parseInt(e.target.value) || undefined})}
                          />
                        </div>
                        <button
                            onClick={() => {
                              if (newAcknowledgement.title) {
                                const updated = [...(localProfile?.acknowledgements || []), {
                                  id: `ack_${Date.now()}`,
                                  title: newAcknowledgement.title,
                                  icon: newAcknowledgement.icon,
                                  year: newAcknowledgement.year
                                }];
                                updateLocalProfile({acknowledgements: updated});
                                setNewAcknowledgement({title: '', icon: '', year: undefined});
                              }
                            }}
                            disabled={!newAcknowledgement.title}
                            className="bg-slate-900 text-white px-5 py-2.5 rounded-lg font-bold hover:bg-slate-800 disabled:opacity-50 flex items-center justify-center shadow-md"
                        >
                            <Plus className="h-4 w-4 mr-1" /> Add Acknowledgement
                        </button>
                    </div>
                  </CollapsibleSection>

                  {/* Social Links */}
                  <CollapsibleSection
                    title="Social & Web Links"
                    subtitle="Your professional online presence and contact methods"
                    icon={<LinkIcon className="h-4 w-4" />}
                    defaultOpen={false}
                    gradient="from-slate-50 to-gray-50"
                    borderColor="border-slate-200"
                    iconBgColor="bg-slate-100"
                    iconTextColor="text-slate-600"
                  >
                    <div className="space-y-3 mb-4">
                        {localProfile?.socialLinks?.map((link, idx) => (
                            <div key={idx} className="flex items-center space-x-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                                <div className="flex-grow">
                                    <div className="flex items-center gap-2 mb-1">
                                      <p className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">{link.platform}</p>
                                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                                        link.type === 'email' ? 'bg-blue-100 text-blue-700' :
                                        link.type === 'tel' ? 'bg-green-100 text-green-700' :
                                        'bg-slate-100 text-slate-600'
                                      }`}>
                                        {link.type === 'email' ? 'EMAIL' : link.type === 'tel' ? 'PHONE' : 'URL'}
                                      </span>
                                    </div>
                                    <p className="text-sm text-brand-700 font-medium truncate">{stripProtocol(link.url)}</p>
                                </div>
                                <button onClick={() => removeLink(idx)} className="text-slate-400 hover:text-red-500 p-2 transition-colors">
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>
                        ))}
                    </div>

                    <div className="flex flex-col gap-3">
                        <div className="flex gap-3">
                          <select
                            value={newLink.type}
                            onChange={(e) => setNewLink({...newLink, type: e.target.value as 'url' | 'email' | 'tel'})}
                            className="border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-brand-500 outline-none bg-white font-bold text-slate-700"
                          >
                            <option value="url">Website/Social</option>
                            <option value="email">Email</option>
                            <option value="tel">Telephone</option>
                          </select>
                          <input
                              type="text"
                              placeholder="Label (e.g. LinkedIn, Contact Email, Mobile)"
                              className="flex-1 border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-brand-500 outline-none"
                              value={newLink.platform}
                              onChange={(e) => setNewLink({...newLink, platform: e.target.value})}
                          />
                        </div>
                        <div className="flex gap-3">
                          <input
                              type="text"
                              placeholder={
                                newLink.type === 'email' ? 'Email address (e.g., coach@example.com)' :
                                newLink.type === 'tel' ? 'Phone number (e.g., +44 7700 900000)' :
                                'URL (https://...)'
                              }
                              className="flex-1 border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-brand-500 outline-none"
                              value={newLink.url}
                              onChange={(e) => setNewLink({...newLink, url: e.target.value})}
                          />
                          <button
                              onClick={addLink}
                              disabled={!newLink.platform || !newLink.url}
                              className="bg-slate-900 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-slate-800 disabled:opacity-50 flex items-center justify-center shadow-md"
                          >
                              <Plus className="h-4 w-4 mr-1" /> Add
                          </button>
                        </div>
                    </div>
                  </CollapsibleSection>
              </div>
              </div>
            )}

            {/* ---------------- SUBSCRIPTION TAB ---------------- */}
            {activeTab === 'subscription' && (
               <div className="space-y-6 animate-fade-in-up">
                   <div className="bg-white rounded-2xl shadow-lg border border-slate-200/60 p-8">
                        <div className="flex justify-between items-start mb-6">
                            <div className="flex items-center">
                                <div className="bg-indigo-100 p-2 rounded-lg mr-4 text-indigo-600">
                                    <CreditCard className="h-6 w-6" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-display font-bold text-slate-900">Subscription</h2>
                                    <p className="text-slate-500 text-sm">Plan and billing.</p>
                                </div>
                            </div>
                            <span className={`px-4 py-1.5 rounded-full text-xs font-extrabold uppercase tracking-wide ${
                                (currentCoach.subscriptionStatus === 'active' || currentCoach.billingCycle) ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-blue-100 text-blue-700 border border-blue-200'
                            }`}>
                                {(currentCoach.subscriptionStatus === 'active' || currentCoach.billingCycle) ? 'Premium' : 'Free Trial'}
                            </span>
                        </div>

                        {/* Show upgrade CTA only if no billing cycle is set (unpaid trial) */}
                        {currentCoach.subscriptionStatus === 'trial' && !currentCoach.billingCycle ? (
                            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl p-8 text-center">
                                <h3 className="text-xl font-bold text-indigo-900 mb-3">Upgrade to Keep Access</h3>
                                <p className="text-sm text-indigo-700/80 mb-8 max-w-md mx-auto">
                                    Your trial ends on <span className="font-bold">{currentCoach.trialEndsAt ? new Date(currentCoach.trialEndsAt).toLocaleDateString() : 'soon'}</span>.
                                    Lock in your early bird rate now.
                                </p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg mx-auto">
                                    <Link
                                        to="/checkout/monthly"
                                        className="bg-white border-2 border-transparent hover:border-indigo-400 p-5 rounded-2xl shadow-sm hover:shadow-md transition-all group block"
                                    >
                                        <span className="block font-bold text-slate-900 text-xl">Monthly</span>
                                        <span className="block text-slate-500">£15/mo</span>
                                    </Link>
                                    <Link
                                        to="/checkout/annual"
                                        className="bg-white border-2 border-brand-500 p-5 rounded-2xl relative shadow-lg hover:-translate-y-1 transition-all block"
                                    >
                                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand-600 text-white text-[10px] px-3 py-1 rounded-full font-bold shadow-sm">SAVE 17%</div>
                                        <span className="block font-bold text-slate-900 text-xl">Annual</span>
                                        <span className="block text-slate-500">£150/yr</span>
                                    </Link>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
                                        <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest mb-4">Billing Cycle</h4>
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <span className="text-2xl font-bold text-slate-900 capitalize">{currentCoach.billingCycle || 'monthly'}</span>
                                                {/* Show pending change indicator */}
                                                {currentCoach.pendingPlanChange && (
                                                    <div className="mt-1 text-xs text-blue-600 font-bold">
                                                        → Changing to {currentCoach.pendingPlanChange.newBillingCycle}
                                                    </div>
                                                )}
                                            </div>
                                            {!currentCoach.pendingPlanChange && (
                                                <Link
                                                    to={`/subscription/change-plan?to=${(currentCoach.billingCycle || 'monthly') === 'monthly' ? 'annual' : 'monthly'}`}
                                                    className="text-sm text-brand-600 font-bold hover:underline flex items-center bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm hover:shadow transition-all"
                                                >
                                                    <RefreshCw className="h-3 w-3 mr-2" /> Change Plan
                                                </Link>
                                            )}
                                        </div>
                                    </div>
                                    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
                                        <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest mb-4">Payment Method</h4>
                                        <div className="flex items-center justify-between">
                                            <p className="text-sm text-slate-600">
                                                Card ending in ••••  {/* Will be populated from Stripe Customer Portal */}
                                            </p>
                                            <button
                                                onClick={async () => {
                                                    // For now, show helpful message since we don't have Stripe Customer ID yet
                                                    // TODO: Once Stripe integration is complete, replace with:
                                                    // await createBillingPortalSession(currentCoach.stripeCustomerId);
                                                    alert('Payment method management will be available after your first payment is processed. This will give you access to:\n\n• Update card details\n• View payment history\n• Download invoices\n• Manage subscription\n\nNo Stripe account needed - it\'s a secure customer portal.');
                                                }}
                                                className="text-sm bg-white border border-slate-300 text-slate-700 font-bold px-4 py-2 rounded-lg hover:bg-slate-50 hover:border-slate-400 transition-all flex items-center shadow-sm"
                                            >
                                                <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                                                </svg>
                                                Update Payment
                                            </button>
                                        </div>
                                        <p className="text-xs text-slate-500 mt-3">
                                            Your payment details are securely stored by Stripe. No card information is stored on our servers.
                                        </p>
                                    </div>
                                </div>

                                {/* Trial information for paid users */}
                                {currentCoach.subscriptionStatus === 'trial' && currentCoach.trialEndsAt && (
                                    <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6">
                                        <div className="flex items-start">
                                            <div className="flex-shrink-0">
                                                <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                            </div>
                                            <div className="ml-4 flex-1">
                                                <h4 className="text-sm font-bold text-blue-900 mb-2">Free Trial Active</h4>
                                                <p className="text-sm text-blue-800">
                                                    Your free trial continues until <span className="font-bold">{new Date(currentCoach.trialEndsAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</span>.
                                                    After your trial ends, your {currentCoach.billingCycle} subscription will begin and you'll be charged automatically.
                                                </p>
                                                <p className="text-xs text-blue-700 mt-2">
                                                    You can cancel anytime before {new Date(currentCoach.trialEndsAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long' })} from the options below.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Pending Plan Change Banner (if plan change is scheduled) */}
                                {currentCoach.pendingPlanChange && (
                                    <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <h4 className="text-lg font-bold text-blue-900 mb-2">
                                                    Plan Change Scheduled
                                                </h4>
                                                <p className="text-sm text-blue-800 mb-1">
                                                    Your plan will change from{' '}
                                                    <span className="font-bold capitalize">{currentCoach.billingCycle}</span> to{' '}
                                                    <span className="font-bold capitalize">{currentCoach.pendingPlanChange.newBillingCycle}</span> on{' '}
                                                    <span className="font-bold">
                                                        {new Date(currentCoach.pendingPlanChange.effectiveDate).toLocaleDateString('en-GB', {
                                                            day: 'numeric',
                                                            month: 'long',
                                                            year: 'numeric'
                                                        })}
                                                    </span>
                                                </p>
                                                <p className="text-sm text-blue-700">
                                                    You can cancel this change anytime before the effective date.
                                                </p>
                                            </div>
                                            <button
                                                onClick={async () => {
                                                    if (window.confirm('Are you sure you want to cancel this plan change?')) {
                                                        const success = await updateCoach({
                                                            ...currentCoach,
                                                            pendingPlanChange: null
                                                        });
                                                        if (success) {
                                                            await refreshCoach();
                                                            alert('✓ Plan change cancelled successfully!');
                                                        } else {
                                                            alert('⚠ Failed to cancel plan change. Please try again.');
                                                        }
                                                    }
                                                }}
                                                className="ml-4 bg-blue-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-blue-700 transition-colors flex-shrink-0"
                                            >
                                                Cancel Change
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Cancellation Banner (if subscription is cancelled) */}
                                {currentCoach.cancelledAt && currentCoach.subscriptionEndsAt && (
                                    <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-6 mt-6">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <h4 className="text-lg font-bold text-yellow-900 mb-2">
                                                    Subscription Scheduled for Cancellation
                                                </h4>
                                                <p className="text-sm text-yellow-800 mb-1">
                                                    Your subscription will end on{' '}
                                                    <span className="font-bold">
                                                        {new Date(currentCoach.subscriptionEndsAt).toLocaleDateString('en-GB', {
                                                            day: 'numeric',
                                                            month: 'long',
                                                            year: 'numeric'
                                                        })}
                                                    </span>
                                                </p>
                                                <p className="text-sm text-yellow-700">
                                                    You'll continue to have access until then. You can reactivate your subscription at any time.
                                                </p>
                                            </div>
                                            <button
                                                onClick={handleReactivateSubscription}
                                                className="ml-4 bg-yellow-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-yellow-700 transition-colors flex-shrink-0"
                                            >
                                                Reactivate
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Cancel Subscription Button (only show if not already cancelled) */}
                                {!currentCoach.cancelledAt && (
                                    <div className="mt-6 pt-6 border-t border-slate-200">
                                        <button
                                            onClick={() => setIsCancelModalOpen(true)}
                                            className="w-full bg-white border-2 border-red-200 text-red-600 py-3 rounded-xl font-bold hover:bg-red-50 hover:border-red-300 transition-all flex items-center justify-center"
                                        >
                                            <AlertTriangle className="h-5 w-5 mr-2" />
                                            Cancel Subscription
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                   </div>

                   {/* Cancel Subscription Modal */}
                   <CancelSubscriptionModal
                       coach={currentCoach}
                       isOpen={isCancelModalOpen}
                       onClose={() => setIsCancelModalOpen(false)}
                       onConfirm={handleCancelSubscription}
                   />

                   {/* Trial Expired Modal */}
                   {isTrialExpiredModalOpen && (
                     <TrialExpiredModal
                       coach={currentCoach}
                       onClose={() => setIsTrialExpiredModalOpen(false)}
                       onDeleteAccount={handleDeleteAccount}
                     />
                   )}

                   {/* EMCC Verification Modal */}
                   {showVerificationModal && (
                     <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                       <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl">
                         {/* Header */}
                         <div className="bg-gradient-to-r from-brand-500 to-brand-600 text-white px-6 py-5 rounded-t-3xl">
                           <h3 className="text-2xl font-black">Verify EMCC Accreditation</h3>
                           <p className="text-brand-50 text-sm mt-1">Confirm your credentials</p>
                         </div>

                         {/* Content */}
                         <div className="p-6 space-y-5">
                           {/* Info Banner */}
                           <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                             <p className="text-sm text-blue-900">
                               <strong>ℹ️ Quick Verification:</strong> Find your <strong>EIA number</strong> (Reference field) in the <a href="https://www.emccglobal.org/directory" target="_blank" rel="noopener noreferrer" className="underline font-bold">EMCC Directory</a> search for instant verification! Format: EIA12345678
                             </p>
                           </div>

                           {/* Error Message */}
                           {verificationError && (
                             <div className="bg-red-50 border-2 border-red-200 text-red-800 px-4 py-3 rounded-xl text-sm">
                               <strong>❌ Verification Failed:</strong> {verificationError}
                             </div>
                           )}

                           {/* EIA Number Field (REQUIRED) */}
                           <div>
                             <label className="block text-sm font-bold text-slate-900 mb-2">
                               EIA Number (Reference) <span className="text-red-500">*</span>
                             </label>
                             <input
                               type="text"
                               value={verificationData.eiaNumber}
                               onChange={(e) => setVerificationData({ ...verificationData, eiaNumber: e.target.value.toUpperCase() })}
                               placeholder="EIA20260083"
                               className="w-full border-2 border-green-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all"
                               disabled={isVerifying}
                               required
                             />
                             <p className="text-xs text-slate-500 mt-2">
                               <strong>⚡ Required for verification.</strong> Find this in your EMCC directory "Reference" column
                             </p>
                           </div>

                           {/* Full Name Field */}
                           <div>
                             <label className="block text-sm font-bold text-slate-900 mb-2">
                               Full Name <span className="text-red-500">*</span>
                             </label>
                             <input
                               type="text"
                               value={verificationData.fullName}
                               onChange={(e) => setVerificationData({ ...verificationData, fullName: e.target.value })}
                               placeholder="Exactly as shown in EMCC directory"
                               className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all"
                               disabled={isVerifying}
                               required
                             />
                             <p className="text-xs text-slate-500 mt-2">Example: "Dr Jane Smith" or "John Michael Doe"</p>
                           </div>

                           {/* Privacy Notice */}
                           <div className="bg-green-50 border border-green-200 rounded-xl p-3">
                             <p className="text-xs text-green-900">
                               🔒 <strong>Privacy:</strong> Your EIA number is only used for verification and is not stored in our system.
                             </p>
                           </div>
                         </div>

                         {/* Footer */}
                         <div className="px-6 pb-6 flex gap-3">
                           <button
                             onClick={() => {
                               setShowVerificationModal(false);
                               setVerificationError(null);
                             }}
                             disabled={isVerifying}
                             className="flex-1 bg-slate-100 text-slate-700 px-5 py-3 rounded-xl font-bold hover:bg-slate-200 transition-all disabled:opacity-50"
                           >
                             Cancel
                           </button>
                           <button
                             onClick={handleVerificationSubmit}
                             disabled={isVerifying || !verificationData.fullName.trim() || !verificationData.eiaNumber.trim()}
                             className="flex-1 bg-brand-600 text-white px-5 py-3 rounded-xl font-bold shadow-lg shadow-brand-500/30 hover:bg-brand-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                           >
                             {isVerifying ? (
                               <>
                                 <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                 Verifying...
                               </>
                             ) : (
                               <>
                                 <Shield className="h-4 w-4 mr-2" />
                                 Verify Now
                               </>
                             )}
                           </button>
                         </div>
                       </div>
                     </div>
                   )}
               </div>
            )}

            {/* ---------------- REVIEWS TAB ---------------- */}
            {activeTab === 'reviews' && (
              <div className="space-y-6 animate-fade-in-up">
                <div className="bg-white rounded-2xl shadow-lg border border-slate-200/60 p-8">
                  <h2 className="text-2xl font-display font-bold text-slate-900 mb-6">Manage Reviews</h2>

                  {currentCoach?.reviews && currentCoach.reviews.length > 0 ? (
                    <>
                      {/* Sub-tabs for Pending/Archived */}
                      <div className="flex gap-2 mb-6 border-b border-slate-200">
                        <button
                          onClick={() => setReviewSubTab('pending')}
                          className={`px-4 py-2 font-bold text-sm transition-colors relative ${
                            reviewSubTab === 'pending'
                              ? 'text-yellow-600 border-b-2 border-yellow-600'
                              : 'text-slate-500 hover:text-slate-700'
                          }`}
                        >
                          Awaiting Approval
                          {currentCoach.reviews.filter(r => r.verificationStatus === 'unverified').length > 0 && (
                            <span className="ml-2 bg-yellow-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                              {currentCoach.reviews.filter(r => r.verificationStatus === 'unverified').length}
                            </span>
                          )}
                        </button>
                        <button
                          onClick={() => setReviewSubTab('archived')}
                          className={`px-4 py-2 font-bold text-sm transition-colors relative ${
                            reviewSubTab === 'archived'
                              ? 'text-slate-600 border-b-2 border-slate-600'
                              : 'text-slate-500 hover:text-slate-700'
                          }`}
                        >
                          Archived
                          {currentCoach.reviews.filter(r => r.verificationStatus === 'verified' || r.verificationStatus === 'flagged').length > 0 && (
                            <span className="ml-2 bg-slate-400 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                              {currentCoach.reviews.filter(r => r.verificationStatus === 'verified' || r.verificationStatus === 'flagged').length}
                            </span>
                          )}
                        </button>
                      </div>

                      {/* Pending Reviews */}
                      {reviewSubTab === 'pending' && (
                        <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                          {currentCoach.reviews.filter(r => r.verificationStatus === 'unverified').length > 0 ? (
                            currentCoach.reviews.filter(r => r.verificationStatus === 'unverified').map((review: Review) => (
                        <div
                          key={review.id}
                          className={`border-2 rounded-xl p-6 transition-all ${
                            review.verificationStatus === 'verified'
                              ? 'border-green-200 bg-green-50/30'
                              : review.verificationStatus === 'flagged'
                              ? 'border-red-200 bg-red-50/30'
                              : 'border-slate-200 bg-white'
                          }`}
                        >
                          {/* Review Header */}
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="font-bold text-slate-900">{review.author}</span>
                                {review.verificationStatus === 'verified' && (
                                  <div className="flex items-center gap-1 bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full font-bold">
                                    <CheckCircle className="h-3 w-3" />
                                    Verified
                                  </div>
                                )}
                                {review.verificationStatus === 'flagged' && (
                                  <div className="flex items-center gap-1 bg-red-100 text-red-700 text-xs px-2 py-1 rounded-full font-bold">
                                    <Flag className="h-3 w-3" />
                                    Flagged
                                  </div>
                                )}
                              </div>

                              {/* Star Rating */}
                              <div className="flex gap-1 mb-2">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <Star
                                    key={star}
                                    className={`h-4 w-4 ${star <= review.rating ? 'fill-yellow-400 text-yellow-400' : 'fill-slate-200 text-slate-200'}`}
                                  />
                                ))}
                              </div>

                              <p className="text-sm text-slate-500 mb-1">
                                Coaching period: {review.coachingPeriod || 'Not specified'}
                              </p>
                              <p className="text-xs text-slate-400">
                                Submitted: {review.date}
                              </p>
                            </div>
                          </div>

                          {/* Review Text */}
                          <p className="text-slate-700 mb-4 leading-relaxed">{review.text}</p>

                          {/* Spam Warning Badge */}
                          {review.isSpam && review.spamScore && review.spamScore >= 50 && (
                            <div className={`mb-4 p-3 rounded-lg flex items-center gap-2 ${
                              review.spamScore >= 70
                                ? 'bg-red-100 text-red-800 border border-red-200'
                                : 'bg-orange-100 text-orange-800 border border-orange-200'
                            }`}>
                              <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                              <div className="text-sm">
                                <strong>Flagged as spam ({review.spamScore}% confidence)</strong>
                                {review.spamCategory && <span> - {review.spamCategory}</span>}
                                {review.spamReasons && review.spamReasons.length > 0 && (
                                  <div className="text-xs mt-1 opacity-80">
                                    {review.spamReasons[review.spamReasons.length - 1]}
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Action Buttons / Forms */}
                          <div className="pt-4 border-t border-slate-200">
                            {commentingOnReview === review.id ? (
                              /* Comment Form */
                              <div className="bg-slate-50 rounded-lg p-4 mb-4">
                                <p className="font-bold text-sm text-slate-900 mb-3">Add a public comment:</p>
                                <textarea
                                  value={commentText}
                                  onChange={(e) => setCommentText(e.target.value)}
                                  placeholder="Share your thoughts about this review..."
                                  className="w-full border border-slate-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-brand-500 focus:border-transparent resize-none"
                                  rows={3}
                                  disabled={commentSubmitting}
                                />
                                <div className="flex gap-2 mt-3">
                                  <button
                                    onClick={() => handleCommentSubmit(review.id)}
                                    disabled={commentSubmitting || !commentText.trim()}
                                    className="flex items-center gap-2 bg-brand-600 text-white px-4 py-2 rounded-lg hover:bg-brand-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-bold"
                                  >
                                    <Send className="h-4 w-4" />
                                    {commentSubmitting ? 'Posting...' : 'Post Comment'}
                                  </button>
                                  <button
                                    onClick={() => {
                                      setCommentingOnReview(null);
                                      setCommentText('');
                                    }}
                                    className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors text-sm font-bold"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            ) : flaggingReview === review.id ? (
                              /* Flag as Spam Form */
                              <div className="bg-red-50 rounded-lg p-4 mb-4 border border-red-200">
                                <p className="font-bold text-sm text-red-900 mb-3">Flag this review as spam:</p>
                                <textarea
                                  value={flagReason}
                                  onChange={(e) => setFlagReason(e.target.value)}
                                  placeholder="Optional: Explain why this is spam (e.g., 'This person was never my client')"
                                  className="w-full border border-red-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                                  rows={3}
                                  disabled={flagSubmitting}
                                />
                                <p className="text-xs text-red-700 mt-2 mb-3">
                                  ℹ️ Our AI will validate your spam flag to ensure it's legitimate
                                </p>
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => handleFlagAsSpam(review.id)}
                                    disabled={flagSubmitting}
                                    className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-bold"
                                  >
                                    <Flag className="h-4 w-4" />
                                    {flagSubmitting ? 'Flagging...' : 'Flag as Spam'}
                                  </button>
                                  <button
                                    onClick={() => {
                                      setFlaggingReview(null);
                                      setFlagReason('');
                                    }}
                                    className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors text-sm font-bold"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            ) : (
                              /* Action Buttons */
                              <div className="flex gap-3">
                                <button
                                  onClick={() => {
                                    setCommentingOnReview(review.id);
                                    loadReviewComments(review.id);
                                  }}
                                  className="flex items-center gap-2 text-brand-600 hover:text-brand-700 font-bold text-sm"
                                >
                                  <MessageCircle className="h-4 w-4" />
                                  Add Comment
                                </button>
                                {!review.isSpam && (
                                  <button
                                    onClick={() => setFlaggingReview(review.id)}
                                    className="flex items-center gap-2 text-red-600 hover:text-red-700 font-bold text-sm"
                                  >
                                    <Flag className="h-4 w-4" />
                                    Flag as Spam
                                  </button>
                                )}
                              </div>
                            )}

                            {/* Display Comments */}
                            {reviewComments[review.id] && reviewComments[review.id].length > 0 && (
                              <div className="mt-4 space-y-3">
                                <p className="text-sm font-bold text-slate-600">Comments:</p>
                                {reviewComments[review.id].map((comment: any) => (
                                  <div key={comment.id} className="bg-white rounded-lg p-3 border border-slate-200">
                                    <div className="flex items-start gap-2">
                                      <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center flex-shrink-0">
                                        <span className="text-brand-600 font-bold text-xs">
                                          {comment.author_name.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
                                        </span>
                                      </div>
                                      <div className="flex-1">
                                        <p className="font-bold text-xs text-slate-900">{comment.author_name}</p>
                                        <p className="text-slate-700 text-sm mt-1">{comment.text}</p>
                                        <p className="text-xs text-slate-500 mt-1">
                                          {new Date(comment.created_at).toLocaleDateString()}
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      ))
                          ) : (
                            <div className="text-center py-12 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
                              <CheckCircle className="h-12 w-12 text-green-300 mx-auto mb-4" />
                              <p className="text-slate-600 font-bold">All caught up!</p>
                              <p className="text-slate-400 text-sm mt-2">No reviews awaiting approval</p>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Archived Reviews */}
                      {reviewSubTab === 'archived' && (
                        <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                          {currentCoach.reviews.filter(r => r.verificationStatus === 'verified' || r.verificationStatus === 'flagged').length > 0 ? (
                            currentCoach.reviews.filter(r => r.verificationStatus === 'verified' || r.verificationStatus === 'flagged').map((review: Review) => (
                              <div
                                key={review.id}
                                className={`border-2 rounded-xl p-6 transition-all ${
                                  review.verificationStatus === 'verified'
                                    ? 'border-green-200 bg-green-50/30'
                                    : 'border-red-200 bg-red-50/30'
                                }`}
                              >
                                {/* Review Header */}
                                <div className="flex items-start justify-between mb-4">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                      <span className="font-bold text-slate-900">{review.author}</span>
                                      {review.verificationStatus === 'verified' && (
                                        <div className="flex items-center gap-1 bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full font-bold">
                                          <CheckCircle className="h-3 w-3" />
                                          Verified
                                        </div>
                                      )}
                                      {review.verificationStatus === 'flagged' && (
                                        <div className="flex items-center gap-1 bg-red-100 text-red-700 text-xs px-2 py-1 rounded-full font-bold">
                                          <Flag className="h-3 w-3" />
                                          Flagged
                                        </div>
                                      )}
                                    </div>

                                    {/* Star Rating */}
                                    <div className="flex gap-1 mb-2">
                                      {[1, 2, 3, 4, 5].map((star) => (
                                        <Star
                                          key={star}
                                          className={`h-4 w-4 ${star <= review.rating ? 'fill-yellow-400 text-yellow-400' : 'fill-slate-200 text-slate-200'}`}
                                        />
                                      ))}
                                    </div>

                                    <p className="text-sm text-slate-500 mb-1">
                                      Coaching period: {review.coachingPeriod || 'Not specified'}
                                    </p>
                                    <p className="text-xs text-slate-400">
                                      Submitted: {review.date}
                                      {review.verifiedAt && ` • Verified: ${review.verifiedAt}`}
                                    </p>
                                  </div>
                                </div>

                                {/* Review Text */}
                                <p className="text-slate-700 mb-4 leading-relaxed">{review.text}</p>

                                {/* Action Buttons */}
                                <div className="flex gap-3 pt-4 border-t border-slate-200">
                                  <button
                                    onClick={() => handleResetReview(review.id)}
                                    className="flex items-center gap-2 px-4 py-2 bg-slate-600 text-white rounded-lg font-bold hover:bg-slate-700 transition-colors text-sm"
                                  >
                                    <RefreshCw className="h-4 w-4" />
                                    Move to Pending
                                  </button>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="text-center py-12 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
                              <Star className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                              <p className="text-slate-600 font-bold">No archived reviews</p>
                              <p className="text-slate-400 text-sm mt-2">Verified or flagged reviews will appear here</p>
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-12">
                      <Star className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                      <p className="text-slate-500 font-medium">No reviews yet</p>
                      <p className="text-slate-400 text-sm mt-2">Reviews from clients will appear here</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ---------------- ANALYTICS TAB ---------------- */}
            {activeTab === 'analytics' && (
              <div className="space-y-6 animate-fade-in-up">
                {loadingAnalytics ? (
                  <div className="bg-white rounded-2xl shadow-lg border border-slate-200/60 p-8">
                    <div className="flex items-center justify-center py-12">
                      <RefreshCw className="h-8 w-8 animate-spin text-brand-600" />
                    </div>
                  </div>
                ) : analytics ? (
                  <>
                    {/* Profile Views Chart with Time Period Selector */}
                    <ProfileViewsChart
                      viewsByDay={analytics.viewsByDay || []}
                      totalViews={analytics.totalViews}
                    />

                    {/* Top Referrers Card */}
                    <div className="bg-white rounded-2xl shadow-lg border border-slate-200/60 p-8">
                      <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center">
                        <TrendingUp className="h-5 w-5 mr-2 text-slate-600" />
                        Top Traffic Sources
                      </h3>
                      {analytics.topReferrers && analytics.topReferrers.length > 0 ? (
                        <div className="space-y-2">
                          {analytics.topReferrers.map((ref, idx) => (
                            <div key={idx} className="flex justify-between items-center py-3 px-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                              <span className="text-sm text-slate-700 font-medium truncate max-w-xs">
                                {ref.referrer === 'direct' ? '🔗 Direct visits' : `🌐 ${ref.referrer}`}
                              </span>
                              <span className="font-bold text-slate-900">{ref.count} views</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-slate-500 text-sm text-center py-8">No referrer data available yet</p>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="bg-white rounded-2xl shadow-lg border border-slate-200/60 p-8">
                    <p className="text-center text-slate-500 py-12">No analytics data available</p>
                  </div>
                )}
              </div>
            )}

            {/* ---------------- ACCOUNT TAB ---------------- */}
            {activeTab === 'account' && (
                <div className="space-y-6 animate-fade-in-up">
                    <div className="bg-white rounded-2xl shadow-lg border border-slate-200/60 p-8">
                         <div className="flex items-center mb-8 border-b border-slate-100 pb-6">
                            <div className="bg-slate-100 p-2 rounded-lg mr-4 text-slate-600">
                                <Lock className="h-6 w-6" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-display font-bold text-slate-900">Login & Security</h2>
                                <p className="text-slate-500 text-sm">Protect your account.</p>
                            </div>
                        </div>

                        <div className="space-y-8">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Email Address</label>
                                <div className="flex gap-3">
                                    <input type="email" value={currentCoach.email || ''} disabled className="flex-grow border border-slate-200 bg-slate-50 text-slate-500 rounded-xl px-4 py-3" />
                                </div>
                            </div>

                            <div className="border-t border-slate-100 pt-8">
                                <div className="flex justify-between items-center mb-4">
                                    <label className="block text-sm font-bold text-slate-700">Password</label>
                                    <button onClick={handleForgotPassword} className="text-sm text-brand-600 font-medium hover:underline">Forgot Password?</button>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="relative">
                                      <input 
                                        type={showPassState.current ? "text" : "password"}
                                        placeholder="Current" 
                                        className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm pr-10 outline-none focus:ring-2 focus:ring-brand-500 bg-slate-50 focus:bg-white transition-colors" 
                                      />
                                    </div>
                                    <div className="relative">
                                      <input 
                                        type={showPassState.new ? "text" : "password"}
                                        placeholder="New" 
                                        className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm pr-10 outline-none focus:ring-2 focus:ring-brand-500 bg-slate-50 focus:bg-white transition-colors" 
                                      />
                                    </div>
                                    <button className="bg-slate-900 text-white rounded-xl px-4 py-2.5 text-sm font-bold hover:bg-slate-800 shadow-md">Update Password</button>
                                </div>
                            </div>

                            <div className="border-t border-slate-100 pt-8">
                                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                    <div>
                                        <h3 className="text-sm font-bold text-slate-900 flex items-center">
                                            <Smartphone className="h-4 w-4 mr-2 text-slate-400" /> Two-Factor Authentication
                                        </h3>
                                        <p className="text-xs text-slate-500 mt-1">Recommended for higher security.</p>
                                    </div>
                                    <button 
                                        onClick={() => {
                                            if(currentCoach.twoFactorEnabled) {
                                                if(window.confirm('Disable 2FA?')) handleUpdateCoach({ twoFactorEnabled: false });
                                            } else {
                                                setIsSettingUp2FA(true);
                                            }
                                        }}
                                        className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none ${currentCoach.twoFactorEnabled ? 'bg-green-500' : 'bg-slate-200'}`}
                                    >
                                        <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform ${currentCoach.twoFactorEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                                    </button>
                                </div>

                                {isSettingUp2FA && (
                                    <div className="mt-4 bg-slate-50 p-6 rounded-2xl border border-slate-200 animate-fade-in">
                                        <p className="text-sm font-bold text-slate-800 mb-4">Scan with Authenticator App</p>
                                        <div className="flex flex-col sm:flex-row gap-6 items-center">
                                            <div className="h-32 w-32 bg-white border border-slate-200 rounded-xl flex items-center justify-center shadow-sm">
                                                 <div className="text-xs text-slate-300">QR CODE</div>
                                            </div>
                                            <div className="flex-grow space-y-3 w-full sm:w-auto">
                                                <input 
                                                    type="text" 
                                                    placeholder="Enter 6-digit code" 
                                                    className="w-full border border-slate-300 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-green-500"
                                                    value={twoFACode}
                                                    onChange={(e) => setTwoFACode(e.target.value)}
                                                    maxLength={6}
                                                />
                                                <div className="flex gap-3">
                                                    <button onClick={handleEnable2FA} className="bg-green-600 text-white px-6 py-3 rounded-xl text-sm font-bold flex-1 shadow-md hover:bg-green-700">Verify</button>
                                                    <button onClick={() => setIsSettingUp2FA(false)} className="bg-white border border-slate-200 text-slate-600 px-6 py-3 rounded-xl text-sm font-bold flex-1 hover:bg-slate-50">Cancel</button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};