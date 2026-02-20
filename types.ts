
export type Specialty = 'Career & Professional Development' | 'Business & Entrepreneurship' | 'Health & Wellness' | 'Personal & Life' | 'Financial' | 'Niche & Demographic' | 'Methodology & Modality' | 'General';

export type Format = 'In-Person' | 'Online';

export type SubscriptionStatus = 'active' | 'trial' | 'expired' | 'onboarding' | 'lifetime';

export type BillingCycle = 'monthly' | 'annual';

export type Currency = 'USD' | 'EUR' | 'GBP' | 'JPY' | 'AUD' | 'CAD' | 'CHF' | 'CNY' | 'INR' | 'NZD';

export interface CurrencyInfo {
  code: Currency;
  symbol: string;
  name: string;
}

export const CURRENCIES: CurrencyInfo[] = [
  { code: 'GBP', symbol: '£', name: 'Pound Sterling' },
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'AUD', symbol: '$', name: 'Australian Dollar' },
  { code: 'CAD', symbol: '$', name: 'Canadian Dollar' },
  { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc' },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'NZD', symbol: '$', name: 'New Zealand Dollar' },
];

export type AccreditationLevel =
  | 'Foundation'
  | 'Practitioner'
  | 'Senior Practitioner'
  | 'Master Practitioner';

export type AccreditationBody = 'EMCC' | 'ICF' | 'Other' | '';

// New: Comprehensive Coaching Areas of Expertise (7 categories)
export type CoachingExpertiseCategory =
  | 'Career & Professional Development'
  | 'Business & Entrepreneurship'
  | 'Health & Wellness'
  | 'Personal & Life'
  | 'Financial'
  | 'Niche & Demographic'
  | 'Methodology & Modality';

export type CareerProfessionalExpertise =
  | 'Career Transition'
  | 'Leadership Development'
  | 'Executive Coaching'
  | 'Team Coaching'
  | 'Performance Coaching'
  | 'Communication Skills'
  | 'Public Speaking'
  | 'Interview Preparation'
  | 'Networking'
  | 'Personal Branding'
  | 'Work-Life Balance'
  | 'Time Management'
  | 'Productivity'
  | 'Confidence Building';

export type BusinessEntrepreneurshipExpertise =
  | 'Business Start-up'
  | 'Business Growth & Scaling'
  | 'Strategic Planning'
  | 'Sales Coaching'
  | 'Marketing & Branding'
  | 'Negotiation Skills'
  | 'Innovation & Creativity'
  | 'Succession Planning';

export type HealthWellnessExpertise =
  | 'Stress Management'
  | 'Mindfulness & Meditation'
  | 'Sleep Improvement'
  | 'Nutrition & Healthy Eating'
  | 'Fitness & Exercise'
  | 'Weight Management'
  | 'Chronic Illness Management'
  | 'Mental Health & Wellbeing'
  | 'Addiction Recovery'
  | 'Grief & Loss'
  | 'Burnout Recovery';

export type PersonalLifeExpertise =
  | 'Life Purpose & Meaning'
  | 'Goal Setting & Achievement'
  | 'Relationship Coaching'
  | 'Parenting'
  | 'Family Dynamics'
  | 'Divorce & Separation'
  | 'Self-Esteem & Confidence'
  | 'Personal Growth'
  | 'Spiritual Development'
  | 'Retirement Planning (Life)'
  | 'Lifestyle Design'
  | 'Creative Expression';

export type FinancialExpertise =
  | 'Financial Planning & Budgeting'
  | 'Debt Management'
  | 'Investment Coaching'
  | 'Retirement Planning (Financial)'
  | 'Money Mindset';

export type NicheDemographicExpertise =
  | 'LGBTQ+ Coaching'
  | 'Neurodiversity (ADHD, Autism, etc.)'
  | 'Youth & Students (Ages 16-25)'
  | 'Mid-Career Professionals'
  | 'Senior Professionals (50+)'
  | 'Women in Leadership'
  | 'Veterans & Military Transition'
  | 'Expats & Relocation'
  | 'Artists & Creatives'
  | 'Athletes & Sports Performance';

export type MethodologyModalityExpertise =
  | 'Cognitive Behavioral Coaching (CBC)'
  | 'Neuro-Linguistic Programming (NLP)'
  | 'Solution-Focused Coaching'
  | 'Positive Psychology'
  | 'Ontological Coaching'
  | 'Systemic Coaching'
  | 'Gestalt Coaching'
  | 'Psychodynamic Coaching'
  | 'Narrative Coaching'
  | 'Somatic Coaching'
  | 'Mindfulness-Based Coaching'
  | 'Acceptance and Commitment Therapy (ACT)'
  | 'Transactional Analysis (TA)';

// Combined type for all coaching expertise areas
export type CoachingExpertise =
  | CareerProfessionalExpertise
  | BusinessEntrepreneurshipExpertise
  | HealthWellnessExpertise
  | PersonalLifeExpertise
  | FinancialExpertise
  | NicheDemographicExpertise
  | MethodologyModalityExpertise;

// New: CPD Qualifications (Additional Professional Development Certifications)
export type CPDQualification =
  | 'Mental Health First Aid (MHFA)'
  | 'Trauma-Informed Coaching Certificate'
  | 'Diversity & Inclusion Coaching Certificate'
  | 'Corporate Coaching Certification'
  | 'Team Coaching Certification'
  | 'Career Coaching Certification'
  | 'Executive Coaching Certification'
  | 'Health & Wellness Coaching Certification'
  | 'Relationship Coaching Certification'
  | 'NLP Practitioner Certification'
  | 'Leadership Coaching Certification'
  | 'Performance Coaching Certification'
  | 'Business Coaching Certification'
  | 'Parenting Coach Certification'
  | 'ADHD Coaching Certification'
  | 'Nutrition Coaching Certification'
  | 'Neuro-affirmed Coaching Certification'
  | 'Certified in Ethical Application of AI';

// New: Coaching Languages
export type CoachingLanguage =
  | 'English'
  | 'Spanish'
  | 'French'
  | 'German'
  | 'Italian'
  | 'Portuguese'
  | 'Dutch'
  | 'Polish'
  | 'Romanian'
  | 'Greek'
  | 'Swedish'
  | 'Danish'
  | 'Norwegian'
  | 'Finnish'
  | 'Czech'
  | 'Hungarian'
  | 'Bulgarian'
  | 'Croatian'
  | 'Slovak'
  | 'Lithuanian'
  | 'Latvian'
  | 'Estonian'
  | 'Slovenian'
  | 'Arabic'
  | 'Hebrew'
  | 'Turkish'
  | 'Russian'
  | 'Ukrainian'
  | 'Mandarin Chinese'
  | 'Cantonese'
  | 'Japanese'
  | 'Korean'
  | 'Hindi'
  | 'Urdu'
  | 'Bengali'
  | 'Punjabi'
  | 'Tamil'
  | 'Tagalog'
  | 'Vietnamese'
  | 'Thai'
  | 'Indonesian'
  | 'Malay'
  | 'Swahili';

export type Gender = 'Male' | 'Female' | 'Non-binary' | 'Prefer not to say' | string; // string allows for self-describe option

export type AdditionalCertification =
  | 'Mental Health First Aid Trained'
  | 'Trauma Informed'
  | 'Diversity & Inclusion Certified'
  | 'Child & Adolescent Specialist'
  | 'Corporate Coaching Certified'
  | 'NLP Practitioner'
  | 'CBT Trained';

export interface SocialLink {
  id?: string;
  platform: string;
  url: string;
  type?: 'url' | 'email' | 'tel'; // New: identify if it's a URL, email, or telephone
}

export interface ReviewComment {
  id: string;
  reviewId: string;
  authorId: string; // Coach ID
  authorName: string; // Coach name
  text: string;
  createdAt: string;
}

export interface Review {
  id: string;
  coachId: string;
  author: string; // First name + last initial (e.g., "John S.")
  authorPhotoUrl?: string;
  rating: number; // 1-5
  text: string;
  isFlagged: boolean;
  date: string;
  isVerifiedClient?: boolean; // Legacy field - no longer used
  coachReply?: string; // Coach's response to the review
  coachReplyDate?: string; // When the coach replied
  coachingPeriod?: string; // When coaching took place (e.g., "December 2024")
  verificationStatus?: 'unverified' | 'verified' | 'flagged'; // DEPRECATED - replaced by spam system
  verifiedAt?: string; // DEPRECATED
  location?: string; // General location of reviewer (e.g., "Cardiff, Wales")

  // New spam detection fields
  spamScore?: number; // 0-100 confidence that review is spam
  spamReasons?: string[]; // Reasons flagged as spam
  isSpam?: boolean; // Auto-detected spam
  spamCategory?: 'abusive' | 'promotional' | 'nonsense' | 'repetitive' | 'suspicious';

  // New comment system
  comments?: ReviewComment[]; // Coach comments on the review
}

export interface Acknowledgement {
  id: string;
  title: string; // e.g. "Author of multiple books", "Coach of the Year 2025"
  icon?: string; // e.g. "star", "trophy", "book"
  year?: number;
}

export interface Qualification {
  id: string;
  degree: string; // e.g. "Masters in Law (MLAW)"
  institution?: string;
  year?: number;
}

export interface Coach {
  id: string;
  name: string;
  email: string;
  phoneNumber?: string;
  photoUrl: string;
  bannerImageUrl?: string; // Profile banner/cover image (like LinkedIn/X/Facebook)
  specialties: Specialty[];
  bio: string;
  introVideoUrl?: string; // YouTube or Vimeo embed URL (e.g., https://www.youtube.com/embed/VIDEO_ID)
  socialLinks: SocialLink[];
  hourlyRate: number;
  currency?: Currency; // Coach's preferred currency (defaults to GBP)
  yearsExperience: number;
  certifications: string[]; // Legacy field - keeping for backward compatibility
  isVerified: boolean;
  availableFormats: Format[];
  location: string;
  reviews: Review[];
  documentsSubmitted: boolean;

  // Accreditation & Verification
  accreditationBody?: AccreditationBody; // Selected accreditation body (EMCC, ICF, Other)
  accreditationLevel?: AccreditationLevel; // e.g. "Senior Practitioner" (EMCC) or "PCC" (ICF)

  // EMCC Verification
  emccVerified?: boolean; // Whether coach was verified via EMCC directory
  emccVerifiedAt?: string; // When EMCC verification was completed
  emccProfileUrl?: string; // Link to coach's EMCC directory profile

  // ICF Verification
  icfVerified?: boolean; // Whether coach was verified via ICF directory
  icfVerifiedAt?: string; // When ICF verification was completed
  icfAccreditationLevel?: 'ACC' | 'PCC' | 'MCC' | ''; // ICF credential level
  icfProfileUrl?: string; // Link to coach's ICF directory profile

  additionalCertifications?: AdditionalCertification[]; // e.g. ["Mental Health First Aid Trained", "Trauma Informed"]
  coachingHours?: number; // Total hours of coaching experience (e.g. 500)

  // Structured Location Fields
  locationCity?: string; // Selected city from dropdown or custom entry
  locationRadius?: string; // Travel radius: "5", "10", "25", "50", "nationwide", "international"
  locationIsCustom?: boolean; // True if location_city is custom entry (not from predefined UK cities list)
  country?: string; // Coach's country (e.g. 'United Kingdom', 'United States')

  qualifications?: Qualification[]; // Formal qualifications with degree details
  acknowledgements?: Acknowledgement[]; // Awards, recognitions, achievements
  languages?: string[]; // Legacy - now superseded by coachingLanguages
  averageRating?: number; // Calculated from reviews (1-5)
  totalReviews?: number; // Count of reviews
  customUrl?: string; // Custom vanity URL slug (e.g., "jonnysmith" for /coach/jonnysmith)

  // New: Enhanced Expertise & Qualifications
  mainCoachingCategories?: CoachingExpertiseCategory[]; // Primary broad categories (7 main areas) - REQUIRED for matching
  coachingExpertise?: CoachingExpertise[]; // Specific areas of expertise (optional detail within categories)
  cpdQualifications?: CPDQualification[]; // Additional professional development certifications
  coachingLanguages?: CoachingLanguage[]; // Languages offered for coaching sessions
  gender?: Gender; // Coach's gender identity
  referralSource?: string | null; // Partner referral source (e.g. 'emcc', 'icf', 'ac')

  // Subscription & Billing
  subscriptionStatus: SubscriptionStatus;
  trialEndsAt?: string;
  trialUsed?: boolean; // Has user already used their free trial?
  billingCycle: BillingCycle;
  lastPaymentDate?: string;

  // Cancellation Tracking
  cancelledAt?: string; // When user requested cancellation
  subscriptionEndsAt?: string; // When access actually ends (billing period end)
  cancelReason?: string; // Dropdown value from CANCELLATION_REASONS
  cancelFeedback?: string; // Optional text feedback
  dataRetentionPreference?: 'keep' | 'delete'; // User preference for data after cancellation
  scheduledDeletionAt?: string; // When data will be auto-deleted

  // Profile Visibility & Access
  profileVisible?: boolean; // Auto-managed by DB trigger based on subscription status
  dashboardAccess?: boolean; // For future complete lockout (not used yet)

  // Stripe Integration (for future use)
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;

  // Security
  twoFactorEnabled: boolean;

  // Deletion Tracking (New Delete Account System)
  deletionRequestedAt?: string; // When user requested deletion
  deletionEffectiveDate?: string; // When account will be hidden/locked (end of billing period)
  deletionPermanentDate?: string; // When data will be permanently deleted (effective_date + 30 days)
  deletionReason?: string; // Optional reason for leaving
  canRestore?: boolean; // Whether account can still be restored (false after permanent deletion)
  restoredAt?: string; // When account was restored (if applicable)
  restoredBy?: string; // Who restored the account (user_id or admin email)
}

export interface QuestionnaireAnswers {
  goal: Specialty | '';
  preferredFormat: Format[];
  preferredLocation?: string; // Preferred city/location for in-person coaching
  budgetMin: number; // Minimum hourly rate
  budgetMax: number; // Maximum hourly rate
  genderPreference?: Gender[]; // Preferred coach gender(s) - multiple selection
  preferredCertifications?: AdditionalCertification[]; // Legacy: Preferred coach certifications
  languagePreferences?: string[]; // Multiple languages (e.g., ["English", "Spanish"])
  experienceLevel?: 'beginner' | 'intermediate' | 'advanced' | 'any'; // Preferred coach experience level
  coachingExpertise?: CoachingExpertise[]; // New: Specific coaching areas (80+ options across 7 categories)
  cpdQualifications?: CPDQualification[]; // New: CPD qualifications (40+ certifications)
}

export interface UserState {
  role: 'guest' | 'admin';
  isAuthenticated: boolean;
}
