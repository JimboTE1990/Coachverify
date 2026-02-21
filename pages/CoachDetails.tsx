import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { getCoachById, trackProfileView, trackContactClick, getCoaches, addReview, addCoachReply, deleteReview, updateReview, addReviewComment, getReviewComments, flagReviewAsSpam } from '../services/supabaseService';
import { storeReviewToken, getReviewToken, canManageReview, removeReviewToken } from '../utils/reviewTokens';
import { Coach, QuestionnaireAnswers, CURRENCIES } from '../types';
import { calculateMatchScore } from '../utils/matchCalculator';
import { useAuth } from '../hooks/useAuth';
import { AccreditationBadge } from '../components/AccreditationBadge';
import { majorCities } from '../data/cities';
import {
  ArrowLeft, Star, Mail, Instagram, MessageCircle, Linkedin,
  MapPin, CheckCircle, Share2, ChevronLeft, ChevronRight, Clock, X,
  Facebook, Globe, Youtube, Phone, Copy, Flag, Reply, Edit, Trash2, Send, AlertTriangle, ExternalLink,
  Calendar, Award
} from 'lucide-react';

export const CoachDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { coach: currentUserCoach } = useAuth();
  const [coach, setCoach] = useState<Coach | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [currentReviewIndex, setCurrentReviewIndex] = useState(0);
  const [showRecentlyViewed, setShowRecentlyViewed] = useState(false);
  const [recentlyViewedCoaches, setRecentlyViewedCoaches] = useState<Coach[]>([]);
  const [questionnaireData, setQuestionnaireData] = useState<QuestionnaireAnswers | null>(null);
  const [showContactOptions, setShowContactOptions] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [copiedContact, setCopiedContact] = useState<string | null>(null);
  const [reviewFormData, setReviewFormData] = useState({
    rating: 5,
    author: '',
    coachingPeriod: '',
    location: '',
    text: ''
  });
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [expandedReview, setExpandedReview] = useState(false);
  const reviewsSectionRef = React.useRef<HTMLDivElement>(null);

  // Coach reply functionality
  const [replyingToReview, setReplyingToReview] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [replySubmitting, setReplySubmitting] = useState(false);

  // User review management
  const [editingReview, setEditingReview] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState({
    rating: 5,
    text: '',
    author: '',
    coachingPeriod: '',
    location: ''
  });

  // Comment functionality
  const [commentingOnReview, setCommentingOnReview] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');
  const [commentSubmitting, setCommentSubmitting] = useState(false);
  const [reviewComments, setReviewComments] = useState<Record<string, any[]>>({});

  // Spam flag functionality
  const [flaggingReview, setFlaggingReview] = useState<string | null>(null);
  const [flagReason, setFlagReason] = useState('');
  const [flagSubmitting, setFlagSubmitting] = useState(false);

  // Share modal state
  const [showShareOptions, setShowShareOptions] = useState(false);

  // Scroll to reviews section
  const scrollToReviews = () => {
    reviewsSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // Check for questionnaire data from location state
  useEffect(() => {
    if (location.state && (location.state as any).questionnaireResults) {
      setQuestionnaireData((location.state as any).questionnaireResults);
      // Store in localStorage so it persists across navigation
      localStorage.setItem('questionnaireData', JSON.stringify((location.state as any).questionnaireResults));
    } else {
      // Try to load from localStorage
      const stored = localStorage.getItem('questionnaireData');
      if (stored) {
        try {
          setQuestionnaireData(JSON.parse(stored));
        } catch {
          setQuestionnaireData(null);
        }
      }
    }
  }, [location]);

  // Load recently viewed coaches
  useEffect(() => {
    const loadRecentlyViewed = async () => {
      const stored = localStorage.getItem('recentlyViewedCoaches');
      if (stored) {
        try {
          const coachIds: string[] = JSON.parse(stored);
          // Fetch full coach data for recently viewed
          const allCoaches = await getCoaches();
          const recentCoaches = coachIds
            .map(coachId => allCoaches.find(c => c.id === coachId))
            .filter((c): c is Coach => c !== undefined)
            .slice(0, 8); // Show last 8
          setRecentlyViewedCoaches(recentCoaches);
        } catch {
          setRecentlyViewedCoaches([]);
        }
      }
    };
    loadRecentlyViewed();
  }, [id]);

  useEffect(() => {
    if (id) {
      const loadCoach = async () => {
        setIsLoading(true);
        const found = await getCoachById(id);
        console.log('[Coach Data Debug] Loaded coach:', found);
        console.log('[Coach Data Debug] introVideoUrl:', found?.introVideoUrl);
        setCoach(found || undefined);
        setIsLoading(false);

        if (found) {
          await trackProfileView(id);

          // Add to recently viewed (max 8)
          const stored = localStorage.getItem('recentlyViewedCoaches');
          let recent: string[] = [];
          if (stored) {
            try {
              recent = JSON.parse(stored);
            } catch {
              recent = [];
            }
          }

          // Remove if already exists, then add to front
          recent = recent.filter(coachId => coachId !== id);
          recent.unshift(id);

          // Keep only last 8
          recent = recent.slice(0, 8);

          localStorage.setItem('recentlyViewedCoaches', JSON.stringify(recent));
        }
      };
      loadCoach();
    }
  }, [id]);

  // Load comments for all reviews when coach data is loaded
  useEffect(() => {
    const loadAllComments = async () => {
      if (coach?.reviews && coach.reviews.length > 0) {
        console.log('[CoachDetails] Loading comments for', coach.reviews.length, 'reviews');
        for (const review of coach.reviews) {
          console.log('[CoachDetails] Loading comments for review:', review.id);
          const comments = await getReviewComments(review.id);
          console.log('[CoachDetails] Got comments for review', review.id, ':', comments);
          if (comments && comments.length > 0) {
            setReviewComments(prev => ({ ...prev, [review.id]: comments }));
          }
        }
      }
    };
    loadAllComments();
  }, [coach?.id]); // Re-run when coach ID changes

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-bounce">🦴</div>
          <h2 className="text-xl font-bold text-slate-700">Fetching profile...</h2>
        </div>
      </div>
    );
  }

  // Not found state
  if (!coach) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="text-6xl mb-4">🐕</div>
          <h2 className="text-xl font-bold text-slate-700 mb-4">Coach not found</h2>
          <button
            onClick={() => navigate('/search')}
            className="text-brand-600 hover:underline font-bold"
          >
            Back to Search
          </button>
        </div>
      </div>
    );
  }

  const avgRating = coach.averageRating ||
    (coach.reviews?.length
      ? (coach.reviews.reduce((acc, r) => acc + r.rating, 0) / coach.reviews.length)
      : 0);

  const totalReviews = coach.totalReviews || coach.reviews?.length || 0;

  // Calculate dynamic match percentage from questionnaire data
  const matchPercentage = questionnaireData
    ? calculateMatchScore(coach, questionnaireData)
    : null;

  const handleShare = () => {
    // Try native share first (works on mobile)
    if (navigator.share) {
      navigator.share({
        title: `${coach.name} - CoachDog`,
        text: `Check out ${coach.name} on CoachDog`,
        url: window.location.href
      });
    } else {
      // Show custom share modal on desktop
      setShowShareOptions(true);
    }
  };

  const shareVia = (platform: string) => {
    const url = encodeURIComponent(window.location.href);
    const title = encodeURIComponent(`${coach.name} - CoachDog`);
    const text = encodeURIComponent(`Check out ${coach.name} on CoachDog`);

    const shareUrls: Record<string, string> = {
      whatsapp: `https://wa.me/?text=${text}%20${url}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
      twitter: `https://twitter.com/intent/tweet?url=${url}&text=${text}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${url}`,
      instagram: '', // Instagram doesn't support web sharing, will copy link
      email: `mailto:?subject=${title}&body=${text}%20${url}`,
      copy: ''
    };

    if (platform === 'copy' || platform === 'instagram') {
      navigator.clipboard.writeText(window.location.href);
      alert(`Link copied to clipboard!${platform === 'instagram' ? ' Open Instagram and paste in your story or bio.' : ''}`);
      setShowShareOptions(false);
    } else {
      window.open(shareUrls[platform], '_blank', 'width=600,height=400');
      setShowShareOptions(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedContact(label);
    setTimeout(() => setCopiedContact(null), 2000);
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setReviewError(null);

    // Prevent coaches from reviewing themselves
    if (currentUserCoach && coach && currentUserCoach.id === coach.id) {
      setReviewError('You cannot leave a review on your own profile. Reviews must be from genuine clients.');
      return;
    }

    // Validation
    if (!reviewFormData.author.trim()) {
      setReviewError('Please enter your name (e.g., "John S.")');
      return;
    }
    if (!reviewFormData.coachingPeriod.trim()) {
      setReviewError('Please select when you worked with this coach');
      return;
    }
    if (!reviewFormData.text.trim()) {
      setReviewError('Please enter your review');
      return;
    }

    setReviewSubmitting(true);

    try {
      // Save review to database
      const newReview = await addReview(
        coach.id,
        reviewFormData.author.trim(),
        reviewFormData.rating,
        reviewFormData.text.trim(),
        reviewFormData.coachingPeriod.trim(),
        reviewFormData.location.trim() || undefined
      );

      if (!newReview) {
        throw new Error('Failed to save review');
      }

      // Store the review token in localStorage for future editing/deleting
      const token = (newReview as any).token;
      if (token) {
        storeReviewToken(newReview.id, token);
        console.log('[CoachDetails] Stored review token for:', newReview.id);
      }

      // Update local coach state with the new review
      setCoach({
        ...coach,
        reviews: [...(coach.reviews || []), newReview]
      });

      // Reset form and close modal
      setReviewFormData({ rating: 5, author: '', coachingPeriod: '', location: '', text: '' });
      setShowReviewForm(false);

      // Show vibrant success message with custom styling
      const successDiv = document.createElement('div');
      successDiv.className = 'fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 animate-fade-in-up';
      successDiv.innerHTML = `
        <div class="bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-3xl shadow-2xl p-8 max-w-md">
          <div class="flex items-center justify-center mb-4">
            <svg class="h-16 w-16 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
          </div>
          <h3 class="text-2xl font-bold text-center mb-2">Review Submitted! 🎉</h3>
          <p class="text-center text-green-50">Thank you for sharing your experience! Your review helps others find great coaches.</p>
        </div>
      `;
      document.body.appendChild(successDiv);
      setTimeout(() => {
        successDiv.remove();
      }, 4000);

    } catch (error) {
      console.error('Error submitting review:', error);
      setReviewError('Failed to submit review. Please try again.');
    } finally {
      setReviewSubmitting(false);
    }
  };

  // Handle coach reply to review
  const handleReplySubmit = async (reviewId: string) => {
    if (!replyText.trim()) {
      alert('Please enter a reply message');
      return;
    }

    setReplySubmitting(true);
    try {
      const updatedReview = await addCoachReply(reviewId, replyText.trim());

      if (!updatedReview) {
        throw new Error('Failed to save reply');
      }

      // Update local coach state with the updated review
      setCoach({
        ...coach!,
        reviews: coach!.reviews!.map(r => r.id === reviewId ? updatedReview : r)
      });

      // Reset reply form
      setReplyingToReview(null);
      setReplyText('');

      // Show success message
      alert('Reply posted successfully!');
    } catch (error) {
      console.error('Error submitting reply:', error);
      alert('Failed to post reply. Please try again.');
    } finally {
      setReplySubmitting(false);
    }
  };

  // Handle user editing their review
  const startEditReview = (review: any) => {
    setEditingReview(review.id);
    setEditFormData({
      rating: review.rating,
      text: review.text,
      author: review.author,
      coachingPeriod: review.coachingPeriod || '',
      location: review.location || ''
    });
  };

  // Handle user deleting their review
  const handleDeleteReview = async (reviewId: string) => {
    // Get token from localStorage
    const token = getReviewToken(reviewId);

    if (!token) {
      alert('You cannot delete this review. Only the original author can delete their review on the device they used to submit it.');
      return;
    }

    if (!confirm('Are you sure you want to delete this review? This action cannot be undone.')) {
      return;
    }

    try {
      // Delete from database with token validation
      const success = await deleteReview(reviewId, token);

      if (!success) {
        throw new Error('Failed to delete review');
      }

      // Remove token from localStorage
      removeReviewToken(reviewId);

      // Update local state
      setCoach({
        ...coach!,
        reviews: coach!.reviews!.filter(r => r.id !== reviewId)
      });

      alert('Review deleted successfully!');
    } catch (error) {
      console.error('Error deleting review:', error);
      alert('Failed to delete review. Please try again.');
    }
  };

  // Handle coach adding a comment to a review
  const handleCommentSubmit = async (reviewId: string) => {
    if (!commentText.trim()) {
      alert('Please enter a comment');
      return;
    }

    if (!currentUserCoach) {
      alert('You must be logged in as a coach to comment');
      return;
    }

    setCommentSubmitting(true);
    try {
      const success = await addReviewComment(
        reviewId,
        currentUserCoach.id,
        currentUserCoach.name,
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

      alert('Comment posted successfully!');
    } catch (error) {
      console.error('Error submitting comment:', error);
      alert('Failed to post comment. Please try again.');
    } finally {
      setCommentSubmitting(false);
    }
  };

  // Handle coach flagging review as spam
  const handleFlagAsSpam = async (reviewId: string) => {
    if (!currentUserCoach) {
      alert('You must be logged in as a coach to flag reviews');
      return;
    }

    setFlagSubmitting(true);
    try {
      const result = await flagReviewAsSpam(
        reviewId,
        currentUserCoach.id,
        flagReason.trim() || undefined
      );

      if (!result.success) {
        throw new Error('Failed to flag review');
      }

      // Show validation result
      if (result.isLegitimateFlag) {
        alert(`✅ Review flagged as spam successfully!\n\nAI Validation: ${result.analysis}\nConfidence: ${result.confidence}%`);
      } else {
        alert(`⚠️ Review flagged, but AI validation suggests it may be legitimate.\n\n${result.analysis}\nConfidence: ${result.confidence}%\n\nThe review has still been marked as spam for admin review.`);
      }

      // Reload the coach data to get updated spam status
      if (id) {
        const updated = await getCoachById(id);
        setCoach(updated || undefined);
      }

      // Reset form
      setFlaggingReview(null);
      setFlagReason('');
    } catch (error) {
      console.error('Error flagging review:', error);
      alert('Failed to flag review. Please try again.');
    } finally {
      setFlagSubmitting(false);
    }
  };

  // Load comments for a review when needed
  const loadReviewComments = async (reviewId: string) => {
    if (reviewComments[reviewId]) return; // Already loaded
    const comments = await getReviewComments(reviewId);
    setReviewComments(prev => ({ ...prev, [reviewId]: comments }));
  };

  // Get contact info from socialLinks (detect type from URL format)
  const emailContacts = coach?.socialLinks?.filter(link => {
    const url = link.url?.toLowerCase() || '';
    const platform = link.platform?.toLowerCase() || '';
    return url.startsWith('mailto:') || url.includes('@') || platform.includes('email');
  }) || [];

  const phoneContacts = coach?.socialLinks?.filter(link => {
    const url = link.url?.toLowerCase() || '';
    const platform = link.platform?.toLowerCase() || '';
    return url.startsWith('tel:') || url.startsWith('+') || platform.includes('phone') || platform.includes('tel') || platform.includes('mobile');
  }) || [];

  // Find booking/appointment link for "Schedule a Call" button
  const bookingLink = coach?.socialLinks?.find(link => {
    const platform = link.platform?.toLowerCase() || '';
    const url = link.url?.toLowerCase() || '';
    return (
      platform.includes('booking') ||
      platform.includes('appointment') ||
      platform.includes('schedule') ||
      platform.includes('calendly') ||
      platform.includes('cal.com') ||
      url.includes('calendly.com') ||
      url.includes('cal.com')
    );
  });

  const nextReview = () => {
    if (coach.reviews && currentReviewIndex < coach.reviews.length - 1) {
      setCurrentReviewIndex(currentReviewIndex + 1);
    }
  };

  const prevReview = () => {
    if (currentReviewIndex > 0) {
      setCurrentReviewIndex(currentReviewIndex - 1);
    }
  };

  const currentReview = coach.reviews?.[currentReviewIndex];

  // Helper function to strip mailto: and tel: prefixes for display
  const stripProtocol = (url: string): string => {
    if (url.startsWith('mailto:')) {
      return url.replace('mailto:', '');
    } else if (url.startsWith('tel:')) {
      return url.replace('tel:', '');
    }
    return url;
  };

  // Helper function to convert video URLs to embed format
  const getEmbedUrl = (url: string): string | null => {
    if (!url) return null;

    // YouTube
    const youtubeMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&?\\/]+)/);
    if (youtubeMatch) return `https://www.youtube.com/embed/${youtubeMatch[1]}`;

    // Vimeo
    const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
    if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;

    // Already an embed URL
    if (url.includes('/embed/') || url.includes('player.vimeo.com')) return url;

    return null;
  };

  // Helper function to get the correct icon for each social platform
  const getSocialIcon = (platform: string) => {
    const lowerPlatform = platform.toLowerCase();

    if (lowerPlatform.includes('instagram')) {
      return <Instagram className="h-6 w-6 text-slate-700" />;
    } else if (lowerPlatform.includes('linkedin')) {
      return <Linkedin className="h-6 w-6 text-slate-700" />;
    } else if (lowerPlatform.includes('facebook')) {
      return <Facebook className="h-6 w-6 text-slate-700" />;
    } else if (lowerPlatform.includes('youtube')) {
      return <Youtube className="h-6 w-6 text-slate-700" />;
    } else if (lowerPlatform.includes('website') || lowerPlatform.includes('portfolio') || lowerPlatform.includes('web')) {
      return <Globe className="h-6 w-6 text-slate-700" />;
    } else if (lowerPlatform.includes('twitter') || lowerPlatform.includes('x.com')) {
      // X/Twitter icon (using MessageCircle as fallback since lucide doesn't have X icon)
      return (
        <svg className="h-6 w-6 text-slate-700" viewBox="0 0 24 24" fill="currentColor">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
        </svg>
      );
    } else if (lowerPlatform.includes('tiktok')) {
      // TikTok icon
      return (
        <svg className="h-6 w-6 text-slate-700" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
        </svg>
      );
    } else {
      // Default to globe icon for unknown platforms
      return <Globe className="h-6 w-6 text-slate-700" />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Simplified Header - NOT sticky */}
      <div className="bg-black text-white px-4 py-4 flex items-center justify-between shadow-lg">
        <button onClick={() => navigate(-1)} className="p-1 hover:bg-slate-800 rounded-lg transition-colors">
          <ArrowLeft className="h-6 w-6" />
        </button>
        <h1 className="text-xl font-bold">Coach Profile</h1>
        <div className="w-8"></div>
      </div>

      {/* Main Content - White Card */}
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden">

          {/* Banner Image - Full Width at Top (like LinkedIn/X) */}
          <div className="w-full h-40 sm:h-48 md:h-64 bg-gradient-to-br from-slate-100 to-slate-200 relative overflow-hidden">
            {coach.bannerImageUrl ? (
              <img
                src={coach.bannerImageUrl}
                alt={`${coach.name} - Profile Banner`}
                className="w-full h-full object-cover object-center"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-brand-600/20 to-indigo-600/20 flex items-center justify-center">
                <div className="opacity-20 flex flex-col items-center gap-2">
                  <svg viewBox="0 0 24 24" className="w-16 h-16 sm:w-20 sm:h-20 text-brand-600" fill="currentColor">
                    <path d="M15.75 6 a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                  </svg>
                  <span className="text-xl sm:text-2xl font-black text-brand-700 tracking-wide">CoachDog</span>
                </div>
              </div>
            )}
          </div>

          {/* Top Section: Recently Viewed (Left), Match & Photo (Center), Share (Right) */}
          <div className="px-6 pt-8 pb-6">
            <div className="flex items-start justify-between mb-6">
              {/* Recently Viewed Button - TOP LEFT */}
              {recentlyViewedCoaches.length > 0 ? (
                <button
                  onClick={() => setShowRecentlyViewed(true)}
                  className="flex flex-col items-center group"
                >
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-100 to-purple-200 flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all">
                    <Clock className="h-7 w-7 text-purple-600" />
                  </div>
                  <span className="text-xs font-bold text-slate-600 mt-2">
                    {recentlyViewedCoaches.length} recent
                  </span>
                </button>
              ) : (
                <div className="w-20"></div> /* Spacer if no recently viewed */
              )}

              {/* Center: Match Percentage + Profile Photo */}
              <div className="flex flex-col items-center">
                {/* Match Percentage Circle - ONLY if questionnaire data exists */}
                {matchPercentage !== null && (
                  <div className="flex flex-col items-center mb-4">
                    <div className="relative w-20 h-20">
                      <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 100 100">
                        <circle
                          cx="50"
                          cy="50"
                          r="42"
                          fill="none"
                          stroke="#e0f2fe"
                          strokeWidth="8"
                        />
                        <circle
                          cx="50"
                          cy="50"
                          r="42"
                          fill="none"
                          stroke="#06b6d4"
                          strokeWidth="8"
                          strokeDasharray={`${matchPercentage * 2.64} 264`}
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-2xl font-black text-slate-900">{matchPercentage}%</span>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-slate-600 mt-2">Match</span>
                  </div>
                )}

                {/* Profile Photo */}
                <div className="relative">
                  <div className="w-36 h-36 rounded-3xl overflow-hidden border-4 border-white shadow-2xl ring-4 ring-slate-100">
                    {coach.photoUrl ? (
                      <img
                        src={coach.photoUrl}
                        alt={coach.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-slate-100 to-slate-200 flex flex-col items-center justify-center gap-1">
                        <svg viewBox="0 0 24 24" className="w-14 h-14 text-slate-400" fill="currentColor">
                          <path d="M4.5 6.375a4.125 4.125 0 1 1 8.25 0 4.125 4.125 0 0 1-8.25 0ZM14.25 8.625a3.375 3.375 0 1 1 6.75 0 3.375 3.375 0 0 1-6.75 0ZM1.5 19.125a7.125 7.125 0 0 1 14.25 0v.003l-.001.119a.75.75 0 0 1-.363.63 13.067 13.067 0 0 1-6.761 1.873c-2.472 0-4.786-.684-6.76-1.873a.75.75 0 0 1-.364-.63l-.001-.122ZM17.25 19.128l-.001.144a2.25 2.25 0 0 1-.233.96 10.088 10.088 0 0 0 5.06-1.01.75.75 0 0 0 .42-.643 4.875 4.875 0 0 0-6.957-4.611 8.586 8.586 0 0 1 1.71 5.157v.003Z" />
                        </svg>
                        <span className="text-xs font-semibold text-slate-400">No photo</span>
                      </div>
                    )}
                  </div>
                  {coach.isVerified && (
                    <div className="absolute -bottom-2 -right-2 bg-blue-600 text-white p-2 rounded-full shadow-lg ring-4 ring-white">
                      <CheckCircle className="h-6 w-6" />
                    </div>
                  )}
                  {/* Top Dog badge — shown when all 5 setup steps are complete */}
                  {(() => {
                    const hasPhoto = !!(coach.photoUrl && !coach.photoUrl.includes('placeholder'));
                    const hasProfile = !!(coach.bio && coach.bio.trim().length > 20 && coach.mainCoachingCategories && coach.mainCoachingCategories.length > 0);
                    const hasScheduling = !!(coach.socialLinks?.some(l => {
                      const lbl = (l.platform || '').toLowerCase();
                      return lbl.includes('booking') || lbl.includes('schedule') || lbl.includes('calendly') || lbl.includes('cal.com');
                    }));
                    const hasReviews = totalReviews >= 1;
                    const hasSocial = !!(coach.socialLinks?.some(l => {
                      const lbl = (l.platform || '').toLowerCase();
                      return lbl.includes('linkedin') || lbl.includes('twitter') || lbl.includes('instagram') || lbl.includes('facebook') || lbl.includes('website') || lbl.includes('x.com');
                    }));
                    if (hasPhoto && hasProfile && hasScheduling && hasReviews && hasSocial) {
                      return (
                        <div
                          className="absolute -top-2 -left-2 bg-gradient-to-br from-amber-400 to-yellow-500 text-white p-1.5 rounded-full shadow-lg ring-4 ring-white"
                          title="Top Dog — Profile fully set up"
                        >
                          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        </div>
                      );
                    }
                    return null;
                  })()}
                </div>
              </div>

              {/* Share Button - TOP RIGHT */}
              <button
                onClick={handleShare}
                className="flex flex-col items-center group"
              >
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-cyan-100 to-brand-200 flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all">
                  <Share2 className="h-7 w-7 text-brand-600" />
                </div>
                <span className="text-xs font-bold text-slate-600 mt-2 text-center leading-tight">
                  Tell the<br />Pack<br />(share)
                </span>
              </button>
            </div>

            {/* Name */}
            <div className="text-center mb-4">
              <h2 className="text-4xl font-black text-slate-900 mb-4 tracking-tight">{coach.name}</h2>

              {/* Star Rating - Directly below name */}
              <button
                onClick={scrollToReviews}
                className="flex items-center justify-center gap-2 mb-4 hover:opacity-80 transition-opacity cursor-pointer mx-auto"
                aria-label="View reviews"
              >
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-7 w-7 ${star <= Math.floor(avgRating) ? 'fill-yellow-400 text-yellow-400' : 'fill-slate-200 text-slate-200'}`}
                    />
                  ))}
                </div>
                <span className="text-lg font-bold text-slate-700 hover:text-cyan-600 transition-colors">
                  {avgRating.toFixed(1)} ({totalReviews} {totalReviews === 1 ? 'review' : 'reviews'})
                </span>
              </button>

              {/* Social Links - Directly below star rating */}
              <div className="flex flex-wrap items-center justify-center gap-3 mb-6">
                {/* Contact Button */}
                {(emailContacts.length > 0 || phoneContacts.length > 0) && (
                  <div className="relative group">
                    {emailContacts.length === 1 && phoneContacts.length === 0 ? (
                      // Single email - direct mailto link
                      <a
                        href={emailContacts[0].url.startsWith('mailto:') ? emailContacts[0].url : `mailto:${emailContacts[0].url}`}
                        onClick={() => coach?.id && trackContactClick(coach.id, 'email')}
                        className="w-14 h-14 rounded-2xl border-2 border-slate-300 flex items-center justify-center hover:bg-slate-50 hover:border-brand-500 transition-all shadow-sm"
                      >
                        <Mail className="h-6 w-6 text-slate-700" />
                      </a>
                    ) : (
                      // Multiple contacts - show dropdown
                      <button
                        onClick={() => setShowContactOptions(true)}
                        className="w-14 h-14 rounded-2xl border-2 border-slate-300 flex items-center justify-center hover:bg-slate-50 hover:border-brand-500 transition-all shadow-sm"
                      >
                        <Mail className="h-6 w-6 text-slate-700" />
                      </button>
                    )}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                      <div className="bg-white border border-slate-200 rounded-xl shadow-lg px-3 py-2 text-center whitespace-nowrap">
                        <p className="text-xs font-bold text-slate-900">Contact</p>
                        <p className="text-xs text-slate-500">{emailContacts.length === 1 && phoneContacts.length === 0 ? stripProtocol(emailContacts[0].url) : 'Email or message'}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* WhatsApp Button - Direct link (for UK coaches with numbers) */}
                {phoneContacts.length > 0 && phoneContacts[0].url && (
                  <div className="relative group">
                    <a
                      href={`https://wa.me/${phoneContacts[0].url.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => coach?.id && trackContactClick(coach.id, 'whatsapp')}
                      className="w-14 h-14 rounded-2xl border-2 border-slate-300 flex items-center justify-center hover:bg-slate-50 hover:border-brand-500 transition-all shadow-sm"
                    >
                      <MessageCircle className="h-6 w-6 text-slate-700" />
                    </a>
                    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                      <div className="bg-white border border-slate-200 rounded-xl shadow-lg px-3 py-2 text-center whitespace-nowrap">
                        <p className="text-xs font-bold text-slate-900">WhatsApp</p>
                        <p className="text-xs text-slate-500">{phoneContacts[0].url}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Dynamically render social links (filter out email, phone, booking) */}
                {coach.socialLinks?.filter(link => {
                  const url = link.url?.toLowerCase() || '';
                  const platform = link.platform?.toLowerCase() || '';
                  // Filter out email, phone, and booking links
                  const isEmail = url.startsWith('mailto:') || url.includes('@') || platform.includes('email');
                  const isPhone = url.startsWith('tel:') || url.startsWith('+') || platform.includes('phone') || platform.includes('tel') || platform.includes('mobile');
                  const isBooking = platform.includes('booking') || platform.includes('appointment') || platform.includes('schedule') || platform.includes('calendly') || platform.includes('cal.com') || url.includes('calendly.com') || url.includes('cal.com');
                  return !isEmail && !isPhone && !isBooking;
                }).map((socialLink) => {
                  // Determine click type from platform
                  const getPlatformType = (platform: string): 'linkedin' | 'instagram' | 'facebook' | 'youtube' | 'twitter' | 'website' => {
                    const lowerPlatform = platform.toLowerCase();
                    if (lowerPlatform.includes('linkedin')) return 'linkedin';
                    if (lowerPlatform.includes('instagram')) return 'instagram';
                    if (lowerPlatform.includes('facebook')) return 'facebook';
                    if (lowerPlatform.includes('youtube')) return 'youtube';
                    if (lowerPlatform.includes('twitter') || lowerPlatform.includes('x.com')) return 'twitter';
                    return 'website';
                  };

                  return (
                  <div key={socialLink.id || socialLink.platform} className="relative group">
                    <a
                      href={socialLink.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => trackContactClick(id!, getPlatformType(socialLink.platform))}
                      className="w-14 h-14 rounded-2xl border-2 border-slate-300 flex items-center justify-center hover:bg-slate-50 hover:border-brand-500 transition-all shadow-sm"
                    >
                      {getSocialIcon(socialLink.platform)}
                    </a>
                    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                      <div className="bg-white border border-slate-200 rounded-xl shadow-lg px-3 py-2 text-center whitespace-nowrap">
                        <p className="text-xs font-bold text-slate-900">{socialLink.platform}</p>
                        <p className="text-xs text-slate-500">{(socialLink.url || '').replace(/^https?:\/\/(www\.)?/, '')}</p>
                      </div>
                    </div>
                  </div>
                );
                })}
              </div>
            </div>


            {/* Location */}
            <div className="flex items-center justify-center gap-2 mb-4">
              <MapPin className="h-5 w-5 text-slate-600" />
              <span className="text-lg font-bold text-slate-900">
                {[coach.locationCity || coach.location, coach.country || 'United Kingdom'].filter(Boolean).join(', ')}
              </span>
            </div>

            {/* Price Badge */}
            <div className="flex justify-center mb-4">
              <div className="bg-gradient-to-r from-cyan-500 to-cyan-600 text-white px-8 py-3 rounded-full shadow-lg">
                <span className="text-2xl font-black">
                  {CURRENCIES.find(c => c.code === (coach.currency || 'GBP'))?.symbol || '£'}{coach.hourlyRate}
                </span>
                <span className="text-sm font-semibold ml-1">per hour</span>
              </div>
            </div>

            {/* Schedule Call / Contact Button */}
            {(() => {
              // Look for booking/calendar link first
              const bookingLink = coach.socialLinks?.find(link => {
                const url = link.url?.toLowerCase() || '';
                const platform = link.platform?.toLowerCase() || '';
                return platform.includes('booking') || platform.includes('appointment') ||
                       platform.includes('schedule') || platform.includes('calendly') ||
                       platform.includes('cal.com') || url.includes('calendly.com') ||
                       url.includes('cal.com');
              });

              // Get primary email for contact button
              const emailContacts = coach.socialLinks?.filter(link => link.type === 'email') || [];
              const primaryEmail = emailContacts[0]?.url;

              return (
                <div className="space-y-3 mb-6">
                  {/* Schedule Call Button - if booking link exists */}
                  {bookingLink && (
                    <div className="flex justify-center">
                      <a
                        href={bookingLink.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => coach?.id && trackContactClick(coach.id, 'booking')}
                        className="inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-brand-600 to-brand-700 text-white font-bold rounded-full shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all"
                      >
                        <Calendar className="h-5 w-5" />
                        Schedule Call
                      </a>
                    </div>
                  )}

                  {/* Contact Coach Button - always show if email available */}
                  {primaryEmail && (
                    <div className="flex justify-center">
                      <a
                        href={primaryEmail.startsWith('mailto:') ? primaryEmail : `mailto:${primaryEmail}`}
                        onClick={() => coach?.id && trackContactClick(coach.id, 'email')}
                        className="inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white font-bold rounded-full shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all"
                      >
                        <Mail className="h-5 w-5" />
                        Contact Coach
                      </a>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Intro Video Embed - RIGHT AFTER BUTTONS */}
            {(() => {
              if (!coach?.introVideoUrl) return null;

              const embedUrl = getEmbedUrl(coach.introVideoUrl);
              if (!embedUrl) return null;

              return (
                <div className="mb-6 px-4">
                  <h3 className="text-lg font-bold text-slate-900 mb-3 text-center">Introduction Video</h3>
                  <div className="relative w-full rounded-2xl overflow-hidden shadow-xl border-2 border-slate-200" style={{ paddingBottom: '56.25%' }}>
                    <iframe
                      src={embedUrl}
                      className="absolute top-0 left-0 w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                      title="Coach Introduction Video"
                      frameBorder="0"
                    />
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Divider */}
          <div className="h-2 bg-slate-50"></div>

          {/* Details Section */}
          <div className="px-6 py-6 space-y-6">

            {/* Accreditation Badge - Compact with Border */}
            {((coach.accreditationBody === 'EMCC' && coach.emccVerified) ||
              (coach.accreditationBody === 'ICF' && coach.icfVerified) ||
              (coach.accreditationBody === 'AC')) && (
              <div className={`flex items-center gap-6 p-5 rounded-2xl border-2 shadow-md mb-6 ${
                coach.accreditationBody === 'EMCC'
                  ? 'bg-gradient-to-br from-[#2B4170]/5 to-[#C9A961]/10 border-[#2B4170]/30'
                  : coach.accreditationBody === 'ICF'
                  ? 'bg-gradient-to-br from-[#2E5C8A]/5 to-[#4A90E2]/10 border-[#2E5C8A]/30'
                  : 'bg-gradient-to-br from-slate-100 to-slate-50 border-slate-300'
              }`}>
                {/* Badge on the left */}
                <div className="flex-shrink-0">
                  {coach.accreditationLevel && (
                    <AccreditationBadge
                      body={coach.accreditationBody}
                      level={coach.accreditationLevel || coach.icfAccreditationLevel || ''}
                      size="large"
                      className="!h-32 !w-32"
                    />
                  )}
                </div>

                {/* Accreditation info - vertical stack like original */}
                <div className="flex-grow">
                  {/* Header with body name and checkmark */}
                  <div className="flex items-center justify-center gap-2 mb-3">
                    <span className={`text-xl font-black tracking-wide ${
                      coach.accreditationBody === 'EMCC' ? 'text-[#2B4170]' :
                      coach.accreditationBody === 'ICF' ? 'text-[#2E5C8A]' : 'text-slate-900'
                    }`}>{coach.accreditationBody}</span>
                    <span className={`text-sm font-bold ${
                      coach.accreditationBody === 'EMCC' ? 'text-[#2B4170]' :
                      coach.accreditationBody === 'ICF' ? 'text-[#2E5C8A]' : 'text-slate-600'
                    }`}>Verified Accreditation</span>
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  </div>

                  {/* Level */}
                  {coach.accreditationLevel && (
                    <p className={`text-center text-base font-bold mb-3 ${
                      coach.accreditationBody === 'EMCC' ? 'text-[#2B4170]' :
                      coach.accreditationBody === 'ICF' ? 'text-[#2E5C8A]' : 'text-slate-700'
                    }`}>{coach.accreditationLevel || coach.icfAccreditationLevel}</p>
                  )}

                  {/* ICF subtitle */}
                  {coach.accreditationBody === 'ICF' && (
                    <p className="text-center text-xs text-slate-600 mb-3">International Coaching Federation</p>
                  )}

                  {/* Separator line + Verify link */}
                  {coach.emccProfileUrl && coach.accreditationBody === 'EMCC' && (() => {
                    let cleanUrl = coach.emccProfileUrl;
                    const refMatch = cleanUrl.match(/reference=([^&]+)/);
                    if (refMatch && refMatch[1]) {
                      cleanUrl = `https://www.emccglobal.org/accreditation/eia/eia-awards/?reference=${refMatch[1]}&search=1`;
                    }
                    return (
                      <a
                        href={cleanUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 text-sm text-[#2B4170] hover:text-[#C9A961] font-semibold transition-colors border-t-2 border-[#2B4170]/20 pt-3"
                      >
                        <ExternalLink className="h-4 w-4" />
                        Check out my EMCC accreditation here
                      </a>
                    );
                  })()}
                  {coach.icfProfileUrl && coach.accreditationBody === 'ICF' && (
                    <a
                      href={coach.icfProfileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 text-sm text-[#2E5C8A] hover:text-brand-600 font-semibold transition-colors border-t-2 border-[#2E5C8A]/20 pt-3"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Check out my ICF accreditation here
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Bio - MOVED TO TOP */}
            {coach.bio && (
              <div className="bg-slate-50 px-5 py-5 rounded-2xl">
                <h3 className="text-sm font-bold text-slate-600 mb-3 uppercase tracking-wide">Coach Bio:</h3>
                <p className="text-slate-900 leading-relaxed font-medium text-base whitespace-pre-line">{coach.bio}</p>
              </div>
            )}

            {/* Languages - MOVED BELOW BIO */}
            {coach.languages && coach.languages.length > 0 && (
              <div>
                <h3 className="text-sm font-bold text-slate-600 mb-3 uppercase tracking-wide">Languages:</h3>
                <div className="flex flex-wrap gap-2">
                  {coach.languages.map((lang, idx) => (
                    <span
                      key={idx}
                      className="bg-slate-900 text-white px-5 py-2.5 rounded-full text-sm font-bold shadow-md"
                    >
                      {lang}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Additional Certifications */}
            {coach.additionalCertifications && coach.additionalCertifications.length > 0 && (
              <div className="space-y-3">
                {coach.additionalCertifications.map((cert, idx) => (
                  <div key={idx} className="flex items-center gap-3 bg-green-50 px-4 py-3 rounded-2xl border border-green-200">
                    <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0" />
                    <span className="font-bold text-green-900">{cert}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Coaching Expertise */}
            {coach.specialties && coach.specialties.length > 0 && (
              <div>
                <h3 className="text-sm font-bold text-slate-600 mb-3 uppercase tracking-wide">Coaching Expertise:</h3>
                <div className="flex flex-wrap gap-2">
                  {coach.specialties.map((specialty, idx) => (
                    <span
                      key={idx}
                      className="bg-slate-900 text-white px-5 py-2.5 rounded-full text-sm font-bold shadow-md hover:shadow-lg transition-shadow"
                    >
                      {specialty}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Coaching Hours */}
            {coach.coachingHours && (
              <div className="bg-cyan-50 px-4 py-3 rounded-2xl border border-cyan-200">
                <p className="text-cyan-900 font-black text-lg">{coach.coachingHours}+ hours of coaching</p>
              </div>
            )}

            {/* Qualifications */}
            {coach.qualifications && coach.qualifications.length > 0 && (
              <div>
                <h3 className="text-sm font-bold text-slate-600 mb-3 uppercase tracking-wide">Qualifications:</h3>
                <div className="space-y-3">
                  {coach.qualifications.map((qual, idx) => {
                    // Handle both object format {degree, institution, year} and string format (legacy)
                    if (typeof qual === 'string') {
                      return <p key={idx} className="text-slate-900 font-bold text-base">{qual}</p>;
                    }
                    // Object format with degree, institution, year
                    return (
                      <div key={idx} className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                        <p className="text-slate-900 font-bold text-base">{qual.degree}</p>
                        {qual.institution && <p className="text-slate-600 text-sm mt-1">{qual.institution}</p>}
                        {qual.year && <p className="text-slate-500 text-xs mt-1">{qual.year}</p>}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Additional Certifications */}
            {coach.cpdQualifications && coach.cpdQualifications.length > 0 && (
              <div>
                <h3 className="text-sm font-bold text-slate-600 mb-3 uppercase tracking-wide">Additional Certifications:</h3>
                <div className="flex flex-wrap gap-2">
                  {coach.cpdQualifications.map((qual, idx) => (
                    <span
                      key={idx}
                      className="bg-purple-100 text-purple-900 px-4 py-2 rounded-full text-sm font-bold border border-purple-300"
                    >
                      {qual}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Coaching Expertise */}
            {coach.coachingExpertise && coach.coachingExpertise.length > 0 && (
              <div>
                <h3 className="text-sm font-bold text-slate-600 mb-3 uppercase tracking-wide">Coaching Expertise:</h3>
                <div className="flex flex-wrap gap-2">
                  {coach.coachingExpertise.map((expertise, idx) => (
                    <span
                      key={idx}
                      className="bg-blue-100 text-blue-900 px-4 py-2 rounded-full text-sm font-bold border border-blue-300"
                    >
                      {expertise}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Coaching Languages */}
            {coach.coachingLanguages && coach.coachingLanguages.length > 0 && (
              <div>
                <h3 className="text-sm font-bold text-slate-600 mb-3 uppercase tracking-wide">Coaching Languages:</h3>
                <div className="flex flex-wrap gap-2">
                  {coach.coachingLanguages.map((lang, idx) => (
                    <span
                      key={idx}
                      className="bg-green-100 text-green-900 px-4 py-2 rounded-full text-sm font-bold border border-green-300"
                    >
                      {lang}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Gender */}
            {coach.gender && (
              <div>
                <h3 className="text-sm font-bold text-slate-600 mb-3 uppercase tracking-wide">Gender:</h3>
                <p className="text-slate-900 font-bold text-base">{coach.gender}</p>
              </div>
            )}

            {/* Method of Coaching */}
            {coach.formats && coach.formats.length > 0 && (
              <div>
                <h3 className="text-sm font-bold text-slate-600 mb-3 uppercase tracking-wide">Method of Coaching:</h3>
                <div className="flex flex-wrap gap-2 mb-3">
                  {coach.formats.map((format, idx) => (
                    <span
                      key={idx}
                      className="bg-slate-900 text-white px-5 py-2.5 rounded-full text-sm font-bold shadow-md"
                    >
                      {format}
                    </span>
                  ))}
                </div>
                {coach.location && (
                  <p className="text-slate-900 font-bold text-sm">
                    within 5 miles of {coach.location}
                  </p>
                )}
              </div>
            )}

            {/* Acknowledgements */}
            {coach.acknowledgements && coach.acknowledgements.length > 0 && (
              <div>
                <h3 className="text-sm font-bold text-slate-600 mb-4 uppercase tracking-wide">Acknowledgements:</h3>
                <div className="space-y-3">
                  {coach.acknowledgements.map((ack: any) => {
                    const iconMap: { [key: string]: string } = {
                      'trophy': '🏆',
                      'star': '⭐',
                      'medal': '🏅',
                      'award': '🎖️',
                      'certificate': '📜',
                      'crown': '👑',
                      'ribbon': '🎗️'
                    };
                    const icon = ack.icon ? (iconMap[ack.icon] || '🏆') : '🏆';
                    return (
                      <div key={ack.id} className="flex items-start gap-3 bg-cyan-50 px-4 py-3 rounded-2xl">
                        <div className="text-3xl flex-shrink-0">{icon}</div>
                        <div className="flex-1">
                          <p className="font-bold text-slate-900 text-base">{ack.title}</p>
                          {ack.year && (
                            <p className="text-sm text-slate-600 mt-1">{ack.year}</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="h-2 bg-slate-50"></div>

          {/* Reviews Section */}
          {coach.reviews && coach.reviews.length > 0 && currentReview && (
            <div ref={reviewsSectionRef} className="px-6 py-8">
              <div className="bg-gradient-to-br from-cyan-100 via-cyan-50 to-blue-50 rounded-3xl p-8 relative shadow-lg border border-cyan-200">
                {/* Stars at Top */}
                <div className="flex justify-center gap-1 mb-5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-8 w-8 ${star <= currentReview.rating ? 'fill-yellow-400 text-yellow-400' : 'fill-slate-300 text-slate-300'}`}
                    />
                  ))}
                </div>

                {/* Review Text - Clickable to expand */}
                <div
                  onClick={() => setExpandedReview(!expandedReview)}
                  className="cursor-pointer hover:bg-white/30 rounded-xl p-4 transition-colors"
                >
                  <p className={`text-slate-900 text-center text-lg font-medium leading-relaxed mb-6 ${expandedReview ? '' : 'line-clamp-3'}`}>
                    {currentReview.text || `${coach.name} is an excellent coach.`}
                  </p>
                  {currentReview.text && currentReview.text.length > 150 && (
                    <p className="text-center text-sm text-cyan-600 font-bold">
                      {expandedReview ? 'Show less' : 'Read more'}
                    </p>
                  )}
                </div>

                {/* Reviewer Info */}
                <div className="text-center">
                  <div className="flex flex-col items-center gap-2">
                    <span className="font-black text-slate-900 text-lg">
                      {currentReview.author || 'Jamie'}
                    </span>
                    {currentReview.isSpam && currentReview.spamScore && currentReview.spamScore >= 50 && (
                      <div className={`flex items-center gap-1 text-xs px-3 py-1 rounded-full font-bold ${
                        currentReview.spamScore >= 70
                          ? 'bg-red-100 text-red-700'
                          : currentReview.spamScore >= 50
                          ? 'bg-orange-100 text-orange-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        <AlertTriangle className="h-3 w-3" />
                        Flagged as spam ({currentReview.spamScore}% confidence)
                        {currentReview.spamCategory && ` - ${currentReview.spamCategory}`}
                      </div>
                    )}
                  </div>
                  {currentReview.location && (
                    <p className="text-sm text-slate-500 mt-1">{currentReview.location}</p>
                  )}
                </div>

                {/* Coach Reply */}
                {currentReview.coachReply && (
                  <div className="mt-6 pt-6 border-t-2 border-cyan-200">
                    <div className="bg-white/70 rounded-2xl p-4 shadow-sm">
                      <div className="flex items-start gap-3 mb-2">
                        <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center flex-shrink-0">
                          <span className="text-brand-600 font-bold text-sm">
                            {coach.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                          </span>
                        </div>
                        <div className="flex-1">
                          <p className="font-bold text-sm text-slate-900 mb-1">Response from {coach.name}</p>
                          <p className="text-slate-700 text-sm leading-relaxed">{currentReview.coachReply}</p>
                          {currentReview.coachReplyDate && (
                            <p className="text-xs text-slate-500 mt-2">Replied on {currentReview.coachReplyDate}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Coach Actions - Comment and Flag Spam (Only for coach viewing their own profile) */}
                {currentUserCoach && coach && currentUserCoach.id === coach.id && (
                  <div className="mt-6 pt-6 border-t-2 border-cyan-200">
                    {/* Comment Form */}
                    {commentingOnReview === currentReview.id ? (
                      <div className="bg-white/70 rounded-xl p-4 mb-4">
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
                            onClick={() => handleCommentSubmit(currentReview.id)}
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
                    ) : null}

                    {/* Display Comments */}
                    {reviewComments[currentReview.id] && reviewComments[currentReview.id].length > 0 && (
                      <div className="mt-4 space-y-3">
                        <p className="text-sm font-bold text-slate-600">Comments:</p>
                        {reviewComments[currentReview.id].map((comment: any) => (
                          <div key={comment.id} className="bg-white/50 rounded-lg p-3 border border-slate-200">
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
                )}

                {/* Navigation Arrows */}
                {coach.reviews.length > 1 && (
                  <>
                    <button
                      onClick={prevReview}
                      disabled={currentReviewIndex === 0}
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-12 h-12 bg-black text-white rounded-full flex items-center justify-center disabled:opacity-20 hover:bg-slate-800 transition-all shadow-lg"
                    >
                      <ChevronLeft className="h-7 w-7" />
                    </button>
                    <button
                      onClick={nextReview}
                      disabled={currentReviewIndex === coach.reviews.length - 1}
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-12 h-12 bg-black text-white rounded-full flex items-center justify-center disabled:opacity-20 hover:bg-slate-800 transition-all shadow-lg"
                    >
                      <ChevronRight className="h-7 w-7" />
                    </button>
                  </>
                )}
              </div>

              {/* View All Reviews Button */}
              {coach.reviews.length > 1 && (
                <div className="mt-4 text-center">
                  <button
                    onClick={() => setShowAllReviews(true)}
                    className="text-cyan-600 hover:text-cyan-700 font-bold text-sm underline"
                  >
                    View All {coach.reviews.length} Reviews
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="px-6 pb-8 space-y-4">
            {/* Schedule a Call / Contact Coach Button */}
            <div className="relative">
              {bookingLink ? (
                // If booking link exists, show "Schedule a Call" button with direct link
                <a
                  href={bookingLink.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-gradient-to-r from-cyan-500 to-cyan-600 text-black font-black py-5 rounded-2xl text-xl shadow-xl hover:shadow-2xl hover:from-cyan-600 hover:to-cyan-700 transition-all transform hover:-translate-y-0.5 flex items-center justify-center"
                >
                  Schedule a Call
                </a>
              ) : (
                // If no booking link, show "Contact Coach" button with dropdown
                <button
                  onClick={() => setShowContactOptions(!showContactOptions)}
                  className="w-full bg-gradient-to-r from-cyan-500 to-cyan-600 text-black font-black py-5 rounded-2xl text-xl shadow-xl hover:shadow-2xl hover:from-cyan-600 hover:to-cyan-700 transition-all transform hover:-translate-y-0.5"
                >
                  Schedule a Call
                </button>
              )}

              {/* Contact Options Dropdown - Only show if no booking link */}
              {!bookingLink && showContactOptions && (emailContacts.length > 0 || phoneContacts.length > 0) && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl border-2 border-cyan-500 shadow-2xl z-50 animate-fade-in max-h-96 overflow-y-auto">
                  {/* Email Options */}
                  {emailContacts.length > 0 && (
                    <div className="border-b border-slate-200">
                      <div className="px-4 py-2 bg-slate-50 font-bold text-xs text-slate-600 uppercase tracking-wide">
                        Email
                      </div>
                      {emailContacts.map((contact, idx) => (
                        <a
                          key={idx}
                          href={contact.url.startsWith('mailto:') ? contact.url : `mailto:${contact.url}`}
                          onClick={() => coach?.id && trackContactClick(coach.id, 'email')}
                          className="w-full px-4 py-3 text-left hover:bg-cyan-50 transition-colors flex items-center justify-between group block"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-slate-900">{contact.platform}</p>
                            <p className="text-sm text-slate-600 break-all">{stripProtocol(contact.url)}</p>
                          </div>
                          <Mail className="h-5 w-5 flex-shrink-0 ml-3 text-slate-400 group-hover:text-cyan-600" />
                        </a>
                      ))}
                    </div>
                  )}

                  {/* Phone Options */}
                  {phoneContacts.length > 0 && (
                    <div>
                      <div className="px-4 py-2 bg-slate-50 font-bold text-xs text-slate-600 uppercase tracking-wide">
                        Telephone
                      </div>
                      {phoneContacts.map((contact, idx) => (
                        <a
                          key={idx}
                          href={contact.url.startsWith('tel:') ? contact.url : `tel:${contact.url}`}
                          onClick={() => coach?.id && trackContactClick(coach.id, 'phone')}
                          className="w-full px-4 py-3 text-left hover:bg-cyan-50 transition-colors flex items-center justify-between group block"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-slate-900">{contact.platform}</p>
                            <p className="text-sm text-slate-600 break-all">{stripProtocol(contact.url)}</p>
                          </div>
                          <Phone className="h-5 w-5 flex-shrink-0 ml-3 text-slate-400 group-hover:text-cyan-600" />
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* No Contact Info Available - Only show if no booking link */}
              {!bookingLink && showContactOptions && emailContacts.length === 0 && phoneContacts.length === 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl border-2 border-slate-300 shadow-2xl z-50 p-6 text-center animate-fade-in">
                  <p className="text-slate-600">No contact information available yet.</p>
                </div>
              )}
            </div>

            {/* Leave a Review Button - Hide if viewing own profile */}
            {!(currentUserCoach && coach && currentUserCoach.id === coach.id) && (
              <button
                onClick={() => setShowReviewForm(true)}
                className="w-full bg-slate-900 text-white font-black py-5 rounded-2xl text-xl shadow-xl hover:shadow-2xl hover:bg-slate-800 transition-all transform hover:-translate-y-0.5"
              >
                Leave a Review
              </button>
            )}
          </div>

          {/* Share Button */}
          <div className="px-6 pb-6 flex justify-end">
            <button
              onClick={handleShare}
              className="flex items-center gap-2 text-slate-700 font-bold hover:text-slate-900 transition-colors group"
            >
              <Share2 className="h-5 w-5 group-hover:scale-110 transition-transform" />
              <span className="text-lg">Tell the Pack (share)</span>
            </button>
          </div>
        </div>

        {/* Bottom Spacing */}
        <div className="h-8"></div>
      </div>

      {/* Recently Viewed Modal - Like Amazon/eBay */}
      {showRecentlyViewed && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl max-w-2xl w-full max-h-[80vh] overflow-hidden shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <h3 className="text-2xl font-black text-slate-900">Recently Viewed</h3>
              <button
                onClick={() => setShowRecentlyViewed(false)}
                className="p-2 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X className="h-6 w-6 text-slate-600" />
              </button>
            </div>

            {/* List of Recently Viewed Coaches */}
            <div className="overflow-y-auto max-h-[calc(80vh-100px)] p-4">
              <div className="space-y-3">
                {recentlyViewedCoaches.map((recentCoach) => (
                  <button
                    key={recentCoach.id}
                    onClick={() => {
                      setShowRecentlyViewed(false);
                      navigate(`/coach/${recentCoach.id}`);
                    }}
                    className="w-full flex items-center gap-4 p-4 bg-slate-50 hover:bg-slate-100 rounded-2xl transition-all group"
                  >
                    <img
                      src={recentCoach.photoUrl || '/default-avatar.png'}
                      alt={recentCoach.name}
                      className="w-16 h-16 rounded-xl object-cover ring-2 ring-slate-200 group-hover:ring-brand-500 transition-all"
                    />
                    <div className="flex-1 text-left">
                      <p className="font-bold text-slate-900 text-lg">{recentCoach.name}</p>
                      <p className="text-sm text-slate-600">
                        {recentCoach.specialties && recentCoach.specialties.length > 0
                          ? recentCoach.specialties.slice(0, 2).join(' • ')
                          : 'Coach'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-brand-600 text-lg">£{recentCoach.hourlyRate}</p>
                      <p className="text-xs text-slate-500">per hour</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Review Form Modal */}
      {showReviewForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-hidden shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <h3 className="text-2xl font-black text-slate-900">Leave a Review</h3>
              <button
                onClick={() => {
                  setShowReviewForm(false);
                  setReviewFormData({ rating: 5, author: '', coachingPeriod: '', location: '', text: '' });
                  setReviewError(null);
                }}
                className="p-2 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X className="h-6 w-6 text-slate-600" />
              </button>
            </div>

            {/* Form Content */}
            <form onSubmit={handleReviewSubmit} className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-140px)]">
              {/* Error Message */}
              {reviewError && (
                <div className="bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm font-medium">
                  {reviewError}
                </div>
              )}

              {/* Star Rating */}
              <div>
                <label className="block text-sm font-bold text-slate-900 mb-3">
                  Rating <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewFormData({ ...reviewFormData, rating: star })}
                      className="transition-transform hover:scale-110"
                    >
                      <Star
                        className={`h-10 w-10 ${
                          star <= reviewFormData.rating
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-slate-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Your Name */}
              <div>
                <label htmlFor="review-author" className="block text-sm font-bold text-slate-900 mb-2">
                  Your Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="review-author"
                  type="text"
                  value={reviewFormData.author}
                  onChange={(e) => setReviewFormData({ ...reviewFormData, author: e.target.value })}
                  placeholder="e.g., John S."
                  className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all"
                  disabled={reviewSubmitting}
                />
                <p className="text-xs text-slate-500 mt-2">First name + last initial for privacy</p>
              </div>

              {/* Coaching Period */}
              <div>
                <label htmlFor="coaching-period" className="block text-sm font-bold text-slate-900 mb-2">
                  When did you work with this coach? <span className="text-red-500">*</span>
                </label>
                <input
                  id="coaching-period"
                  type="text"
                  value={reviewFormData.coachingPeriod}
                  onChange={(e) => setReviewFormData({ ...reviewFormData, coachingPeriod: e.target.value })}
                  placeholder="e.g., December 2024"
                  className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all"
                  disabled={reviewSubmitting}
                />
              </div>

              {/* Location (Optional) */}
              <div>
                <label htmlFor="review-location" className="block text-sm font-bold text-slate-900 mb-2">
                  Your Location <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <input
                  id="review-location"
                  type="text"
                  list="cities-list"
                  value={reviewFormData.location}
                  onChange={(e) => setReviewFormData({ ...reviewFormData, location: e.target.value })}
                  placeholder="Select a city or type your own..."
                  className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all"
                  disabled={reviewSubmitting}
                />
                <datalist id="cities-list">
                  {majorCities.map((city) => (
                    <option key={city} value={city} />
                  ))}
                </datalist>
                <p className="text-xs text-slate-500 mt-2">Choose from popular cities or type your own (e.g., "Cardiff, Wales")</p>
              </div>

              {/* Review Text */}
              <div>
                <label htmlFor="review-text" className="block text-sm font-bold text-slate-900 mb-2">
                  Your Review <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="review-text"
                  value={reviewFormData.text}
                  onChange={(e) => setReviewFormData({ ...reviewFormData, text: e.target.value })}
                  placeholder="Share your experience with this coach..."
                  rows={5}
                  className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all resize-none"
                  disabled={reviewSubmitting}
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={reviewSubmitting}
                className="w-full bg-brand-600 text-white font-bold py-4 rounded-xl hover:bg-brand-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {reviewSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Submitting...
                  </>
                ) : (
                  'Submit Review'
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* View All Reviews Modal */}
      {showAllReviews && coach && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl relative">
            {/* CoachDog Logo - Top Right Corner */}
            <div className="absolute top-4 right-16 w-16 h-16 bg-white rounded-full shadow-lg flex items-center justify-center z-10 border-2 border-cyan-200 overflow-hidden">
              <img
                src="/favicon2.png"
                alt="CoachDog"
                className="w-full h-full object-cover"
              />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-200 bg-gradient-to-r from-cyan-50 to-blue-50">
              <div>
                <h3 className="text-2xl font-black text-slate-900">All Reviews</h3>
                <p className="text-sm text-slate-600 mt-1">
                  {coach.reviews.length} {coach.reviews.length === 1 ? 'review' : 'reviews'} • Average rating: {avgRating.toFixed(1)} ⭐
                </p>
              </div>
              <button
                onClick={() => setShowAllReviews(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Reviews List */}
            <div className="overflow-y-auto max-h-[calc(90vh-100px)] p-6 space-y-4">
              {coach.reviews.map((review, index) => (
                <div
                  key={review.id}
                  className="bg-gradient-to-br from-cyan-50 via-cyan-25 to-blue-50 rounded-2xl p-6 border border-cyan-200 shadow-sm"
                >
                  {/* Rating */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`h-5 w-5 ${star <= review.rating ? 'fill-yellow-400 text-yellow-400' : 'fill-slate-300 text-slate-300'}`}
                        />
                      ))}
                    </div>
                    {review.isSpam && review.spamScore && review.spamScore >= 50 && (
                      <div className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full font-bold ${
                        review.spamScore >= 70
                          ? 'bg-red-100 text-red-700'
                          : review.spamScore >= 50
                          ? 'bg-orange-100 text-orange-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        <AlertTriangle className="h-3 w-3" />
                        Spam ({review.spamScore}%)
                        {review.spamCategory && ` - ${review.spamCategory}`}
                      </div>
                    )}
                  </div>

                  {/* Review Text */}
                  <p className="text-slate-900 text-base leading-relaxed mb-4">
                    {review.text || `${coach.name} is an excellent coach.`}
                  </p>

                  {/* Reviewer Info */}
                  <div className="flex items-center justify-between text-sm">
                    <div>
                      <span className="font-bold text-slate-900">{review.author}</span>
                      {review.location && (
                        <span className="text-slate-500"> • {review.location}</span>
                      )}
                    </div>
                    <span className="text-slate-500">{review.date}</span>
                  </div>

                  {/* Coach Reply */}
                  {review.coachReply && (
                    <div className="mt-4 pt-4 border-t border-cyan-200">
                      <div className="bg-white/70 rounded-xl p-4">
                        <p className="font-bold text-sm text-slate-900 mb-2">Response from {coach.name}:</p>
                        <p className="text-slate-700 text-sm leading-relaxed">{review.coachReply}</p>
                        {review.coachReplyDate && (
                          <p className="text-xs text-slate-500 mt-2">Replied on {review.coachReplyDate}</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Coach Reply Form - Only show if this is the coach viewing their own profile */}
                  {!review.coachReply && currentUserCoach && coach && currentUserCoach.id === coach.id && (
                    <div className="mt-4 pt-4 border-t border-cyan-200">
                      {replyingToReview === review.id ? (
                        <div className="bg-white/70 rounded-xl p-4">
                          <p className="font-bold text-sm text-slate-900 mb-3">Reply to this review:</p>
                          <textarea
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            placeholder="Thank you for your feedback! I'm glad I could help..."
                            className="w-full border border-slate-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-brand-500 focus:border-transparent resize-none"
                            rows={4}
                            disabled={replySubmitting}
                          />
                          <p className="text-xs text-slate-500 mt-2 mb-3">
                            💡 <strong>Tip:</strong> Thank the reviewer, address any concerns, and provide contact info if they want to follow up (e.g., "Feel free to reach out at [email] if you'd like to discuss further").
                          </p>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleReplySubmit(review.id)}
                              disabled={replySubmitting || !replyText.trim()}
                              className="flex items-center gap-2 bg-brand-600 text-white px-4 py-2 rounded-lg hover:bg-brand-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-bold"
                            >
                              <Send className="h-4 w-4" />
                              {replySubmitting ? 'Posting...' : 'Post Reply'}
                            </button>
                            <button
                              onClick={() => {
                                setReplyingToReview(null);
                                setReplyText('');
                              }}
                              className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors text-sm font-bold"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => setReplyingToReview(review.id)}
                          className="flex items-center gap-2 text-brand-600 hover:text-brand-700 font-bold text-sm"
                        >
                          <Reply className="h-4 w-4" />
                          Reply to this review
                        </button>
                      )}
                    </div>
                  )}

                  {/* Coach Actions - Comment and Flag Spam (Only for coach viewing their own profile) */}
                  {currentUserCoach && coach && currentUserCoach.id === coach.id && (
                    <div className="mt-4 pt-4 border-t border-cyan-200">
                      {/* Comment Form */}
                      {commentingOnReview === review.id ? (
                        <div className="bg-white/70 rounded-xl p-4 mb-4">
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
                      ) : null}

                      {/* Display Comments */}
                      {reviewComments[review.id] && reviewComments[review.id].length > 0 && (
                        <div className="mt-4 space-y-3">
                          <p className="text-sm font-bold text-slate-600">Comments:</p>
                          {reviewComments[review.id].map((comment: any) => (
                            <div key={comment.id} className="bg-white/50 rounded-lg p-3 border border-slate-200">
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
                  )}

                  {/* User Edit/Delete Actions - Only show if user has token for this review */}
                  {canManageReview(review.id) && (
                    <div className="mt-4 pt-4 border-t border-cyan-200">
                      <div className="flex items-center justify-between">
                        <div className="flex gap-3">
                          <button
                            onClick={() => startEditReview(review)}
                            className="flex items-center gap-1 text-slate-600 hover:text-brand-600 text-xs font-medium"
                          >
                            <Edit className="h-3 w-3" />
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteReview(review.id)}
                            className="flex items-center gap-1 text-slate-600 hover:text-red-600 text-xs font-medium"
                          >
                            <Trash2 className="h-3 w-3" />
                            Delete
                          </button>
                        </div>
                        <p className="text-xs text-slate-400">
                          This is your review
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-slate-200 bg-slate-50">
              <button
                onClick={() => setShowAllReviews(false)}
                className="w-full bg-slate-900 text-white font-bold py-3 rounded-xl hover:bg-slate-800 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Share Options Modal */}
      {showShareOptions && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" onClick={() => setShowShareOptions(false)}>
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <h3 className="text-2xl font-black text-slate-900">Share Profile</h3>
              <button
                onClick={() => setShowShareOptions(false)}
                className="p-2 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X className="h-6 w-6 text-slate-600" />
              </button>
            </div>

            {/* Share Options */}
            <div className="p-6 grid grid-cols-3 gap-4">
              {/* WhatsApp */}
              <button
                onClick={() => shareVia('whatsapp')}
                className="flex flex-col items-center gap-2 p-4 rounded-2xl hover:bg-green-50 transition-colors group"
              >
                <div className="w-16 h-16 rounded-full bg-green-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <MessageCircle className="h-8 w-8 text-white" />
                </div>
                <span className="text-sm font-bold text-slate-700">WhatsApp</span>
              </button>

              {/* Facebook */}
              <button
                onClick={() => shareVia('facebook')}
                className="flex flex-col items-center gap-2 p-4 rounded-2xl hover:bg-blue-50 transition-colors group"
              >
                <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Facebook className="h-8 w-8 text-white" />
                </div>
                <span className="text-sm font-bold text-slate-700">Facebook</span>
              </button>

              {/* Twitter */}
              <button
                onClick={() => shareVia('twitter')}
                className="flex flex-col items-center gap-2 p-4 rounded-2xl hover:bg-sky-50 transition-colors group"
              >
                <div className="w-16 h-16 rounded-full bg-black flex items-center justify-center group-hover:scale-110 transition-transform">
                  <svg className="h-7 w-7 text-white" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                </div>
                <span className="text-sm font-bold text-slate-700">Twitter</span>
              </button>

              {/* LinkedIn */}
              <button
                onClick={() => shareVia('linkedin')}
                className="flex flex-col items-center gap-2 p-4 rounded-2xl hover:bg-blue-50 transition-colors group"
              >
                <div className="w-16 h-16 rounded-full bg-blue-700 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Linkedin className="h-8 w-8 text-white" />
                </div>
                <span className="text-sm font-bold text-slate-700">LinkedIn</span>
              </button>

              {/* Instagram */}
              <button
                onClick={() => shareVia('instagram')}
                className="flex flex-col items-center gap-2 p-4 rounded-2xl hover:bg-pink-50 transition-colors group"
              >
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-600 via-pink-600 to-orange-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Instagram className="h-8 w-8 text-white" />
                </div>
                <span className="text-sm font-bold text-slate-700">Instagram</span>
              </button>

              {/* Email */}
              <button
                onClick={() => shareVia('email')}
                className="flex flex-col items-center gap-2 p-4 rounded-2xl hover:bg-slate-50 transition-colors group"
              >
                <div className="w-16 h-16 rounded-full bg-slate-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Mail className="h-8 w-8 text-white" />
                </div>
                <span className="text-sm font-bold text-slate-700">Email</span>
              </button>
            </div>

            {/* Copy Link */}
            <div className="px-6 pb-6">
              <button
                onClick={() => shareVia('copy')}
                className="w-full bg-slate-100 text-slate-900 font-bold py-4 rounded-xl hover:bg-slate-200 transition-colors flex items-center justify-center gap-2"
              >
                <Copy className="h-5 w-5" />
                Copy Link
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
