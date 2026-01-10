import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { getCoachById, trackProfileView, getCoaches, addReview } from '../services/supabaseService';
import { Coach, QuestionnaireAnswers } from '../types';
import { calculateMatchScore } from '../utils/matchCalculator';
import {
  ArrowLeft, Star, Mail, Instagram, MessageCircle, Linkedin,
  MapPin, CheckCircle, Share2, ChevronLeft, ChevronRight, Clock, X,
  Facebook, Globe, Youtube, Phone, Copy
} from 'lucide-react';

export const CoachDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [coach, setCoach] = useState<Coach | undefined>(undefined);
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
        const found = await getCoachById(id);
        setCoach(found || undefined);

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

  if (!coach) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center">
          <h2 className="text-xl font-bold text-slate-700 mb-4">Coach not found</h2>
          <button
            onClick={() => navigate('/search')}
            className="text-brand-600 hover:underline"
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
    if (navigator.share) {
      navigator.share({
        title: `${coach.name} - CoachDog`,
        text: `Check out ${coach.name} on CoachDog`,
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
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

          {/* Top Section: Match, Photo, Recently Viewed */}
          <div className="px-6 pt-8 pb-6">
            <div className="flex items-start justify-between mb-6">
              {/* Match Percentage Circle - ONLY if questionnaire data exists */}
              {matchPercentage !== null ? (
                <div className="flex flex-col items-center">
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
              ) : (
                <div className="w-20"></div> /* Spacer if no match data */
              )}

              {/* Profile Photo */}
              <div className="relative">
                <div className="w-36 h-36 rounded-3xl overflow-hidden border-4 border-white shadow-2xl ring-4 ring-slate-100">
                  <img
                    src={coach.photoUrl || '/default-avatar.png'}
                    alt={coach.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                {coach.isVerified && (
                  <div className="absolute -bottom-2 -right-2 bg-blue-600 text-white p-2 rounded-full shadow-lg ring-4 ring-white">
                    <CheckCircle className="h-6 w-6" />
                  </div>
                )}
              </div>

              {/* Recently Viewed Button */}
              {recentlyViewedCoaches.length > 0 && (
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
              )}
            </div>

            {/* Name and Accreditation */}
            <div className="text-center mb-4">
              <h2 className="text-4xl font-black text-slate-900 mb-2 tracking-tight">{coach.name}</h2>
              <p className="text-brand-600 font-bold text-base uppercase tracking-wide">
                {coach.verificationBody || 'EMCC'} Accredited
              </p>
            </div>

            {/* Star Rating */}
            <div className="flex items-center justify-center gap-2 mb-6">
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`h-7 w-7 ${star <= Math.floor(avgRating) ? 'fill-yellow-400 text-yellow-400' : 'fill-slate-200 text-slate-200'}`}
                  />
                ))}
              </div>
              <span className="text-lg font-bold text-slate-700">({totalReviews})</span>
            </div>

            {/* Contact Icons - Email, WhatsApp, and ALL social links */}
            <div className="flex items-center justify-center gap-4 mb-8 flex-wrap">
              {/* Email - Always show */}
              <a
                href={`mailto:${coach.email}`}
                className="w-14 h-14 rounded-2xl border-2 border-slate-300 flex items-center justify-center hover:bg-slate-50 hover:border-brand-500 transition-all shadow-sm"
                title="Email"
              >
                <Mail className="h-6 w-6 text-slate-700" />
              </a>

              {/* WhatsApp - Show if phone number exists */}
              {coach.phoneNumber && (
                <a
                  href={`https://wa.me/${coach.phoneNumber.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-14 h-14 rounded-2xl border-2 border-slate-300 flex items-center justify-center hover:bg-slate-50 hover:border-brand-500 transition-all shadow-sm"
                  title="WhatsApp"
                >
                  <MessageCircle className="h-6 w-6 text-slate-700" />
                </a>
              )}

              {/* Dynamically render ALL social links from coach profile */}
              {coach.socialLinks?.map((socialLink) => (
                <a
                  key={socialLink.id || socialLink.platform}
                  href={socialLink.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-14 h-14 rounded-2xl border-2 border-slate-300 flex items-center justify-center hover:bg-slate-50 hover:border-brand-500 transition-all shadow-sm"
                  title={socialLink.platform}
                >
                  {getSocialIcon(socialLink.platform)}
                </a>
              ))}
            </div>

            {/* Location */}
            <div className="flex items-center justify-center gap-2 mb-4">
              <MapPin className="h-5 w-5 text-slate-600" />
              <span className="text-lg font-bold text-slate-900">{coach.location || 'United Kingdom'}</span>
            </div>

            {/* Price Badge */}
            <div className="flex justify-center mb-8">
              <div className="bg-gradient-to-r from-cyan-500 to-cyan-600 text-white px-8 py-3 rounded-full shadow-lg">
                <span className="text-2xl font-black">£{coach.hourlyRate}</span>
                <span className="text-sm font-semibold ml-1">per hour</span>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="h-2 bg-slate-50"></div>

          {/* Details Section */}
          <div className="px-6 py-6 space-y-6">

            {/* Accreditation Level */}
            <div>
              <p className="text-slate-600 text-sm mb-1">Accreditation Level:</p>
              <p className="text-xl font-black text-slate-900">Senior Practitioner</p>
            </div>

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
                <div className="space-y-2">
                  {coach.qualifications.map((qual, idx) => (
                    <p key={idx} className="text-slate-900 font-bold text-base">{qual}</p>
                  ))}
                </div>
              </div>
            )}

            {/* Bio */}
            {coach.bio && (
              <div className="bg-slate-50 px-5 py-5 rounded-2xl">
                <h3 className="text-sm font-bold text-slate-600 mb-3 uppercase tracking-wide">Coach Bio:</h3>
                <p className="text-slate-900 leading-relaxed font-medium text-base whitespace-pre-line">{coach.bio}</p>
              </div>
            )}

            {/* Languages */}
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
                  {coach.acknowledgements.map((ack: any) => (
                    <div key={ack.id} className="flex items-start gap-3 bg-cyan-50 px-4 py-3 rounded-2xl">
                      <Star className="h-7 w-7 text-cyan-500 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="font-bold text-slate-900 text-base">{ack.title}</p>
                        {ack.year && (
                          <p className="text-sm text-slate-600 mt-1">{ack.year}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="h-2 bg-slate-50"></div>

          {/* Reviews Section */}
          {coach.reviews && coach.reviews.length > 0 && currentReview && (
            <div className="px-6 py-8">
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

                {/* Review Text */}
                <p className="text-slate-900 text-center text-lg font-medium leading-relaxed mb-6 min-h-[80px]">
                  {currentReview.text || `${coach.name} is an excellent coach.`}
                </p>

                {/* Reviewer Info */}
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2">
                    <span className="font-black text-slate-900 text-lg">
                      {currentReview.author || 'Jamie'}
                    </span>
                    {currentReview.verificationStatus === 'verified' && (
                      <div className="relative group">
                        <CheckCircle className="h-5 w-5 text-green-600 fill-green-600" />
                        <div className="absolute bottom-full right-0 mb-2 hidden group-hover:block w-48 bg-slate-900 text-white text-xs rounded-lg py-2 px-3 shadow-lg z-10">
                          <div className="font-bold mb-1">Verified Review</div>
                          <div>This review has been verified by the coach</div>
                          <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-slate-900"></div>
                        </div>
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
            </div>
          )}

          {/* Action Buttons */}
          <div className="px-6 pb-8 space-y-4">
            {/* Contact Coach Button with Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowContactOptions(!showContactOptions)}
                className="w-full bg-gradient-to-r from-cyan-500 to-cyan-600 text-black font-black py-5 rounded-2xl text-xl shadow-xl hover:shadow-2xl hover:from-cyan-600 hover:to-cyan-700 transition-all transform hover:-translate-y-0.5"
              >
                Contact Coach for More Details
              </button>

              {/* Contact Options Dropdown */}
              {showContactOptions && (emailContacts.length > 0 || phoneContacts.length > 0) && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl border-2 border-cyan-500 shadow-2xl z-50 animate-fade-in max-h-96 overflow-y-auto">
                  {/* Email Options */}
                  {emailContacts.length > 0 && (
                    <div className="border-b border-slate-200">
                      <div className="px-4 py-2 bg-slate-50 font-bold text-xs text-slate-600 uppercase tracking-wide">
                        Email
                      </div>
                      {emailContacts.map((contact, idx) => (
                        <button
                          key={idx}
                          onClick={() => copyToClipboard(contact.url, contact.platform)}
                          className="w-full px-4 py-3 text-left hover:bg-cyan-50 transition-colors flex items-center justify-between group"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-slate-900">{contact.platform}</p>
                            <p className="text-sm text-slate-600 break-all">{stripProtocol(contact.url)}</p>
                          </div>
                          <Copy className={`h-5 w-5 flex-shrink-0 ml-3 ${copiedContact === contact.platform ? 'text-green-600' : 'text-slate-400 group-hover:text-cyan-600'}`} />
                        </button>
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
                        <button
                          key={idx}
                          onClick={() => copyToClipboard(contact.url, contact.platform)}
                          className="w-full px-4 py-3 text-left hover:bg-cyan-50 transition-colors flex items-center justify-between group"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-slate-900">{contact.platform}</p>
                            <p className="text-sm text-slate-600 break-all">{stripProtocol(contact.url)}</p>
                          </div>
                          <Copy className={`h-5 w-5 flex-shrink-0 ml-3 ${copiedContact === contact.platform ? 'text-green-600' : 'text-slate-400 group-hover:text-cyan-600'}`} />
                        </button>
                      ))}
                    </div>
                  )}

                  {copiedContact && (
                    <div className="px-4 py-2 bg-green-50 text-green-700 text-sm font-bold text-center border-t border-green-200">
                      {copiedContact} copied to clipboard!
                    </div>
                  )}
                </div>
              )}

              {/* No Contact Info Available */}
              {showContactOptions && emailContacts.length === 0 && phoneContacts.length === 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl border-2 border-slate-300 shadow-2xl z-50 p-6 text-center animate-fade-in">
                  <p className="text-slate-600">No contact information available yet.</p>
                </div>
              )}
            </div>

            {/* Leave a Review Button */}
            <button
              onClick={() => setShowReviewForm(true)}
              className="w-full bg-slate-900 text-white font-black py-5 rounded-2xl text-xl shadow-xl hover:shadow-2xl hover:bg-slate-800 transition-all transform hover:-translate-y-0.5"
            >
              Leave a Review
            </button>
          </div>

          {/* Share Button */}
          <div className="px-6 pb-6 flex justify-end">
            <button
              onClick={handleShare}
              className="flex items-center gap-2 text-slate-700 font-bold hover:text-slate-900 transition-colors group"
            >
              <Share2 className="h-5 w-5 group-hover:scale-110 transition-transform" />
              <span className="text-lg">share</span>
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
                  value={reviewFormData.location}
                  onChange={(e) => setReviewFormData({ ...reviewFormData, location: e.target.value })}
                  placeholder="e.g., Cardiff, Wales or London, UK"
                  className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all"
                  disabled={reviewSubmitting}
                />
                <p className="text-xs text-slate-500 mt-2">Keep it general for privacy (e.g., city and country)</p>
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
    </div>
  );
};
